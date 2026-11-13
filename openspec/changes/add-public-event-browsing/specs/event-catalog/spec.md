# Spec Delta

## Purpose

Lets any visitor, without an account, discover upcoming events and see which tickets are offered for each event, at what price, and whether they can currently be bought.

## ADDED Requirements

### Requirement: Anonymous access to the catalog
The system SHALL allow visitors to view the event list and event detail pages without an account, login, or session.

#### Scenario: Visitor without account opens the event list
- **WHEN** a visitor who is not logged in requests the event list page
- **THEN** the system shows the event list without prompting for login or registration

#### Scenario: Visitor without account opens an event detail page
- **WHEN** a visitor who is not logged in requests the detail page of a listed event
- **THEN** the system shows the event detail page without prompting for login or registration

### Requirement: Only published events are listed
The system SHALL list only events whose status is published. Draft and cancelled events SHALL NOT appear in the catalog.

#### Scenario: Draft event is hidden
- **GIVEN** an upcoming event with status draft
- **WHEN** a visitor views the event list
- **THEN** the draft event is not shown

#### Scenario: Cancelled event is hidden
- **GIVEN** an upcoming event with status cancelled
- **WHEN** a visitor views the event list
- **THEN** the cancelled event is not shown

### Requirement: Ended events are hidden
The system SHALL hide an event once it has ended. An event has ended when its end time has passed; an event without an end time has ended when its start time has passed.

#### Scenario: Event in progress remains listed
- **GIVEN** a published event whose start time has passed and whose end time has not
- **WHEN** a visitor views the event list
- **THEN** the event is shown

#### Scenario: Event past its end time is hidden
- **GIVEN** a published event whose end time has passed
- **WHEN** a visitor views the event list
- **THEN** the event is not shown

#### Scenario: Event without end time past its start time is hidden
- **GIVEN** a published event with no end time whose start time has passed
- **WHEN** a visitor views the event list
- **THEN** the event is not shown

### Requirement: Ticket types with ended sales are hidden
The system SHALL hide a ticket type once its sale window has closed. The sale window is closed when its sale end time has passed.

#### Scenario: Ticket type with closed sale window is hidden
- **GIVEN** a listed event with a ticket type whose sale end time has passed
- **WHEN** a visitor views the event detail page
- **THEN** that ticket type is not shown

#### Scenario: Ticket type with open sale window is shown
- **GIVEN** a listed event with a ticket type whose sale has opened and not yet ended
- **WHEN** a visitor views the event detail page
- **THEN** that ticket type is shown

### Requirement: Events without visible ticket types are hidden
The system SHALL hide a published, not-ended event when none of its ticket types are visible.

#### Scenario: All ticket sales have ended before the event
- **GIVEN** a published upcoming event whose ticket types all have closed sale windows
- **WHEN** a visitor views the event list
- **THEN** the event is not shown

#### Scenario: Event with no ticket types
- **GIVEN** a published upcoming event with no ticket types
- **WHEN** a visitor views the event list
- **THEN** the event is not shown

### Requirement: Event list ordering
The system SHALL order the event list by event start time, soonest first.

#### Scenario: Events appear soonest first
- **GIVEN** two listed events, A starting on 10 December and B starting on 5 December
- **WHEN** a visitor views the event list
- **THEN** event B is shown before event A

### Requirement: Empty catalog message
The system SHALL show a message stating there are no upcoming events when no events are listed.

#### Scenario: No listed events
- **GIVEN** no events meet the listing rules
- **WHEN** a visitor views the event list
- **THEN** the system shows a message that there are no upcoming events

### Requirement: Event list entry content
Each event in the list SHALL show its title, start date and time, venue, image when one exists, a ticket summary, and a link to its detail page.

#### Scenario: Visitor opens an event from the list
- **WHEN** a visitor selects an event in the list
- **THEN** the system shows that event's detail page

### Requirement: Event ticket summary
Each listed event SHALL show one ticket summary derived from its visible ticket types: the lowest price among available ticket types, otherwise the earliest sale start among not-yet-on-sale ticket types, otherwise a sold-out badge.

