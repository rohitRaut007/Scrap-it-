import { useLocalSearchParams } from "expo-router";
import { OrderDetailScreen } from "@/features/orders/order-detail-screen";

export default function OrderDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const orderId = Array.isArray(id) ? id[0] : id;
  if (!orderId) {
    return null;
  }
  return <OrderDetailScreen orderId={orderId} />;
}
