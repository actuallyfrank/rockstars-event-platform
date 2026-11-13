import type { ListedEvent } from "@/lib/catalog/queries";
import { EventCard } from "./event-card";

export function EventList({ events }: { events: ListedEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-600 dark:border-stone-700 dark:text-stone-400">
        There are no upcoming events.
      </p>
    );
  }

  return (
    <ul
      className="grid items-start gap-6 sm:grid-cols-2"
      aria-label="Upcoming events"
    >
      {events.map((listed) => (
        <li key={listed.event.id} data-event-slug={listed.event.slug}>
          <EventCard listed={listed} />
        </li>
      ))}
    </ul>
  );
}
