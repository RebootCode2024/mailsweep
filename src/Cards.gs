/**
 * Card Service UI for the Gmail sidebar.
 * Style: Material/Google look — icon rows, dividers, hero stats, brand color.
 */

var BRAND_BLUE = '#1a73e8';
var DANGER_RED = '#d93025';
var SUCCESS_GREEN = '#1e8e3e';
var WARN_AMBER = '#f9ab00';

// Iconify SVGs — colored to match brand
var ICON = {
  breakdown: 'https://api.iconify.design/material-symbols/groups-2-rounded.svg?color=%231a73e8',
  promo:     'https://api.iconify.design/material-symbols/campaign-rounded.svg?color=%231a73e8',
  social:    'https://api.iconify.design/material-symbols/groups-rounded.svg?color=%231a73e8',
  updates:   'https://api.iconify.design/material-symbols/notifications-active-rounded.svg?color=%231a73e8',
  clock:     'https://api.iconify.design/material-symbols/schedule-rounded.svg?color=%231a73e8',
  sender:    'https://api.iconify.design/material-symbols/alternate-email-rounded.svg?color=%235f6368',
  subject:   'https://api.iconify.design/material-symbols/title-rounded.svg?color=%235f6368',
  label:     'https://api.iconify.design/material-symbols/label-rounded.svg?color=%235f6368',
  email:     'https://api.iconify.design/material-symbols/mark-email-unread-rounded.svg?color=%231a73e8',
  trash:     'https://api.iconify.design/material-symbols/delete-sweep-rounded.svg?color=%23d93025',
  check:     'https://api.iconify.design/material-symbols/check-circle-rounded.svg?color=%231e8e3e',
  warn:      'https://api.iconify.design/material-symbols/warning-rounded.svg?color=%23f9ab00',
  none:      'https://api.iconify.design/material-symbols/inbox-rounded.svg?color=%235f6368',
  lock:      'https://api.iconify.design/material-symbols/lock-rounded.svg?color=%231a73e8',
  sparkle:   'https://api.iconify.design/material-symbols/auto-awesome-rounded.svg?color=%23f9ab00',
  repeat:    'https://api.iconify.design/material-symbols/repeat-rounded.svg?color=%231a73e8',
  schedule:  'https://api.iconify.design/material-symbols/event-repeat-rounded.svg?color=%231a73e8',
  paused:    'https://api.iconify.design/material-symbols/pause-circle-rounded.svg?color=%235f6368'
};

function buildFilterCard() {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('MailSweep')
        .setSubtitle('Clean your inbox in seconds')
    );

  const recipesSection = buildHomepageRecipesSection_();
  if (recipesSection) card.addSection(recipesSection);

  return card
    .addSection(buildPresetsSection_())
    .addSection(buildCustomFilterSection_())
    .addSection(buildDateRangeSection_())
    .addSection(buildPreviewButtonSection_())
    .build();
}

function buildPresetsSection_() {
  const oneYearAgo = oneYearAgoString_();
  return CardService.newCardSection()
    .setHeader('<b>QUICK CLEAN</b>')
    .addWidget(presetRow_(
      'Promotions', ICON.promo, 'Marketing & deals',
      { label: 'promotions' }
    ))
    .addWidget(presetRow_(
      'Social', ICON.social, 'Facebook, LinkedIn, etc.',
      { label: 'social' }
    ))
    .addWidget(presetRow_(
      'Updates', ICON.updates, 'Receipts & notifications',
      { label: 'updates' }
    ))
    .addWidget(presetRow_(
      'Older than 1 year', ICON.clock, 'Received before ' + oneYearAgo,
      { dateTo: oneYearAgo }
    ));
}

function presetRow_(title, iconUrl, subtitle, filters) {
  return CardService.newDecoratedText()
    .setStartIcon(CardService.newIconImage().setIconUrl(iconUrl))
    .setText('<b>' + title + '</b>')
    .setBottomLabel(subtitle)
    .setOnClickAction(
      CardService.newAction()
        .setFunctionName('onPresetClick')
        .setParameters({ filters: JSON.stringify(filters) })
    );
}

