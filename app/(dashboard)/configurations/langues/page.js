import LanguesClient from "./langues-client";
import { getLanguages } from "@/services/languages";

export default async function LanguesPage() {
  const { items, error } = await getLanguages();

  return <LanguesClient initialLanguages={items} initialError={error} />;
}
