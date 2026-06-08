/**
 * MailSweep — entry points.
 * Wired from appsscript.json triggers.
 */

function onHomepage(e) {
  return buildFilterCard();
}

function onPreviewClick(e) {
  const filters = readFilters_(e);
  const count = countMatchingThreads_(filters);
  return buildPreviewCard(filters, count);
}

function onDeleteConfirm(e) {
  const filters = readFilters_(e);
  const result = deleteMatchingThreads_(filters);
  return buildResultCard(result);
}
