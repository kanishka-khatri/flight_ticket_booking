const { ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');
const flightService = require('../../services/flightService');
const { CardFactory } = require('botbuilder');

class ShowBookingsDialog extends ComponentDialog {
  constructor() {
    super('showBookingsDialog');
    
    this.addDialog(new WaterfallDialog('bookingsFlow', [
      this.showBookingsStep.bind(this)
    ]));

    this.initialDialogId = 'bookingsFlow';
  }

  async showBookingsStep(stepContext) {
    const userId = stepContext.context.activity.from.id;
    const userName = stepContext.context.activity.from.name || 'Guest';

    try {
        console.log(`Fetching bookings for user ${userId}`);
        const bookings = await flightService.getUserBookings(userId);

        if (!bookings.length) {
            await stepContext.context.sendActivity(
                `${userName}, you don't have any bookings yet.`
            );
            return await stepContext.endDialog();
        }

        // Create booking cards
        const bookingCards = bookings.map(booking => {
            const departureDate = new Date(booking.departure).toLocaleDateString('en-GB');
            const bookingDate = new Date(booking.booking_date).toLocaleDateString('en-GB');

            return {
                name: `FLT-${booking.id.toString().padStart(6, '0')}`,
                value:
                    `✈️ ${booking.airline} (${booking.origin} → ${booking.destination})\n` +
                    `📅 ${departureDate} | 👥 ${booking.passengers} passenger(s)\n` +
                    `💰 $${booking.total_price} | Status: ${booking.status}`
            };
        });

        // Send the hero card
        await stepContext.context.sendActivity({
            attachments: [
                CardFactory.heroCard(
                    `📋 ${userName}'s Flight Bookings`,
                    bookingCards.map(booking => booking.value),
                    null,
                    bookingCards.map(booking => ({
                        type: 'imBack',
                        title: booking.name,
                        value: booking.value
                    }))
                )
            ]
        });
    } catch (error) {
        console.error('Failed to fetch bookings:', error);
        await stepContext.context.sendActivity(
            '❌ Could not retrieve your bookings. Please try again later.'
        );
    }

    return await stepContext.endDialog();
}
}

module.exports = ShowBookingsDialog;