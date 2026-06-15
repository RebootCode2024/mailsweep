# MailSweep — demo video script

**Target runtime:** 75–90 seconds.
**Purpose (dual):**
1. **Marketing** — embed on landing page, share on Reddit, Marketplace listing video.
2. **OAuth verification compliance** — Google's restricted-scope review requires a demo video showing how `gmail.modify` is actually used. The narration in scenes 3-5 below explicitly satisfies this.

**Tone:** confident and matter-of-fact. Not salesy, not jokey. You're showing someone something useful, not pitching them.

---

## Pre-record checklist

| Item | Why |
|---|---|
| Real Gmail account with a cluttered inbox (10,000+ unread, lots of LinkedIn / promotional mail) | Authentic visual impact. Don't fake this. |
| MailSweep installed and working on that account | Obvious. |
| Screen recorder set to 1920×1080 at 30fps minimum | YouTube + Marketplace standard. |
| Decent USB mic (Blue Yeti, even a phone earbuds mic in a quiet room is fine) | Audio matters more than video quality for trust. |
| Quiet room, door closed, phone on silent | No retakes for AC clicks. |
| Browser zoomed to 110-120% so add-on text is readable on small screens | Reddit + mobile viewers. |
| Close ALL other tabs and browser windows. Use a fresh Chrome profile if needed. | No notification popups, no email previews leaking real data. |
| Hide bookmark bar | Cleaner frame. |
| Mouse cursor visible and big enough to follow | Important for the screen action. |

---

## The script

> Time codes are approximate. Read the VO lines naturally — don't rush. Pause where indicated.

### Scene 1 — The hook (0:00–0:08, ~8s)

**Screen:** Open Gmail inbox. Show a counter — top right of Gmail shows total messages, or scroll quickly through pages of unread mail. Show the chaos.

**VO:**
> "If your Gmail looks like this, you've already tried selecting fifty emails at a time. It doesn't scale."

**Cue:** Click the "Select all" checkbox at the top of the inbox. Gmail shows the "Select all 50 conversations on this page" banner with a small "Select all conversations that match this search" link. Pause on that frame for 1s. The banner is the visual proof of the problem.

---

### Scene 2 — Open MailSweep (0:08–0:18, ~10s)

**Screen:** Click the MailSweep icon in the right sidebar. The add-on opens with the filter card.

**VO:**
> "MailSweep lives in your Gmail sidebar. Type a sender, a subject, a label, or pick a date range — or use a one-tap preset for Promotions, Social, Updates, or anything older than a year."

**Cue:** Hover over each preset row briefly so the viewer registers them, then click into the **From** field.

---

### Scene 3 — Filter and preview (0:18–0:35, ~17s)

**Screen:** Type `linkedin.com` (or whatever sender dominates the test inbox).

**VO:**
> "I'll clean out LinkedIn. I type the sender. Click Preview matches."

**Cue:** Click **Preview matches**. The card swaps to the preview card showing the count and the underlying Gmail query.

**VO continues over the preview card:**
> "Three thousand four hundred and eight emails. MailSweep uses Gmail's own search to find them — it's the same query you'd type in the Gmail search bar."

> ⚠️ **OAuth note:** The line above is important — it explicitly tells Google's reviewer that the `gmail.modify` scope is being used to *search* (read message IDs and metadata) before any trashing happens. Keep it in.

---

### Scene 4 — Sender breakdown (0:35–0:55, ~20s)

**Screen:** Click **Review by sender**. The breakdown card opens with toggles for each sender domain.

**VO:**
> "Before I trash anything I can see who's sending. Job alerts, newsletter, group digests — each gets its own toggle. If I want to spare one sender, I just uncheck them."

**Cue:** Visibly untick one or two senders. The viewer should see the act of unchecking — make it deliberate.

**VO:**
> "Then I confirm."

**Cue:** Click **Trash selected senders →**. Confirm card appears.

---

### Scene 5 — Trash and result (0:55–1:10, ~15s)

**Screen:** Click **Yes, move to Trash** on the confirm card.

