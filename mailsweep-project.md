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
| **Paid** | $2 one-time lifetime payment, unlimited usage |

### Popup Messages to Show Users

**When they try a second delete on the same day:**
> "You've already used your free delete today. Come back tomorrow — or unlock unlimited access for just $2."

**When their 3-day trial ends:**
> "Your 3-day free trial is over. Pay $2 once and clean your inbox forever."

Both popups must include a direct **"Buy for $2"** button linking to LemonSqueezy checkout.

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
| Payments | LemonSqueezy ($2 one-time) |
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
| Week 3 | Day 15–21 | LemonSqueezy + Supabase license + paywall + trial enforcement |
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
| 15 | Create LemonSqueezy account, set up $2 lifetime product |
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

*(No features built yet — log will be updated as development progresses)*

---

## Notes for Marketing (Fill as You Go)

> This section is for capturing honest, specific outcomes during testing.
> Example: "Deleted 4,200 emails in under 90 seconds." These become your ad copy.

*(To be filled during development and testing)*
