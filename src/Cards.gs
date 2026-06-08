/**
 * Card Service UI for the Gmail sidebar.
 * TODO Day 2-3: real inputs (sender, subject, label, date range).
 */

function buildFilterCard() {
  const senderInput = CardService.newTextInput()
    .setFieldName('sender')
    .setTitle('From (sender email or domain)')
    .setHint('e.g. noreply@linkedin.com or @amazon.com');

  const subjectInput = CardService.newTextInput()
    .setFieldName('subject')
    .setTitle('Subject contains')
    .setHint('e.g. "your order", invoice, newsletter');

  const labelInput = CardService.newTextInput()
    .setFieldName('label')
    .setTitle('Label')
    .setHint('e.g. Promotions, Updates, Receipts');

  const dateFromInput = CardService.newDatePicker()
    .setFieldName('dateFrom')
    .setTitle('Received after');

  const dateToInput = CardService.newDatePicker()
    .setFieldName('dateTo')
    .setTitle('Received before');

  const intro = CardService.newTextParagraph()
    .setText('Enter at least one filter, then preview matching emails before deleting.');

  const previewButton = CardService.newTextButton()
    .setText('Preview count')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setOnClickAction(CardService.newAction().setFunctionName('onPreviewClick'));

  const buttonSet = CardService.newButtonSet().addButton(previewButton);

  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('MailSweep')
        .setSubtitle('Bulk delete, no 50-email cap')
    )
    .addSection(
      CardService.newCardSection()
        .setHeader('Filters')
        .addWidget(intro)
        .addWidget(senderInput)
        .addWidget(subjectInput)
        .addWidget(labelInput)
    )
    .addSection(
      CardService.newCardSection()
        .setHeader('Date range (optional)')
        .addWidget(dateFromInput)
        .addWidget(dateToInput)
    )
    .addSection(
      CardService.newCardSection().addWidget(buttonSet)
    )
    .build();
}

function buildPreviewCard(filters, count) {
  const query = buildQuery_(filters);
  const headline = count === 0
    ? 'No matching emails.'
    : '<b>' + count.toLocaleString() + '</b> matching email thread' + (count === 1 ? '' : 's') + '.';

  const section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText(headline));

  if (query) {
    section.addWidget(
      CardService.newKeyValue()
        .setTopLabel('Gmail query')
        .setContent(query)
        .setMultiline(true)
    );
  }

  if (count > 0) {
    section.addWidget(CardService.newTextParagraph()
      .setText('Delete button coming Day 10.'));
  }

  const back = CardService.newTextButton()
    .setText('Back to filters')
    .setOnClickAction(CardService.newAction().setFunctionName('onBackToFilters'));
  section.addWidget(CardService.newButtonSet().addButton(back));

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Preview'))
    .addSection(section)
    .build();
}

function buildResultCard(result) {
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Done'))
    .addSection(
      CardService.newCardSection()
        .addWidget(CardService.newTextParagraph().setText('Deleted ' + result.deleted + ' threads.'))
    )
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
