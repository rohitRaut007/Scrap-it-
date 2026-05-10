import { useLocalSearchParams } from "expo-router";
import { AddressFormScreen } from "@/features/profile/address-form-screen";

export default function EditAddressRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AddressFormScreen addressId={id} />;
}
