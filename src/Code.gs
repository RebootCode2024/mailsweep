/**
 * MailSweep — entry points.
 * Wired from appsscript.json triggers.
 */

function onHomepage(e) {
  const state = readBgState_();
  if (state) {
    return buildBackgroundCard_(state);
  }
  return buildFilterCard();
}

function onBgRefresh(e) {
  const state = readBgState_();
  if (!state) {
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(buildFilterCard()))
      .build();
  }
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(buildBackgroundCard_(state)))
    .build();
}

function onBgDismiss(e) {
  clearBgState_();
  clearBgTriggers_();
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(buildFilterCard()))
    .build();
}

function onPreviewClick(e) {
  const filters = readFilters_(e);
  if (!buildQuery_(filters)) {
    return notify_('Enter at least one filter first.');
  }
  const dateErr = validateDateRange_(filters);
  if (dateErr) return notify_(dateErr);
  return runPreview_(filters);
}

function validateDateRange_(filters) {
  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
    return '"Received after" is later than "Received before" — swap the dates.';
  }
  return '';
}

function onPresetClick(e) {
  const params = (e && e.commonEventObject && e.commonEventObject.parameters) || {};
  const filters = JSON.parse(params.filters || '{}');
  return runPreview_(filters);
}

function runPreview_(filters) {
  try {
    const c = countMatchingThreads_(filters);
    return pushCard_(buildPreviewCard(filters, c.count, c.capped, c.estimated));
  } catch (err) {
    return notify_('Error: ' + err.message);
  }
}

function onAnalyzeSenders(e) {
  const params = (e && e.commonEventObject && e.commonEventObject.parameters) || {};
  const filters = JSON.parse(params.filters || '{}');
  const totalCount = Number(params.totalCount || 0);
  const totalCapped = params.capped === '1';
  try {
    const breakdown = analyzeSenders_(filters, totalCount);
    return pushCard_(buildSenderBreakdownCard_(filters, breakdown, totalCount, totalCapped));
  } catch (err) {
    return notify_('Error analyzing senders: ' + err.message);
  }
}

function onSweepSelectedSenders(e) {
  const params = (e && e.commonEventObject && e.commonEventObject.parameters) || {};
  const filters = JSON.parse(params.filters || '{}');
  const domains = JSON.parse(params.domains || '[]');
  const inputs = (e && e.commonEventObject && e.commonEventObject.formInputs) || {};

  const excluded = [];
  let keptCount = 0;
  for (let i = 0; i < domains.length; i++) {
    const d = domains[i];
    const f = inputs['include_' + d];
    const on = !!(f && f.stringInputs && f.stringInputs.value && f.stringInputs.value[0]);
    if (on) keptCount++;
    else excluded.push(d);
  }

  if (keptCount === 0 && excluded.length === domains.length) {
    return notify_('All senders are unticked — nothing to trash.');
  }

  const augmented = Object.assign({}, filters, {
    excludeDomains: (filters.excludeDomains || []).concat(excluded)
  });

  try {
    const c = countMatchingThreads_(augmented);
    return pushCard_(buildConfirmCard(augmented, c.count, c.count, c.capped || c.estimated));
  } catch (err) {
    return notify_('Error: ' + err.message);
  }
}

function onBackToFilters(e) {
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().popCard())
    .build();
}

function onDeletePrompt(e) {
  const params = (e && e.commonEventObject && e.commonEventObject.parameters) || {};
  const filters = JSON.parse(params.filters || '{}');
  const count = Number(params.count || 0);
  const total = Number(params.total || count);
  const capped = params.capped === '1';
  return pushCard_(buildConfirmCard(filters, count, total, capped));
}

