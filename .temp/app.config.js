export default {
  expo: {
    extra: {
      eas: {
        projectId: "b93d7a65-e09c-47a7-8b1b-2c40c8367202",
      },
    },
    owner: "3envees-inc",
    slug: "carbotrackrtester",
    name: "CarboTrackr",
    android: {
      package: "com.kinra23.carbotrackrtester",
    },
    ios: {
      bundleIdentifier: "com.kinra23.carbotrackrtester",
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
