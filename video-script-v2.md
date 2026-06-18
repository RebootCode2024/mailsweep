# MailSweep — Full demo video script (v2)

**Target runtime:** 4:30 – 5:00.
**Purpose:**
1. **Marketing** — Marketplace listing, landing page, Reddit launch.
2. **OAuth verification compliance** — restricted-scope review requires a demo showing how `gmail.modify` is used. The scenes flagged below carry the verbatim language Google's reviewer needs.

**Tone:** confident, matter-of-fact, slightly conversational. You're showing a friend something useful, not pitching. Read at a relaxed pace — at 5 minutes you have room to breathe, don't rush. Smile slightly while talking; people can hear it.

**Recording style:** segmented. Record each scene as a separate take, stitch in Clipchamp. Easier than one continuous 5-minute take and lets you retry weak scenes without redoing the whole thing.

---

## Pre-record checklist

| Item | Why |
|---|---|
| Real Gmail account with a genuinely cluttered inbox (10k+ unread, varied senders) | The "Three thousand four hundred matching emails" moment needs to land. |
| MailSweep installed + working on that account | Obvious. |
| Wired or USB mic, quiet room | Audio quality reads as trust at this price point. |
| OBS configured: Window Capture of Chrome, 1920×1080, mp4, mic ON, system audio OFF | Standard setup we used before. |
| Browser zoomed to 110%, bookmark bar hidden, no other tabs | Clean frame. |
| Fresh delete + recurring + storage + mark-read recipes seeded for the demo flow (see Setup-state below) | Saves scene transitions. |
| Phone on silent, notifications off, AC turned down | No retakes for AC clicks. |

### Setup-state before recording

Get the test inbox into this state once, then leave it:

- **Inbox count:** at least 10,000 unread
- **Senders:** good variety — LinkedIn, Quora, Substack, Pepperfry/Amazon, one or two job boards
- **At least one email with a large attachment** (>10 MB) so the storage scene has data
- **Zero existing MailSweep recurring sweeps saved** (delete any test ones — Manage → Delete on each)
- **Apps Script trigger limit reset** if you hit it again — wait 24h or use the rebootcode2024 account

---

## The script — 11 segments

> Each segment is a clean take. Read the dialogue, do the actions, stop recording. Move on. Stitch in Clipchamp.

---

### Segment 1 — Hook (0:00–0:15, ~15s)

**Screen action:**
Open Gmail. Inbox visible, lots of unread. Briefly click the "Select all" checkbox at the top — the "Select all 50 conversations on this page" banner appears. Hold the frame on that banner for 2 seconds. Uncheck.

**Voiceover:**
> "If your Gmail looks like this — thousands of unread, the inbox just keeps growing — you've probably already tried selecting fifty emails at a time. It doesn't scale. You'd be there for hours."

> "This is MailSweep. It cleans Gmail in seconds, the way you wish Gmail did natively."

---

### Segment 2 — The sidebar tour (0:15–0:40, ~25s)

**Screen action:**
Click the MailSweep icon in the right sidebar. The home card opens. Slowly scroll through it: hover briefly over each of the three preset sections (Quick Clean → Free Up Storage → Clear Unread Badge), then the custom filter inputs at the bottom.

**Voiceover:**
> "MailSweep lives right in your Gmail sidebar — no separate app, no new account. It does three things."

> "First — it bulk-cleans by any filter you want: sender, subject, label, date range. Second — it helps you free up Gmail storage when you're running out of space. And third — it clears your unread badge without deleting anything."

> "Let me show you each."

---

### Segment 3 — Quick Clean preset (0:40–1:05, ~25s)

**Screen action:**
On the home card, click the **Promotions** preset row in Quick Clean. Preview card appears. Hold 2 seconds. Click **Move N to Trash**. Confirm card appears. Click **Yes, move to Trash**. Wait for the result card.

**Voiceover:**
> "Quick Clean has one-tap presets for the categories that bloat every inbox — Promotions, Social, Updates, anything older than a year."

> "I'll clean out my Promotions tab. One tap. MailSweep uses Gmail's own search to find them — same query you'd type in the Gmail search bar. Confirm, and they're gone."

> "Trashed mail stays recoverable in Gmail's Trash for thirty days, so nothing's lost if you change your mind."

> ⚠️ **OAuth-required line — keep verbatim:** *"MailSweep uses Gmail's own search to find them — same query you'd type in the Gmail search bar."* AND *"Trashed mail stays recoverable in Gmail's Trash for thirty days."*

---

### Segment 4 — Custom filter + preview (1:05–1:30, ~25s)

**Screen action:**
Back on the home card. Click into the **From** field under "OR CUSTOM FILTER." Type `linkedin.com`. Click **Preview matches**. Preview card shows a big count (whatever your real number is). Hold the frame on the count for 2 seconds.

