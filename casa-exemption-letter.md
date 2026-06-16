# MailSweep — CASA exemption justification

**Purpose:** paste this into Google's OAuth verification submission form (in the "Justification for restricted scope use" field) alongside the YouTube demo video URL. This letter argues that MailSweep qualifies for the CASA-not-applicable exemption per Google's own stated criteria.

**Submitter:** Harsh Bhojwani (`imharshbhojwani@gmail.com`)
**App:** MailSweep — Gmail bulk-cleanup add-on
**Restricted scope claimed:** `https://www.googleapis.com/auth/gmail.modify`
**Date:** [fill in submission date]

---

## Letter (paste this verbatim)

> MailSweep is a Google Workspace add-on (Apps Script) that helps users bulk-delete Gmail messages matching a filter they choose — by sender, subject, label, or date range.
>
> ### Why `gmail.modify` is the minimum scope required
>
> The `gmail.modify` scope is necessary because MailSweep performs `Messages.batchModify` calls that add the system `TRASH` label to selected messages. No narrower Gmail scope — `gmail.readonly`, `gmail.metadata`, or `gmail.labels` — permits modifying message labels for the purpose of moving them to Trash. We deliberately do not request the broader `mail.google.com` scope; `gmail.modify` is the least-privilege scope that supports our core feature.
>
> ### Why CASA does not apply to MailSweep
>
> Google's published criteria state that a Cloud Application Security Assessment is required when an app *"stores or transmits restricted scope data on servers."* MailSweep does neither. Specifically:
>
> 1. **All Gmail API calls execute inside Google Apps Script.** Apps Script runs on Google's own infrastructure. The Gmail API requests originate from, are processed in, and return to Google's servers without traversing any third-party network.
>
> 2. **No Gmail message data — content, subject, body, headers, attachments, recipient lists, or message IDs — is ever written to, cached on, transmitted to, or processed by any server we operate.** The data path for Gmail content is strictly Google → Apps Script → Google.
>
> 3. **Our backend (Supabase) handles license validation only.** When a sweep is initiated, MailSweep sends exactly one piece of information to Supabase: the user's Google account email address (obtained from `userinfo.email`). The Supabase function returns a boolean indicating whether the user has a valid lifetime license or is within their free trial. No Gmail data, message metadata, search query, sender information, or result count is ever transmitted to Supabase.
>
> 4. **The sender-breakdown feature** reads the `From` header from a sample of matching messages and groups by domain. This processing happens entirely within Apps Script on Google's infrastructure. The aggregated counts are displayed in the Gmail sidebar UI and discarded after the user's session. No sender data is persisted or transmitted outside Google's ecosystem.
>
> 5. **The recurring-sweeps feature** stores recipe definitions (filter parameters + cadence + run statistics) inside the user's own Apps Script `UserProperties` — meaning the data lives inside the user's Google account on Google's servers, not on ours. Trigger execution is handled by Google's own Apps Script trigger infrastructure.
>
> ### Data flow summary
>
> ```
>   USER → Gmail (clicks "Sweep")
>        ↓
>   Apps Script (Google's servers)
>     - Issues Gmail API search for matching messages
>     - Adds TRASH label via Messages.batchModify
>     - Reads From headers for sender breakdown (in-memory, ephemeral)
>     - Stores recurring-sweep recipes in UserProperties (Google's servers)
>        ↓
>   Gmail (Google's servers)
>     - Returns matching IDs / accepts batch modify / persists Trash state
> 
>   Apps Script → Supabase (our backend)
>     - SENDS: user's Google email address ONLY
>     - RECEIVES: license validity boolean ONLY
>     - Zero Gmail data ever included in either direction
> 
>   Apps Script → Gumroad (payment processor)
>     - User's checkout happens via Gumroad's hosted page
>     - Gumroad webhooks send purchase email back to Supabase
>     - Zero Gmail data ever included
> ```
>
> ### Limited Use compliance
>
> MailSweep's use of data from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements. We do not transfer Google user data to third parties except as necessary to provide or improve MailSweep itself; we do not use Google user data for advertising; and we do not allow humans to read Google user data except (a) with explicit consent for support purposes, (b) for security purposes such as investigating abuse, or (c) to comply with applicable law. This policy is published at https://rebootcode2024.github.io/mailsweep/privacy.html.
>
> ### Conclusion
>
> Because MailSweep does not store or transmit any restricted-scope data on servers we operate — and because all Gmail data processing occurs entirely within Google's own infrastructure — we respectfully submit that the CASA security assessment is not applicable to this app per Google's own published criteria.
>
> The demo video at [YouTube URL — fill in after recording] demonstrates the full user-facing flow and explicitly verbalizes how the `gmail.modify` scope is used.
>
> We are available to answer any follow-up questions at imharshbhojwani@gmail.com.
>
> Respectfully submitted,
> Harsh Bhojwani
> MailSweep developer
> [submission date]

---

## Per-scope justification table (paste into the per-scope fields if Google asks separately)

| Scope | Justification (≤2 sentences each) |
|---|---|
| `gmail.modify` | Required to read message IDs matching the user's filter and to add the `TRASH` label via `Messages.batchModify`. No message content is read, stored, or transmitted beyond the user's own account. |
| `gmail.addons.execute` | Required to run as a Gmail sidebar add-on. The add-on is the entire product surface. |
| `script.scriptapp` | Required to create time-driven triggers for the Recurring Sweeps feature and for background continuation of large one-off sweeps that exceed the 6-minute Apps Script execution wall. |
| `script.external_request` | Required to call our Supabase-hosted paywall validation endpoint before each sweep. Only the user's Google email address is sent; no Gmail data is transmitted. |
| `userinfo.email` | Required to read the user's Gmail address as the license identifier. The buyer's Gmail address acts as the license key; there is no separate license key. |

---

## If Google rejects the exemption

If verification comes back asking for CASA anyway, the fallback path is:

1. Reach out to TAC Security (Indian CASA-approved lab) for a Tier 2 quote. Approximate range we've heard: ~₹50,000/year.
2. If TAC's quote is workable, proceed. If not, reach out to other approved labs.
3. Update the OAuth submission with "CASA letter of engagement" once signed.
4. Continue launch in parallel — Google often allows operation during the CASA-in-progress window.

Do not refund users or take MailSweep offline simply because CASA review is pending — Google's enforcement only triggers if the assessment isn't started OR if active installs cross 100 without a valid CASA. See repo's `mailsweep-project.md` for the full launch sequence.

---

## Notes for the submitter

- Replace `[YouTube URL]` and `[submission date]` before pasting.
- Keep the letter intact — every paragraph is doing work. Reviewers skim for "stores or transmits restricted scope data on servers"; the letter rebuts that claim point by point.
- If the form field is character-limited, the "Conclusion" paragraph is the most essential — preserve it and trim the data-flow diagram first.
- Save your reviewer's reply email — if they accept, that email is the evidence you can show TAC Security (or anyone else) showing CASA isn't required for this architecture.
