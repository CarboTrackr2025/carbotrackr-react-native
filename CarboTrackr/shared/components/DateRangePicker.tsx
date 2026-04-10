import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { color, gradient } from '../constants/colors';

type Props = {
    startDate: Date;
    endDate: Date;
    onChange: (start: Date, end: Date) => void;
};

type Which = 'start' | 'end';
const INPUT_BORDER_WIDTH = 2.5;

const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const endOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

export default function DateRangePicker({ startDate, endDate, onChange }: Props) {
    const [openWhich, setOpenWhich] = useState<Which | null>(null);
    const focusedBorder = [color['light-green'], color['light-green']] as [string, string];

    const format = (d: Date) =>
        d.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
        });

    const today = useMemo(() => new Date(), []);

    const pickerDate = openWhich === 'start' ? startDate : endDate;

    // Min/Max constraints
    const minimumDate =
        openWhich === 'end' ? startDate : undefined;

    const maximumDate =
        openWhich === 'start'
            ? endDate
            : today;

    const closePicker = () => setOpenWhich(null);

    const onPicked = (event: DateTimePickerEvent, selected?: Date) => {
        // Android fires "dismissed" when user cancels
        if (event.type === 'dismissed') {
            closePicker();
            return;
        }

        const next = selected ?? pickerDate;

        if (openWhich === 'start') {
            // Ensure start <= end
            const nextStart = next;
            const nextEnd = nextStart > endDate ? nextStart : endDate;
            onChange(nextStart, nextEnd);
        } else if (openWhich === 'end') {
            // Ensure end >= start and end <= today
            let nextEnd = next;
            if (nextEnd < startDate) nextEnd = startDate;
            if (nextEnd > today) nextEnd = today;
            onChange(startDate, nextEnd);
        }

        // Android closes automatically after selection; iOS stays open so we keep it open until Done
        if (Platform.OS === 'android') closePicker();
    };

    return (
        <View style={styles.container}>
            {/* START */}
            <LinearGradient
                colors={openWhich === 'start' ? focusedBorder : (gradient.green as [string, string])}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.inputBorder}
            >
                <TouchableOpacity
                    style={styles.input}
                    onPress={() => setOpenWhich('start')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.label}>Start</Text>
                    <Text style={styles.value}>{format(startDate)}</Text>
                </TouchableOpacity>
            </LinearGradient>

            {/* END */}
            <LinearGradient
                colors={openWhich === 'end' ? focusedBorder : (gradient.green as [string, string])}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.inputBorder}
            >
                <TouchableOpacity
                    style={styles.input}
                    onPress={() => setOpenWhich('end')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.label}>End</Text>
                    <Text style={styles.value}>{format(endDate)}</Text>
                </TouchableOpacity>
            </LinearGradient>

            {/* Picker UI */}
            {openWhich && (
                <View style={styles.pickerWrap}>
                    {/* iOS needs a Done button because it stays visible */}
                    {Platform.OS === 'ios' && (
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>
                                {openWhich === 'start' ? 'Select start date' : 'Select end date'}
                            </Text>
                            <TouchableOpacity onPress={closePicker} style={styles.doneBtn}>
                                <Text style={styles.doneText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <DateTimePicker
                        value={pickerDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onPicked}
                        minimumDate={minimumDate}
                        maximumDate={maximumDate}
                    />
                </View>
            )}
        </View>
    );
}

/* =======================
   Styles
======================= */

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },

    inputBorder: {
        flex: 1,
        borderRadius: 10,
        padding: INPUT_BORDER_WIDTH,
    },

    input: {
        backgroundColor: color.white,
        borderRadius: 10 - INPUT_BORDER_WIDTH,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },

    label: {
        fontSize: 11,
        color: '#6B7280',
    },

    value: {
        fontSize: 14,
        fontWeight: '600',
        color: color.black,
        marginTop: 2,
    },

    // Inline picker container (shows below, spanning full width)
    pickerWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 58, // sits just below the inputs; adjust if needed
        backgroundColor: color.white,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 10,
        zIndex: 10,
    },

    pickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },

    pickerTitle: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },

    doneBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },

    doneText: {
        fontSize: 12,
        color: color.black,
        fontWeight: '600',
    },
});
