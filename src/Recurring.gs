/**
 * Recurring sweeps: saved filter recipes that run on a daily/weekly/monthly
 * cadence via a SINGLE shared time-driven trigger per user.
 *
 * Storage: one UserProperty key holding a JSON array of recipes.
 *
 * Trigger model: ONE clock trigger per user. Created lazily on the first
 * recipe save and reused forever. It fires daily at ~3am; the handler
 * `runDueRecurringSweeps` walks every recipe and decides which are due
 * based on cadence + lastRunAt. This sidesteps Apps Script's per-user
 * trigger-create rate limit entirely — save/pause/rename/cadence-change
 * never touch the trigger system after the first install.
 *
 * Recipe cap is 50 for sanity; trigger count is no longer a constraint.
 */

var RECIPES_KEY = 'mailsweep_recipes_v1';
var DISPATCHER_HANDLER = 'runDueRecurringSweeps';
var MAX_RECIPES = 25;

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

// ---------- Shared dispatcher trigger ----------

/**
 * Ensures the single shared daily dispatcher trigger exists. Idempotent —
 * if one already exists for this user, does nothing. Called once on the
 * first recipe save and after manual purges.
 */
function ensureDispatcherTrigger_() {
  const existing = ScriptApp.getProjectTriggers();
  for (let i = 0; i < existing.length; i++) {
    if (existing[i].getHandlerFunction() === DISPATCHER_HANDLER) return;
  }
  ScriptApp.newTrigger(DISPATCHER_HANDLER)
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();
}

/**
 * Maintenance: deletes ALL recipe-related triggers (the shared dispatcher
 * AND any legacy per-recipe triggers from older code). Safe to run anytime.
 * The next recipe action will re-create the dispatcher.
 */
function purgeOrphanTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  let deleted = 0;
  for (let i = 0; i < triggers.length; i++) {
    const t = triggers[i];
    const h = t.getHandlerFunction();
    if (h === DISPATCHER_HANDLER ||
        h === 'runRecurringSweep' /* legacy per-recipe handler */) {
      try { ScriptApp.deleteTrigger(t); deleted++; } catch (e) { /* ignore */ }
    }
  }
  console.log('Purged ' + deleted + ' recipe trigger(s).');
  return deleted;
}

/**
 * Diagnostic: prints the actual trigger + recipe state.
 */
function diagnoseTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  console.log('=== TRIGGERS (' + triggers.length + ') ===');
  triggers.forEach(function (t, i) {
    console.log(i + ': handler=' + t.getHandlerFunction() +
      ' uid=' + t.getUniqueId() +
      ' type=' + t.getEventType());
  });
  const recipes = listRecipes_();
  console.log('=== RECIPES (' + recipes.length + ') ===');
  recipes.forEach(function (r) {
    console.log('Recipe "' + r.name + '" enabled=' + r.enabled +
      ' cadence=' + r.cadence + ' lastRunAt=' + r.lastRunAt);
  });
  console.log('MAX_RECIPES=' + MAX_RECIPES);
}

// ---------- Public API used by Cards / Code ----------

function createRecipe(name, filters, cadence, digestEnabled) {
  const recipes = listRecipes_();
  if (recipes.length >= MAX_RECIPES) {
    throw new Error(
      'You\'ve reached the ' + MAX_RECIPES +
      '-recipe limit. Delete an existing one to add another.'
    );
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
    // weekday and monthday captured at create time — these decide which days
    // the dispatcher considers the recipe "due" when it fires daily.
    weekday: new Date().getDay(),       // 0=Sun..6=Sat
    monthday: new Date().getDate()      // 1..31
  };
  upsertRecipe_(recipe);
  // First save bootstraps the shared dispatcher; later saves are no-ops.
  try { ensureDispatcherTrigger_(); } catch (e) {
    console.error('Dispatcher install failed: ' + (e && e.message || e));
  }
  return recipe;
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
  recipe.enabled = !!enabled;
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
  recipe.cadence = cadence;
  upsertRecipe_(recipe);
  return recipe;
}

function deleteRecipeAndTrigger(recipeId) {
  deleteRecipe_(recipeId);
  // If the user just deleted their last recipe, free up the dispatcher
  // slot. They can save another anytime and we'll lazily reinstall it.
  const remaining = listRecipes_();
  if (remaining.length === 0) {
    const triggers = ScriptApp.getProjectTriggers();
    for (let i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === DISPATCHER_HANDLER) {
        try { ScriptApp.deleteTrigger(triggers[i]); } catch (e) { /* ignore */ }
      }
    }
  }
}

// ---------- Dispatcher: fires daily, runs whichever recipes are due ----------

function runDueRecurringSweeps() {
  const recipes = listRecipes_();
  const now = new Date();
  for (let i = 0; i < recipes.length; i++) {
    const r = recipes[i];
    if (!r.enabled) continue;
    if (isRecipeDue_(r, now)) {
      try {
        runRecipeNow_(r.id);
      } catch (e) {
        console.error('Recipe "' + r.name + '" failed: ' +
          (e && e.message || e));
      }
    }
  }
}

/**
 * Returns true if this recipe should fire today. Combines cadence + last-run
 * + the recipe's anchor day (weekday / monthday) captured at create time.
 *
 *   daily   → due if not yet run today
 *   weekly  → due if today's weekday matches recipe.weekday AND not yet run
 *             in the last 6 days (prevents double-fires if dispatcher runs
 *             multiple times on the same day for any reason)
 *   monthly → due if today's day-of-month matches recipe.monthday AND not yet
 *             run in the last 27 days (same dedup intent)
 */
function isRecipeDue_(recipe, now) {
  const today = startOfDay_(now).getTime();
  const lastRun = recipe.lastRunAt ? startOfDay_(new Date(recipe.lastRunAt)).getTime() : 0;
  const oneDay = 24 * 60 * 60 * 1000;

  if (recipe.cadence === 'daily') {
    return lastRun < today;
  }
  if (recipe.cadence === 'weekly') {
    if (now.getDay() !== recipe.weekday) return false;
    return (today - lastRun) >= 6 * oneDay;
  }
  if (recipe.cadence === 'monthly') {
    if (now.getDate() !== recipe.monthday) return false;
    return (today - lastRun) >= 27 * oneDay;
  }
  return false;
}

function startOfDay_(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Runs the recipe immediately — used by both the dispatcher and the
 * "Run now" button on the per-recipe edit card.
 *
 * Reuses the existing deleteMatchingThreads_ pipeline (same battle-tested
 * batchModify path, same 3-min internal budget). For huge recipes we
 * accept what one run can do — the next cadence fire picks up the rest.
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
