export default {
  expo: {
    extra: {
      eas: {
        projectId: "76e29ac8-6bf3-42fd-ae6b-ccf402bbe94a",
      },
    },
    owner: "kinra23",
    slug: "carbotrackr-watchtest",
    name: "CarboTrackr",
    android: {
      package: "com.kinra23.carbotrackrwatchtest",
    },
    ios: {
      bundleIdentifier: "com.kinra23.carbotrackrwatchtest",
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
      [
        "react-native-health-connect",
        {
          permissions: [
            "android.permission.health.READ_STEPS",
            "android.permission.health.READ_HEART_RATE",
            "android.permission.health.WRITE_STEPS",
            "android.permission.health.WRITE_HEART_RATE",
          ],
        },
      ],
      ["expo-health-connect"],
    ],
  },
};
