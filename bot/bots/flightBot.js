// const { ActivityHandler } = require('botbuilder');

// class FlightBot extends ActivityHandler {
//     constructor(conversationState, mainDialog) {
//         super();
        
//         if (!conversationState) throw new Error('Missing conversationState');
//         if (!mainDialog) throw new Error('Missing mainDialog');
        
//         this.conversationState = conversationState;
//         this.mainDialog = mainDialog;
//         this.dialogState = this.conversationState.createProperty('DialogState');

//         this.onMessage(async (context, next) => {
//             try {
//                 const message = context.activity.text.toLowerCase().trim();
//                 console.log(`Processing message: "${message}"`);

//                 if (message === 'help') {
//                     await this.showHelp(context);
//                     return await next();
//                 }

//                 if (message === 'my bookings' || message === 'bookings') {
//                     await this.showBookings(context);
//                     return await next();
//                 }

//                 if (message === 'restart' || message === 'start over') {
//                     await this.restartConversation(context);
//                     return await next();
//                 }

//                 await this.mainDialog.run(context, this.dialogState);
//             } catch (error) {
//                 console.error('Message handling error:', error.stack);
//                 await context.sendActivity('I encountered an issue. Please try again or say "help".');
//             } finally {
//                 await next();
//             }
//         });

//         this.onMembersAdded(async (context, next) => {
//             await this.sendWelcomeMessage(context);
//             await next();
//         });
//     }

//     async sendWelcomeMessage(context) {
//         const welcomeMessage = [
//             'Welcome to Flight Booking Bot! ✈️',
//             'I can help you:',
//             '- Book flights (say "book a flight")',
//             '- Check existing bookings (say "my bookings")',
//             '- Get help (say "help")',
//             '',
//             'What would you like to do today?'
//         ].join('\n');
        
//         await context.sendActivity(welcomeMessage);
//     }

//     async showHelp(context) {
//         const helpMessage = [
//             '**Flight Bot Help**',
//             'Here are the commands I understand:',
//             '- "Book a flight" - Start a new flight reservation',
//             '- "My bookings" - View your existing reservations',
//             '- "Restart" - Cancel current conversation',
//             '- "Help" - Show this message',
//             '',
//             'You can also say things like:',
//             '"I want to fly from New York to London next week"'
//         ].join('\n');
        
//         await context.sendActivity(helpMessage);
//     }

//     async showBookings(context) {
//         await context.sendActivity('Your recent bookings will appear here once we implement storage.');
//     }

//     async restartConversation(context) {
//         await this.conversationState.clear(context);
//         await context.sendActivity('Okay, let\'s start fresh!');
//         await this.sendWelcomeMessage(context);
//     }

//     async run(context) {
//         try {
//             await super.run(context);
//             await this.conversationState.saveChanges(context, false);
//         } catch (error) {
//             console.error('Error in bot.run:', error.stack);
//             await context.sendActivity('I\'m having technical difficulties. Please try again later.');
//         }
//     }
// }

// module.exports.FlightBot = FlightBot;
const { ActivityHandler } = require('botbuilder');

class FlightBot extends ActivityHandler {
    constructor(conversationState, mainDialog) {
        super();
        this.conversationState = conversationState;
        this.dialogState = conversationState.createProperty('DialogState');
        this.mainDialog = mainDialog;

        this.onMessage(async (context, next) => {
            const message = context.activity.text.toLowerCase().trim();

            if (["1", "book", "book a flight"].includes(message)) {
                await this.mainDialog.run(context, this.dialogState);
            } else if (["2", "my bookings"].includes(message)) {
                await this.mainDialog.showBookings(context);
            } else if (["3", "help"].includes(message)) {
                await context.sendActivity("Send `1` to book, `2` to view bookings, `4` to restart.");
            } else if (["4", "restart"].includes(message)) {
                await context.sendActivity(this.mainDialog.menuText());
            } else {
                await context.sendActivity("Invalid input. Please choose 1–4.");
            }

            await next();
        });

        this.onMembersAdded(async (context, next) => {
            await context.sendActivity(this.mainDialog.menuText());
            await next();
        });
    }

    async run(context) {
        await super.run(context);
        await this.conversationState.saveChanges(context);
    }
}

module.exports = { FlightBot };