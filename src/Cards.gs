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
  sparkle:   'https://api.iconify.design/material-symbols/auto-awesome-rounded.svg?color=%23f9ab00'
};

function buildFilterCard() {
  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('MailSweep')
        .setSubtitle('Clean your inbox in seconds')
    )
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

  const button = CardService.newTextButton()
    .setText('  Preview matches  →  ')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor(BRAND_BLUE)
    .setOnClickAction(CardService.newAction().setFunctionName('onPreviewClick'));

  return CardService.newCardSection()
    .addWidget(hint)
    .addWidget(CardService.newButtonSet().addButton(button));
}

function buildPreviewCard(filters, count, capped) {
  const query = buildQuery_(filters);
  const countText = capped ? count.toLocaleString() + '+' : count.toLocaleString();

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
        .setBottomLabel('Ready to clean up')
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
  buttonSection.addWidget(previewButtons);

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Preview'))
    .addSection(heroSection)
    .addSection(buttonSection)
    .build();
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
    ? 'Unlock unlimited deletes for $3'
    : 'Free trial: 1 delete per day';

  const hero = CardService.newDecoratedText()
    .setStartIcon(CardService.newIconImage().setIconUrl(isTrialOver ? ICON.lock : ICON.clock))
    .setText('<font color="' + BRAND_BLUE + '"><b>' + heroLabel + '</b></font>')
    .setBottomLabel(verdict.message || 'Upgrade to keep sweeping.')
    .setWrapText(true);

  const bullets = CardService.newTextParagraph()
    .setText(
      '<b>What you get with $3 lifetime:</b><br>' +
      '✓ Unlimited deletes, unlimited filters<br>' +
      '✓ One-time payment, no subscription<br>' +
      '✓ Same Gmail address — no key to enter<br>' +
      '✓ 30-day Gumroad refund guarantee'
    );

  const buy = CardService.newTextButton()
    .setText('Buy for $3')
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
