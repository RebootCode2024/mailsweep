# MailSweep — Project Brief for Claude Code

> **Instruction for Claude Code:** Read this file fully before starting any work.
> After building each feature, update the **Build Log** section at the bottom of this file.
> Write 1–2 lines per feature: what was built and what it does. This log will be used later for marketing copy, Marketplace listing, and social media content.

---

## What Is MailSweep?

A Google Workspace Add-on (Gmail sidebar) that lets users bulk delete thousands of emails at once — no 50-email cap like Gmail's native UI. Users set filters, preview matching emails, and delete all in one click.

---

## The Problem It Solves

Gmail's web UI only lets you select 50 emails at a time. Deleting thousands of emails requires repeating the same action dozens of times. MailSweep removes this friction entirely using the Gmail API, which has no such cap.

---

## Target Users

- Individual Gmail users with cluttered inboxes
- Small businesses and teams on Google Workspace

---

## Pricing Model

| Tier | Details |
|---|---|
| **Free Trial** | 1 delete/day for 3 days |
| **Same-day second attempt** | Blocked with upgrade prompt |
| **After day 3 (unpaid)** | Permanently blocked on that email ID |
| **Paid** | $3 one-time lifetime payment, unlimited usage |

### Popup Messages to Show Users

**When they try a second delete on the same day:**
> "You've already used your free delete today. Come back tomorrow — or unlock unlimited access for just $3."

**When their 3-day trial ends:**
> "Your 3-day free trial is over. Pay $3 once and clean your inbox forever."

Both popups must include a direct **"Buy for $3"** button linking to Gumroad checkout.

---

## Core Features to Build

1. **Gmail Sidebar UI** — filter inputs: sender, subject keyword, label, date range
2. **Preview Count** — shows number of matching emails before deleting
3. **Bulk Delete** — trashes emails in batches of 500 via Gmail API
4. **Safety Confirmation Dialog** — "You're about to delete X emails. Continue?"
5. **Progress Indicator** — "Deleting 500 of 3,200..."
6. **Run Again Button** — if email count exceeds one run (Apps Script 6-min limit)
7. **License Key Input** — user enters key to unlock paid tier
8. **Trial Enforcement** — 1 delete/day, 3-day max, then blocked by email ID
9. **Upgrade Prompts** — two popup variants (same-day block + trial-over block)

---

## Tech Stack

| Layer | Tool |
|---|---|
| Add-on logic | Google Apps Script |
| UI | Apps Script Card Service |
| Email deletion | Gmail API (via Apps Script) |
| User tracking + license validation | Supabase (edge function) |
| Payments | Gumroad ($3 one-time) |
| Landing page | Plain HTML, hosted on GitHub Pages |
| Distribution | Google Workspace Marketplace |

---

## Supabase Schema

Table name: `users`

| Column | Type | Purpose |
|---|---|---|
| `email_id` | text (primary key) | User's Gmail address |
| `trial_start_date` | date | When they first used MailSweep |
| `last_delete_date` | date | Enforces 1 delete/day rule |
| `trial_days_used` | integer | Counts up to 3 |
| `is_paid` | boolean | true = unlimited access |
| `is_blocked` | boolean | true after day 3 if unpaid |

---

## User Logic Flow

```
User opens sidebar
        ↓
Check Supabase → is_paid?
   YES → allow unlimited delete
   NO  → is_blocked?
           YES → show "trial over" popup
           NO  → last_delete_date = today?
                   YES → show "come back tomorrow" popup
                   NO  → allow delete, update last_delete_date + trial_days_used
                          trial_days_used = 3? → set is_blocked = true
```

---

## Gmail API Notes

- Gmail API is **free**, no cost per call
- Quota: 1 billion units/day per user (will never be hit)
- Apps Script max execution time: **6 minutes per run**
- Delete in **batches of 500** to stay within limits
- If more emails remain after one run, show **"Run Again"** button

---

## 28-Day Build Plan

| Week | Days | Focus |
|---|---|---|
| Week 1 | Day 1–7 | Sidebar UI + filter logic |
| Week 2 | Day 8–14 | Bulk delete logic + confirmation + progress bar |
| Week 3 | Day 15–21 | Gumroad + Supabase license + paywall + trial enforcement |
| Week 4 | Day 22–28 | Marketplace submission + landing page + Reddit launch |