function buildCustomFilterSection_() {
  return CardService.newCardSection()
    .setHeader('<b>OR CUSTOM FILTER</b>')
    .addWidget(
      CardService.newDecoratedText()
        .setStartIcon(CardService.newIconImage().setIconUrl(ICON.sender))
        .setText('From')
        .setBottomLabel('Sender email or domain')
    )
    .addWidget(
      CardService.newTextInput()
        .setFieldName('sender')
        .setHint('noreply@linkedin.com or @amazon.com')
    )
    .addWidget(
      CardService.newDecoratedText()
        .setStartIcon(CardService.newIconImage().setIconUrl(ICON.subject))
        .setText('Subject')
        .setBottomLabel('Keyword in subject line')
    )
    .addWidget(
      CardService.newTextInput()
        .setFieldName('subject')
        .setHint('invoice, newsletter, "your order"')
    )
    .addWidget(
      CardService.newDecoratedText()
        .setStartIcon(CardService.newIconImage().setIconUrl(ICON.label))
        .setText('Label')
        .setBottomLabel('Gmail label name')
    )
    .addWidget(
      CardService.newTextInput()
        .setFieldName('label')
        .setHint('Promotions, Updates, Receipts')
    );
}

function buildDateRangeSection_() {
  return CardService.newCardSection()
    .setHeader('<b>DATE RANGE</b>')
    .setCollapsible(true)
    .setNumUncollapsibleWidgets(0)
    .addWidget(
      CardService.newDatePicker()
        .setFieldName('dateFrom')
        .setTitle('Received after')
    )
    .addWidget(
      CardService.newDatePicker()
        .setFieldName('dateTo')
        .setTitle('Received before')
    );
}

function buildPreviewButtonSection_() {
  const hint = CardService.newTextParagraph()
    .setText('<font color="#5f6368">See exactly what will be trashed before you delete anything.</font>');

  const previewBtn = CardService.newTextButton()
    .setText('  Preview matches  →  ')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor(BRAND_BLUE)
    .setOnClickAction(CardService.newAction().setFunctionName('onPreviewClick'));

  const saveRecurringBtn = CardService.newTextButton()
    .setText('Save as recurring')
    .setOnClickAction(CardService.newAction().setFunctionName('onSaveRecipePrompt'));

  return CardService.newCardSection()
    .addWidget(hint)
    .addWidget(CardService.newButtonSet().addButton(previewBtn).addButton(saveRecurringBtn));
}

function buildPreviewCard(filters, count, capped, estimated) {
  const query = buildQuery_(filters);
  const countText = capped
    ? count.toLocaleString() + '+'
    : (estimated ? '~' + count.toLocaleString() : count.toLocaleString());

  const heroSection = CardService.newCardSection();
  if (count === 0) {
    heroSection.addWidget(
      CardService.newDecoratedText()
        .setStartIcon(CardService.newIconImage().setIconUrl(ICON.none))
        .setText('<b>No matching emails</b>')
        .setBottomLabel('Try a different filter.')
    );
  } else {
    heroSection.addWidget(
      CardService.newDecoratedText()
        .setStartIcon(CardService.newIconImage().setIconUrl(ICON.email))
        .setText('<font color="' + BRAND_BLUE + '"><b>' + countText + '</b></font> matching emails')
        .setBottomLabel(estimated ? 'Estimate from Gmail index — exact count after sweep' : 'Ready to clean up')
    );
  }

  if (query) {
    heroSection.addWidget(
      CardService.newDecoratedText()
        .setTopLabel('Gmail query')
        .setText(query)
        .setWrapText(true)
    );
  }

  const buttonSection = CardService.newCardSection();
  const previewButtons = CardService.newButtonSet();
  if (count > 0) {
    previewButtons.addButton(
      CardService.newTextButton()
        .setText('Move ' + countText + ' to Trash')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor(DANGER_RED)
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('onDeletePrompt')
            .setParameters({
              filters: JSON.stringify(filters),
              count: String(count),
              total: String(count),
              capped: capped ? '1' : '0'
            })
        )
    );
  }
  previewButtons.addButton(
    CardService.newTextButton()
      .setText('Back')
      .setOnClickAction(CardService.newAction().setFunctionName('onBackToFilters'))
  );
  if (count > 0) {
    buttonSection.addWidget(
      CardService.newTextParagraph()
        .setText('<font color="#5f6368">Want to spare a few senders?</font>')
    );
    buttonSection.addWidget(
      CardService.newButtonSet().addButton(
        CardService.newTextButton()
          .setText('  Review by sender  →  ')
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setBackgroundColor(BRAND_BLUE)
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('onAnalyzeSenders')
              .setParameters({
                filters: JSON.stringify(filters),
                totalCount: String(count),
                capped: capped ? '1' : '0'
              })
          )
      )
    );
  }
  buttonSection.addWidget(previewButtons);

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Preview'))
    .addSection(heroSection)
    .addSection(buttonSection)
    .build();
}