**Voiceover:**
> "If the presets aren't enough, build your own filter. Sender, subject keyword, Gmail label, or a date range — any combination."

> "I'll clean every email from LinkedIn. Click Preview, and MailSweep shows me the exact count, plus the underlying Gmail query so I know exactly what's going to happen. No surprises."

---

### Segment 5 — Sender breakdown (1:30–2:15, ~45s)

**Screen action:**
From the preview card with the LinkedIn count, click **Review by sender →**. The breakdown card opens with sender domains and toggles. Visibly **untick one or two toggles** — make each click slow and deliberate. Cursor should hover briefly on each before clicking.

**Voiceover:**
> "Here's where MailSweep does something Gmail can't. Click Review by sender."

> "MailSweep groups the emails by who sent them. So I can see — these three thousand four hundred LinkedIn emails are actually split across job alerts, newsletter digests, group notifications, and reactions. Each one's a separate sender."

> "If I want to spare one of them — like, I do actually read the job alerts — I just untick it. The rest get trashed in one go."

> "Then I confirm."

**Screen action continues:**
Click **Trash selected senders →**. Confirm card appears. Click **Yes, move to Trash**. Result card shows.

---

### Segment 6 — Background continuation (2:15–2:35, ~20s)

**Screen action:**
On the result card from Segment 5, if a remaining count is visible ("X still match"), let it sit on screen for a moment. If your inbox has 5,000+ matches the background card may already be visible — hold for 3 seconds.

**Voiceover:**
> "If a sweep is too big to finish in one go — Google caps Apps Script at six minutes per run — MailSweep keeps going in the background. You can close the tab. It'll keep working. Come back later and check the count."

> "Tested live, it handles inboxes with hundreds of thousands of matches."

---

### Segment 7 — Storage cleanup (2:35–3:25, ~50s)

**Screen action:**
Click **Back** or **Done** to return to the home card. Scroll down slightly to show the **FREE UP STORAGE** section. Hover briefly over the three presets. Click **Big attachments**. Wait for the preview card with "~XXX MB" hero text. Hold for 3 seconds.

**Voiceover:**
> "Now — different problem. Your Gmail isn't just cluttered. It's full. Google's fifteen gigabyte cap, and emails are bouncing."

> "MailSweep has a section for exactly this. Free Up Storage."

> "Three presets — huge emails, big attachments, anything old and heavy. I'll go with big attachments."

> "MailSweep estimates the storage that'll be freed. About three hundred and forty megabytes from this filter."

**Screen action continues:**
Click **Move N to Trash**. Confirm. Wait for result card. Point cursor at the "Open Gmail Trash" button.

**Voiceover continues:**
> "One thing to know — Gmail keeps trashed mail for thirty days, which means the storage isn't freed immediately. To free space right now, empty Gmail's Trash. MailSweep links you straight there."

---

### Segment 8 — Mark as read (3:25–4:05, ~40s)

**Screen action:**
Back to home card. Scroll to the **CLEAR UNREAD BADGE** section. Hover over the four presets briefly. Click **Old unread mail**. Preview card appears with the unread count. Hold 2 seconds.

**Voiceover:**
> "And — third problem. Maybe you don't want to delete anything. You just want that red unread badge to go away. The forty-thousand-unread that's been mocking you for two years."

> "MailSweep can do that too. Clear Unread Badge — four presets for the most common cases. Old unread mail, unread Promotions, Social, Updates."

> "Notice the button is blue, not red — because we're not deleting. We're marking these as read. They stay in your inbox. Only the badge changes. And it's reversible — you can mark them unread again from Gmail anytime."

**Screen action continues:**
Click **Mark N as read**. Confirm card. Click **Yes, mark as read**. Result card shows green check.

---

### Segment 9 — Recurring sweeps (4:05–4:45, ~40s)

**Screen action:**
Back to home card. Build a simple filter — type something in the From field. Click **Save as recurring**. The save-recurring card opens. Show the name field, the cadence radios (Daily/Weekly/Monthly), the digest toggle. Type a name like "LinkedIn weekly." Click **Save recipe**. Lands back on home card with the new recipe visible at the top in the SAVED SWEEPS section.

**Voiceover:**
> "Last thing — if you find yourself cleaning the same stuff over and over, save it as a recurring sweep."

> "Pick daily, weekly, or monthly. Optional — get a short email digest after each run, off by default because nobody wants more inbox bloat from a tool that's supposed to clean it."

> "MailSweep runs it automatically while you sleep. Set it, forget it. Up to twenty-five different recurring sweeps per account."

---

### Segment 10 — Safety net + privacy (4:45–5:00, ~15s)

**Screen action:**
Stay on home card. Cursor hovers briefly over the MailSweep header logo.

**Voiceover:**
> "Everything MailSweep does runs entirely inside your Gmail and Google Apps Script. We don't read your emails. We don't copy anything to our servers. We don't sell data. The only thing we ever see is your Gmail address — to know whether your license is active."