### Detailed Day Plan

| Day | Task |
|---|---|
| 1 | Set up Google Cloud Project, enable Gmail API, create Apps Script project |
| 2 | Build basic sidebar UI — sender filter + subject keyword input |
| 3 | Add date range filter + label filter to sidebar |
| 4 | Wire up "Preview Count" button |
| 5 | Test preview across different filter combinations |
| 6 | Fix UI bugs, polish layout |
| 7 | Test on both personal Gmail and Workspace account |
| 8 | Write batch fetch logic — pull 500 matching emails at a time |
| 9 | Write trash/delete function using Gmail API |
| 10 | Connect delete function to "Delete All" button |
| 11 | Add confirmation dialog before deleting |
| 12 | Add progress indicator |
| 13 | Edge case testing — empty results, API errors, timeouts |
| 14 | Full end-to-end test, fix anything broken |
| 15 | Create Gumroad account, set up $3 lifetime product (switched from LS — Indian individuals can't sell internationally on LS without business registration; Gumroad allows it and is cheaper on $3 — 10% flat = $0.30 vs $0.65) |
| 16 | Set up Supabase project, create users table |
| 17 | Write Supabase edge function — validates license + trial logic |
| 18 | Add "Enter License Key" UI to sidebar |
| 19 | Connect sidebar to Supabase validation function |
| 20 | Enforce trial rules — 1/day, 3-day cap, both popup variants |
| 21 | Full payment flow test — buy → get key → enter → unlock |
| 22 | Write privacy policy page (HTML, host on GitHub Pages) |
| 23 | Set up OAuth consent screen on Google Cloud Console |
| 24 | Take screenshots + record short demo video for Marketplace |
| 25 | Write Marketplace listing — title, description, category |
| 26 | Build one-page landing page |
| 27 | Final review, submit to Google Marketplace |
| 28 | Share on Reddit r/gmail + r/productivity |

---

## Build Log

> **Claude Code: Update this section after completing each feature.**
> Format: `- [Day X] **Feature name** — what it does (1–2 lines)`

- [Day 1] **Repo + Apps Script scaffold live in Gmail** — created private GitHub repo, GCP project `mailsweep-498802` with Gmail API enabled, OAuth platform configured. Apps Script project linked to GCP and pushed via clasp. Manifest declares `gmail.addons.execute` + `gmail.modify` scopes. Test deployment installed; add-on renders in Gmail sidebar with a Google-blue delete-sweep icon and a working homepage card.
- [Day 2] **Sender + subject filter inputs** — replaced placeholder text with two real Card Service text inputs (`From` and `Subject contains`) with hint examples.
- [Day 3] **Label + date range filters** — added a label text input plus two date pickers (`Received after` / `Received before`), split into a "Filters" section and a "Date range (optional)" section. Date-picker values are converted to Gmail's `YYYY/MM/DD` query format.
- [Day 4] **Preview Count button wired to Gmail** — enabled the Gmail advanced service, implemented `countMatchingThreads_` via `Gmail.Users.Threads.list` (instant `resultSizeEstimate`). Added a filled "Preview count" button that navigates to a Preview card showing the count, the underlying Gmail query, and a "Back to filters" button. Empty-filter and API-error paths return a sidebar notification instead of a crash. Verified end-to-end against a real inbox.
- [Day 8-11] **End-to-end bulk trash with confirmation** — `deleteMatchingThreads_` paginates `Gmail.Users.Threads.list` in pages of 500 and calls `Threads.trash` on each, with a 5-minute internal time budget so we exit cleanly before the 6-minute Apps Script wall. Added a red "Move N to Trash" button on the preview card → red confirmation card explaining trash is recoverable for 30 days → result card showing how many were trashed, whether we timed out, how many remain, and a "Run again" button if there's a remainder. `setStateChanged(true)` hints Gmail to refresh state; users are told to refresh the inbox list themselves. Verified by trashing 5 real "Google Alerts" threads end-to-end.
- [Day 12] **Persistent X-of-Y progress across chunked deletes** — confirm + result cards now plumb `total` and `deletedSoFar` through action parameters across consecutive Continue clicks. Result card shows "Trashed N of M so far" and a "Continue (K left)" button. Tightened internal time budget from 5 → 4 minutes and wrapped the recount in try/catch so we no longer hit "Exceeded maximum execution time". Also fixed a count bug where `resultSizeEstimate` returned a useless capped 201 for every query — counting now paginates list and returns exact counts (capped at 10,000+ for snappiness on huge inboxes).
- [Speed] **Batch trash via Messages.batchModify** — switched from per-thread `Threads.trash` (575 emails = 575 API calls, blew the 6-min wall) to `Messages.batchModify` with `addLabelIds: ['TRASH']` in chunks of 1000. Tested live: 405 emails trashed in seconds; ~30-50k realistic per click. UI text updated thread → email. Effectively unlimited total via successive Continue clicks.
- [UI Redesign] **Premium card look** — rebuilt every card with Material/Google styling: Quick Clean section with 4 tap-to-preview preset rows (Promotions/Social/Updates/Older-than-1-year, each with Iconify-hosted Material Symbols icon in brand blue), iconified custom-filter labels (alt-email/title/label-tag), collapsible Date Range section, brand-blue primary CTA with helper hint and arrow, Preview card with hero count row + Gmail-query display + side-by-side red destructive + outlined back buttons, Confirm card with amber warning icon, Result card with green check-circle for success or trash icon for in-progress. All button pairs are now side-by-side rather than stacked. Brand colors: #1a73e8 / #d93025 / #1e8e3e / #f9ab00.
- [Reliability] **Fast post-delete recount** — replaced paginated recount (could take minutes on huge inboxes, causing "Exceeded maximum execution time" at the 6-min wall) with `countMatchingFast_` — a single `Messages.list` call (<1s) that returns the page size and a "more pages exist" flag. Result card shows "500+ still match" instead of an exact count when there's more than one page. Tightened internal MAX_RUN_MS from 4 → 3 minutes for extra headroom.
- [Day 15-17] **Monetization backend stack** — Switched from LemonSqueezy → Gumroad because LS blocks Indian individuals from selling internationally without a registered business. Created Gumroad store + $3 lifetime product (license tied to buyer's email, not a key — better UX, no copy-paste step). Spun up Supabase project `mailsweep-prod` (Singapore region, free tier) with a `users` table tracking `email_id`, `trial_start_date`, `last_delete_date`, `trial_days_used`, `is_paid`, `is_blocked`. Deployed the `validate-user` edge function (URL slug: `clever-processor`) that the Gmail add-on will call before every delete to decide allow/paywall. Function uses the new Supabase `withSupabase({ auth: ["secret"] })` wrapper for auth; smoke-tested all four states (paid/trial/used_today/trial_over) end-to-end via curl. RLS disabled on `users` — the edge function is the only access path. Secrets stored in gitignored `mailsweep-secrets.txt`.
- [Day 13] **Query-builder edge cases + date validation** — `buildQuery_` now trims inputs, strips accidental leading operators (user typing `from:foo@bar.com` in the From field no longer produces `from:from:foo@bar.com`), and wraps multi-word subject/label values in quotes so `subject:your order` actually searches for the phrase instead of `subject:your OR order`. Reversed date range (`Received after` later than `Received before`) is caught before hitting Gmail and shown as a sidebar notification. `batchModify` failures now log to console instead of being silently swallowed.
- [Background] **Auto-continuation via time-driven trigger** — added `Background.gs`. After `onDeleteConfirm` runs one pass, if any matches remain it writes `{filters, deletedSoFar, total, remaining, ...}` to `UserProperties` and creates a one-shot time-driven trigger to fire 15s later. The trigger handler (`continueBackgroundDelete`) runs another full delete pass against the saved filters and either reschedules itself or marks the job completed. `onHomepage` reads the bg state and renders `buildBackgroundCard_` instead of the filter card whenever a job is active. Background card shows "X trashed so far / Y remaining — working in background" with Refresh + Stop buttons, or green "All done" when completed. Added `script.scriptapp` OAuth scope to manifest. Trigger creation is wrapped in try/catch — if it fails (e.g. install hasn't re-consented to the new scope), we fall back to the manual Continue UI from before.

---

## Notes for Marketing (Fill as You Go)

> This section is for capturing honest, specific outcomes during testing.
> Example: "Deleted 4,200 emails in under 90 seconds." These become your ad copy.

*(To be filled during development and testing)*
