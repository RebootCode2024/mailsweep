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

  const buttons = CardService.newButtonSet();

  if (count > 0) {
    const deleteBtn = CardService.newTextButton()
      .setText('Move ' + count.toLocaleString() + ' to Trash')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('onDeletePrompt')
          .setParameters({ filters: JSON.stringify(filters), count: String(count) })
      );
    buttons.addButton(deleteBtn);
  }

  const back = CardService.newTextButton()
    .setText('Back')
    .setOnClickAction(CardService.newAction().setFunctionName('onBackToFilters'));
  buttons.addButton(back);
  section.addWidget(buttons);

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Preview'))
    .addSection(section)
    .build();
}

function buildConfirmCard(filters, count) {
  const warning = CardService.newTextParagraph().setText(
    'You are about to move <b>' + count.toLocaleString() + '</b> email thread' +
    (count === 1 ? '' : 's') + ' to <b>Trash</b>. ' +
    'Trashed mail is recoverable for 30 days, then permanently deleted by Gmail.'
  );

  const confirm = CardService.newTextButton()
    .setText('Yes, move to Trash')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setBackgroundColor('#d93025')
    .setOnClickAction(
      CardService.newAction()
        .setFunctionName('onDeleteConfirm')
        .setParameters({ filters: JSON.stringify(filters) })
    );

  const cancel = CardService.newTextButton()
    .setText('Cancel')
    .setOnClickAction(CardService.newAction().setFunctionName('onBackToFilters'));

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Confirm delete'))
    .addSection(
      CardService.newCardSection()
        .addWidget(warning)
        .addWidget(CardService.newButtonSet().addButton(confirm).addButton(cancel))
    )
    .build();
}

function buildResultCard(filters, result) {
  const lines = [];
  lines.push('Moved <b>' + result.deleted.toLocaleString() + '</b> thread' +
             (result.deleted === 1 ? '' : 's') + ' to Trash.');
  if (result.timedOut) {
    lines.push('Hit Apps Script\'s 6-minute limit before finishing.');
  }
  if (result.remaining > 0) {
    lines.push('<b>' + result.remaining.toLocaleString() + '</b> matching thread' +
               (result.remaining === 1 ? '' : 's') + ' still remain.');
  }

  const section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText(lines.join('<br><br>')));

  const buttons = CardService.newButtonSet();
  if (result.remaining > 0) {
    buttons.addButton(
      CardService.newTextButton()
        .setText('Run again')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('onDeleteConfirm')
            .setParameters({ filters: JSON.stringify(filters) })
        )
    );
  }
  buttons.addButton(
    CardService.newTextButton()
      .setText('Back to filters')
      .setOnClickAction(CardService.newAction().setFunctionName('onBackToHome'))
  );
  section.addWidget(buttons);

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Done'))
    .addSection(section)
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
