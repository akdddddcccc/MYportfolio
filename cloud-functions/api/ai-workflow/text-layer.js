import { emptyOptionsResponse, jsonResponse, workflowModule } from "./_edge-runtime.js";

export function onRequestOptions() {
  return emptyOptionsResponse();
}

export async function onRequestPost(context) {
  const { handleTextLayer } = await workflowModule(context);
  const body = await context.request.json();
  return jsonResponse(await handleTextLayer(body));
}
