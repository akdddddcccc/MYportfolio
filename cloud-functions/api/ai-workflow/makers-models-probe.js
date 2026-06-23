import { emptyOptionsResponse, jsonResponse, workflowModule } from "./_edge-runtime.js";

export function onRequestOptions() {
  return emptyOptionsResponse();
}

export async function onRequestPost(context) {
  try {
    const { handleMakersModelsProbe } = await workflowModule(context);
    const body = await context.request.json();
    const data = await handleMakersModelsProbe(body);
    return jsonResponse(data, data.ok ? 200 : 400);
  } catch (error) {
    return jsonResponse({
      ok: false,
      code: "makers_models_probe_failed",
      message: error?.message || "Makers Models probe failed"
    }, error?.status || 500);
  }
}