function onDeleteConfirm(e) {
  const params = (e && e.commonEventObject && e.commonEventObject.parameters) || {};
  const filters = JSON.parse(params.filters || '{}');
  const total = Number(params.total || 0);
  const deletedSoFar = Number(params.deletedSoFar || 0);

  // Paywall check — only on the FIRST run of a sweep (when deletedSoFar=0).
  // Continuations of an in-progress sweep skip validation; the user already
  // consumed their quota when they kicked it off.
  if (deletedSoFar === 0) {
    const verdict = validateCurrentUser_();
    if (!verdict.allowed) {
      return CardService.newActionResponseBuilder()
        .setNavigation(CardService.newNavigation().updateCard(buildPaywallCard_(verdict)))
        .build();
    }
  }

  try {
    const result = deleteMatchingThreads_(filters);
    const newDeletedSoFar = deletedSoFar + result.deleted;

    // If there's more to do, hand off to a background trigger.
    if (result.remaining > 0) {
      writeBgState_({
        filters: filters,
        total: total,
        deletedSoFar: newDeletedSoFar,
        remaining: result.remaining,
        remainingCapped: result.remainingCapped,
        startTime: Date.now(),
        lastRun: Date.now(),
        completed: false
      });
      try {
        scheduleBgRun_();
      } catch (bgErr) {
        // Trigger creation failed — fall back to manual Continue UI.
        return CardService.newActionResponseBuilder()
          .setNavigation(CardService.newNavigation().updateCard(
            buildResultCard(filters, result, total, deletedSoFar)
          ))
          .setStateChanged(true)
          .build();
      }
      return CardService.newActionResponseBuilder()
        .setNavigation(CardService.newNavigation().updateCard(
          buildBackgroundCard_(readBgState_())
        ))
        .setNotification(CardService.newNotification()
          .setText('Trashed ' + result.deleted + ' so far. Continuing in background.'))
        .setStateChanged(true)
        .build();
    }

    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(
        buildResultCard(filters, result, total, deletedSoFar)
      ))
      .setNotification(CardService.newNotification()
        .setText('Trashed ' + result.deleted + ' email' + (result.deleted === 1 ? '' : 's') + '. Refresh Gmail to update the list.'))
      .setStateChanged(true)
      .build();
  } catch (err) {
    return notify_('Error: ' + err.message);
  }
}

function onBackToHome(e) {
  return CardService.newActionResponseBuilder()
    .setNavigation(
      CardService.newNavigation()
        .popToRoot()
        .updateCard(buildFilterCard())
    )
    .setStateChanged(true)
    .build();
}

function pushCard_(card) {
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(card))
    .build();
}

function notify_(text) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(text))
    .build();
}

// ============================================================
// Recurring sweeps — handlers
// ============================================================

function onSaveRecipePrompt(e) {
  const filters = readFilters_(e);
  if (!buildQuery_(filters)) {
    return notify_('Enter at least one filter first.');
  }
  const dateErr = validateDateRange_(filters);
  if (dateErr) return notify_(dateErr);

  const verdict = validateCurrentUser_();
  if (!verdict.allowed || verdict.status !== 'paid') {
    return pushCard_(buildRecurringPaywallCard_(verdict));
  }

  return pushCard_(buildSaveRecipeCard_(filters, 'weekly'));
}

function onSaveRecipeFromResult(e) {
  const params = (e && e.commonEventObject && e.commonEventObject.parameters) || {};
  const filters = JSON.parse(params.filters || '{}');

  const verdict = validateCurrentUser_();
  if (!verdict.allowed || verdict.status !== 'paid') {
    return pushCard_(buildRecurringPaywallCard_(verdict));
  }

  return pushCard_(buildSaveRecipeCard_(filters, 'weekly'));
}

