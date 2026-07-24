import OpenAI from "openai";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const response = (data, status = 200) => Response.json(data, { status, headers: cors });

export function onRequestOptions() { return new Response(null, { status: 204, headers: cors }); }

export async function onRequestPost(context) {
  const key = context.env?.QWEN_SHADER_COPILOT_API_KEY;
  const baseURL = context.env?.QWEN_SHADER_COPILOT_BASE_URL;
  if (!key || !baseURL) return response({ message: "Qwen Vision is not configured for this preview." }, 503);
  try {
    const { imageDataUrl, lang = "zh" } = await context.request.json();
    if (typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) return response({ message: "An image data URL is required." }, 400);
    if (imageDataUrl.length > 5_000_000) return response({ message: "Please upload an image under 3 MB." }, 413);
    const client = new OpenAI({ apiKey: key, baseURL, timeout: 60_000, maxRetries: 0 });
    const completion = await client.chat.completions.create({
      model: context.env?.QWEN_SHADER_COPILOT_MODEL || "qwen3-vl-plus",
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: "You are a CMF and Blender PBR material analyst. Return only valid JSON." }, { role: "user", content: [{ type: "text", text: `Analyse this reference image. Identify its distinct visible materials, including emissive or translucent parts. Return JSON in this exact form: {\"materials\":[{\"id\":\"short-id\",\"name\":\"${lang === "zh" ? "Chinese material name" : "English material name"}\",\"region\":\"image region\",\"finish\":\"short finish description\",\"baseColor\":\"#RRGGBB\",\"metallic\":0-1,\"roughness\":0-1,\"transmission\":0-1,\"ior\":1.45,\"emissionColor\":\"#RRGGBB\",\"emissionStrength\":0-5,\"confidence\":0-1,\"reasoning\":\"short visual evidence\"}]}. Include 3 to 8 materials. Do not claim manufacturing specifications not visible in the image.` }, { type: "image_url", image_url: { url: imageDataUrl } }] }]
    });
    const parsed = JSON.parse(completion.choices?.[0]?.message?.content || "{}");
    const materials = Array.isArray(parsed.materials) ? parsed.materials.slice(0, 8).map((m, index) => ({
      id: String(m.id || `material-${index + 1}`).replace(/[^a-z0-9-_]/gi, "-"), name: String(m.name || `Material ${index + 1}`), region: String(m.region || "Visible surface"), finish: String(m.finish || "PBR estimate"), baseColor: /^#[0-9a-f]{6}$/i.test(m.baseColor) ? m.baseColor : "#808080", metallic: clamp(m.metallic), roughness: clamp(m.roughness), transmission: clamp(m.transmission), ior: clamp(m.ior, 1, 2.5, 1.45), emissionColor: /^#[0-9a-f]{6}$/i.test(m.emissionColor) ? m.emissionColor : "#000000", emissionStrength: clamp(m.emissionStrength, 0, 5), confidence: clamp(m.confidence), reasoning: String(m.reasoning || "Visual estimate")
    })) : [];
    if (!materials.length) return response({ message: "Vision returned no usable material data." }, 502);
    return response({ materials });
  } catch (error) { return response({ message: error?.message || "Vision request failed." }, 502); }
}

function clamp(value, min = 0, max = 1, fallback = 0) { const number = Number(value); return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback; }
