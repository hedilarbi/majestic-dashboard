import GuichetSeanceClient from "@/components/guichet/GuichetSeanceClient";

export default async function GuichetSeancePage({ params }) {
  const { seanceId } = (await params) || {};
  const socketUrl = process.env.BASE_URL?.replace(/\/$/, "") || "";

  return <GuichetSeanceClient seanceId={seanceId} socketUrl={socketUrl} />;
}
