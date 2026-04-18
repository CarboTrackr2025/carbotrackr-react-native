export function formatDateLabel(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    })
}

export function formatTimeLabel(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    })
}