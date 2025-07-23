const { 
    ComponentDialog, 
    WaterfallDialog, 
    ChoicePrompt,
    TextPrompt,
    NumberPrompt,
    DialogSet,
    DialogTurnStatus,
    
} = require('botbuilder-dialogs');
const flightService = require('../services/flightService');
const pool = require('../../database/mysql-config');
const { CardFactory } = require('botbuilder');
const MAIN_MENU = 'mainMenu';
const BOOK_FLIGHT = 'bookFlight';
const SHOW_BOOKINGS = 'showBookings';

class MainDialog extends ComponentDialog {
    constructor(conversationState, userState) {
        super('mainDialog');
        
        this.addDialog(new ChoicePrompt('choicePrompt'));
        this.addDialog(new TextPrompt('textPrompt'));
        this.addDialog(new NumberPrompt('numberPrompt'));
        
        this.addDialog(new WaterfallDialog(MAIN_MENU, [
            this.showWelcomeStep.bind(this),
            this.processChoiceStep.bind(this)
        ]));

        this.addDialog(new WaterfallDialog(BOOK_FLIGHT, [
            this.askOriginStep.bind(this),
            this.askDestinationStep.bind(this),
            this.askDateStep.bind(this),
            this.askPassengersStep.bind(this),
            this.confirmBookingStep.bind(this)
        ]));

        this.addDialog(new WaterfallDialog(SHOW_BOOKINGS, [
            this.showBookingsStep.bind(this)
        ]));

        this.initialDialogId = MAIN_MENU;
    }

    async showWelcomeStep(stepContext) {
        // Skip welcome message if user directly asks for bookings
        if (this.isBookingRequest(stepContext.context.activity.text)) {
            return stepContext.beginDialog(SHOW_BOOKINGS);
        }
        
        return stepContext.prompt('choicePrompt', {
            prompt: 'Welcome to Flight Booking! ✈️ What would you like to do?',
            choices: [
                { value: 'book', action: { title: '📅 Book a flight' } },
                { value: 'view', action: { title: '✈️ My bookings' } },
                { value: 'help', action: { title: '❓ Help' } }
            ],
            style: 2
        });
    }

    async processChoiceStep(stepContext) {
    const choice = stepContext.result?.value?.toLowerCase() || '';

    switch (choice) {
        case 'book':
            return stepContext.beginDialog(BOOK_FLIGHT);
        case 'view':
            return stepContext.beginDialog(SHOW_BOOKINGS);
        case 'help':
            return await this.showHelp(stepContext); // ✅ correctly awaited
        default:
            await stepContext.context.sendActivity('❌ Invalid choice. Please choose again.');
            return stepContext.replaceDialog(MAIN_MENU);
    }
}

    isBookingRequest(text) {
        if (!text) return false;
        const bookingKeywords = ['my booking', 'my bookings', 'show booking', 'show bookings'];
        return bookingKeywords.some(keyword => 
            text.toLowerCase().includes(keyword)
        );
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
                return stepContext.endDialog();
            }
            
            // Create rich cards for each booking
            const bookingCards = bookings.map(booking => ({
                name: `FLT-${booking.id.toString().padStart(6, '0')}`,
                value: {
                    airline: booking.airline,
                    route: `${booking.origin} → ${booking.destination}`,
                    date: new Date(booking.departure).toLocaleDateString('en-GB'),
                    passengers: booking.passengers,
                    price: booking.total_price,
                    status: booking.status,
                    bookedOn: new Date(booking.booking_date).toLocaleDateString('en-GB')
                }
            }));

