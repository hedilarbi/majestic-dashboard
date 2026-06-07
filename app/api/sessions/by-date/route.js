import { NextResponse } from "next/server";
import { getAuthContext } from "@/services/api";

export async function GET(request) {
  const auth = await getAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ message: "date requis" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${auth.baseUrl}/sessions/by-date?date=${encodeURIComponent(date)}`,
      {
        headers: { Authorization: `Bearer ${auth.token}`, Accept: "application/json" },
        cache: "no-store",
      },
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ groups: [], message: data?.message }, { status: response.status });
    }

    // Extract flat list of occupied sessionTimes from grouped response
    const groups = Array.isArray(data) ? data : (Array.isArray(data?.groups) ? data.groups : []);
    const occupiedTimes = new Set();
    groups.forEach((group) => {
      (group.sessions || []).forEach((s) => {
        if (s.sessionTime) occupiedTimes.add(s.sessionTime);
      });
    });

    return NextResponse.json({ occupiedTimes: Array.from(occupiedTimes) });
  } catch {
    return NextResponse.json({ occupiedTimes: [] }, { status: 500 });
  }
}
