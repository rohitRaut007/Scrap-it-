import { Stack } from "expo-router";

export default function AppGroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="pickup/index" options={{ presentation: "modal" }} />
      <Stack.Screen name="order/[id]" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="saved-addresses" />
    </Stack>
  );
}
