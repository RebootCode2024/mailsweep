/**
 * Supabase keep-alive ping.
 *
 * Supabase's free tier auto-pauses a project after 7 days of inactivity. Once
 * paused, the Gumroad webhook for new purchases also fails — meaning a
 * customer who pays during a slow patch wouldn't get their license activated.
 *
 * Fix: a weekly trigger that hits validate-user with a sentinel email. The
 * edge function short-circuits for this email — no row is created, no
 * counters are touched — but the call itself counts as activity against
 * Supabase's idle timer, keeping the project awake.
 *
 * Setup: run `installKeepAliveTrigger` once from the Apps Script editor.
 * Tear-down: run `removeKeepAliveTrigger` if ever needed.
 */

var KEEPALIVE_HANDLER = 'runKeepAlivePing';
var KEEPALIVE_EMAIL = 'keepalive@mailsweep.app';

/**
 * One-time setup. Run this once from the Apps Script editor under the
 * developer account that owns the deployment. Creates one weekly trigger
 * that fires every Monday at ~6am script timezone.
 *
 * Idempotent — re-running won't create duplicate triggers.
 */
function installKeepAliveTrigger() {
  removeKeepAliveTrigger();
  ScriptApp.newTrigger(KEEPALIVE_HANDLER)
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(6)
    .create();
  console.log('Keep-alive trigger installed. Will fire every Monday ~6am.');
}

function removeKeepAliveTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === KEEPALIVE_HANDLER) {
      try { ScriptApp.deleteTrigger(triggers[i]); removed++; } catch (e) {}
    }
  }
  if (removed) console.log('Removed ' + removed + ' keep-alive trigger(s).');
}

/**
 * Trigger handler. Single POST to validate-user with the sentinel email.
 * Errors are logged but never thrown — a flaky network call shouldn't
 * cause the trigger to retry storm or alert.
 */
function runKeepAlivePing() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SUPABASE_VALIDATE_URL');
  const secret = props.getProperty('SUPABASE_SECRET_KEY');
  if (!url || !secret) {
    console.error('Keep-alive: missing SUPABASE_VALIDATE_URL or SUPABASE_SECRET_KEY.');
    return;
  }
  try {
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'apikey': secret },
      payload: JSON.stringify({ email: KEEPALIVE_EMAIL }),
      muteHttpExceptions: true
    });
    const code = res.getResponseCode();
    console.log('Keep-alive ping → HTTP ' + code);
  } catch (e) {
    console.error('Keep-alive ping threw: ' + (e && e.message || e));
  }
}
