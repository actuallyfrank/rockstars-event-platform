import Image from "next/image";
import Link from "next/link";
import type { ListedEvent } from "@/lib/catalog/queries";
import { DateTime } from "./date-time";
import { TicketSummary } from "./ticket-summary";

export function EventCard({ listed }: { listed: ListedEvent }) {
  const { event, summary } = listed;
  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md dark:border-stone-800 dark:bg-stone-900">
      {event.imageUrl ? (
        <div className="relative aspect-video bg-stone-100 dark:bg-stone-800">
          <Image
            src={event.imageUrl}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="text-lg font-semibold">
          <Link
            href={`/events/${event.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-stone-900 dark:focus-visible:after:ring-stone-100"
          >
            {event.title}
          </Link>
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          <DateTime value={event.startsAt} timeZone={event.timezone} />
        </p>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {event.venueName}
        </p>
        <div className="mt-auto pt-2">
          <TicketSummary summary={summary} timeZone={event.timezone} />
        </div>
      </div>
    </article>
  );
}
