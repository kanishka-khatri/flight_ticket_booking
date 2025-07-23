const { ComponentDialog } = require('botbuilder-dialogs');

class BaseDialog extends ComponentDialog {
  constructor(dialogId) {
    super(dialogId);
    this.version = '1.0.0'; // Central version control
  }
}

module.exports = BaseDialog;