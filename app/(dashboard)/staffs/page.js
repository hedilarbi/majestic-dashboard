import StaffsClient from "./staffs-client";
import { getStaffs } from "@/services/staffs";

export default async function StaffsPage() {
  const { items, error } = await getStaffs();

  return <StaffsClient initialStaffs={items} initialError={error} />;
}
