/**
 * Gmail search + trash logic.
 * Uses Messages (not Threads) so we can batchModify up to 1000 IDs per API call.
 */

var BATCH_SIZE = 500;             // page size for list calls
var BATCH_TRASH_SIZE = 1000;      // max IDs per batchModify (Gmail API hard limit)
var MAX_RUN_MS = 3 * 60 * 1000;   // safety buffer below the 6-min Apps Script wall

function buildQuery_(filters) {
  var parts = [];
  var sender   = cleanFilterValue_(filters.sender,  'from:');
  var subject  = cleanFilterValue_(filters.subject, 'subject:');
  var label    = cleanFilterValue_(filters.label,   'label:');
  var dateFrom = (filters.dateFrom || '').trim();
  var dateTo   = (filters.dateTo   || '').trim();
  var excludeDomains = filters.excludeDomains || [];
  // Storage-cleanup operators — only set by Free-up-storage presets.
  var sizeMinMB     = Number(filters.sizeMinMB) || 0;
  var hasAttachment = !!filters.hasAttachment;
  var olderThan     = (filters.olderThan || '').trim(); // e.g. "5y", "1y", "30d"

  if (sender)  parts.push('from:' + quoteIfNeeded_(sender));
  if (subject) parts.push('subject:' + quoteIfNeeded_(subject));
  if (label)   parts.push('label:' + labelToken_(label));
  if (dateFrom) parts.push('after:' + dateFrom);
  if (dateTo)   parts.push('before:' + dateTo);
  if (sizeMinMB > 0)    parts.push('larger:' + sizeMinMB + 'M');
  if (hasAttachment)    parts.push('has:attachment');
  if (olderThan)        parts.push('older_than:' + olderThan);
  for (var i = 0; i < excludeDomains.length; i++) {
    var d = (excludeDomains[i] || '').trim();
    if (d) parts.push('-from:' + d);
  }
  // Raw passthrough — used by mark-as-read presets to inject `is:unread
  // category:promotions` etc. without adding a structured field for every
  // Gmail operator.
  var extraQuery = (filters.extraQuery || '').trim();
  if (extraQuery) parts.push(extraQuery);
  return parts.join(' ');
}

// Strip surrounding whitespace and an accidental leading operator prefix
// (e.g. user types "from:foo@bar.com" in the From field).
function cleanFilterValue_(raw, prefix) {
  var v = (raw || '').trim();
  if (!v) return '';
  var lower = v.toLowerCase();
  if (lower.indexOf(prefix) === 0) v = v.substring(prefix.length).trim();
  // Strip surrounding quotes — we'll re-add if needed.
  if (v.length >= 2 && v.charAt(0) === '"' && v.charAt(v.length - 1) === '"') {
    v = v.substring(1, v.length - 1);
  }
  return v;
}

