import { Alert, Linking } from "react-native";

/** In-app help contact; opens default mail client when available. */
export const SUPPORT_MAILTO =
  "mailto:support@scrap-it.app?subject=Scrap-it%20help";

export async function openSupportContact(): Promise<void> {
  try {
    const can = await Linking.canOpenURL(SUPPORT_MAILTO);
    if (can) {
      await Linking.openURL(SUPPORT_MAILTO);
      return;
    }
  } catch {
    // fall through to alert
  }
  Alert.alert(
    "Help & support",
    "Email us at support@scrap-it.app and we'll get back to you.",
    [{ text: "OK" }],
  );
}