**VO:**
> "MailSweep moves them to Gmail's Trash — not permanent deletion. Gmail keeps trashed mail for thirty days, so if you change your mind, restore from Trash like any other email."

> ⚠️ **OAuth note:** This is the second restricted-scope sentence. Google needs to hear "moves them to Trash" and "Gmail keeps trashed mail for 30 days." It tells the reviewer the `gmail.modify` scope is being used to add the `TRASH` label, not to permanently delete, and that the user retains the standard Gmail recovery path. Keep this line verbatim.

**Cue:** Progress card animates briefly, then the result card shows "All done — Trashed 3,408 emails."

---

### Scene 6 — Recurring sweeps (1:10–1:25, ~15s)

**Screen:** From the result card, click **Run this weekly →**. The save-recurring card opens.

**VO:**
> "And if this is a sweep I'd do every week, I save it as a recurring recipe. Name it, pick daily, weekly, or monthly, and MailSweep runs it automatically while I'm not looking."

**Cue:** Type name "LinkedIn cleanup", confirm **Weekly** is selected, click **Save recipe**. Land back on the home card with the new recipe row showing at the top.

---

### Scene 7 — Close (1:25–1:30, ~5s)

**Screen:** Cursor hovers over the MailSweep header logo.

**VO:**
> "MailSweep. Five dollars, lifetime, on the Google Workspace Marketplace."

**End frame:** Hold on the home card with the recipe section visible for 2 seconds before cutting.

---

## Post-record steps

1. **Trim** to 75–90 seconds. If it's longer, the LinkedIn type-and-preview moment (scene 3) is the easiest to compress — it doesn't need 17 seconds.
2. **No music in the OAuth-submission version.** Voice only. Music distracts the reviewer.
3. **Marketing cut:** add a single soft bed track (e.g. an upbeat lo-fi loop at -20dB) for Reddit/landing/Marketplace. Same script.
4. **Captions** — burn them in or use YouTube's caption editor. Many viewers watch muted. Critical for the OAuth scope sentences too (reviewers may watch with sound off).
5. **Thumbnail** — a clean frame from scene 4 (the sender breakdown with toggles) is the most distinctive moment. Don't make a YouTube-bait thumbnail with a giant face or red arrows. Marketplace prefers a clean product shot.
6. **Upload to YouTube as Unlisted.** Title: "MailSweep — bulk-clean Gmail in 60 seconds". Description: link to landing page, mention $5 lifetime.
7. **Copy the URL.** Paste into the OAuth verification submission form (next step in GCP Console after recording).

---

## The OAuth-reviewer cheat sheet

If Google requests additional context after watching, here's the per-scope justification — copy-paste into the form if asked:

| Scope | Justification |
|---|---|
| `gmail.modify` | Required to read message IDs matching the user's filter (via Gmail search) and to add the `TRASH` label to those messages in bulk via `Messages.batchModify`. No message content is read, stored, or transmitted beyond the user's own account. |
| `gmail.addons.execute` | Required to run as a Gmail sidebar add-on (the add-on is the entire product surface). |
| `script.scriptapp` | Required to create time-driven triggers for the Recurring Sweeps feature and for background continuation of large one-off sweeps that exceed the 6-minute Apps Script execution wall. |
| `script.external_request` | Required to call our Supabase-hosted paywall validation endpoint before each sweep, to check whether the current user is on trial or has purchased a license. |
| `userinfo.email` | Required to read the user's Gmail address as the license identifier (the buyer's Gmail = the license; there's no separate license key). |

---

## Things NOT to do in the video

- Don't show real personal emails. If your test inbox has real mail from real people, get fresh mock data — sign up for newsletters under a throwaway address for a week.
- Don't say "delete" — say "trash" or "move to Trash." Google reviewers and users both need to understand it's recoverable.
- Don't add disclaimers in voiceover ("results may vary, terms apply"). Visual product proof is the disclaimer.
- Don't show the paywall. The video is for OAuth verification and marketing — the paywall is end-user logic, not a feature to demo.
- Don't end with a hard sell. The "$5 lifetime" line at the end is enough.
