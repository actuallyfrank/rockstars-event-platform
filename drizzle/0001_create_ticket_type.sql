CREATE TABLE `ticket_type` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`name` text NOT NULL,
	`price_amount` integer NOT NULL,
	`currency` text NOT NULL,
	`quantity_total` integer NOT NULL,
	`quantity_remaining` integer NOT NULL,
	`sale_starts_at` integer,
	`sale_ends_at` integer,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ticket_type_price_amount_check" CHECK(price_amount >= 0),
	CONSTRAINT "ticket_type_quantity_total_check" CHECK(quantity_total >= 0),
	CONSTRAINT "ticket_type_quantity_remaining_check" CHECK(quantity_remaining >= 0 AND quantity_remaining <= quantity_total)
);
--> statement-breakpoint
CREATE INDEX `ticket_type_event_id_idx` ON `ticket_type` (`event_id`);