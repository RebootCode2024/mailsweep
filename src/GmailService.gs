/**
 * Gmail search + trash logic.
 * Day 8-10: implement batch fetch + trash via Gmail API advanced service.
 */

var BATCH_SIZE = 500;

function buildQuery_(filters) {
  var parts = [];
  if (filters.sender)   parts.push('from:' + filters.sender);
  if (filters.subject)  parts.push('subject:' + filters.subject);
  if (filters.label)    parts.push('label:' + filters.label);
  if (filters.dateFrom) parts.push('after:' + filters.dateFrom);
  if (filters.dateTo)   parts.push('before:' + filters.dateTo);
  return parts.join(' ');
}

function countMatchingThreads_(filters) {
  // TODO: use Gmail.Users.Threads.list with resultSizeEstimate or paginated count.
  return 0;
}

function deleteMatchingThreads_(filters) {
  // TODO: paginate Gmail.Users.Threads.list, call Threads.trash in batches of BATCH_SIZE.
  return { deleted: 0, remaining: 0 };
}
