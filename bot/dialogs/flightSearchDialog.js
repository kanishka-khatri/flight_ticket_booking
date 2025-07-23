const BaseDialog = require('./baseDialog');
const { WaterfallDialog, TextPrompt, NumberPrompt } = require('botbuilder-dialogs');

class FlightSearchDialog extends BaseDialog {
  constructor() {
    super('FlightSearchDialog');
    
    this.addDialog(new TextPrompt('TextPrompt'));
    this.addDialog(new NumberPrompt('NumberPrompt'));
    
    this.addDialog(new WaterfallDialog('WaterfallDialog', [
      this.originStep.bind(this),
      this.destinationStep.bind(this),
      this.dateStep.bind(this),
      this.travelersStep.bind(this),
      this.searchStep.bind(this)
    ]));

    this.initialDialogId = 'WaterfallDialog';
  }

  async originStep(stepContext) {
    return await stepContext.prompt('TextPrompt', {
      prompt: 'Where are you flying from? (e.g. New York)'
    });
  }

  async destinationStep(stepContext) {
    stepContext.values.origin = stepContext.result;
    return await stepContext.prompt('TextPrompt', {
      prompt: 'Where are you flying to? (e.g. London)'
    });
  }

  async dateStep(stepContext) {
    stepContext.values.destination = stepContext.result;
    return await stepContext.prompt('TextPrompt', {
      prompt: 'When? (YYYY-MM-DD)'
    });
  }

  async travelersStep(stepContext) {
    stepContext.values.date = stepContext.result;
    return await stepContext.prompt('NumberPrompt', {
      prompt: 'How many travelers?'
    });
  }

  async searchStep(stepContext) {
    stepContext.values.travelers = stepContext.result;
    await stepContext.context.sendActivity(`Searching flights from ${stepContext.values.origin} to ${stepContext.values.destination}`);
    return await stepContext.endDialog();
  }
}

module.exports = { FlightSearchDialog };