const { ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt } = require('botbuilder-dialogs');
const flightService = require('../../services/flightService');

class BookingDialog extends ComponentDialog {
  constructor() {
    super('bookingDialog');
    
    this.addDialog(new TextPrompt('textPrompt'));
    this.addDialog(new NumberPrompt('numberPrompt'));
    
    this.addDialog(new WaterfallDialog('bookingFlow', [
      this.askOriginStep.bind(this),
      this.askDestinationStep.bind(this),
      this.askDateStep.bind(this),
      this.searchFlightsStep.bind(this),
      this.selectFlightStep.bind(this),
      this.askPassengersStep.bind(this),
      this.confirmBookingStep.bind(this)
    ]));

    this.initialDialogId = 'bookingFlow';
  }

  // [Previous steps remain the same...]

  async confirmBookingStep(stepContext) {
    const { selectedFlight, passengers } = stepContext.values;
    const user = stepContext.context.activity.from;
    
    try {
      const { bookingId, flight, totalPrice } = await flightService.bookFlight(
        selectedFlight.id,
        user.id,
        user.name || 'Guest',
        passengers
      );
      
      // Format booking confirmation
      const departureDate = new Date(flight.departure).toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      await stepContext.context.sendActivity({
        text: `📋 Booking Confirmation\n\n` +
              `Booking Reference: FLT-${bookingId.toString().padStart(6, '0')}\n` +
              `Route: ${flight.origin} → ${flight.destination}\n` +
              `Date: ${departureDate}\n` +
              `Passengers: ${passengers}\n\n` +
              `Thank you for flying with us!`,
        speak: 'Your booking has been confirmed. Reference number F L T ' + 
               bookingId.toString().split('').join(' ')
      });
    } catch (error) {
      await stepContext.context.sendActivity(
        `❌ Booking failed: ${error.message}`
      );
    }
    
    return stepContext.endDialog();
  }
}

module.exports = BookingDialog;