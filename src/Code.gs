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
  return runPreview_(filters);
}

function onPresetClick(e) {
  const params = (e && e.commonEventObject && e.commonEventObject.parameters) || {};
  const filters = JSON.parse(params.filters || '{}');
  return runPreview_(filters);
}

function runPreview_(filters) {
  try {
    const c = countMatchingThreads_(filters);
    return pushCard_(buildPreviewCard(filters, c.count, c.capped));
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
    .setNavigation(CardService.newNavigation().popToRoot())
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
