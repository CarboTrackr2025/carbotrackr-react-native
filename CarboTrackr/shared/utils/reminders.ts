import { Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Notifications from "expo-notifications"

const REMINDER_IDS_KEY = "health_reminder_notification_ids"
const REMINDER_CHANNEL_ID = "health-reminders"

type ReminderScheduleInput = {
    frequency: number | null | undefined
    timeOfDay: string | null | undefined
    title?: string
    body?: string
}

type ReminderScheduleResult = {
    scheduled: number
    permission: "granted" | "denied" | "skipped"
}

const parseTimeOfDay = (
    value: string | null | undefined
): { hour: number; minute: number } | null => {
    if (typeof value !== "string") return null
    const trimmed = value.trim()
    if (!trimmed) return null

    const match = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/.exec(trimmed)
    if (!match) return null

    const hour = Number(match[1])
    const minute = Number(match[2])

    if (
        !Number.isInteger(hour) ||
        !Number.isInteger(minute) ||
        hour < 0 ||
        hour > 23 ||
        minute < 0 ||
        minute > 59
    ) {
        return null
    }

    return { hour, minute }
}

const computeIntervalTimes = (
    frequency: number,
    base: { hour: number; minute: number },
    intervalMinutes: number
) => {
    const times: Array<{ hour: number; minute: number }> = []
    const baseMinutes = base.hour * 60 + base.minute

    for (let i = 0; i < frequency; i += 1) {
        const totalMinutes = baseMinutes + i * intervalMinutes
        const minuteOfDay = ((totalMinutes % 1440) + 1440) % 1440
        times.push({
            hour: Math.floor(minuteOfDay / 60),
            minute: minuteOfDay % 60,
        })
    }

    return times
}

const ensurePermissions = async (): Promise<boolean> => {
    const existing = await Notifications.getPermissionsAsync()
    if (existing.status === "granted") return true

    const requested = await Notifications.requestPermissionsAsync()
    return requested.status === "granted"
}

const ensureAndroidChannel = async () => {
    if (Platform.OS !== "android") return

    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
        name: "Health reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
    })
}

export async function cancelHealthReminders() {
    const stored = await AsyncStorage.getItem(REMINDER_IDS_KEY)
    if (!stored) return

    try {
        const ids = JSON.parse(stored) as string[]
        await Promise.all(
            ids.map((id) =>
                Notifications.cancelScheduledNotificationAsync(id).catch(() => null)
            )
        )
    } catch {
        // Ignore corrupt data and clear it below.
    } finally {
        await AsyncStorage.removeItem(REMINDER_IDS_KEY)
    }
}

export async function scheduleHealthReminders(
    input: ReminderScheduleInput
): Promise<ReminderScheduleResult> {
    await cancelHealthReminders()

    const frequency = Number(input.frequency)
    if (!Number.isInteger(frequency) || frequency <= 0) {
        return { scheduled: 0, permission: "skipped" }
    }

    const base = parseTimeOfDay(input.timeOfDay)
    if (!base) return { scheduled: 0, permission: "skipped" }

    const hasPermission = await ensurePermissions()
    if (!hasPermission) return { scheduled: 0, permission: "denied" }

    await ensureAndroidChannel()

    const times = computeIntervalTimes(frequency, base, 2)
    const ids: string[] = []

    for (const time of times) {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: input.title ?? "CarboTrackr Reminder",
                body: input.body ?? "Time to log your meals and health data.",
                sound: "default",
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: time.hour,
                minute: time.minute,
                channelId: REMINDER_CHANNEL_ID,
            },
        })
        ids.push(id)
    }

    await AsyncStorage.setItem(REMINDER_IDS_KEY, JSON.stringify(ids))

    return { scheduled: ids.length, permission: "granted" }
}
