import { formatDateTime } from "@/lib/catalog/format";

/** An instant shown in the given (event) timezone. */
export function DateTime({
  value,
  timeZone,
}: {
  value: Date;
  timeZone: string;
}) {
  return (
    <time dateTime={value.toISOString()}>
      {formatDateTime(value, timeZone)}
    </time>
  );
}
