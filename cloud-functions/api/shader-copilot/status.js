export function onRequestOptions() { return new Response(null, { status: 204, headers: cors }); }

export function onRequestGet(context) {
  const configured = Boolean(context.env?.QWEN_SHADER_COPILOT_API_KEY && context.env?.QWEN_SHADER_COPILOT_BASE_URL);
  return Response.json({ qwen: { configured, model: context.env?.QWEN_SHADER_COPILOT_MODEL || "qwen3-vl-plus" } }, { headers: cors });
}

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
