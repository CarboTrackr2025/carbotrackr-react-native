import React, {useEffect, useState} from "react"
import {ActivityIndicator, StyleSheet, View} from "react-native"
import {StatusBar} from "expo-status-bar"
import AccountSettingsForm from "../../../features/settings/components/AccountSettingsForm"
import {getAccountSettings} from "../../../features/settings/api/get-account-settings"

const MOCK_PROFILE_ID = "a4c06ef4-6d62-4b7f-8d8c-9344f65bf577"

type AccountSettingsState = {
    email: string
    gender: string | number | null
    date_of_birth: string | null
    height_cm: number | null
    weight_kg: number | null
}

const EMPTY_SETTINGS: AccountSettingsState = {
    email: "",
    gender: null,
    date_of_birth: null,
    height_cm: null,
    weight_kg: null,
}

export default function AccountSettingsScreen() {
    const [loading, setLoading] = useState(true)
    const [initialValues, setInitialValues] = useState<AccountSettingsState>(EMPTY_SETTINGS)

    useEffect(() => {
        let mounted = true

        async function run() {
            try {
                setLoading(true)

                const {data} = await getAccountSettings(MOCK_PROFILE_ID)

                if (!mounted) return
                setInitialValues(data)
            } catch (err) {
                console.log(err)
            } finally {
                if (!mounted) return
                setLoading(false)
            }
        }

        run()

        return () => {
            mounted = false
        }
    }, [])

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator />
                <StatusBar style="auto" />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <AccountSettingsForm initialValues={initialValues} />
            <StatusBar style="auto" />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 12,
    },
    loaderContainer: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
})