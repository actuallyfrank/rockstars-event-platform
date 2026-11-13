import Image from "next/image";
import type { ListedEvent } from "@/lib/catalog/queries";
import { DateTime } from "./date-time";
import { TicketTypeList } from "./ticket-type-list";

export function EventDetail({ listed }: { listed: ListedEvent }) {
  const { event, ticketTypes } = listed;
  return (
    <article className="flex flex-col gap-8">
      {event.imageUrl ? (
        <div className="relative aspect-[21/9] overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800">
          <Image
            src={event.imageUrl}
            alt=""
            fill
            unoptimized
            priority
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
          <dt className="font-medium text-stone-500 dark:text-stone-400">
            Starts
          </dt>
          <dd data-testid="event-starts">
            <DateTime value={event.startsAt} timeZone={event.timezone} />
          </dd>
          {event.endsAt ? (
            <>
              <dt className="font-medium text-stone-500 dark:text-stone-400">
                Ends
              </dt>
              <dd data-testid="event-ends">
                <DateTime value={event.endsAt} timeZone={event.timezone} />
              </dd>
            </>
          ) : null}
          <dt className="font-medium text-stone-500 dark:text-stone-400">
            Venue
          </dt>
          <dd data-testid="event-venue">
            {event.venueName}
            <span className="block text-stone-600 dark:text-stone-400">
              {event.location}
            </span>
          </dd>
        </dl>
      </header>

      <section aria-labelledby="about-heading" className="max-w-prose">
        <h2 id="about-heading" className="mb-2 text-xl font-semibold">
          About
        </h2>
        <p className="whitespace-pre-line text-stone-700 dark:text-stone-300">
          {event.description}
        </p>
      </section>

      <section aria-labelledby="tickets-heading">
        <h2 id="tickets-heading" className="mb-3 text-xl font-semibold">
          Tickets
        </h2>
        <TicketTypeList ticketTypes={ticketTypes} timeZone={event.timezone} />
      </section>
    </article>
  );
}
