CREATE TABLE `event` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`image_url` text,
	`venue_name` text NOT NULL,
	`location` text NOT NULL,
	`timezone` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer,
	`status` text NOT NULL,
	CONSTRAINT "event_status_check" CHECK(status IN ('draft', 'published', 'cancelled'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_slug_unique` ON `event` (`slug`);