// Wrap in quotes if value contains whitespace; escape internal quotes.
function quoteIfNeeded_(v) {
  if (/\s/.test(v)) return '"' + v.replace(/"/g, '\\"') + '"';
  return v;
}

// Gmail label: spaces become dashes (Gmail's own convention), or quote.
function labelToken_(v) {
  if (/\s/.test(v)) return '"' + v.replace(/"/g, '\\"') + '"';
  return v;
}

// Fast count: one Messages.list call (~500ms even on huge inboxes).
// If results fit in a single page → exact count.
// If more pages exist → Gmail's resultSizeEstimate (marked as estimate in UI).
// This replaces a paginate-to-10k loop that previously took 5-10s.
//
// For storage-cleanup filters (sizeMinMB > 0) we additionally pass through a
// single extra page to gather sizeEstimate values so the preview card can
// show "~340 MB will be freed". We cap the size-scan at one extra Gmail
// batch get so it stays under the 1s budget even on huge inboxes.
function countMatchingThreads_(filters) {
  const q = buildQuery_(filters);
  if (!q) return { count: 0, capped: false, estimated: false, bytesEstimate: 0 };

  let page;
  try {
    page = Gmail.Users.Messages.list('me', {
      q: q,
      maxResults: BATCH_SIZE,
      fields: 'nextPageToken,resultSizeEstimate,messages/id'
    });
  } catch (e) {
    return { count: 0, capped: false, estimated: false, bytesEstimate: 0 };
  }

  const firstPageMessages = page.messages || [];
  const firstPageCount = firstPageMessages.length;
  let count, estimated, capped;

  // Single page → exact count.
  if (!page.nextPageToken) {
    count = firstPageCount;
    estimated = false;
    capped = false;
  } else {
    // More pages exist → use Gmail's index estimate (lower-bounded by what we saw).
    count = Math.max(Number(page.resultSizeEstimate) || 0, firstPageCount);
    estimated = true;
    capped = false;
  }

  let bytesEstimate = 0;
  if ((Number(filters.sizeMinMB) || 0) > 0 && firstPageMessages.length > 0) {
    bytesEstimate = sumMessageSizes_(firstPageMessages, count);
  }

  return { count: count, capped: capped, estimated: estimated, bytesEstimate: bytesEstimate };
}

// Sample-based size estimator for storage cleanup.
// We sum sizeEstimate from a sample of message-gets and scale up to total.
// For < 50 messages we sum the whole set for accuracy; above that we sample
// the first 50 and scale (Gmail's sizeEstimate per-message is itself a
// rough number, so over-precision here is wasted work).
function sumMessageSizes_(firstPageMessages, totalCount) {
  const SAMPLE = Math.min(50, firstPageMessages.length);
  const ids = [];
  for (let i = 0; i < SAMPLE; i++) ids.push(firstPageMessages[i].id);

  const sizes = gmailBatchGetSizes_(ids);
  let sampledBytes = 0;
  let sampledN = 0;
  for (let i = 0; i < sizes.length; i++) {
    if (sizes[i] > 0) { sampledBytes += sizes[i]; sampledN++; }
  }
  if (sampledN === 0) return 0;
  const avg = sampledBytes / sampledN;
  return Math.round(avg * totalCount);
}

// Variant of gmailBatchGetFrom_ that returns each message's sizeEstimate.
function gmailBatchGetSizes_(ids) {
  const out = new Array(ids.length);
  for (let i = 0; i < out.length; i++) out[i] = 0;
  if (!ids.length) return out;

  const token = ScriptApp.getOAuthToken();
  const boundary = 'mailsweep_sz_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
  let body = '';
  for (let i = 0; i < ids.length; i++) {
    body += '--' + boundary + '\r\n';
    body += 'Content-Type: application/http\r\n';
    body += 'Content-ID: <item-' + i + '>\r\n\r\n';
    body += 'GET /gmail/v1/users/me/messages/' + ids[i] +
            '?format=metadata&fields=sizeEstimate\r\n\r\n';
  }
  body += '--' + boundary + '--';

  let res;
  try {
    res = UrlFetchApp.fetch('https://gmail.googleapis.com/batch/gmail/v1', {
      method: 'post',
      contentType: 'multipart/mixed; boundary=' + boundary,
      headers: { Authorization: 'Bearer ' + token },
      payload: body,
      muteHttpExceptions: true
    });
  } catch (e) { return out; }

  if (res.getResponseCode() !== 200) return out;
  const headers = res.getAllHeaders();
  const ct = headers['Content-Type'] || headers['content-type'] || '';
  const bMatch = ct.match(/boundary=([^;]+)/);
  if (!bMatch) return out;
  const respBoundary = bMatch[1].replace(/^"|"$/g, '').trim();

  const text = res.getContentText();
  const parts = text.split('--' + respBoundary);
  for (let p = 0; p < parts.length; p++) {
    const part = parts[p];
    if (!part || part === '--' || part === '--\r\n') continue;
    const idMatch = part.match(/Content-ID:\s*<response-item-(\d+)>/i);
    if (!idMatch) continue;
    const idx = parseInt(idMatch[1], 10);
    const o1 = part.indexOf('\r\n\r\n');
    if (o1 < 0) continue;
    const afterOuter = part.substring(o1 + 4);
    const o2 = afterOuter.indexOf('\r\n\r\n');
    if (o2 < 0) continue;
    const jsonBody = afterOuter.substring(o2 + 4).trim().replace(/\r?\n--\s*$/, '');
    try {
      const data = JSON.parse(jsonBody);
      out[idx] = Number(data && data.sizeEstimate) || 0;
    } catch (e) { /* skip */ }
  }
  return out;
}

/**
 * Mark-as-read counterpart to deleteMatchingThreads_.
 * Same batching, budget, and timeout behavior. Difference: instead of adding
 * the TRASH label, we remove the UNREAD label. The emails stay where they
 * are — only the read state changes. Fully reversible by the user via
 * Gmail's own UI.
 *
 * Returns { marked, remaining, remainingCapped, timedOut } so the result
 * card can read the same fields as the delete path.
 */
function markMatchingRead_(filters) {
  const q = buildQuery_(filters);
  if (!q) return { marked: 0, remaining: 0, remainingCapped: false, timedOut: false };

  const start = Date.now();
  let marked = 0;
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

    while (buffer.length >= BATCH_TRASH_SIZE) {
      if (Date.now() - start > MAX_RUN_MS) { timedOut = true; break; }
      const chunk = buffer.splice(0, BATCH_TRASH_SIZE);
      try {
        Gmail.Users.Messages.batchModify({
          ids: chunk,
          removeLabelIds: ['UNREAD']
        }, 'me');
        marked += chunk.length;
      } catch (e) {
        console.error('batchModify (mark-read) failed: ' + (e && e.message || e));
      }
    }
    pageToken = page.nextPageToken;
  } while (pageToken && !timedOut);

  if (!timedOut && buffer.length) {
    try {
      Gmail.Users.Messages.batchModify({
        ids: buffer,
        removeLabelIds: ['UNREAD']
      }, 'me');
      marked += buffer.length;
      buffer = [];
    } catch (e) {
      console.error('batchModify (mark-read flush) failed: ' + (e && e.message || e));
    }
  }

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
    marked: marked,
    remaining: remaining,
    remainingCapped: remainingCapped,
    timedOut: timedOut
  };
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
        console.error('batchModify failed: ' + (e && e.message || e));
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
    } catch (e) {
      console.error('batchModify (flush) failed: ' + (e && e.message || e));
    }
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

