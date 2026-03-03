import React, {useEffect, useState} from "react"
import {ActivityIndicator, StyleSheet, View, Alert} from "react-native"
import {StatusBar} from "expo-status-bar"
import AccountSettingsForm from "../../../features/settings/components/AccountSettingsForm"
import {getAccountSettings} from "../../../features/settings/api/get-account-settings"
import {putAccountSettings} from "../../../features/settings/api/put-account-settings"
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

type SaveAccountSettingsInput = {
    gender: "MALE" | "FEMALE" | null
    date_of_birth: string | null
    height_cm: number | null
    weight_kg: number | null
}


export default function AccountSettingsScreen() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [initialValues, setInitialValues] = useState<AccountSettingsState>(EMPTY_SETTINGS)
    const [reloadKey, setReloadKey] = useState(0)

    const handleSave = async (values: SaveAccountSettingsInput) => {
        try {
            setSaving(true)

            await putAccountSettings({
                account_id: MOCK_PROFILE_ID,
                gender: values.gender,
                date_of_birth: values.date_of_birth,
                height_cm: values.height_cm,
                weight_kg: values.weight_kg,
            })

            Alert.alert("Success", "Account settings updated.")
            setReloadKey((current) => current + 1)
        } catch (err) {
            console.log(err)
            Alert.alert("Error", "Failed to update account settings.")
        } finally {
            setSaving(false)
        }
    }


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
            <AccountSettingsForm
                initialValues={initialValues}
                onSave={handleSave}
                saving={saving}
            />
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