# MailSweep — OAuth re-verification demo video (v2)

**Why we're re-recording:** Google's reviewer said the first video didn't sufficiently
demonstrate functionality. They specifically want to see the email functions performed
**from the app** AND the effect **on the end-user's real Gmail account** — i.e., the
emails actually leaving the inbox and appearing in Trash, shown in the Gmail UI.

**The single most important thing:** show the BEFORE and AFTER in the real Gmail
inbox + Trash. That is the proof the reviewer needs. Everything else is secondary.

**Runtime:** ~90 seconds. Screen recording with voiceover.
**Visibility:** upload to YouTube **Unlisted** (same as before), send the link.

---

## The script (visual | narration)

| # | Visual (what's on screen) | Narration |
|---|---|---|
| 1 | Gmail inbox open. In Gmail's own search bar, type `from:linkedin.com` and press Enter so a clear list of LinkedIn emails shows. Let the count + several emails be visible for 2-3 seconds. | "This is the user's Gmail inbox. Using Gmail's search, you can see multiple emails here from LinkedIn." |
| 2 | Click the **MailSweep** icon in the right sidebar. Home card opens. | "MailSweep runs as a Gmail sidebar add-on." |
| 3 | In the **From** field type `linkedin.com`. Click **Preview matches**. Preview card shows the count. | "In MailSweep I filter by sender — linkedin dot com — and preview. MailSweep uses Gmail's own search to find the matching messages." |
| 4 | Click **Move [N] to Trash** → confirm card → **Yes, move to Trash**. Result card shows "All done". | "I move them to Trash. MailSweep applies Gmail's TRASH label using the gmail.modify scope." |
| 5 | **CRITICAL:** Click back into the main Gmail window. Re-run the same `from:linkedin.com` search (or refresh). Show that the LinkedIn emails are **now gone** from the inbox — empty or drastically fewer results. Hold 3 seconds. | "Back in the Gmail inbox, I refresh the same search — the LinkedIn emails are no longer here. MailSweep moved them out of the inbox." |
| 6 | **CRITICAL:** In Gmail's left sidebar, click **Trash** (you may need to click "More" to reveal it). Show the same LinkedIn emails now sitting in Trash. Hold 3 seconds. | "And in Gmail's Trash folder, those same emails now appear — confirming they were moved to Trash on the user's real account, not permanently deleted. They stay recoverable here for thirty days." |
| 7 | Cursor back on the MailSweep logo / home card. | "MailSweep never reads or stores email content. All processing happens inside Google Apps Script. Thank you for reviewing." |

---

## Do's and don'ts

**MUST do:**
- Show the **same sender's emails** in the inbox at step 1 AND gone at step 5 AND present in Trash at step 6. The before/after continuity is the whole point.
- Use a real Gmail account with real (or realistic test) emails from one clear sender.
- Say the scope name **"gmail.modify"** out loud at step 4.
- Show the Gmail **Trash** folder — this proves move-to-Trash (recoverable), which is your safety story.

**Optional (nice but not required):** after step 6, quickly demo mark-as-read — show unread emails, use MailSweep's "Clear unread badge", switch back to Gmail and show them now read. This demonstrates the other half of gmail.modify (removing the UNREAD label).

**Don't:**
- Don't just show the MailSweep sidebar the whole time — that's what got rejected. At least half the video must be the **actual Gmail inbox/Trash** reflecting the changes.
- Don't use fake/mocked screens. It must be the live add-on on a live Gmail account.
- Don't rush steps 5 and 6 — hold each for a few seconds so the reviewer clearly sees the state.

---

## After recording

1. Upload to YouTube, **Unlisted**.
2. Copy the new link.
3. **Reply to the Google reviewer email** (same thread — the reply address carries your case id) with the new link. Draft reply:

> Hello,
>
> Thank you. I have recorded an updated demo video that demonstrates the email
> functionality both within the MailSweep add-on and on the end-user's source
> Gmail account. The video shows: (1) emails present in the Gmail inbox, (2)
> MailSweep filtering and moving them to Trash via the gmail.modify scope, (3)
> the Gmail inbox after refresh with those emails removed, and (4) the same
> emails now present in the Gmail Trash folder, confirming the action on the
> user's real account.
>
> Updated demo video: [NEW YOUTUBE LINK]
>
> Please let me know if any further detail is required.
>
> Thank you,
> Harsh Bhojwani
> MailSweep developer
> imharshbhojwani@gmail.com

4. Also update the video link in Cloud Console → Data Access if it lets you (optional; the email reply is the required action).