function truncate_(s, n) {
  s = String(s || '');
  return s.length > n ? s.substring(0, n - 1) + '…' : s;
}

function escapeHtml_(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildSenderBreakdownCard_(filters, breakdown, totalCount, totalCapped) {
  const senders = (breakdown.senders || []).slice(0, 10);
  const totalText = totalCapped ? totalCount.toLocaleString() + '+' : totalCount.toLocaleString();

  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Review by sender'));

  const heroSection = CardService.newCardSection().addWidget(
    CardService.newDecoratedText()
      .setStartIcon(CardService.newIconImage().setIconUrl(ICON.breakdown))
      .setText('<font color="' + BRAND_BLUE + '"><b>' + totalText + '</b></font> emails · top senders')
      .setBottomLabel(breakdown.capped
        ? 'Sampled first ' + breakdown.scanned.toLocaleString() + ' messages — counts are estimates'
        : 'Scanned all ' + breakdown.scanned.toLocaleString() + ' messages')
      .setWrapText(true)
  );
  card.addSection(heroSection);

  if (senders.length === 0) {
    heroSection.addWidget(
      CardService.newTextParagraph()
        .setText('<font color="#5f6368">Couldn’t group these by sender. Go back and use the normal sweep.</font>')
    );
    card.addSection(
      CardService.newCardSection().addWidget(
        CardService.newButtonSet().addButton(
          CardService.newTextButton()
            .setText('Back')
            .setOnClickAction(CardService.newAction().setFunctionName('onBackToFilters'))
        )
      )
    );
    return card.build();
  }

  const sendersSection = CardService.newCardSection()
    .setHeader('<b>UNTICK SENDERS TO SPARE</b>');
  const domains = [];
  for (let i = 0; i < senders.length; i++) {
    const s = senders[i];
    domains.push(s.domain);
    const countDisplay = (s.estimated ? '~' : '') + s.count.toLocaleString();
    sendersSection.addWidget(
      CardService.newDecoratedText()
        .setText('<b>' + escapeHtml_(truncate_(s.name, 38)) + '</b>')
        .setBottomLabel(escapeHtml_(s.domain) + ' · ' + countDisplay + ' email' + (s.count === 1 ? '' : 's'))
        .setWrapText(true)
        .setSwitchControl(
          CardService.newSwitch()
            .setFieldName('include_' + s.domain)
            .setValue('1')
            .setSelected(true)
        )
    );
  }
  if (breakdown.senders.length > 10) {
    sendersSection.addWidget(
      CardService.newTextParagraph()
        .setText('<font color="#5f6368">Showing top 10 of ' + breakdown.senders.length +
                 ' senders. Mail from senders outside the top 10 will still be trashed.</font>')
    );
  }
  card.addSection(sendersSection);

  const actionSection = CardService.newCardSection();
  actionSection.addWidget(
    CardService.newButtonSet().addButton(
      CardService.newTextButton()
        .setText('Trash selected senders  →')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor(DANGER_RED)
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('onSweepSelectedSenders')
            .setParameters({
              filters: JSON.stringify(filters),
              domains: JSON.stringify(domains)
            })
        )
    ).addButton(
      CardService.newTextButton()
        .setText('Back')
        .setOnClickAction(CardService.newAction().setFunctionName('onBackToFilters'))
    )
  );
  card.addSection(actionSection);

  return card.build();
}

