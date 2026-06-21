import { emptyOptionsResponse, jsonResponse, workflowModule } from "./_edge-runtime.js";

export function onRequestOptions() {
  return emptyOptionsResponse();
}

export async function onRequestGet(context) {
  const { workflowStatus } = await workflowModule(context);
  return jsonResponse(await workflowStatus());
}
