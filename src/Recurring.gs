/**
 * Recurring sweeps: saved filter recipes that run on a daily/weekly/monthly
 * cadence via Apps Script time-driven triggers. After every run we send the
 * user a short Gmail digest with the count and a Trash link.
 *
 * Storage: one UserProperty key holding a JSON array of recipes. Hard cap 20
 * (also matches Apps Script's 20-triggers-per-script-per-user limit).
 *
 * Trigger model: each recipe owns ONE clock trigger. The shared handler
 * `runRecurringSweep` receives the trigger's uid via the event arg, looks up
 * the recipe whose triggerId matches, and runs the sweep.
 */

var RECIPES_KEY = 'mailsweep_recipes_v1';
var RECIPE_HANDLER = 'runRecurringSweep';
var MAX_RECIPES = 20;

// ---------- Storage CRUD ----------

function listRecipes_() {
  const json = PropertiesService.getUserProperties().getProperty(RECIPES_KEY);
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function saveRecipes_(recipes) {
  PropertiesService.getUserProperties()
    .setProperty(RECIPES_KEY, JSON.stringify(recipes));
}

function getRecipe_(recipeId) {
  const recipes = listRecipes_();
  for (let i = 0; i < recipes.length; i++) {
    if (recipes[i].id === recipeId) return recipes[i];
  }
  return null;
}

function upsertRecipe_(recipe) {
  const recipes = listRecipes_();
  const idx = recipes.findIndex(function (r) { return r.id === recipe.id; });
  if (idx >= 0) recipes[idx] = recipe;
  else recipes.push(recipe);
  saveRecipes_(recipes);
}

function deleteRecipe_(recipeId) {
  const recipes = listRecipes_().filter(function (r) { return r.id !== recipeId; });
  saveRecipes_(recipes);
}

function newRecipeId_() {
  return 'r_' + Date.now().toString(36) + '_' +
    Math.floor(Math.random() * 1e6).toString(36);
}

// ---------- Trigger install / uninstall ----------

/**
 * Installs a clock trigger for the recipe, stores the trigger uid on the
 * recipe, and persists. Caller is responsible for uninstalling any prior
 * trigger for this recipe first.
 *
 * Cadence rules:
 *   daily   → every day at ~3am script timezone
 *   weekly  → same weekday as createdAt, ~3am
 *   monthly → 1st of every month, ~3am  (Apps Script ClockTriggerBuilder
 *             doesn't support arbitrary day-of-month for monthly; we fire
 *             monthly-on-the-1st as the simplest reliable cadence)
 */
function installRecipeTrigger_(recipe) {
  const tb = ScriptApp.newTrigger(RECIPE_HANDLER).timeBased();
  const hour = 3;

  if (recipe.cadence === 'daily') {
    tb.everyDays(1).atHour(hour);
  } else if (recipe.cadence === 'weekly') {
    const wd = weekdayForRecipe_(recipe);
    tb.onWeekDay(wd).atHour(hour);
  } else if (recipe.cadence === 'monthly') {
    tb.onMonthDay(1).atHour(hour);
  } else {
    throw new Error('Unknown cadence: ' + recipe.cadence);
  }

  const trigger = tb.create();
  recipe.triggerId = trigger.getUniqueId();
  upsertRecipe_(recipe);
  return recipe;
}

function uninstallRecipeTrigger_(recipeId) {
  const recipe = getRecipe_(recipeId);
  if (!recipe || !recipe.triggerId) return;
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getUniqueId() === recipe.triggerId) {
      ScriptApp.deleteTrigger(triggers[i]);
      break;
    }
  }
  recipe.triggerId = null;
  upsertRecipe_(recipe);
}

function weekdayForRecipe_(recipe) {
  const days = [
    ScriptApp.WeekDay.SUNDAY,
    ScriptApp.WeekDay.MONDAY,
    ScriptApp.WeekDay.TUESDAY,
    ScriptApp.WeekDay.WEDNESDAY,
    ScriptApp.WeekDay.THURSDAY,
    ScriptApp.WeekDay.FRIDAY,
    ScriptApp.WeekDay.SATURDAY
  ];
  const ref = recipe.createdAt ? new Date(recipe.createdAt) : new Date();
  return days[ref.getDay()];
}

