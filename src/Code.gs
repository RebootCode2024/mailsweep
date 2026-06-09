/**
 * MailSweep — entry points.
 * Wired from appsscript.json triggers.
 */

function onHomepage(e) {
  return buildFilterCard();
}

function onPreviewClick(e) {
  const filters = readFilters_(e);
  if (!buildQuery_(filters)) {
    return notify_('Enter at least one filter first.');
  }
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
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(
        buildResultCard(filters, result, total, deletedSoFar)
      ))
      .setNotification(CardService.newNotification()
        .setText('Trashed ' + result.deleted + ' thread' + (result.deleted === 1 ? '' : 's') + '. Refresh Gmail to update the list.'))
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
