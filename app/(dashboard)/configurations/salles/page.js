import SallesClient from "./salles-client";
import { getRooms } from "@/services/rooms";
import { getPricing } from "@/services/pricing";

export default async function SallesPage() {
  const [roomsResult, pricingResult] = await Promise.all([
    getRooms(),
    getPricing(),
  ]);

  return (
    <SallesClient
      initialRooms={roomsResult.items}
      initialPricing={pricingResult.items}
      roomsError={roomsResult.error}
      pricingError={pricingResult.error}
    />
  );
}