            // Send a carousel of booking cards
            await stepContext.context.sendActivity({
                attachments: [this.createBookingsCarousel(bookingCards, userName)]
            });
            
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            await stepContext.context.sendActivity(
                '❌ Could not retrieve your bookings. Please try again later.'
            );
        }
        
        return stepContext.endDialog();
    }

    createBookingsCarousel(bookings, userName) {
        return CardFactory.carousel(
            bookings.map(booking => CardFactory.heroCard(
                booking.name,
                [
                    `✈️ ${booking.value.airline} (${booking.value.route})`,
                    `📅 ${booking.value.date}`,
                    `👥 ${booking.value.passengers} passenger(s)`,
                    `💰 $${booking.value.price}`,
                    `🟢 ${booking.value.status}`,
                    `Booked on: ${booking.value.bookedOn}`
                ].join('\n'),
                null,
                [
                    { type: 'imBack', title: 'Cancel Booking', value: `Cancel ${booking.name}` },
                    { type: 'imBack', title: 'View Details', value: `Details ${booking.name}` }
                ]
            )),
            `📋 ${userName}'s Bookings (${bookings.length})`
        );
    }

    async showWelcomeStep(stepContext) {
        return stepContext.prompt('choicePrompt', {
            prompt: 'Welcome to Flight Booking! ✈️ What would you like to do?',
            choices: [
                { value: 'book', action: { title: '📅 Book a flight' } },
                { value: 'view', action: { title: '✈️ My bookings' } },
                { value: 'help', action: { title: '❓ Help' } }
            ],
            style: 2
        });
    }

    async processChoiceStep(stepContext) {
        const choice = stepContext.result.value;
        switch (choice) {
            case 'book':
                return stepContext.beginDialog(BOOK_FLIGHT);
            case 'view':
                return stepContext.beginDialog(SHOW_BOOKINGS);
            case 'help':
                return this.showHelp(stepContext);
            default:
                return stepContext.replaceDialog(MAIN_MENU);
        }
    }

    async askOriginStep(stepContext) {
        return stepContext.prompt('textPrompt', {
            prompt: '✈️ Enter departure airport code (3 letters, e.g. DEL):',
            retryPrompt: 'Please enter a valid 3-letter airport code'
        });
    }

    async askDestinationStep(stepContext) {
        const origin = stepContext.result.toUpperCase();
        if (!/^[A-Z]{3}$/.test(origin)) {
            await stepContext.context.sendActivity('❌ Invalid airport code format');
            return stepContext.replaceDialog(BOOK_FLIGHT);
        }
        
        stepContext.values.origin = origin;
        return stepContext.prompt('textPrompt', {
            prompt: '🌍 Enter destination airport code (3 letters, e.g. BOM):',
            retryPrompt: 'Please enter a valid 3-letter airport code'
        });
    }

    async askDateStep(stepContext) {
        const destination = stepContext.result.toUpperCase();
        if (!/^[A-Z]{3}$/.test(destination)) {
            await stepContext.context.sendActivity('❌ Invalid airport code format');
            return stepContext.replaceDialog(BOOK_FLIGHT);
        }
        
        stepContext.values.destination = destination;
        return stepContext.prompt('textPrompt', {
            prompt: '📅 Enter travel date (YYYY-MM-DD):',
            retryPrompt: 'Please use YYYY-MM-DD format (e.g. 2025-07-25)'
        });
    }

    async askPassengersStep(stepContext) {
        const date = stepContext.result;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            await stepContext.context.sendActivity('❌ Invalid date format');
            return stepContext.replaceDialog(BOOK_FLIGHT);
        }
        
        stepContext.values.date = date;
        return stepContext.prompt('numberPrompt', {
            prompt: '👪 How many passengers? (1-9):',
            retryPrompt: 'Please enter a number between 1 and 9'
        });
    }

    async confirmBookingStep(stepContext) {
    const passengers = stepContext.result;
    if (passengers < 1 || passengers > 9) {
        await stepContext.context.sendActivity('❌ Invalid passenger count');
        return stepContext.replaceDialog(BOOK_FLIGHT);
    }
    
    // Get all collected values from stepContext.values
    const { origin, destination, date } = stepContext.values;
    const user = stepContext.context.activity.from;
    
    try {
        console.log(`Searching flights from ${origin} to ${destination} on ${date}`);
        const flights = await flightService.searchFlights(origin, destination, date);
        console.log(`Found ${flights.length} flights`);
        
        if (!flights.length) {
            // Suggest alternative flights if available
            const [altFlights] = await pool.query(
                `SELECT * FROM flights 
                 WHERE origin = ? AND destination = ? AND seats > 0
                 ORDER BY ABS(DATEDIFF(departure, ?)) ASC
                 LIMIT 3`,
                [origin, destination, date]
            );
            
            if (altFlights.length) {
                let message = '❌ No flights found for your exact date. Alternatives:\n\n';
                altFlights.forEach(flight => {
                    const flightDate = new Date(flight.departure).toLocaleDateString();
                    message += `✈️ ${flight.airline} on ${flightDate}\n`;
                });
                message += '\nPlease try booking again with one of these dates.';
                await stepContext.context.sendActivity(message);
                return stepContext.replaceDialog(BOOK_FLIGHT);
            }
            
            throw new Error('No flights available for this route');
        }
        
        // Book the first available flight
        const flight = flights[0];
        console.log(`Booking flight ${flight.id} for ${passengers} passengers`);
        const { bookingId, totalPrice } = await flightService.bookFlight(
            flight.id,
            user.id,
            user.name || 'Guest',
            passengers
        );
        
        // Format confirmation
        const formattedDate = new Date(flight.departure).toLocaleDateString('en-GB');
        await stepContext.context.sendActivity(
            `📋 Booking Confirmation\n\n` +
            `Booking Reference: FLT-${bookingId.toString().padStart(6, '0')}\n` +
            `Route: ${flight.origin} → ${flight.destination}\n` +
            `Date: ${formattedDate}\n` +
            `Passengers: ${passengers}\n` +
            `Total Price: $${totalPrice}\n\n` +
            `Thank you for flying with us!`
        );
    } catch (error) {
        console.error('Booking error:', error);
        await stepContext.context.sendActivity(
            `❌ Booking failed: ${error.message}`
        );
    }
    
    return stepContext.endDialog();
}
    async showBookingsStep(stepContext) {
        const userId = stepContext.context.activity.from.id;
        
        try {
            const bookings = await flightService.getUserBookings(userId);
            
            if (!bookings.length) {
                await stepContext.context.sendActivity('You have no bookings yet.');
                return stepContext.endDialog();
            }
            
            let message = '📋 Your Bookings:\n\n';
            bookings.forEach(booking => {
                const bookingDate = new Date(booking.booking_date).toLocaleDateString('en-GB');
                const departureDate = new Date(booking.departure).toLocaleDateString('en-GB');
                
                message += `🔹 FLT-${booking.id.toString().padStart(6, '0')}\n` +
                           `   ${booking.airline} (${booking.origin} → ${booking.destination})\n` +
                           `   Date: ${departureDate}\n` +
                           `   Passengers: ${booking.passengers}\n` +
                           `   Status: ${booking.status}\n` +
                           `   Booked on: ${bookingDate}\n\n`;
            });
            
            await stepContext.context.sendActivity(message);
        } catch (error) {
            console.error('Get bookings error:', error);
            await stepContext.context.sendActivity(
                '❌ Failed to retrieve bookings. Please try again later.'
            );
        }
        
        return stepContext.endDialog();
    }

    async showHelp(stepContext) {
        await stepContext.context.sendActivity({
            text: 'Here are some things you can ask:',
            attachments: [this.getHelpCard()]
        });
        return stepContext.replaceDialog(MAIN_MENU);
    }

    getHelpCard() {
        return CardFactory.heroCard(
            'Help Center',
            null,
            null,
            [
                { type: 'imBack', title: 'Book a flight', value: 'Book a flight' },
                { type: 'imBack', title: 'My bookings', value: 'My bookings' },
                { type: 'imBack', title: 'Help', value: 'Help' }
            ]
        );
    }

    async run(context, dialogState) {
        const dialogSet = new DialogSet(dialogState);
        dialogSet.add(this);
        
        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }
}

module.exports = { MainDialog };