function buildConfirmCard(filters, count, total, capped) {
  total = total || count;
  const countText = capped ? count.toLocaleString() + '+' : count.toLocaleString();

  const warning = CardService.newDecoratedText()
    .setStartIcon(CardService.newIconImage().setIconUrl(ICON.warn))
    .setText('<b>Confirm trash</b>')
    .setBottomLabel('Recoverable for 30 days');

  const detail = CardService.newDecoratedText()
    .setText('Moving <b>' + countText + '</b> email' + (count === 1 ? '' : 's') +
             ' to <b>Trash</b>. Gmail keeps trashed mail for 30 days, then deletes it permanently.')
    .setWrapText(true);

  const confirm = CardService.newTextButton()
    .setText('Yes, move to Trash')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor(DANGER_RED)
    .setOnClickAction(
      CardService.newAction()
        .setFunctionName('onDeleteConfirm')
        .setParameters({
          filters: JSON.stringify(filters),
          total: String(total),
          deletedSoFar: '0'
        })
    );

  const cancel = CardService.newTextButton()
    .setText('Cancel')
    .setOnClickAction(CardService.newAction().setFunctionName('onBackToFilters'));

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Confirm'))
    .addSection(
      CardService.newCardSection()
        .addWidget(warning)
        .addWidget(detail)
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(CardService.newButtonSet().addButton(confirm).addButton(cancel))
    )
    .build();
}

function buildResultCard(filters, result, total, deletedSoFar) {
  total = Number(total) || (result.deleted + result.remaining);
  deletedSoFar = (Number(deletedSoFar) || 0) + result.deleted;
  const remaining = result.remaining;
  const remainingCapped = result.remainingCapped;
  const isDone = remaining === 0;
  const remainingText = remainingCapped
    ? remaining.toLocaleString() + '+'
    : remaining.toLocaleString();

  const hero = CardService.newDecoratedText()
    .setStartIcon(CardService.newIconImage().setIconUrl(isDone ? ICON.check : ICON.trash));

  if (isDone) {
    hero.setText('<font color="' + SUCCESS_GREEN + '"><b>All done</b></font>')
        .setBottomLabel('Trashed ' + deletedSoFar.toLocaleString() + ' email' +
                        (deletedSoFar === 1 ? '' : 's'));
  } else {
    hero.setText('<b>' + deletedSoFar.toLocaleString() + '</b> trashed so far')
        .setBottomLabel(remainingText + ' still match the filter');
  }

  const heroSection = CardService.newCardSection().addWidget(hero);

  if (result.timedOut) {
    heroSection.addWidget(
      CardService.newDecoratedText()
        .setStartIcon(CardService.newIconImage().setIconUrl(ICON.clock))
        .setText('Paused at time limit')
        .setBottomLabel('Click Continue to keep going')
        .setWrapText(true)
    );
  }

  if (isDone) {
    heroSection.addWidget(
      CardService.newTextParagraph()
        .setText('<font color="#5f6368">Refresh Gmail to update the inbox list.</font>')
    );
  }

  const buttonSection = CardService.newCardSection();
  const resultButtons = CardService.newButtonSet();
  if (remaining > 0) {
    resultButtons.addButton(
      CardService.newTextButton()
        .setText('Continue (' + remainingText + ' left)')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor(BRAND_BLUE)
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('onDeleteConfirm')
            .setParameters({
              filters: JSON.stringify(filters),
              total: String(total),
              deletedSoFar: String(deletedSoFar)
            })
        )
    );
  }
  resultButtons.addButton(
    CardService.newTextButton()
      .setText(isDone ? 'Done' : 'Back')
      .setOnClickAction(CardService.newAction().setFunctionName('onBackToHome'))
  );
  buttonSection.addWidget(resultButtons);

  if (isDone && deletedSoFar > 0) {
    buttonSection.addWidget(
      CardService.newTextParagraph()
        .setText('<font color="#5f6368">Want this to run automatically?</font>')
    );
    buttonSection.addWidget(
      CardService.newButtonSet().addButton(
        CardService.newTextButton()
          .setText('Run this weekly  ↻')
          .setOnClickAction(
            CardService.newAction()
              .setFunctionName('onSaveRecipeFromResult')
              .setParameters({ filters: JSON.stringify(filters) })
          )
      )
    );
  }

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle(isDone ? 'All clean' : 'Trashing...'))
    .addSection(heroSection)
    .addSection(buttonSection)
    .build();
}

