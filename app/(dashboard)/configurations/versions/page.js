import VersionsClient from "./versions-client";
import { getVersions } from "@/services/versions";

export default async function VersionsPage() {
  const { items, error } = await getVersions();

  return <VersionsClient initialVersions={items} initialError={error} />;
}
