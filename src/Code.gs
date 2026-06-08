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
    const count = countMatchingThreads_(filters);
    return pushCard_(buildPreviewCard(filters, count));
  } catch (err) {
    return notify_('Error: ' + err.message);
  }
}

function onBackToFilters(e) {
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().popCard())
    .build();
}

function onDeleteConfirm(e) {
  const filters = readFilters_(e);
  const result = deleteMatchingThreads_(filters);
  return buildResultCard(result);
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