function buildBackgroundCard_(state) {
  const deletedSoFar = state.deletedSoFar || 0;
  const total = state.total || 0;
  const remaining = state.remaining || 0;
  const remainingCapped = !!state.remainingCapped;
  const completed = !!state.completed;
  const errored = !!state.error;

  const remainingText = remainingCapped
    ? remaining.toLocaleString() + '+'
    : remaining.toLocaleString();

  const heroSection = CardService.newCardSection();

  if (errored) {
    heroSection.addWidget(
      CardService.newDecoratedText()
        .setStartIcon(CardService.newIconImage().setIconUrl(ICON.warn))
        .setText('<font color="' + DANGER_RED + '"><b>Background job hit an error</b></font>')
        .setBottomLabel(state.error)
        .setWrapText(true)
    );
    heroSection.addWidget(
      CardService.newDecoratedText()
        .setText('Trashed <b>' + deletedSoFar.toLocaleString() + '</b> before stopping.')
    );
  } else if (completed) {
    heroSection.addWidget(
      CardService.newDecoratedText()
        .setStartIcon(CardService.newIconImage().setIconUrl(ICON.check))
        .setText('<font color="' + SUCCESS_GREEN + '"><b>All done</b></font>')
        .setBottomLabel('Trashed ' + deletedSoFar.toLocaleString() + ' email' +
                        (deletedSoFar === 1 ? '' : 's'))
    );
    heroSection.addWidget(
      CardService.newTextParagraph()
        .setText('<font color="#5f6368">Refresh Gmail to update the inbox list.</font>')
    );
  } else {
    heroSection.addWidget(
      CardService.newDecoratedText()
        .setStartIcon(CardService.newIconImage().setIconUrl(ICON.clock))
        .setText('<b>' + deletedSoFar.toLocaleString() + '</b> trashed so far')
        .setBottomLabel(remainingText + ' remaining — working in background')
    );
    heroSection.addWidget(
      CardService.newTextParagraph()
        .setText('<font color="#5f6368">This continues automatically every ~15 seconds. ' +
                 'Tap Refresh to see progress.</font>')
    );
  }

  const buttonSection = CardService.newCardSection();
  const buttons = CardService.newButtonSet();

  if (!completed && !errored) {
    buttons.addButton(
      CardService.newTextButton()
        .setText('Refresh')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor(BRAND_BLUE)
        .setOnClickAction(CardService.newAction().setFunctionName('onBgRefresh'))
    );
    buttons.addButton(
      CardService.newTextButton()
        .setText('Stop')
        .setOnClickAction(CardService.newAction().setFunctionName('onBgDismiss'))
    );
  } else {
    buttons.addButton(
      CardService.newTextButton()
        .setText('Done')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor(BRAND_BLUE)
        .setOnClickAction(CardService.newAction().setFunctionName('onBgDismiss'))
    );
  }
  buttonSection.addWidget(buttons);

  const title = errored ? 'Stopped' : (completed ? 'All clean' : 'Working...');
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle(title))
    .addSection(heroSection)
    .addSection(buttonSection)
    .build();
}

function buildPaywallCard_(verdict) {
  const isTrialOver = verdict.status === 'trial_over';
  const title = isTrialOver ? 'Trial ended' : 'Daily limit hit';
  const heroLabel = isTrialOver
    ? 'Unlock unlimited deletes for $5'
    : 'Free trial: 1 delete per day';

  const hero = CardService.newDecoratedText()
    .setStartIcon(CardService.newIconImage().setIconUrl(isTrialOver ? ICON.lock : ICON.clock))
    .setText('<font color="' + BRAND_BLUE + '"><b>' + heroLabel + '</b></font>')
    .setBottomLabel(verdict.message || 'Upgrade to keep sweeping.')
    .setWrapText(true);

  const bullets = CardService.newTextParagraph()
    .setText(
      '<b>What you get with $5 lifetime:</b><br>' +
      '✓ Unlimited deletes, unlimited filters<br>' +
      '✓ One-time payment, no subscription<br>' +
      '✓ Same Gmail address — no key to enter'
    );

  const buy = CardService.newTextButton()
    .setText('Buy for $5')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor(BRAND_BLUE)
    .setOpenLink(
      CardService.newOpenLink()
        .setUrl(getCheckoutUrl_())
        .setOpenAs(CardService.OpenAs.FULL_SIZE)
        .setOnClose(CardService.OnClose.RELOAD)
    );

  const back = CardService.newTextButton()
    .setText('Maybe later')
    .setOnClickAction(CardService.newAction().setFunctionName('onBackToFilters'));

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle(title))
    .addSection(CardService.newCardSection().addWidget(hero).addWidget(bullets))
    .addSection(CardService.newCardSection().addWidget(
      CardService.newButtonSet().addButton(buy).addButton(back)
    ))
    .build();
}

