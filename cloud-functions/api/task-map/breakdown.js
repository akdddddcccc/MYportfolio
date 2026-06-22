import { emptyOptionsResponse, jsonResponse, workflowModule } from "../ai-workflow/_edge-runtime.js";

export function onRequestOptions() {
  return emptyOptionsResponse();
}

export async function onRequestPost(context) {
  const { handleTaskMapBreakdown } = await workflowModule(context);
  const body = await context.request.json();
  return jsonResponse(await handleTaskMapBreakdown(body));
}
