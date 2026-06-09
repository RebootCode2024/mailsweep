/**
 * Background deletion: keeps trashing across multiple Apps Script runs
 * via a time-driven trigger that re-fires every ~15s until done.
 *
 * State (filters + progress) lives in UserProperties so it survives
 * across both the trigger firings and the user reopening the card.
 */

var BG_STATE_KEY = 'mailsweep_bg_state';
var BG_HANDLER   = 'continueBackgroundDelete';
var BG_DELAY_MS  = 15 * 1000;

function readBgState_() {
  const json = PropertiesService.getUserProperties().getProperty(BG_STATE_KEY);
  return json ? JSON.parse(json) : null;
}

function writeBgState_(state) {
  PropertiesService.getUserProperties().setProperty(BG_STATE_KEY, JSON.stringify(state));
}

function clearBgState_() {
  PropertiesService.getUserProperties().deleteProperty(BG_STATE_KEY);
}

function scheduleBgRun_() {
  clearBgTriggers_();
  ScriptApp.newTrigger(BG_HANDLER)
    .timeBased()
    .after(BG_DELAY_MS)
    .create();
}

function clearBgTriggers_() {
  const triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === BG_HANDLER) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

/**
 * Trigger entry point — fires every BG_DELAY_MS until no remaining matches.
 */
function continueBackgroundDelete() {
  const state = readBgState_();
  if (!state || state.completed) {
    clearBgTriggers_();
    return;
  }

  try {
    const result = deleteMatchingThreads_(state.filters);
    state.deletedSoFar = (state.deletedSoFar || 0) + result.deleted;
    state.remaining = result.remaining;
    state.remainingCapped = result.remainingCapped;
    state.lastRun = Date.now();

    if (result.remaining > 0) {
      writeBgState_(state);
      scheduleBgRun_();
    } else {
      state.completed = true;
      writeBgState_(state);
      clearBgTriggers_();
    }
  } catch (e) {
    state.error = String(e && e.message || e);
    writeBgState_(state);
    clearBgTriggers_();
  }
}
