/**
 * Gmail search + trash logic.
 * Day 8-10: implement batch fetch + trash via Gmail API advanced service.
 */

var BATCH_SIZE = 500;
var MAX_RUN_MS = 5 * 60 * 1000;

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
  const q = buildQuery_(filters);
  if (!q) return { deleted: 0, remaining: 0, timedOut: false };

  const start = Date.now();
  let deleted = 0;
  let pageToken;
  let timedOut = false;

  do {
    if (Date.now() - start > MAX_RUN_MS) { timedOut = true; break; }

    const page = Gmail.Users.Threads.list('me', {
      q: q,
      maxResults: BATCH_SIZE,
      pageToken: pageToken
    });
    const threads = page.threads || [];
    if (!threads.length) break;

    for (let i = 0; i < threads.length; i++) {
      if (Date.now() - start > MAX_RUN_MS) { timedOut = true; break; }
      try {
        Gmail.Users.Threads.trash('me', threads[i].id);
        deleted++;
      } catch (e) {
        // swallow per-thread errors; counted as remaining
      }
    }
    pageToken = page.nextPageToken;
  } while (pageToken && !timedOut);

  const remaining = countMatchingThreads_(filters);
  return { deleted: deleted, remaining: remaining, timedOut: timedOut };
}