> ⚠️ **OAuth-required line — keep verbatim:** *"Everything MailSweep does runs entirely inside your Gmail and Google Apps Script. We don't read your emails. We don't copy anything to our servers."*

---

### Segment 11 — Close (5:00–5:10, ~10s)

**Screen action:**
Hold on the home card. Cursor over the logo.

**Voiceover:**
> "MailSweep. Five dollars, one time, lifetime access. On the Google Workspace Marketplace."

> "Clean your inbox like you've been wanting to."

**End frame:** Hold for 2 full seconds on the home card before cutting.

---

## Post-record steps

1. **Stitch in Clipchamp.** Drop each segment's MP4 onto the timeline in order. Trim dead air at the start/end of each.

2. **Background music — none for OAuth submission.** Voice only. Music distracts the reviewer. Add a soft lo-fi bed (-20 dB) for the marketing cuts.

3. **Captions.** Burn them in via Clipchamp's auto-caption feature, OR upload to YouTube and use auto-captions. Reviewers and viewers watch muted; captions matter.

4. **Total runtime check.** Should land between 4:30 and 5:10. If you're under, you read too fast — re-record one or two segments slower. If over 5:30, the Quick Clean segment is the easiest to compress.

5. **Thumbnail.** Frame from Segment 5 (sender breakdown with toggles) is the most visually distinctive moment. Clean product shot, no YouTube-bait.

6. **Upload to YouTube.**
   - **Title:** `MailSweep — Bulk-clean Gmail in seconds (full demo)`
   - **Description:** see template below.
   - **Visibility:** **Unlisted** (NOT public, NOT private). Unlisted is what the OAuth reviewer needs.
   - **Copy the URL** when published.

### YouTube description template

```
MailSweep is a Gmail sidebar add-on that bulk-cleans your inbox by
filter — and now does three things in one place:

1. Bulk-delete by sender, subject, label, or date range (with a sender
   breakdown so you can spare anyone you don't mean to trash).
2. Free up Gmail storage when you hit the 15 GB cap.
3. Clear your unread badge without deleting anything.

Plus recurring sweeps — daily, weekly, or monthly — that run
automatically. Up to 25 saved sweeps per account.

$5 one-time lifetime license. No subscription.

Privacy: https://rebootcode2024.github.io/mailsweep/privacy.html
Terms:   https://rebootcode2024.github.io/mailsweep/terms.html
```

---

## OAuth reviewer cheat sheet

| Scope | Verbal coverage in the video | Form justification |
|---|---|---|
| `gmail.modify` | Segments 3, 7, 8 verbalize search + trash + mark-as-read using `Messages.list` + `Messages.batchModify`. | "Required to read message IDs matching the user's filter via Gmail search, then add the TRASH label OR remove the UNREAD label via Messages.batchModify. No message content is read, stored, or transmitted." |
| `gmail.addons.execute` | The whole video is the add-on running. | "Required to run as a Gmail sidebar add-on (the entire product surface)." |
| `script.scriptapp` | Segments 6, 9 mention background continuation + recurring. | "Required to create time-driven triggers for Recurring Sweeps and for background continuation of large one-off sweeps that exceed the 6-minute Apps Script execution wall." |
| `script.external_request` | Not explicitly mentioned but covered by Segment 10's privacy line. | "Required to call our Supabase-hosted paywall validation endpoint with the user's Gmail address only. No Gmail data transmitted." |
| `userinfo.email` | Segment 10 explicitly covers it. | "Required to read the user's Gmail address as the license identifier. The buyer's Gmail address acts as the license key." |

---

## Things NOT to do in this video

- Don't show real personal email subjects or sender names. Use a test inbox seeded with newsletters from throwaway signups.
- Don't say "delete" — say "trash" or "move to Trash." Reversibility is the trust story.
- Don't say "instant" or "permanent." Say "in seconds" and "recoverable for 30 days."
- Don't apologize for the price ("...only five dollars"). Just state it. Five dollars is a fair price for a real tool. Confidence sells.
- Don't read the segment numbers or scene titles aloud. The viewer doesn't need them.
- Don't add disclaimers in voiceover. Visual proof IS the disclaimer.
- Don't show the paywall card. It's not a feature to demo — it's a friction point for trial users.

---

## Optional: 90-second cut for Reddit / social

If you want a tighter cut for Reddit launch (people scroll past long videos), the 90-second highlights are:

1. Segment 1 (hook) — 15s
2. Segment 5 (sender breakdown — the visually most distinctive feature) — 45s
3. Segments 7 + 8 condensed (mention storage + mark-as-read briefly) — 20s
4. Segment 11 (close + $5 lifetime) — 10s

Same source footage, just trim the others out for this version. Keep the full 5-minute one as the Marketplace listing video and YouTube canonical.