// ---------- Public API used by Cards / Code ----------

/**
 * Create a recipe from current filters + cadence, install trigger, persist.
 * Returns the saved recipe. Caller must enforce paywall + duplicate-name
 * checks before calling.
 */
function createRecipe(name, filters, cadence, digestEnabled) {
  const recipes = listRecipes_();
  if (recipes.length >= MAX_RECIPES) {
    throw new Error('Recipe limit reached (' + MAX_RECIPES + ').');
  }
  const recipe = {
    id: newRecipeId_(),
    name: (name || 'Untitled sweep').trim().substring(0, 60),
    filters: filters || {},
    cadence: cadence,
    enabled: true,
    digestEnabled: !!digestEnabled,
    lastRunAt: null,
    lastRunCount: 0,
    totalSwept: 0,
    runCount: 0,
    createdAt: Date.now(),
    triggerId: null
  };
  return installRecipeTrigger_(recipe);
}

function setRecipeDigest(recipeId, digestEnabled) {
  const recipe = getRecipe_(recipeId);
  if (!recipe) return null;
  recipe.digestEnabled = !!digestEnabled;
  upsertRecipe_(recipe);
  return recipe;
}

function setRecipeEnabled(recipeId, enabled) {
  const recipe = getRecipe_(recipeId);
  if (!recipe) return null;
  if (enabled && !recipe.triggerId) {
    recipe.enabled = true;
    return installRecipeTrigger_(recipe);
  }
  if (!enabled && recipe.triggerId) {
    uninstallRecipeTrigger_(recipeId);
    const r = getRecipe_(recipeId);
    r.enabled = false;
    upsertRecipe_(r);
    return r;
  }
  recipe.enabled = enabled;
  upsertRecipe_(recipe);
  return recipe;
}

function renameRecipe(recipeId, newName) {
  const recipe = getRecipe_(recipeId);
  if (!recipe) return null;
  recipe.name = (newName || 'Untitled sweep').trim().substring(0, 60);
  upsertRecipe_(recipe);
  return recipe;
}

function changeRecipeCadence(recipeId, cadence) {
  const recipe = getRecipe_(recipeId);
  if (!recipe) return null;
  if (recipe.triggerId) uninstallRecipeTrigger_(recipeId);
  const r = getRecipe_(recipeId);
  r.cadence = cadence;
  upsertRecipe_(r);
  if (r.enabled) return installRecipeTrigger_(r);
  return r;
}

function deleteRecipeAndTrigger(recipeId) {
  uninstallRecipeTrigger_(recipeId);
  deleteRecipe_(recipeId);
}

// ---------- Trigger entry point ----------

/**
 * Shared handler fired by every recipe trigger. Looks up which recipe owns
 * this trigger uid and runs its sweep.
 *
 * Apps Script gives us the trigger uid on the event arg.
 */
function runRecurringSweep(e) {
  const triggerUid = e && e.triggerUid;
  if (!triggerUid) return;

  const recipes = listRecipes_();
  let recipe = null;
  for (let i = 0; i < recipes.length; i++) {
    if (recipes[i].triggerId === triggerUid) {
      recipe = recipes[i];
      break;
    }
  }
  if (!recipe || !recipe.enabled) return;

  runRecipeNow_(recipe.id);
}

/**
 * Runs the recipe immediately (used by both the trigger handler and the
 * "Run now" button on the per-recipe edit card).
 *
 * Reuses the existing deleteMatchingThreads_ pipeline (same battle-tested
 * batchModify path, same 3-min internal budget, same per-call safety).
 *
 * For huge recipes we accept what one run can do — we don't chain a
 * background trigger from here, since the next cadence fire will pick up
 * whatever's left.
 */
