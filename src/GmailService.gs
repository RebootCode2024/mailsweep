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
  const q = buildQuery_(filters);
  if (!q) return 0;
  const res = Gmail.Users.Threads.list('me', { q: q, maxResults: 1 });
  return res.resultSizeEstimate || 0;
}

function deleteMatchingThreads_(filters) {
  // TODO: paginate Gmail.Users.Threads.list, call Threads.trash in batches of BATCH_SIZE.
  return { deleted: 0, remaining: 0 };
}
