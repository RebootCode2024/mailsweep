/**
 * Gmail search + trash logic.
 * Uses Messages (not Threads) so we can batchModify up to 1000 IDs per API call.
 */

var BATCH_SIZE = 500;             // page size for list calls
var BATCH_TRASH_SIZE = 1000;      // max IDs per batchModify (Gmail API hard limit)
var MAX_RUN_MS = 3 * 60 * 1000;   // safety buffer below the 6-min Apps Script wall
var COUNT_HARD_CAP = 10000;       // stop counting beyond this; show "10,000+"

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
  if (!q) return { count: 0, capped: false };
  let total = 0;
  let pageToken;
  do {
    const res = Gmail.Users.Messages.list('me', {
      q: q,
      maxResults: BATCH_SIZE,
      pageToken: pageToken,
      fields: 'nextPageToken,messages/id'
    });
    total += (res.messages || []).length;
    if (total >= COUNT_HARD_CAP) return { count: COUNT_HARD_CAP, capped: true };
    pageToken = res.nextPageToken;
  } while (pageToken);
  return { count: total, capped: false };
}

function deleteMatchingThreads_(filters) {
  const q = buildQuery_(filters);
  if (!q) return { deleted: 0, remaining: 0, remainingCapped: false, timedOut: false };

  const start = Date.now();
  let deleted = 0;
  let pageToken;
  let timedOut = false;
  let buffer = [];

  do {
    if (Date.now() - start > MAX_RUN_MS) { timedOut = true; break; }

    const page = Gmail.Users.Messages.list('me', {
      q: q,
      maxResults: BATCH_SIZE,
      pageToken: pageToken,
      fields: 'nextPageToken,messages/id'
    });
    const msgs = page.messages || [];
    if (!msgs.length && !buffer.length) break;

    for (let i = 0; i < msgs.length; i++) buffer.push(msgs[i].id);

    // Flush buffer in chunks of BATCH_TRASH_SIZE
    while (buffer.length >= BATCH_TRASH_SIZE) {
      if (Date.now() - start > MAX_RUN_MS) { timedOut = true; break; }
      const chunk = buffer.splice(0, BATCH_TRASH_SIZE);
      try {
        Gmail.Users.Messages.batchModify({
          ids: chunk,
          addLabelIds: ['TRASH']
        }, 'me');
        deleted += chunk.length;
      } catch (e) {
        // batchModify is all-or-nothing; if it fails, leave them
      }
    }
    pageToken = page.nextPageToken;
  } while (pageToken && !timedOut);

  // Flush remainder
  if (!timedOut && buffer.length) {
    try {
      Gmail.Users.Messages.batchModify({
        ids: buffer,
        addLabelIds: ['TRASH']
      }, 'me');
      deleted += buffer.length;
      buffer = [];
    } catch (e) {}
  }

  // Fast recount: one list call only, so we never burn time after a huge delete.
  let remaining = 0;
  let remainingCapped = false;
  try {
    const fast = countMatchingFast_(filters);
    remaining = fast.count;
    remainingCapped = fast.capped;
  } catch (e) {
    remaining = timedOut ? BATCH_SIZE : 0;
    remainingCapped = timedOut;
  }
  return {
    deleted: deleted,
    remaining: remaining,
    remainingCapped: remainingCapped,
    timedOut: timedOut
  };
}

// Single-API-call count for after-delete: returns N and "+" flag if more pages exist.
// Bounded time (< 1s) so it's safe even at the edge of the run budget.
function countMatchingFast_(filters) {
  const q = buildQuery_(filters);
  if (!q) return { count: 0, capped: false };
  const res = Gmail.Users.Messages.list('me', {
    q: q,
    maxResults: BATCH_SIZE,
    fields: 'nextPageToken,messages/id'
  });
  const count = (res.messages || []).length;
  const capped = !!res.nextPageToken;
  return { count: count, capped: capped };
}