function runRecipeNow_(recipeId) {
  const recipe = getRecipe_(recipeId);
  if (!recipe) return null;

  let result;
  try {
    result = deleteMatchingThreads_(recipe.filters);
  } catch (e) {
    console.error('Recipe ' + recipe.id + ' threw: ' + (e && e.message || e));
    return null;
  }

  const fresh = getRecipe_(recipeId);
  if (!fresh) return null;
  fresh.lastRunAt = Date.now();
  fresh.lastRunCount = result.deleted || 0;
  fresh.totalSwept = (fresh.totalSwept || 0) + (result.deleted || 0);
  fresh.runCount = (fresh.runCount || 0) + 1;
  upsertRecipe_(fresh);

  if (fresh.digestEnabled) {
    try { sendDigestEmail_(fresh, result); } catch (e) {
      console.error('Digest email failed: ' + (e && e.message || e));
    }
  }
  return { recipe: fresh, result: result };
}

// ---------- Digest email ----------

function sendDigestEmail_(recipe, result) {
  const userEmail = Session.getActiveUser().getEmail();
  if (!userEmail) return;

  const deleted = result.deleted || 0;
  const remaining = result.remaining || 0;
  const trashUrl = 'https://mail.google.com/mail/u/0/#trash';
  const cadenceLabel = cadenceHumanLabel_(recipe.cadence);

  const subject = 'MailSweep: ' + deleted + ' email' + (deleted === 1 ? '' : 's') +
                  ' cleaned from "' + recipe.name + '"';

  const summaryLine = deleted === 0
    ? 'Nothing matched this run — your filter is keeping the inbox clean.'
    : 'Cleaned ' + formatNumber_(deleted) + ' email' + (deleted === 1 ? '' : 's') +
      ' from your inbox.' +
      (remaining > 0
        ? ' (~' + formatNumber_(remaining) + ' still match — next ' + cadenceLabel + ' run will continue.)'
        : '');

  const filterSummary = humanFilterSummary_(recipe.filters);

  const html =
    '<div style="font-family:Roboto,Arial,sans-serif;color:#202124;max-width:560px">' +
      '<div style="font-size:18px;font-weight:600;color:#1a73e8;margin-bottom:12px">' +
        'MailSweep — ' + escapeHtml_(recipe.name) +
      '</div>' +
      '<div style="font-size:14px;line-height:1.5;margin-bottom:16px">' +
        escapeHtml_(summaryLine) +
      '</div>' +
      '<div style="font-size:13px;color:#5f6368;line-height:1.5;margin-bottom:16px">' +
        '<b>Filter:</b> ' + escapeHtml_(filterSummary) + '<br>' +
        '<b>Schedule:</b> ' + escapeHtml_(cadenceLabel) +
      '</div>' +
      (deleted > 0
        ? ('<div style="margin-bottom:16px">' +
            '<a href="' + trashUrl + '" style="background:#1a73e8;color:#fff;' +
            'text-decoration:none;padding:10px 16px;border-radius:4px;' +
            'font-size:14px;font-weight:500;display:inline-block">' +
            'View in Trash</a>' +
          '</div>')
        : '') +
      '<div style="font-size:12px;color:#5f6368">' +
        'Trashed emails stay recoverable in Gmail Trash for 30 days. ' +
        'Open MailSweep in Gmail to manage this recipe.' +
      '</div>' +
    '</div>';

  GmailApp.sendEmail(userEmail, subject, summaryLine, {
    htmlBody: html,
    name: 'MailSweep'
  });
}

function cadenceHumanLabel_(cadence) {
  if (cadence === 'daily') return 'daily';
  if (cadence === 'weekly') return 'weekly';
  if (cadence === 'monthly') return 'monthly';
  return cadence || '';
}

function humanFilterSummary_(filters) {
  const parts = [];
  if (filters.sender)   parts.push('from: ' + filters.sender);
  if (filters.subject)  parts.push('subject: ' + filters.subject);
  if (filters.label)    parts.push('label: ' + filters.label);
  if (filters.dateFrom) parts.push('after: ' + filters.dateFrom);
  if (filters.dateTo)   parts.push('before: ' + filters.dateTo);
  if (filters.excludeDomains && filters.excludeDomains.length) {
    parts.push('excluding ' + filters.excludeDomains.length + ' senders');
  }
  return parts.length ? parts.join(' · ') : '(empty filter)';
}

function formatNumber_(n) {
  n = Number(n) || 0;
  return n.toLocaleString();
}
