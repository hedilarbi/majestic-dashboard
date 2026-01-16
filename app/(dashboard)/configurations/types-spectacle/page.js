import TypesSpectacleClient from "./types-spectacle-client";
import { getShowTypes } from "@/services/show-types";

export default async function TypesSpectaclePage() {
  const { items, error } = await getShowTypes();

  return (
    <TypesSpectacleClient initialShowTypes={items} initialError={error} />
  );
}
