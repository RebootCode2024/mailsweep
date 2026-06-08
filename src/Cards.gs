/**
 * Card Service UI for the Gmail sidebar.
 * TODO Day 2-3: real inputs (sender, subject, label, date range).
 */

function buildFilterCard() {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('MailSweep').setSubtitle('Bulk delete, no 50-email cap'))
    .addSection(
      CardService.newCardSection()
        .addWidget(CardService.newTextParagraph().setText('Filter inputs coming Day 2.'))
    );
  return card.build();
}

function buildPreviewCard(filters, count) {
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Preview'))
    .addSection(
      CardService.newCardSection()
        .addWidget(CardService.newTextParagraph().setText(count + ' matching threads'))
    )
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
    sender: getInput_(inputs, 'sender'),
    subject: getInput_(inputs, 'subject'),
    label: getInput_(inputs, 'label'),
    dateFrom: getInput_(inputs, 'dateFrom'),
    dateTo: getInput_(inputs, 'dateTo')
  };
}

function getInput_(inputs, key) {
  const f = inputs[key];
  return f && f.stringInputs && f.stringInputs.value && f.stringInputs.value[0] || '';
}
