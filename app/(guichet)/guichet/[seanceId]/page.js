import GuichetSeanceClient from "@/components/guichet/GuichetSeanceClient";

export default async function GuichetSeancePage({ params }) {
  const { seanceId } = (await params) || {};
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "") || "";

  return <GuichetSeanceClient seanceId={seanceId} socketUrl={socketUrl} />;
}