// Group matched mail by sender domain. Sample-based on huge inboxes.
// Uses the Gmail Batch endpoint: 100 sub-requests inside one HTTP call,
// so 300 messages cost 3 round trips (~2-3s) instead of 300.
// 5-minute UserCache makes repeat clicks on the same filter instant.
function analyzeSenders_(filters, totalCount) {
  const q = buildQuery_(filters);
  if (!q) return { senders: [], scanned: 0, capped: false, totalCount: 0 };

  const cache = CacheService.getUserCache();
  const cacheKey = senderCacheKey_(filters);
  const cached = cache.get(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) { /* fall through */ }
  }

  const MAX_SCAN = 300;             // sample size — top-N ranking is stable here
  const BATCH_CHUNK = 100;          // Gmail batch endpoint max sub-requests
  const MAX_MS = 8 * 1000;          // hard budget — well inside add-on action wall
  const start = Date.now();

  // Phase 1: collect up to MAX_SCAN message IDs.
  let ids = [];
  let pageToken;
  do {
    if (Date.now() - start > 1500) break;
    let res;
    try {
      res = Gmail.Users.Messages.list('me', {
        q: q,
        maxResults: 500,
        pageToken: pageToken,
        fields: 'nextPageToken,messages/id'
      });
    } catch (e) { break; }
    const msgs = res.messages || [];
    for (let i = 0; i < msgs.length && ids.length < MAX_SCAN; i++) ids.push(msgs[i].id);
    pageToken = res.nextPageToken;
  } while (pageToken && ids.length < MAX_SCAN);

  const moreExist = !!pageToken;

  // Phase 2: Gmail Batch — 100 message-gets per HTTP call.
  const domainMap = {};
  let scanned = 0;
  for (let i = 0; i < ids.length; i += BATCH_CHUNK) {
    if (Date.now() - start > MAX_MS) break;
    const chunk = ids.slice(i, i + BATCH_CHUNK);
    const fromValues = gmailBatchGetFrom_(chunk);
    for (let j = 0; j < fromValues.length; j++) {
      const from = fromValues[j];
      if (!from) continue;
      const parsed = parseSender_(from);
      if (!parsed.domain) continue;
      if (!domainMap[parsed.domain]) {
        domainMap[parsed.domain] = { count: 0, name: parsed.name || parsed.domain };
      }
      domainMap[parsed.domain].count++;
      scanned++;
    }
  }

  const capped = moreExist || scanned < ids.length;
  const total = Number(totalCount) || scanned;
  const scale = capped && scanned > 0 ? total / scanned : 1;

  const senders = Object.keys(domainMap).map(function (d) {
    const raw = domainMap[d].count;
    const scaled = Math.round(raw * scale);
    return {
      domain: d,
      name: domainMap[d].name,
      count: capped ? scaled : raw,
      rawCount: raw,
      estimated: capped
    };
  }).sort(function (a, b) { return b.count - a.count; });

  const result = { senders: senders, scanned: scanned, capped: capped, totalCount: total };
  try { cache.put(cacheKey, JSON.stringify(result), 300); } catch (e) { /* cache is best-effort */ }
  return result;
}

