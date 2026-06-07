import { proxyPartnersRequest } from "../proxy";

export async function GET(request, { params }) {
  return proxyPartnersRequest(request, params, "GET");
}

export async function POST(request, { params }) {
  return proxyPartnersRequest(request, params, "POST");
}

export async function PUT(request, { params }) {
  return proxyPartnersRequest(request, params, "PUT");
}

export async function DELETE(request, { params }) {
  return proxyPartnersRequest(request, params, "DELETE");
}