function readFilters_(e) {
  const inputs = (e && e.commonEventObject && e.commonEventObject.formInputs) || {};
  return {
    sender:   getStringInput_(inputs, 'sender'),
    subject:  getStringInput_(inputs, 'subject'),
    label:    getStringInput_(inputs, 'label'),
    dateFrom: getDateInput_(inputs, 'dateFrom'),
    dateTo:   getDateInput_(inputs, 'dateTo')
  };
}

function getStringInput_(inputs, key) {
  const f = inputs[key];
  return f && f.stringInputs && f.stringInputs.value && f.stringInputs.value[0] || '';
}

function getSwitchInput_(inputs, key) {
  const f = inputs[key];
  const v = f && f.stringInputs && f.stringInputs.value && f.stringInputs.value[0];
  return !!v;
}

function getDateInput_(inputs, key) {
  const f = inputs[key];
  const ms = f && f.dateInput && f.dateInput.msSinceEpoch;
  if (!ms) return '';
  const d = new Date(Number(ms));
  return d.getUTCFullYear() + '/' +
         String(d.getUTCMonth() + 1).padStart(2, '0') + '/' +
         String(d.getUTCDate()).padStart(2, '0');
}

function oneYearAgoString_() {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return d.getUTCFullYear() + '/' +
         String(d.getUTCMonth() + 1).padStart(2, '0') + '/' +
         String(d.getUTCDate()).padStart(2, '0');
}

// ============================================================
// Recurring sweeps UI
// ============================================================

function buildHomepageRecipesSection_() {
  const recipes = listRecipes_();
  if (!recipes.length) return null;

  const active = recipes.filter(function (r) { return r.enabled; }).length;
  const cap = MAX_RECIPES;
  const countDisplay = recipes.length + ' of ' + cap;
  const headerText = active === recipes.length
    ? '<b>RECURRING SWEEPS (' + countDisplay + ')</b>'
    : '<b>RECURRING SWEEPS (' + countDisplay + ' · ' + active + ' active)</b>';

  const section = CardService.newCardSection().setHeader(headerText);
  for (let i = 0; i < recipes.length; i++) {
    const r = recipes[i];
    const cadenceLabel = cadenceHumanLabel_(r.cadence);
    const last = r.lastRunAt
      ? 'Last run ' + relativeTime_(r.lastRunAt) + ' · ' + formatNumber_(r.lastRunCount) + ' cleaned'
      : 'Hasn’t run yet';
    section.addWidget(
      CardService.newDecoratedText()
        .setStartIcon(CardService.newIconImage().setIconUrl(r.enabled ? ICON.repeat : ICON.paused))
        .setText('<b>' + escapeHtml_(r.name) + '</b>')
        .setBottomLabel(cadenceLabel + ' · ' + last)
        .setWrapText(true)
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('onRecipeOpen')
            .setParameters({ recipeId: r.id })
        )
    );
  }

  // Show the rule only when the user is at or near the cap, so it stops
  // being decorative noise and starts being actionable advice.
  if (recipes.length >= cap - 2) {
    const note = recipes.length >= cap
      ? 'You\'ve reached the ' + cap + '-recipe limit. Delete one to add another.'
      : 'You can save up to ' + cap + ' recurring sweeps. Delete one to make room when you hit the limit.';
    section.addWidget(
      CardService.newTextParagraph()
        .setText('<font color="#5f6368">' + note + '</font>')
    );
  }

  return section;
}