// Stable cache key from a filter set — same filters → same key.
function senderCacheKey_(filters) {
  const f = {
    s: (filters.sender || '').trim().toLowerCase(),
    j: (filters.subject || '').trim().toLowerCase(),
    l: (filters.label || '').trim().toLowerCase(),
    a: (filters.dateFrom || '').trim(),
    b: (filters.dateTo || '').trim(),
    x: (filters.excludeDomains || []).slice().sort().join(',')
  };
  const raw = JSON.stringify(f);
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, raw);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const v = (bytes[i] + 256) % 256;
    hex += (v < 16 ? '0' : '') + v.toString(16);
  }
  return 'snd_' + hex;
}

// Gmail Batch endpoint: bundle up to 100 message-get requests into ONE HTTP call.
// Returns an array of From-header strings (or '' for failed sub-responses), in the
// same order as the input ids. Cuts ~100 sequential calls down to a single round trip.
function gmailBatchGetFrom_(ids) {
  const out = new Array(ids.length);
  for (let i = 0; i < out.length; i++) out[i] = '';
  if (!ids.length) return out;

  const token = ScriptApp.getOAuthToken();
  const boundary = 'mailsweep_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
  let body = '';
  for (let i = 0; i < ids.length; i++) {
    body += '--' + boundary + '\r\n';
    body += 'Content-Type: application/http\r\n';
    body += 'Content-ID: <item-' + i + '>\r\n\r\n';
    body += 'GET /gmail/v1/users/me/messages/' + ids[i] +
            '?format=metadata&metadataHeaders=From&fields=payload/headers\r\n\r\n';
  }
  body += '--' + boundary + '--';

  let res;
  try {
    res = UrlFetchApp.fetch('https://gmail.googleapis.com/batch/gmail/v1', {
      method: 'post',
      contentType: 'multipart/mixed; boundary=' + boundary,
      headers: { Authorization: 'Bearer ' + token },
      payload: body,
      muteHttpExceptions: true
    });
  } catch (e) { return out; }

  if (res.getResponseCode() !== 200) return out;

  // Find the response boundary (may differ from request boundary).
  const headers = res.getAllHeaders();
  const ct = headers['Content-Type'] || headers['content-type'] || '';
  const bMatch = ct.match(/boundary=([^;]+)/);
  if (!bMatch) return out;
  const respBoundary = bMatch[1].replace(/^"|"$/g, '').trim();

  const text = res.getContentText();
  const parts = text.split('--' + respBoundary);
  for (let p = 0; p < parts.length; p++) {
    const part = parts[p];
    if (!part || part === '--' || part === '--\r\n') continue;
    // Map response-item-N back to our index via Content-ID.
    const idMatch = part.match(/Content-ID:\s*<response-item-(\d+)>/i);
    if (!idMatch) continue;
    const idx = parseInt(idMatch[1], 10);
    // Skip outer headers (...\r\n\r\n), then inner HTTP status + inner headers (...\r\n\r\n), then body.
    const o1 = part.indexOf('\r\n\r\n');
    if (o1 < 0) continue;
    const afterOuter = part.substring(o1 + 4);
    const o2 = afterOuter.indexOf('\r\n\r\n');
    if (o2 < 0) continue;
    const jsonBody = afterOuter.substring(o2 + 4).trim().replace(/\r?\n--\s*$/, '');
    try {
      const data = JSON.parse(jsonBody);
      const hs = (data && data.payload && data.payload.headers) || [];
      for (let h = 0; h < hs.length; h++) {
        if ((hs[h].name || '').toLowerCase() === 'from') {
          out[idx] = hs[h].value || '';
          break;
        }
      }
    } catch (e) { /* skip */ }
  }
  return out;
}

// Parse "Foo Bar <foo@bar.com>" → { name: 'Foo Bar', addr: 'foo@bar.com', domain: 'bar.com' }
function parseSender_(raw) {
  const v = (raw || '').trim();
  if (!v) return { name: '', addr: '', domain: '' };
  let name = '';
  let addr = '';
  const lt = v.indexOf('<');
  if (lt >= 0) {
    name = v.substring(0, lt).replace(/^"|"$/g, '').trim();
    const gt = v.indexOf('>', lt);
    addr = v.substring(lt + 1, gt > 0 ? gt : v.length).trim();
  } else {
    addr = v;
  }
  const at = addr.indexOf('@');
  const domain = at >= 0 ? addr.substring(at + 1).toLowerCase() : '';
  return { name: name, addr: addr.toLowerCase(), domain: domain };
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
