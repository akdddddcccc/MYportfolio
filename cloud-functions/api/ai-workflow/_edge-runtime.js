function applyContextEnv(env = {}) {
  Object.entries(env).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    process.env[key] = String(value);
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

function emptyOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

async function workflowModule(context) {
  applyContextEnv(context.env);
  return import("../../../scripts/ai-workflow-server.mjs");
}

export { emptyOptionsResponse, jsonResponse, workflowModule };