function onSaveRecipeConfirm(e) {
  const params = (e && e.commonEventObject && e.commonEventObject.parameters) || {};
  const filters = JSON.parse(params.filters || '{}');
  const inputs = (e && e.commonEventObject && e.commonEventObject.formInputs) || {};
  const name = getStringInput_(inputs, 'recipe_name') || suggestRecipeName_(filters);
  const cadence = getStringInput_(inputs, 'recipe_cadence') || 'weekly';
  const digestEnabled = getSwitchInput_(inputs, 'recipe_digest');

  const verdict = validateCurrentUser_();
  if (!verdict.allowed || verdict.status !== 'paid') {
    return pushCard_(buildRecurringPaywallCard_(verdict));
  }

  try {
    createRecipe(name, filters, cadence, digestEnabled);
  } catch (err) {
    return notify_('Could not save: ' + (err && err.message || err));
  }

  return CardService.newActionResponseBuilder()
    .setNavigation(
      CardService.newNavigation()
        .popToRoot()
        .updateCard(buildFilterCard())
    )
    .setNotification(CardService.newNotification().setText('Saved — runs ' + cadence + '.'))
    .setStateChanged(true)
    .build();
}

function onRecipeOpen(e) {
  const params = (e && e.commonEventObject && e.commonEventObject.parameters) || {};
  const recipe = getRecipe_(params.recipeId);
  if (!recipe) return notify_('Recipe not found.');
  return pushCard_(buildRecipeEditCard_(recipe));
}

function onRecipeRunNow(e) {
  const params = (e && e.commonEventObject && e.commonEventObject.parameters) || {};
  const recipeId = params.recipeId;

  const verdict = validateCurrentUser_();
  if (!verdict.allowed || verdict.status !== 'paid') {
    return pushCard_(buildRecurringPaywallCard_(verdict));
  }

  let out;
  try {
    out = runRecipeNow_(recipeId);
  } catch (err) {
    return notify_('Run failed: ' + (err && err.message || err));
  }
  if (!out) return notify_('Recipe not found.');

  const r = out.recipe;
  const r2 = getRecipe_(recipeId);
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(buildRecipeEditCard_(r2 || r)))
    .setNotification(CardService.newNotification()
      .setText('Trashed ' + (out.result.deleted || 0) + '. Check your inbox + digest email.'))
    .setStateChanged(true)
    .build();
}

function onRecipeToggle(e) {
  const params = (e && e.commonEventObject && e.commonEventObject.parameters) || {};
  const enable = params.enable === '1';
  const updated = setRecipeEnabled(params.recipeId, enable);
  if (!updated) return notify_('Recipe not found.');
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(buildRecipeEditCard_(updated)))
    .setStateChanged(true)
    .build();
}

function onRecipeSaveEdits(e) {
  const params = (e && e.commonEventObject && e.commonEventObject.parameters) || {};
  const inputs = (e && e.commonEventObject && e.commonEventObject.formInputs) || {};
  const recipeId = params.recipeId;
  const newName = getStringInput_(inputs, 'recipe_new_name');
  const newCadence = getStringInput_(inputs, 'recipe_new_cadence');
  const newDigest = getSwitchInput_(inputs, 'recipe_new_digest');

  let recipe = getRecipe_(recipeId);
  if (!recipe) return notify_('Recipe not found.');

  let changed = false;
  if (newName && newName !== recipe.name) {
    renameRecipe(recipeId, newName);
    changed = true;
  }
  if (newCadence && newCadence !== recipe.cadence) {
    changeRecipeCadence(recipeId, newCadence);
    changed = true;
  }
  if (newDigest !== !!recipe.digestEnabled) {
    setRecipeDigest(recipeId, newDigest);
    changed = true;
  }

  recipe = getRecipe_(recipeId);
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(buildRecipeEditCard_(recipe)))
    .setNotification(CardService.newNotification()
      .setText(changed ? 'Saved.' : 'No changes.'))
    .setStateChanged(true)
    .build();
}

function onRecipeDelete(e) {
  const params = (e && e.commonEventObject && e.commonEventObject.parameters) || {};
  deleteRecipeAndTrigger(params.recipeId);
  return CardService.newActionResponseBuilder()
    .setNavigation(
      CardService.newNavigation()
        .popToRoot()
        .updateCard(buildFilterCard())
    )
    .setNotification(CardService.newNotification().setText('Recipe deleted.'))
    .setStateChanged(true)
    .build();
}
