import CodesPromoClient from "./codes-promo-client";
import { getPromoCodes } from "@/services/promo-codes";

export default async function CodesPromoPage() {
  const { items, error } = await getPromoCodes();

  return <CodesPromoClient initialPromoCodes={items} initialError={error} />;
}
