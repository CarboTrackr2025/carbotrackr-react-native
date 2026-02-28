// Formatters (like transforming dates, numbers, etc.)
type TimestampLike = string | number | Date | null | undefined;

type RecordedDateTimeProps = {
    timestamp: TimestampLike;
    label?: string;
};

export function formatPhilippinesTime(
    value: Exclude<TimestampLike, null | undefined>,
): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    const datePart = new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "short",
        day: "2-digit",
    }).format(date);

    const timePart = new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).format(date);

    return `${datePart}, ${timePart} (PHT)`;
}

