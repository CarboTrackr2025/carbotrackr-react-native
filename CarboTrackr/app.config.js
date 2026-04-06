export default {
  expo: {
    extra: {
      eas: {
        projectId: "d9a9f624-620e-4ee9-a738-5b1185411db6",
      },
    },
    owner: "athaina-carbotrackr-devs",
    slug: "CarboTrackr",
    name: "CarboTrackr",
    scheme: "carbotrackr",
    android: {
      package: "com.athaina.carbotrackr",
      permissions: [
        "android.permission.health.READ_STEPS",
        "android.permission.health.READ_HEART_RATE",
        "android.permission.health.WRITE_STEPS",
        "android.permission.health.WRITE_HEART_RATE",
         "android.permission.health.READ_TOTAL_CALORIES_BURNED",
         "android.permission.health.WRITE_TOTAL_CALORIES_BURNED",
      ]
    },
    ios: {
      bundleIdentifier: "com.athaina.carbotrackr",
    },
    plugins: [
      [
        "expo-build-properties",
        {
          android: {
            minSdkVersion: 26,
            targetSdkVersion: 35,
            compileSdkVersion: 36,
            buildToolsVersion: "35.0.0",
            kotlinVersion: "2.0.21",
          },
          ios: {
            deploymentTarget: "15.1",
          },
        },
      ],
      // Per react-native-health-connect docs (Expo installation)
      [
        "expo-health-connect",
        {
          rationale:
            "We need access to your health data to track steps and heart rate.",
          permissions: ["Steps", "HeartRate"],
        },
      ],
        [
            "expo-secure-store",
        ]
    ],
  },
};
