# MailSweep

Google Workspace Gmail sidebar add-on for bulk-deleting thousands of emails at once — no 50-email cap.

Set filters (sender, subject, label, date range), preview the matching count, and trash them all in one click.

## Status

In development. See [mailsweep-project.md](mailsweep-project.md) for the full brief and 28-day build plan.

## Stack

- Google Apps Script (Card Service) — add-on UI + logic
- Gmail API — batch search and trash
- Supabase — license + trial tracking
- LemonSqueezy — $2 one-time payment
- GitHub Pages — landing page

## Local development

This repo is pushed to Apps Script via [clasp](https://github.com/google/clasp).

```sh
npm install -g @google/clasp
clasp login
clasp clone <SCRIPT_ID>   # or `clasp create --type standalone`
clasp push
```

`.clasp.json` is gitignored — each developer creates their own.

## License

Proprietary — all rights reserved.