function buildSaveRecipeCard_(filters, prefillCadence) {
  const queryPreview = buildQuery_(filters) || '(empty)';
  const defaultName = suggestRecipeName_(filters);

  const hero = CardService.newDecoratedText()
    .setStartIcon(CardService.newIconImage().setIconUrl(ICON.schedule))
    .setText('<font color="' + BRAND_BLUE + '"><b>Save as recurring sweep</b></font>')
    .setBottomLabel('Runs automatically — you get an email after each run.')
    .setWrapText(true);

  const filterRow = CardService.newDecoratedText()
    .setTopLabel('Filter')
    .setText(queryPreview)
    .setWrapText(true);

  const nameInput = CardService.newTextInput()
    .setFieldName('recipe_name')
    .setTitle('Recipe name')
    .setValue(defaultName);

  const cadencePicker = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.RADIO_BUTTON)
    .setTitle('How often?')
    .setFieldName('recipe_cadence')
    .addItem('Daily', 'daily', prefillCadence === 'daily')
    .addItem('Weekly', 'weekly', prefillCadence !== 'daily' && prefillCadence !== 'monthly')
    .addItem('Monthly', 'monthly', prefillCadence === 'monthly');

  const digestToggle = CardService.newDecoratedText()
    .setText('Email me after each run')
    .setBottomLabel('Off by default — you can always check stats in the add-on.')
    .setWrapText(true)
    .setSwitchControl(
      CardService.newSwitch()
        .setFieldName('recipe_digest')
        .setValue('1')
        .setSelected(false)
    );

  const note = CardService.newTextParagraph()
    .setText('<font color="#5f6368">Runs in the early morning (around 3 AM your timezone). ' +
             'You can pause or delete this anytime.</font>');

  const save = CardService.newTextButton()
    .setText('Save recipe')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor(BRAND_BLUE)
    .setOnClickAction(
      CardService.newAction()
        .setFunctionName('onSaveRecipeConfirm')
        .setParameters({ filters: JSON.stringify(filters) })
    );

  const cancel = CardService.newTextButton()
    .setText('Cancel')
    .setOnClickAction(CardService.newAction().setFunctionName('onBackToFilters'));

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('New recurring sweep'))
    .addSection(CardService.newCardSection().addWidget(hero).addWidget(filterRow))
    .addSection(CardService.newCardSection().addWidget(nameInput).addWidget(cadencePicker).addWidget(digestToggle).addWidget(note))
    .addSection(CardService.newCardSection().addWidget(
      CardService.newButtonSet().addButton(save).addButton(cancel)
    ))
    .build();
}

function buildRecipeEditCard_(recipe) {
  const cadenceLabel = cadenceHumanLabel_(recipe.cadence);
  const lastRun = recipe.lastRunAt
    ? relativeTime_(recipe.lastRunAt) + ' · ' + formatNumber_(recipe.lastRunCount) + ' cleaned'
    : 'Hasn’t run yet';
  const totalSwept = formatNumber_(recipe.totalSwept || 0);
  const runCount = formatNumber_(recipe.runCount || 0);
  const filterSummary = humanFilterSummary_(recipe.filters);

  const hero = CardService.newDecoratedText()
    .setStartIcon(CardService.newIconImage().setIconUrl(recipe.enabled ? ICON.repeat : ICON.paused))
    .setText('<b>' + escapeHtml_(recipe.name) + '</b>')
    .setBottomLabel(cadenceLabel + (recipe.enabled ? '' : ' · paused'))
    .setWrapText(true);

  const stats = CardService.newDecoratedText()
    .setTopLabel('Total cleaned')
    .setText('<b>' + totalSwept + '</b> emails over ' + runCount + ' run' + (recipe.runCount === 1 ? '' : 's'))
    .setBottomLabel('Last run: ' + lastRun)
    .setWrapText(true);

  const filterRow = CardService.newDecoratedText()
    .setTopLabel('Filter')
    .setText(escapeHtml_(filterSummary))
    .setWrapText(true);

  const runNow = CardService.newTextButton()
    .setText('Run now')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor(BRAND_BLUE)
    .setOnClickAction(
      CardService.newAction()
        .setFunctionName('onRecipeRunNow')
        .setParameters({ recipeId: recipe.id })
    );

  const toggle = CardService.newTextButton()
    .setText(recipe.enabled ? 'Pause' : 'Resume')
    .setOnClickAction(
      CardService.newAction()
        .setFunctionName('onRecipeToggle')
        .setParameters({ recipeId: recipe.id, enable: recipe.enabled ? '0' : '1' })
    );

  const renameInput = CardService.newTextInput()
    .setFieldName('recipe_new_name')
    .setTitle('Rename')
    .setValue(recipe.name);

  const cadencePicker = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.RADIO_BUTTON)
    .setTitle('Change cadence')
    .setFieldName('recipe_new_cadence')
    .addItem('Daily', 'daily', recipe.cadence === 'daily')
    .addItem('Weekly', 'weekly', recipe.cadence === 'weekly')
    .addItem('Monthly', 'monthly', recipe.cadence === 'monthly');

  const digestToggle = CardService.newDecoratedText()
    .setText('Email me after each run')
    .setBottomLabel(recipe.digestEnabled ? 'On — digests will be sent.' : 'Off — runs silently.')
    .setWrapText(true)
    .setSwitchControl(
      CardService.newSwitch()
        .setFieldName('recipe_new_digest')
        .setValue('1')
        .setSelected(!!recipe.digestEnabled)
    );

  const saveEdits = CardService.newTextButton()
    .setText('Save changes')
    .setOnClickAction(
      CardService.newAction()
        .setFunctionName('onRecipeSaveEdits')
        .setParameters({ recipeId: recipe.id })
    );

  const del = CardService.newTextButton()
    .setText('Delete')
    .setOnClickAction(
      CardService.newAction()
        .setFunctionName('onRecipeDelete')
        .setParameters({ recipeId: recipe.id })
    );

  const back = CardService.newTextButton()
    .setText('Back')
    .setOnClickAction(CardService.newAction().setFunctionName('onBackToHome'));

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Manage recipe'))
    .addSection(CardService.newCardSection().addWidget(hero).addWidget(stats).addWidget(filterRow))
    .addSection(
      CardService.newCardSection()
        .addWidget(CardService.newButtonSet().addButton(runNow).addButton(toggle))
    )
    .addSection(
      CardService.newCardSection()
        .setHeader('<b>EDIT</b>')
        .addWidget(renameInput)
        .addWidget(cadencePicker)
        .addWidget(digestToggle)
        .addWidget(CardService.newButtonSet().addButton(saveEdits))
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(CardService.newButtonSet().addButton(del).addButton(back))
    )
    .build();
}

