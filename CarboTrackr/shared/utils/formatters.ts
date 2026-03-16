// Formatters (like transforming dates, numbers, etc.)
type TimestampLike = string | number | Date | null | undefined;
type TimeOfDayLike = string | null | undefined;

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

const pad2 = (value: number) => String(value).padStart(2, "0");

export function formatPhilippinesTimeOfDay(value: TimeOfDayLike): string {
    if (typeof value !== "string") return "-";
    const trimmed = value.trim();
    if (!trimmed) return "-";

    const match = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/.exec(trimmed);
    if (!match) return "-";

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = match[3] ? Number(match[3]) : 0;
    const ms = match[4] ? match[4].slice(0, 3).padEnd(3, "0") : "000";

    if (
        !Number.isInteger(hour) ||
        !Number.isInteger(minute) ||
        !Number.isInteger(second) ||
        hour < 0 ||
        hour > 23 ||
        minute < 0 ||
        minute > 59 ||
        second < 0 ||
        second > 59
    ) {
        return "-";
    }

    const hour12 = hour % 12 || 12;
    const suffix = hour < 12 ? "AM" : "PM";
    const timePart = `${hour12}:${pad2(minute)} ${suffix}`;

    return `${timePart} (PHT)`;
}

export function parseTimeOfDayToDate(value: TimeOfDayLike): Date | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    const match = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/.exec(trimmed);
    if (!match) return null;

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = match[3] ? Number(match[3]) : 0;
    const ms = match[4] ? Number(match[4].slice(0, 3).padEnd(3, "0")) : 0;

    if (
        !Number.isInteger(hour) ||
        !Number.isInteger(minute) ||
        !Number.isInteger(second) ||
        hour < 0 ||
        hour > 23 ||
        minute < 0 ||
        minute > 59 ||
        second < 0 ||
        second > 59
    ) {
        return null;
    }

    const date = new Date();
    date.setHours(hour, minute, second, ms);
    if (Number.isNaN(date.getTime())) return null;

    return date;
}

export function formatTimeOfDayForApi(value: Date | null | undefined): string | null {
    if (!value || Number.isNaN(value.getTime())) return null;
    const hh = pad2(value.getHours());
    const min = pad2(value.getMinutes());
    const ss = pad2(value.getSeconds());
    const fraction = String(value.getMilliseconds() * 100).padStart(5, "0");
    return `${hh}:${min}:${ss}.${fraction}`;
}

