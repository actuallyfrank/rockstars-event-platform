import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EventDetail } from "@/components/catalog/event-detail";
import { getDb } from "@/db/client";
import { getListedEventBySlug } from "@/lib/catalog/queries";

/** The listed event for a slug at request time, cached for at most 60 seconds. */
async function getCachedListedEvent(slug: string) {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 60 });

  const now = new Date();
  return getListedEventBySlug(getDb(), slug, now);
}

export async function generateMetadata({
  params,
}: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const listed = await getCachedListedEvent(slug);
  return listed
    ? { title: listed.event.title, description: listed.event.description }
    : { title: "Event not found" };
}

export default function EventPage({ params }: PageProps<"/events/[slug]">) {
  return (
    <>
      <Link
        href="/events"
        className="mb-6 inline-block text-sm text-stone-600 hover:underline dark:text-stone-400"
      >
        ← All events
      </Link>
      <Suspense fallback={<p className="text-stone-500">Loading event…</p>}>
        <EventDetailLoader params={params} />
      </Suspense>
    </>
  );
}

async function EventDetailLoader({
  params,
}: {
  params: PageProps<"/events/[slug]">["params"];
}) {
  const { slug } = await params;
  const listed = await getCachedListedEvent(slug);
  // Unknown and hidden events get the same not-found page. Next.js 16 has
  // already started streaming here, so this is a soft 404 (status 200 +
  // noindex); see design.md.
  if (!listed) notFound();
  return <EventDetail listed={listed} />;
}
