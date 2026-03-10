import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="add-blood-pressure"
        options={{ headerShown: true, title: "Measure Blood Pressure" }}
      />
      <Stack.Screen name="blood-glucose" options={{ headerShown: false }} />
      <Stack.Screen
        name="add-blood-glucose"
        options={{ headerShown: true, title: "Measure Blood Glucose" }}
      />
    </Stack>
  );
}
