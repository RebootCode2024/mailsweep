/**
 * Supabase client — calls the validate-user edge function to decide
 * whether the current user is allowed to delete.
 *
 * Secrets live in Script Properties (Apps Script → Project Settings →
 * Script Properties). Never hardcode them here — they ride along with
 * the Marketplace deployment and would leak if committed.
 *
 * Required Script Properties:
 *   SUPABASE_VALIDATE_URL  — full URL of the validate-user function
 *   SUPABASE_SECRET_KEY    — the sb_secret_... key
 *   GUMROAD_CHECKOUT_URL   — full URL of the Gumroad product checkout
 */

// Comp'd accounts — friends, testers, the founder. Always allowed, never charged.
var WHITELIST_EMAILS = [
  'haranddev@gmail.com',
  'imharshbhojwani@gmail.com',
  'harshrox555@gmail.com'
];

function validateCurrentUser_() {
  const email = Session.getActiveUser().getEmail();
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SUPABASE_VALIDATE_URL');
  const secret = props.getProperty('SUPABASE_SECRET_KEY');

  // Whitelist bypass — skip Supabase entirely.
  if (email && WHITELIST_EMAILS.indexOf(email.toLowerCase()) !== -1) {
    return { allowed: true, status: 'paid' };
  }

  // If paywall isn't wired up yet (dev/test), fail-open and allow.
  if (!url || !secret) {
    return { allowed: true, status: 'unconfigured' };
  }

  // If we can't determine the email (rare in add-on context), block softly.
  if (!email) {
    return { allowed: false, status: 'no_email',
             message: 'Could not detect your Gmail address. Please reopen the add-on.' };
  }

  try {
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'apikey': secret },
      payload: JSON.stringify({ email: email }),
      muteHttpExceptions: true
    });
    const code = res.getResponseCode();
    const body = res.getContentText();
    if (code !== 200) {
      console.error('validate-user HTTP ' + code + ': ' + body);
      // Fail-open on backend errors so we never block a paying user
      // because Supabase had a hiccup. Worth revisiting once we have telemetry.
      return { allowed: true, status: 'error' };
    }
    return JSON.parse(body);
  } catch (e) {
    console.error('validate-user threw: ' + (e && e.message || e));
    return { allowed: true, status: 'error' };
  }
}

function getCheckoutUrl_() {
  return PropertiesService.getScriptProperties().getProperty('GUMROAD_CHECKOUT_URL')
    || 'https://gumroad.com';
}