#### Scenario: Event with available tickets
- **GIVEN** a listed event with available ticket types priced EUR 35 and EUR 80
- **WHEN** a visitor views the event list
- **THEN** the event shows "from EUR 35"

#### Scenario: Price from cheapest available type, not cheapest overall
- **GIVEN** a listed event with a sold-out ticket type at EUR 25 and an available ticket type at EUR 35
- **WHEN** a visitor views the event list
- **THEN** the event shows "from EUR 35"

#### Scenario: Event with no available tickets but upcoming sales
- **GIVEN** a listed event whose visible ticket types are all sold out or not yet on sale, with the earliest sale start on 1 December
- **WHEN** a visitor views the event list
- **THEN** the event shows "On sale from" 1 December

#### Scenario: Event fully sold out
- **GIVEN** a listed event whose visible ticket types are all sold out
- **WHEN** a visitor views the event list
- **THEN** the event shows a sold-out badge

### Requirement: Event detail content
The event detail page SHALL show the event's title, start date and time, end date and time when one exists, venue and location, description, image when one exists, and its visible ticket types.

#### Scenario: Visitor views event details
- **WHEN** a visitor opens the detail page of a listed event
- **THEN** the page shows the event's title, date and time, venue and location, description, and its visible ticket types

### Requirement: Ticket type ordering
The event detail page SHALL list visible ticket types by price, lowest first.

#### Scenario: Ticket types ordered by price
- **GIVEN** a listed event with visible ticket types VIP at EUR 80 and Regular at EUR 35
- **WHEN** a visitor views the event detail page
- **THEN** Regular is shown before VIP

### Requirement: Available ticket type display
A visible ticket type whose sale window is open and that has remaining stock SHALL show its name, price, and exact remaining count.

#### Scenario: Available ticket type with remaining stock
- **GIVEN** a ticket type "Regular" priced EUR 35 with 142 remaining and an open sale window
- **WHEN** a visitor views the event detail page
- **THEN** the page shows "Regular", EUR 35, and "142 left"

### Requirement: Sold-out ticket type display
A visible ticket type whose sale window is open and that has no remaining stock SHALL show its name, price, and a sold-out badge instead of a remaining count.

#### Scenario: Sold-out ticket type
- **GIVEN** a ticket type "Early bird" priced EUR 25 with 0 remaining and an open sale window
- **WHEN** a visitor views the event detail page
- **THEN** the page shows "Early bird", EUR 25, and a sold-out badge

### Requirement: Not-yet-on-sale ticket type display
A visible ticket type whose sale has not started SHALL show its name, price, and the date and time its sale starts, instead of a remaining count.

#### Scenario: Ticket type before sale starts
- **GIVEN** a ticket type "VIP" priced EUR 80 whose sale starts on 1 December at 10:00
- **WHEN** a visitor views the event detail page before that moment
- **THEN** the page shows "VIP", EUR 80, and "On sale from" 1 December 10:00

#### Scenario: Sale start moment is reached
- **GIVEN** a ticket type with remaining stock whose sale starts on 1 December at 10:00
- **WHEN** a visitor views the event detail page at or after 1 December 10:00
- **THEN** the ticket type is shown as available with its remaining count

### Requirement: Hidden or unknown events are not found
The system SHALL respond with a not-found page when a visitor requests the detail page of an event that does not exist or is not listed.

#### Scenario: Unknown event address
- **WHEN** a visitor requests a detail page for an event that does not exist
- **THEN** the system responds with a not-found page

#### Scenario: Hidden event address
- **GIVEN** an event that is draft, cancelled, ended, or has no visible ticket types
- **WHEN** a visitor requests its detail page directly
- **THEN** the system responds with a not-found page

### Requirement: Dates, times, and prices display
The system SHALL show event and sale dates and times in the event's local timezone, and SHALL show prices with their currency.

#### Scenario: Event in a specific timezone
- **GIVEN** an event in Amsterdam starting at 20:00 local time
- **WHEN** a visitor views the event
- **THEN** the start time is shown as 20:00
