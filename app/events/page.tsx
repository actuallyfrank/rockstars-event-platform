import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { connection } from "next/server";
import { Suspense } from "react";
import { EventList } from "@/components/catalog/event-list";
import { getDb } from "@/db/client";
import { listEvents } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Upcoming events" };

export default function EventsPage() {
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">
        Upcoming events
      </h1>
      <Suspense fallback={<p className="text-stone-500">Loading events…</p>}>
        <CatalogEventList />
      </Suspense>
    </>
  );
}

async function CatalogEventList() {
  // Never read the database at build time: the catalog depends on `now`.
  await connection();
  return <CachedCatalogEventList />;
}

async function CachedCatalogEventList() {
  "use cache";
  // Cache window: content is at most 60 seconds old.
  cacheLife({ stale: 30, revalidate: 30, expire: 60 });

  const now = new Date();
  const events = await listEvents(getDb(), now);
  return <EventList events={events} />;
}
