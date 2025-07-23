const { ActivityHandler, CardFactory } = require('botbuilder');
const { MainDialog } = require('./dialogs/mainDialog');

class FlightBookingBot extends ActivityHandler {
    constructor(conversationState, userState) {
        super();
        
        this.conversationState = conversationState;
        this.userState = userState;
        this.dialogState = this.conversationState.createProperty('DialogState');
        this.mainDialog = new MainDialog(conversationState, userState);

        this.onMessage(async (context, next) => {
            console.log('Message received:', context.activity.text);
            await this.mainDialog.run(context, this.dialogState);
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await this.mainDialog.run(context, this.dialogState);
                }
            }
            await next();
        });
    }

    async run(context) {
        await super.run(context);
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }
}

module.exports = { FlightBookingBot };