function buildRecurringPaywallCard_(verdict) {
  const isTrialOver = verdict.status === 'trial_over';
  const heroLabel = isTrialOver
    ? 'Unlock unlimited deletes + recurring sweeps for $5'
    : 'Recurring sweeps are a paid feature';

  const hero = CardService.newDecoratedText()
    .setStartIcon(CardService.newIconImage().setIconUrl(ICON.lock))
    .setText('<font color="' + BRAND_BLUE + '"><b>' + heroLabel + '</b></font>')
    .setBottomLabel('Set it once — MailSweep cleans your inbox while you sleep.')
    .setWrapText(true);

  const bullets = CardService.newTextParagraph()
    .setText(
      '<b>What you get with $5 lifetime:</b><br>' +
      '✓ Unlimited deletes, unlimited filters<br>' +
      '✓ Schedule recurring sweeps (daily/weekly/monthly)<br>' +
      '✓ Email digest after every recurring run<br>' +
      '✓ One-time payment, no subscription'
    );

  const buy = CardService.newTextButton()
    .setText('Buy for $5')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor(BRAND_BLUE)
    .setOpenLink(
      CardService.newOpenLink()
        .setUrl(getCheckoutUrl_())
        .setOpenAs(CardService.OpenAs.FULL_SIZE)
        .setOnClose(CardService.OnClose.RELOAD)
    );

  const back = CardService.newTextButton()
    .setText('Maybe later')
    .setOnClickAction(CardService.newAction().setFunctionName('onBackToFilters'));

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Upgrade'))
    .addSection(CardService.newCardSection().addWidget(hero).addWidget(bullets))
    .addSection(CardService.newCardSection().addWidget(
      CardService.newButtonSet().addButton(buy).addButton(back)
    ))
    .build();
}

function suggestRecipeName_(filters) {
  if (filters.sender) {
    const at = filters.sender.indexOf('@');
    const dom = at >= 0 ? filters.sender.substring(at + 1) : filters.sender;
    return 'Clean ' + dom;
  }
  if (filters.label) return 'Clean ' + filters.label;
  if (filters.subject) return 'Clean: ' + filters.subject;
  if (filters.dateTo) return 'Clean older mail';
  return 'Untitled sweep';
}

function relativeTime_(ms) {
  const diff = Date.now() - Number(ms);
  if (diff < 0) return 'just now';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + ' min ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' hr ago';
  const d = Math.floor(h / 24);
  if (d < 30) return d + 'd ago';
  const mo = Math.floor(d / 30);
  return mo + 'mo ago';
}
