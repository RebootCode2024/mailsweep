# MailSweep — Google Workspace Marketplace listing draft

Everything you'll paste into the Marketplace SDK when OAuth verification approves.
Prepared while the OAuth review is in progress so launch is same-day on approval.

---

## App name

```
MailSweep
```

## Short description (tagline — keep under ~80 chars)

```
Bulk-clean Gmail — delete, free up storage, or clear unread in seconds.
```

## Detailed description (the main store body)

```
MailSweep is the fastest way to clean up a cluttered Gmail inbox. Filter by
sender, subject, label, date, or size — preview exactly what will be affected —
then act on thousands of emails in seconds, right from the Gmail sidebar.

THREE WAYS TO CLEAN

• Bulk delete — sweep away emails matching any filter. Review by sender first,
  so you never trash something you meant to keep.

• Free up storage — find huge emails and big attachments and clear them to
  reclaim space against Gmail's 15 GB limit.

• Clear the unread badge — mark thousands of old, promotional, or social emails
  as read without deleting anything.

SET IT AND FORGET IT

• Recurring sweeps run your saved filters automatically — daily, weekly, or
  monthly. Save up to 25.

SAFE BY DESIGN

• Everything moves to Gmail's Trash and stays recoverable for 30 days — nothing
  is permanently deleted.

• Preview and per-sender review before anything happens.

• Your email content never leaves Google. MailSweep processes everything inside
  Google Apps Script and stores no message data on any outside server.

PRICING

One-time $5. Lifetime license. No subscription, no monthly fees. Try it free,
then unlock unlimited cleaning once.
```

## Category

```
Productivity
```

---

## URLs (all live)

| Field | Value |
|---|---|
| Developer website / App homepage | `https://mailsweep.dalalstreetlens.in/` |
| Privacy policy | `https://mailsweep.dalalstreetlens.in/privacy.html` |
| Terms of service | `https://mailsweep.dalalstreetlens.in/terms.html` |
| Support / contact | `mailto:imharshbhojwani@gmail.com` (or a support page later) |

## Pricing model

- **Install: Free.** The paywall is in-app (3-day free trial, then $5 lifetime via Gumroad).
- In the Marketplace pricing field, list as **Free** with **in-app purchases** noted — payment happens through Gumroad, not Google, so we don't use Google's paid-app billing.

---

## Graphics needed (Marketplace has strict sizes)

| Asset | Required size | Status |
|---|---|---|
| Application icon | 128×128 PNG | ✅ Have it — `docs/img/logo-128.png` |
| Card banner / small promo tile | 220×140 PNG | ⚠️ Need to create |
| Marketplace banner (large) | 920×680 PNG | ⚠️ Need to create |
| Screenshots (1–5) | 1280×800 or 640×400 PNG | ✅ Have 7 — pick the best 5 from `screenshots/` |

**Recommended screenshot order (pick 5):**
1. `02-filter-card.png` — the hero: clean filter UI with presets
2. `04-sender-breakdown.png` — the differentiator: per-sender toggles
3. `03-preview-count.png` — preview before deleting (trust)
4. `07-save-recurring.png` — set-and-forget recurring sweeps
5. `06-all-done.png` — the satisfying payoff

**Promo tiles (220×140 + 920×680):** need to be made — a simple branded graphic (broom logo + "MailSweep — bulk-clean Gmail" on a clean background). Can generate these the same way we made the title card.

---

## OAuth scopes (already configured — will carry over)

- `gmail.modify`, `gmail.addons.execute`, `script.scriptapp`, `script.external_request`, `userinfo.email`

---

## Submission steps (when OAuth approves)

1. GCP → enable **Google Workspace Marketplace SDK** (APIs & Services → Library → search "Google Workspace Marketplace SDK" → Enable).
2. Marketplace SDK → **App Configuration** — fill scopes, Apps Script deployment ID, visibility = Public.
3. Marketplace SDK → **Store Listing** — paste the name/descriptions/category above, upload icon + screenshots + promo tiles, set the URLs.
4. **Publish** → Google runs the Marketplace listing review (separate, usually 1–7 days).
5. Once approved → MailSweep appears in the Workspace Marketplace, installable in one click.

---

## Notes

- The store listing review is separate from OAuth verification but is *gated* on it — the listing goes public only after restricted-scope verification approves.
- Keep the description free of superlatives Google dislikes ("best," "#1"). The draft above is deliberately factual.
- Localization optional — English-only is fine for launch.
