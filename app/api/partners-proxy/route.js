import { proxyPartnersRequest } from "./proxy";

export async function GET(request) {
  return proxyPartnersRequest(request, null, "GET");
}

export async function POST(request) {
  return proxyPartnersRequest(request, null, "POST");
}
