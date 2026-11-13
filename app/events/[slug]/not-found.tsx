import Link from "next/link";

export default function EventNotFound() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Event not found</h1>
      <p className="text-stone-600 dark:text-stone-400">
        This event doesn&apos;t exist or is no longer available.
      </p>
      <Link href="/events" className="font-medium underline">
        See upcoming events
      </Link>
    </div>
  );
}
