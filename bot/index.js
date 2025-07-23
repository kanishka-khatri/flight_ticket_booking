const { ConversationState, MemoryStorage } = require('botbuilder');
const { FlightBot } = require('./bots/flightBot');
const { MainDialog } = require('../bot/dialogs/mainDialog');
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);

const mainDialog = new MainDialog();
const bot = new FlightBot(conversationState, mainDialog);

module.exports = { bot };
