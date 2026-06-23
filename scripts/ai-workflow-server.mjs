import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { deflateSync, inflateSync } from "node:zlib";
import OpenAI from "openai";

const PORT = Number(process.env.AI_WORKFLOW_PORT || 8787);
const LEGACY_IMAGE_API_KEY = process.env.OPENAI_API_KEY || "";
const LEGACY_IMAGE_BASE_URL = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
const LEGACY_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "";
const requestedImageProvider = (process.env.STICKER_IMAGE_PROVIDER || "ofox").toLowerCase();
const STICKER_IMAGE_PROVIDER = ["openai", "official", "openai-official"].includes(requestedImageProvider)
  ? "openai"
  : "ofox";
const legacyProvider = LEGACY_IMAGE_BASE_URL.includes("api.ofox.io") ? "ofox" : "openai";
const envFlag = (name, fallback) => process.env[name] === undefined
  ? fallback
  : process.env[name] === "1";
// A missing or literal "auto" edit-size means "use the requested per-sticker size".
// Any explicit value (e.g. "1536x1024") is preserved verbatim.
const normalizeEditSizeEnv = (value) => {
  const trimmed = String(value ?? "").trim();
  return trimmed.toLowerCase() === "auto" ? "" : trimmed;
};
const imageProviderAdapters = {
  ofox: {
    id: "ofox",
    label: "OFOX",
    keyName: "OFOX_API_KEY",
    apiKey: process.env.OFOX_API_KEY || (legacyProvider === "ofox" ? LEGACY_IMAGE_API_KEY : ""),
    baseUrl: (process.env.OFOX_BASE_URL || "https://api.ofox.io/v1").replace(/\/+$/, ""),
    model: process.env.OFOX_IMAGE_MODEL || (legacyProvider === "ofox" && LEGACY_IMAGE_MODEL) || "openai/gpt-image-2",
    quality: process.env.OFOX_IMAGE_QUALITY || process.env.OPENAI_IMAGE_QUALITY || "low",
    useImageEdits: envFlag("OFOX_IMAGE_USE_EDITS", true),
    editField: process.env.OFOX_IMAGE_EDIT_FIELD || "image",
    editSize: normalizeEditSizeEnv(process.env.OFOX_IMAGE_EDIT_SIZE),
    editFallbackSize: normalizeEditSizeEnv(process.env.OFOX_IMAGE_EDIT_FALLBACK_SIZE),
    includeEditExtras: envFlag("OFOX_IMAGE_EDIT_INCLUDE_EXTRAS", false),
    supportsGenerations: envFlag("OFOX_IMAGE_ALLOW_GENERATIONS", false)
  },
  openai: {
    id: "openai",
    label: "OpenAI Official",
    keyName: "OPENAI_OFFICIAL_API_KEY",
    apiKey: process.env.OPENAI_OFFICIAL_API_KEY || (legacyProvider === "openai" ? LEGACY_IMAGE_API_KEY : ""),
    baseUrl: (process.env.OPENAI_OFFICIAL_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, ""),
    model: process.env.OPENAI_OFFICIAL_IMAGE_MODEL || (legacyProvider === "openai" && LEGACY_IMAGE_MODEL) || "gpt-image-2",
    quality: process.env.OPENAI_OFFICIAL_IMAGE_QUALITY || process.env.OPENAI_IMAGE_QUALITY || "low",
    useImageEdits: envFlag("OPENAI_OFFICIAL_IMAGE_USE_EDITS", true),
    editField: process.env.OPENAI_OFFICIAL_IMAGE_EDIT_FIELD || "image",
    editSize: normalizeEditSizeEnv(process.env.OPENAI_OFFICIAL_IMAGE_EDIT_SIZE),
    editFallbackSize: normalizeEditSizeEnv(process.env.OPENAI_OFFICIAL_IMAGE_EDIT_FALLBACK_SIZE),
    includeEditExtras: envFlag("OPENAI_OFFICIAL_IMAGE_EDIT_INCLUDE_EXTRAS", true),
    supportsGenerations: true
  }
};
const IMAGE_PROVIDER = imageProviderAdapters[STICKER_IMAGE_PROVIDER];
const API_KEY = IMAGE_PROVIDER.apiKey;
const OPENAI_BASE_URL = IMAGE_PROVIDER.baseUrl;
const TASKMAP_PROVIDER = (process.env.TASKMAP_PROVIDER || "deepseek").toLowerCase();
const OPENAI_TASKMAP_API_KEY = process.env.OPENAI_TASKMAP_API_KEY || "";
const OPENAI_TASKMAP_BASE_URL = (process.env.OPENAI_TASKMAP_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
const OPENAI_TASKMAP_MODEL = process.env.OPENAI_TASKMAP_MODEL || "gpt-4.1-mini";
const DEEPSEEK_TASKMAP_API_KEY = process.env.DEEPSEEK_TASKMAP_API_KEY || process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_TASKMAP_BASE_URL = (process.env.DEEPSEEK_TASKMAP_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
const DEEPSEEK_TASKMAP_MODEL = process.env.DEEPSEEK_TASKMAP_MODEL || "deepseek-v4-flash";
const TASKMAP_DEMO_FALLBACK = process.env.TASKMAP_DEMO_FALLBACK === "1";
// Makers Models remains an isolated experiment. Do not route the frozen demo's
// OFOX, official OpenAI, or Task Map requests through it until image endpoints
// and multi-reference edits have been verified against the deployed gateway.
const MAKERS_MODELS_API_KEY = process.env.MAKERS_MODELS_API_KEY || "";
const MAKERS_MODELS_BASE_URL = (process.env.MAKERS_MODELS_BASE_URL || "").replace(/\/+$/, "");
const MAKERS_MODELS_TEXT_MODEL = process.env.MAKERS_MODELS_TEXT_MODEL || "@makers/deepseek-v4-flash";
const MAKERS_MODELS_IMAGE_MODEL = process.env.MAKERS_MODELS_IMAGE_MODEL || "";
const MAKERS_MODELS_ENABLE_IMAGE_PROBE = process.env.MAKERS_MODELS_ENABLE_IMAGE_PROBE === "1";
const MAKERS_MODELS_TIMEOUT_MS = Math.min(
  60000,
  Math.max(5000, Number(process.env.MAKERS_MODELS_TIMEOUT_MS || 30000) || 30000)
);
const IMAGE_MODEL = IMAGE_PROVIDER.model;
const IMAGE_QUALITY = IMAGE_PROVIDER.quality;
const USE_IMAGE_EDITS = IMAGE_PROVIDER.useImageEdits;
const DEFAULT_IMAGE_TIMEOUT_MS = 90000;
const MAX_IMAGE_TIMEOUT_MS = 90000;
const providerTimeoutValue = STICKER_IMAGE_PROVIDER === "ofox"
  ? process.env.OFOX_IMAGE_TIMEOUT_MS
  : process.env.OPENAI_OFFICIAL_IMAGE_TIMEOUT_MS;
const CONFIGURED_IMAGE_TIMEOUT_MS = Number(providerTimeoutValue || process.env.OPENAI_IMAGE_TIMEOUT_MS || DEFAULT_IMAGE_TIMEOUT_MS);
const IMAGE_TIMEOUT_MS = Number.isFinite(CONFIGURED_IMAGE_TIMEOUT_MS) && CONFIGURED_IMAGE_TIMEOUT_MS > 0
  ? Math.min(CONFIGURED_IMAGE_TIMEOUT_MS, MAX_IMAGE_TIMEOUT_MS)
  : DEFAULT_IMAGE_TIMEOUT_MS;
const IMAGE_TIMEOUT_CLAMPED = IMAGE_TIMEOUT_MS !== CONFIGURED_IMAGE_TIMEOUT_MS;
const IMAGE_EDIT_FIELD = IMAGE_PROVIDER.editField;
const IMAGE_EDIT_SIZE = IMAGE_PROVIDER.editSize;
const IMAGE_EDIT_FALLBACK_SIZE = IMAGE_PROVIDER.editFallbackSize;
const IMAGE_EDIT_INCLUDE_EXTRAS = IMAGE_PROVIDER.includeEditExtras;
const TEXT_LAYER_SIZE = process.env.OPENAI_TEXT_LAYER_SIZE || "1536x1024";
const configuredTextLayerFallbackSize = STICKER_IMAGE_PROVIDER === "ofox"
  ? normalizeEditSizeEnv(process.env.OFOX_TEXT_LAYER_EDIT_FALLBACK_SIZE)
  : normalizeEditSizeEnv(process.env.OPENAI_OFFICIAL_TEXT_LAYER_EDIT_FALLBACK_SIZE);
const TEXT_LAYER_EDIT_FALLBACK_SIZE = configuredTextLayerFallbackSize
  || IMAGE_EDIT_FALLBACK_SIZE
  || (STICKER_IMAGE_PROVIDER === "ofox" ? "1024x1024" : "");
const TEXT_LAYER_USE_API = process.env.OPENAI_TEXT_LAYER_USE_API !== "0";
const GENERATION_MODE = process.env.AI_WORKFLOW_GENERATION_MODE || "sequential";
const WORKFLOW_DOC_PATH = "/Users/eeo/Documents/直播间贴片自动化/直播间贴片生图工作流_主文档.md";
const RUNTIME_BUILD = "2026-06-22-provider-adapters-top-bottom-side-v1";
const openAiTaskMapClient = OPENAI_TASKMAP_API_KEY
  ? new OpenAI({
      apiKey: OPENAI_TASKMAP_API_KEY,
      baseURL: OPENAI_TASKMAP_BASE_URL
    })
  : null;
const deepSeekTaskMapClient = DEEPSEEK_TASKMAP_API_KEY
  ? new OpenAI({
      apiKey: DEEPSEEK_TASKMAP_API_KEY,
      baseURL: DEEPSEEK_TASKMAP_BASE_URL
    })
  : null;

function elapsedMs(startedAt) {
  return Math.max(0, Date.now() - startedAt);
}

function mimeForFormat(format) {
  const normalized = String(format || "").trim().toLowerCase();
  if (normalized === "jpeg" || normalized === "jpg") return "image/jpeg";
  if (normalized === "webp") return "image/webp";
  return "image/png";
}

const stickerSpecs = {
  top: {
    zhName: "上贴背景",
    enName: "Top background",
    size: "1536x1024",
    width: 1536,
    height: 1024,
    instruction: "生成直播间顶部横向贴片。顶部 35% 和左右边缘可有装饰、材质和光效，必须保留参考图的主色、饱和度、线条对比和深浅层次，不能泛白、雾化或褪色；只有底边 25% 可以自然过渡到中性纯白或近白背景。若存在聚焦感，视觉轻微向下汇聚，但不要形成明确主体或海报中心。"
  },
  side: {
    zhName: "侧贴背景",
    enName: "Side background",
    size: "1024x1536",
    width: 1024,
    height: 1536,
    instruction: "生成直播间侧边竖向窄幅贴片。装饰集中在左上角、上沿或外侧边缘，装饰线条必须保留参考图主色、饱和度和深浅对比，不能整体变淡；大部分区域保持素净、透气，不抢直播主体和商品。不要强纵深、不要中心主体、不要密集信息排版。严禁密铺、平铺、网格式重复、花纹重复、连续小图案、壁纸纹样或满版装饰；侧贴必须像一条留白充足的边缘贴片，而不是 pattern tile。"
  },
  bottom: {
    zhName: "下贴背景",
    enName: "Bottom background",
    size: "1536x1024",
    width: 1536,
    height: 1024,
    instruction: "生成直播间底部横向贴片。下沿 35% 可承载主要装饰、材质和光效，必须保留参考图的主色、饱和度、线条对比和深浅关系，不能泛白、雾化或褪色；只有顶边 25% 可以自然过渡到中性纯白或近白背景。若存在聚焦感，视觉轻微向上汇聚，但不要形成明确主体或促销海报感。"
  }
};

const basePrompt = `根据当前唯一参考图生成直播间贴片背景底图。
只继承当前参考图的构图气质、色彩关系、材质、光效、边缘装饰密度和留白方式。
颜色锁定：装饰区域必须保持参考图主要颜色的饱和度、明度层次和深色线条对比，不能把彩色装饰整体洗成浅灰、浅粉、浅蓝或接近白色。
留白只发生在指定过渡边缘，不允许把整张贴片做成低饱和、雾化、褪色、奶白或半透明质感。
不要继承或生成文字、logo、二维码、价格标签、促销信息、人物、具体商品、海报排版、信息图结构。
将参考图中的主体转译为抽象背景语言，使画面适合叠加直播间内容。
整体干净、透气，过渡边缘自然，不抢直播主体。`;

const negativePrompt = `禁止生成：文字、logo、二维码、人物、具体商品、价格、优惠券、促销标签、按钮、信息图、海报模板、广告版式、月亮、天体、球体、强中心主体、强边框、深色压迫背景、过密装饰、脏灰底色、整图泛白、整图雾化、低饱和褪色、彩色线条变浅、装饰区域接近白色。`;

let workflowDocCache = null;

async function readWorkflowDoc() {
  if (workflowDocCache !== null) return workflowDocCache;
  try {
    workflowDocCache = await readFile(WORKFLOW_DOC_PATH, "utf8");
  } catch {
    workflowDocCache = "";
  }
  return workflowDocCache;
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  response.end(JSON.stringify(data));
}

async function readRequestJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function buildStickerPrompt(kind, userPrompt) {
  const spec = stickerSpecs[kind];
  return [
    basePrompt,
    "",
    spec.instruction,
    "",
    userPrompt ? `本轮用户补充要求：${userPrompt}` : "",
    "",
    "输出要求：只输出可叠加的背景素材，风格统一但构图不要三张完全重复。禁止把参考图做成平铺纹样或重复贴图。",
    negativePrompt
  ].filter(Boolean).join("\n");
}

function extensionForMime(mime) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "png";
}

function dataUrlToUploadFile(dataUrl, index) {
  if (!dataUrl || !dataUrl.startsWith("data:")) return null;
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1] || "image/png";
  const buffer = Buffer.from(match[2], "base64");
  const filename = `reference-${index + 1}.${extensionForMime(mime)}`;
  if (typeof File !== "undefined") {
    return new File([buffer], filename, { type: mime });
  }
  const blob = new Blob([buffer], { type: mime });
  blob.name = filename;
  return blob;
}

async function requestOpenAIImage({ prompt, size, referenceImage, referenceImages, editSize, outputFormat = "png", metrics, attemptLabel }) {
  const headers = { Authorization: `Bearer ${API_KEY}` };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
  const inputImages = Array.isArray(referenceImages) && referenceImages.length
    ? referenceImages
    : (referenceImage ? [referenceImage] : []);
  const startedAt = Date.now();
  const metric = {
    label: attemptLabel || (inputImages.length ? "image edit" : "image generation"),
    provider: IMAGE_PROVIDER.id,
    endpoint: inputImages.length ? "images/edits" : "images/generations",
    size: editSize || IMAGE_EDIT_SIZE || size,
    referenceCount: inputImages.length,
    ok: false
  };

  try {
    if (USE_IMAGE_EDITS && inputImages.length) {
      const imageFiles = inputImages.map((image, index) => dataUrlToUploadFile(image, index)).filter(Boolean);
      if (imageFiles.length) {
        const body = new FormData();
        body.append("model", IMAGE_MODEL);
        body.append("prompt", prompt);
        body.append("size", editSize || IMAGE_EDIT_SIZE || size);
        if (IMAGE_EDIT_INCLUDE_EXTRAS || IMAGE_PROVIDER.id === "openai") {
          body.append("quality", IMAGE_QUALITY);
        }
        body.append("output_format", outputFormat);
        imageFiles.forEach((imageFile, index) => {
          body.append(IMAGE_EDIT_FIELD, imageFile, imageFile.name || `reference-${index + 1}.png`);
        });
        const response = await fetch(`${OPENAI_BASE_URL}/images/edits`, {
          method: "POST",
          headers,
          body,
          signal: controller.signal
        });
        metric.status = response.status;
        const image = await parseOpenAIImageResponse(response, outputFormat);
        metric.ok = true;
        return image;
      }
    }

    if (!IMAGE_PROVIDER.supportsGenerations) {
      throw new Error(`${IMAGE_PROVIDER.label} adapter only enables reference-image editing. Configure a reference image or enable OFOX_IMAGE_ALLOW_GENERATIONS after verifying gateway support.`);
    }

    metric.endpoint = "images/generations";
    metric.size = size;
    metric.referenceCount = 0;
    const response = await fetch(`${OPENAI_BASE_URL}/images/generations`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt,
        size,
        quality: IMAGE_QUALITY,
        output_format: outputFormat
      }),
      signal: controller.signal
    });
    metric.status = response.status;
    const image = await parseOpenAIImageResponse(response, outputFormat);
    metric.ok = true;
    return image;
  } catch (error) {
    metric.error = error?.message || "Image request failed";
    if (error?.name === "AbortError") {
      const timeoutError = new Error(`Image request timed out after ${Math.round(IMAGE_TIMEOUT_MS / 1000)}s`);
      timeoutError.isTimeout = true;
      throw timeoutError;
    }
    throw error;
  } finally {
    metric.durationMs = elapsedMs(startedAt);
    metrics?.push(metric);
    clearTimeout(timeoutId);
  }
}

async function parseOpenAIImageResponse(response, requestedFormat) {
  const text = await response.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { error: { message: text } };
  }
  if (!response.ok) {
    const requestId = response.headers.get("x-request-id");
    const message = data?.error?.message || `OpenAI request failed with ${response.status}`;
    const error = new Error(requestId ? `${message} (request ${requestId})` : message);
    error.status = response.status;
    throw error;
  }
  const imageBase64 = data?.data?.[0]?.b64_json;
  const imageUrl = data?.data?.[0]?.url;
  if (imageUrl) return imageUrl;
  if (!imageBase64) throw new Error("OpenAI did not return image data.");
  const buffer = Buffer.from(imageBase64, "base64");
  const contentType = sniffImageMime(buffer) || mimeForFormat(requestedFormat);
  return `data:${contentType};base64,${imageBase64}`;
}

function isImageBillingLimitError(error) {
  return /spending limit|monthly limit|insufficient[_ ]quota|billing|额度|余额不足/i.test(String(error?.message || ""));
}

async function imageUrlToDataUrl(imageUrl) {
  if (!imageUrl || imageUrl.startsWith("data:")) return imageUrl;
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Generated image URL could not be read: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const headerType = (response.headers.get("content-type") || "").split(";")[0].trim();
  const contentType = sniffImageMime(buffer) || headerType || "image/png";
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

function sniffImageMime(buffer) {
  if (buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") return "image/png";
  if (buffer.subarray(0, 3).toString("hex") === "ffd8ff") return "image/jpeg";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return "";
}

function parsedImageBuffer(dataUrl) {
  const parsed = dataUrlToBuffer(dataUrl);
  if (!parsed) return null;
  return {
    ...parsed,
    mime: sniffImageMime(parsed.buffer) || parsed.mime
  };
}

function analyzePngSticker(dataUrl) {
  const parsed = parsedImageBuffer(dataUrl);
  if (!parsed || parsed.mime !== "image/png") return null;
  const { width, height, rgba } = decodePngToRgba(parsed.buffer);
  const total = width * height;
  let visible = 0;
  let meaningful = 0;
  let channelSpreadTotal = 0;

  for (let pixel = 0; pixel < total; pixel += 1) {
    const index = pixel * 4;
    const alpha = rgba[index + 3];
    if (alpha <= 12) continue;
    visible += 1;
    const red = rgba[index];
    const green = rgba[index + 1];
    const blue = rgba[index + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    channelSpreadTotal += max - min;
    if (min < 238 || max - min > 18) meaningful += 1;
  }

  const meaningfulRatio = visible ? meaningful / visible : 0;
  const averageSpread = visible ? channelSpreadTotal / visible : 0;
  return {
    width,
    height,
    mime: parsed.mime,
    visibleRatio: total ? visible / total : 0,
    meaningfulRatio,
    averageSpread
  };
}

function assertStickerImageNotBlank(dataUrl, kind) {
  const stats = analyzePngSticker(dataUrl);
  if (!stats) return;
  if (stats.visibleRatio < 0.08 || (stats.meaningfulRatio < 0.006 && stats.averageSpread < 2.2)) {
    throw new Error([
      `${stickerSpecs[kind]?.zhName || kind} returned a near-blank white image from the image gateway`,
      `size=${stats.width}x${stats.height}`,
      `meaningful=${stats.meaningfulRatio.toFixed(4)}`,
      `spread=${stats.averageSpread.toFixed(2)}`
    ].join(" "));
  }
}

function resizeCoverRgba(source, targetWidth, targetHeight) {
  const { width: sourceWidth, height: sourceHeight, rgba: sourceRgba } = source;
  const targetRgba = Buffer.alloc(targetWidth * targetHeight * 4);
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const scaledWidth = sourceWidth * scale;
  const scaledHeight = sourceHeight * scale;
  const offsetX = (scaledWidth - targetWidth) / 2;
  const offsetY = (scaledHeight - targetHeight) / 2;

  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = Math.min(sourceHeight - 1, Math.max(0, Math.round((y + offsetY) / scale)));
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(sourceWidth - 1, Math.max(0, Math.round((x + offsetX) / scale)));
      const sourceIndex = (sourceY * sourceWidth + sourceX) * 4;
      const targetIndex = (y * targetWidth + x) * 4;
      targetRgba[targetIndex] = sourceRgba[sourceIndex];
      targetRgba[targetIndex + 1] = sourceRgba[sourceIndex + 1];
      targetRgba[targetIndex + 2] = sourceRgba[sourceIndex + 2];
      targetRgba[targetIndex + 3] = sourceRgba[sourceIndex + 3];
    }
  }

  return {
    width: targetWidth,
    height: targetHeight,
    rgba: targetRgba
  };
}

function normalizeStickerImageSize(dataUrl, kind) {
  const parsed = parsedImageBuffer(dataUrl);
  const spec = stickerSpecs[kind];
  if (!parsed || parsed.mime !== "image/png" || !spec) return dataUrl;

  const png = decodePngToRgba(parsed.buffer);
  if (png.width === spec.width && png.height === spec.height) return dataUrl;

  const normalized = resizeCoverRgba(png, spec.width, spec.height);
  return `data:image/png;base64,${encodeRgbaToPng(normalized).toString("base64")}`;
}

async function requestCheckedStickerImage(kind, prompt, referenceImage, editSize, metrics, attemptLabel, outputFormat = "jpeg") {
  const image = await requestOpenAIImage({
    prompt,
    size: stickerSpecs[kind].size,
    referenceImage,
    editSize,
    outputFormat,
    metrics,
    attemptLabel
  });
  const postprocessStartedAt = Date.now();
  const metric = {
    label: `${attemptLabel || "image"} postprocess`,
    endpoint: "local/postprocess",
    size: stickerSpecs[kind].size,
    referenceCount: 0,
    ok: false
  };
  try {
    const dataUrl = await imageUrlToDataUrl(image);
    assertStickerImageNotBlank(dataUrl, kind);
    const normalized = normalizeStickerImageSize(dataUrl, kind);
    metric.ok = true;
    return normalized;
  } catch (error) {
    metric.error = error?.message || "Sticker postprocess failed";
    throw error;
  } finally {
    metric.durationMs = elapsedMs(postprocessStartedAt);
    metrics?.push(metric);
  }
}

async function requestStickerImage(kind, prompt, referenceImage) {
  const failedAttempts = [];
  const metrics = [];
  const tryAttempt = async (label, options = {}) => {
    const formats = options.outputFormat ? [options.outputFormat] : ["jpeg", "png"];
    for (const outputFormat of formats) {
      try {
        return await requestCheckedStickerImage(
          kind,
          options.prompt || prompt,
          options.referenceImage ?? referenceImage,
          options.editSize,
          metrics,
          `${label} ${outputFormat}`,
          outputFormat
        );
      } catch (error) {
        if (error?.isTimeout) throw error;
        if (isImageBillingLimitError(error)) {
          error.metrics = metrics;
          throw error;
        }
        failedAttempts.push(`${label} ${outputFormat}: ${error.message || "failed"}`);
      }
    }
    return "";
  };

  const directResult = await tryAttempt("reference edit");
  if (directResult) return { image: directResult, warning: "", metrics };

  // The requested edit size is the per-sticker spec unless an explicit env override is set.
  // top/bottom resolve to 1536x1024 landscape, side to 1024x1536 portrait.
  const requestedEditSize = IMAGE_EDIT_SIZE || stickerSpecs[kind].size;
  const compatibilityEditSize = IMAGE_EDIT_FALLBACK_SIZE || (IMAGE_PROVIDER.id === "ofox" ? "1024x1024" : "");
  if (USE_IMAGE_EDITS && referenceImage && compatibilityEditSize && requestedEditSize !== compatibilityEditSize) {
    // Compatibility fallback (e.g. a square 1024x1024 gateway size) is forced to PNG so the
    // postprocess step can decode and resize it back to the requested sticker ratio. A JPEG
    // fallback would skip normalizeStickerImageSize and leak a square asset (e.g. a square side).
    const squareResult = await tryAttempt(`reference edit ${compatibilityEditSize}`, {
      editSize: compatibilityEditSize,
      outputFormat: "png"
    });
    if (squareResult) {
      return {
        image: squareResult,
        warning: `${stickerSpecs[kind].zhName} 的原比例图生图失败，已用 ${compatibilityEditSize} 兼容尺寸以 PNG 生成并归一化回贴片比例（${stickerSpecs[kind].size}）。`,
        metrics
      };
    }
  }

  if (IMAGE_PROVIDER.supportsGenerations) {
    const generationPrompt = [
      prompt,
      "",
      "The image edit gateway returned blank or unusable output for the reference image. Generate a fresh non-blank sticker background from the written style instructions. The result must contain visible decorative texture, color, and composition; never return a blank or nearly white canvas."
    ].join("\n");
    const generatedResult = await tryAttempt("text-only generation retry", {
      referenceImage: "",
      prompt: generationPrompt
    });
    if (generatedResult) {
      return {
        image: generatedResult,
        warning: `${stickerSpecs[kind].zhName} 的图生图不可用，已改用文字描述生成；参考图相似度会降低。`,
        metrics
      };
    }
  }

  const error = new Error(failedAttempts.join(" / ") || "Image generation failed");
  error.metrics = metrics;
  throw error;
}

function fallbackSticker(kind, userPrompt) {
  const spec = stickerSpecs[kind];
  const accent = kind === "top" ? "#243f32" : kind === "side" ? "#6d7568" : "#40573e";
  const label = spec.zhName;
  const focusY = kind === "bottom" ? spec.height * 0.82 : spec.height * 0.18;
  const fadeStart = kind === "bottom" ? 0 : spec.height * 0.58;
  const fadeEnd = kind === "bottom" ? spec.height * 0.42 : spec.height;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width}" height="${spec.height}" viewBox="0 0 ${spec.width} ${spec.height}">
  <defs>
    <linearGradient id="fade" x1="0" y1="${kind === "bottom" ? 0 : 1}" x2="0" y2="${kind === "bottom" ? 1 : 0}">
      <stop offset="0" stop-color="#fbfaf4"/>
      <stop offset="0.55" stop-color="#f1efe4"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="${kind === "bottom" ? "85%" : "15%"}" r="70%">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.42"/>
      <stop offset="0.58" stop-color="${accent}" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="22"/></filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#fade)"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  <g opacity="0.42" filter="url(#blur)">
    <path d="M 0 ${focusY} C ${spec.width * 0.24} ${focusY - 90}, ${spec.width * 0.5} ${focusY + 90}, ${spec.width} ${focusY - 20}" fill="none" stroke="${accent}" stroke-width="86"/>
    <path d="M ${spec.width * 0.12} ${kind === "bottom" ? spec.height : 0} C ${spec.width * 0.3} ${focusY}, ${spec.width * 0.74} ${focusY}, ${spec.width * 0.92} ${kind === "bottom" ? spec.height : 0}" fill="none" stroke="#d7dcc7" stroke-width="54"/>
  </g>
  <rect x="0" y="${fadeStart}" width="${spec.width}" height="${Math.abs(fadeEnd - fadeStart)}" fill="#fbfaf4" opacity="0.48"/>
  <text x="42" y="72" fill="#1d2720" font-size="28" font-family="Arial, sans-serif" opacity="0.72">${label} / local draft</text>
  <text x="42" y="116" fill="#1d2720" font-size="18" font-family="Arial, sans-serif" opacity="0.52">${escapeSvg(userPrompt || `等待 ${IMAGE_PROVIDER.keyName} 后生成真实贴片背景`).slice(0, 96)}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function escapeSvg(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function makeTextLayerSvg({ copyText, styleKey, background = "transparent", textBrightness = "light" }) {
  const text = String(copyText || "").replace(/^例如：\n?|^Example:\n?/i, "").replace(/[“”"]/g, "").trim() || "NOBOOK · 618 狂欢季\n重走真理诞生路";
  const lines = text.split(/\n+/).slice(0, 4);
  const expressive = styleKey === "expressive";
  const dark = textBrightness === "dark";
  const fill = dark ? "#1d2118" : (expressive ? "#f7f3e8" : "#ffffff");
  const stroke = dark ? "#f3efe4" : (expressive ? "#222719" : "#121212");
  const fontFamily = expressive
    ? "'Kaiti SC', 'STKaiti', 'Songti SC', 'Noto Serif SC', serif"
    : "'Songti SC', 'STSong', 'Noto Serif SC', 'Source Han Serif SC', serif";
  const titleSize = expressive ? 70 : 62;
  const bodySize = expressive ? 44 : 42;
  const lineNodes = lines.map((line, index) => {
    const size = index === 0 ? titleSize : bodySize;
    const y = 126 + index * 62;
    return `<text x="540" y="${y}" text-anchor="middle" font-size="${size}" font-weight="${index === 0 ? 800 : 560}" fill="${fill}" stroke="${stroke}" stroke-width="${expressive ? 2.8 : 1.4}" paint-order="stroke">${escapeSvg(line)}</text>`;
  }).join("\n");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="320" viewBox="0 0 1080 320">
  <rect width="1080" height="320" fill="${background}"/>
  <g font-family="${fontFamily}" letter-spacing="0">
    ${lineNodes}
  </g>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function dataUrlToBuffer(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mime: match[1],
    buffer: Buffer.from(match[2], "base64")
  };
}

function readUInt32(buffer, offset) {
  return buffer.readUInt32BE(offset);
}

function makeCrcTable() {
  return Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    return value >>> 0;
  });
}

const crcTable = makeCrcTable();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function paethPredictor(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const distanceLeft = Math.abs(estimate - left);
  const distanceUp = Math.abs(estimate - up);
  const distanceUpLeft = Math.abs(estimate - upLeft);
  if (distanceLeft <= distanceUp && distanceLeft <= distanceUpLeft) return left;
  if (distanceUp <= distanceUpLeft) return up;
  return upLeft;
}

function decodePngToRgba(buffer) {
  const signature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== signature) {
    throw new Error("Only PNG image data can be locally cut out.");
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = readUInt32(buffer, offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = readUInt32(data, 0);
      height = readUInt32(data, 4);
      bitDepth = data[8];
      colorType = data[9];
    }
    if (type === "IDAT") idatChunks.push(data);
    if (type === "IEND") break;
    offset += length + 12;
  }

  if (bitDepth !== 8 || ![0, 2, 6].includes(colorType)) {
    throw new Error(`Unsupported PNG format: bitDepth=${bitDepth}, colorType=${colorType}`);
  }

  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const bytesPerPixel = channels;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idatChunks));
  const unfiltered = Buffer.alloc(height * stride);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    const filter = raw[rowStart];
    const source = raw.subarray(rowStart + 1, rowStart + 1 + stride);
    const targetStart = y * stride;
    const previousStart = (y - 1) * stride;

    for (let x = 0; x < stride; x += 1) {
      const left = x >= bytesPerPixel ? unfiltered[targetStart + x - bytesPerPixel] : 0;
      const up = y > 0 ? unfiltered[previousStart + x] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? unfiltered[previousStart + x - bytesPerPixel] : 0;
      let value = source[x];
      if (filter === 1) value = (value + left) & 0xff;
      if (filter === 2) value = (value + up) & 0xff;
      if (filter === 3) value = (value + Math.floor((left + up) / 2)) & 0xff;
      if (filter === 4) value = (value + paethPredictor(left, up, upLeft)) & 0xff;
      unfiltered[targetStart + x] = value;
    }
  }

  const rgba = Buffer.alloc(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    const sourceIndex = index * channels;
    const targetIndex = index * 4;
    if (colorType === 6) {
      rgba[targetIndex] = unfiltered[sourceIndex];
      rgba[targetIndex + 1] = unfiltered[sourceIndex + 1];
      rgba[targetIndex + 2] = unfiltered[sourceIndex + 2];
      rgba[targetIndex + 3] = unfiltered[sourceIndex + 3];
    } else if (colorType === 2) {
      rgba[targetIndex] = unfiltered[sourceIndex];
      rgba[targetIndex + 1] = unfiltered[sourceIndex + 1];
      rgba[targetIndex + 2] = unfiltered[sourceIndex + 2];
      rgba[targetIndex + 3] = 255;
    } else {
      const gray = unfiltered[sourceIndex];
      rgba[targetIndex] = gray;
      rgba[targetIndex + 1] = gray;
      rgba[targetIndex + 2] = gray;
      rgba[targetIndex + 3] = 255;
    }
  }

  return { width, height, rgba };
}

function encodeRgbaToPng({ width, height, rgba }) {
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    makePngChunk("IHDR", ihdr),
    makePngChunk("IDAT", deflateSync(raw)),
    makePngChunk("IEND")
  ]);
}

function isNearWhitePixel(rgba, index, threshold = 236) {
  const red = rgba[index];
  const green = rgba[index + 1];
  const blue = rgba[index + 2];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  return min >= threshold && max - min <= 24;
}

function isNearBlackPixel(rgba, index, threshold = 24) {
  const red = rgba[index];
  const green = rgba[index + 1];
  const blue = rgba[index + 2];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  return max <= threshold && max - min <= 24;
}

function isMattePixel(rgba, index, matteMode) {
  return matteMode === "black"
    ? isNearBlackPixel(rgba, index)
    : isNearWhitePixel(rgba, index);
}

// Feather alpha by distance from the matte color, so anti-aliased glyph edges fade out
// smoothly instead of leaving a hard halo. White matte fades on darkness; black on brightness.
function matteFeatherAlpha(rgba, index, matteMode) {
  if (matteMode === "black") {
    const maxChannel = Math.max(rgba[index], rgba[index + 1], rgba[index + 2]);
    return Math.max(0, Math.min(255, Math.round((maxChannel - 8) * 14)));
  }
  const minChannel = Math.min(rgba[index], rgba[index + 1], rgba[index + 2]);
  return Math.max(0, Math.min(255, Math.round((248 - minChannel) * 14)));
}

// Only the matte region that is connected to the canvas border is removed. Glyph-interior
// highlights (white inside dark strokes) and interior dark detail (black outline/shadow inside
// light strokes) are not border-connected, so the flood fill never reaches them and they survive.
function removeConnectedMatte(dataUrl, matteMode = "white") {
  const parsed = dataUrlToBuffer(dataUrl);
  if (!parsed || parsed.mime !== "image/png") {
    throw new Error("Local matte cutout needs a PNG data URL.");
  }
  const mode = matteMode === "black" ? "black" : "white";

  const png = decodePngToRgba(parsed.buffer);
  const { width, height, rgba } = png;
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = [];

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const pixel = y * width + x;
    if (visited[pixel]) return;
    const index = pixel * 4;
    if (!isMattePixel(rgba, index, mode)) return;
    visited[pixel] = 1;
    queue.push(pixel);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const pixel = queue[cursor];
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  const fallbackChannel = mode === "black" ? 0 : 255;
  for (let pixel = 0; pixel < total; pixel += 1) {
    if (!visited[pixel]) continue;
    const index = pixel * 4;
    const alpha = matteFeatherAlpha(rgba, index, mode);
    rgba[index + 3] = alpha;
    if (alpha === 0) {
      rgba[index] = fallbackChannel;
      rgba[index + 1] = fallbackChannel;
      rgba[index + 2] = fallbackChannel;
    }
  }

  return `data:image/png;base64,${encodeRgbaToPng(png).toString("base64")}`;
}

function measureDecorationBrightness(dataUrl) {
  const parsed = parsedImageBuffer(dataUrl);
  if (!parsed || parsed.mime !== "image/png") return null;
  let png;
  try {
    png = decodePngToRgba(parsed.buffer);
  } catch {
    return null;
  }
  let sum = 0;
  let counted = 0;
  for (let pixel = 0; pixel < png.width * png.height; pixel += 1) {
    const index = pixel * 4;
    const red = png.rgba[index];
    const green = png.rgba[index + 1];
    const blue = png.rgba[index + 2];
    if (png.rgba[index + 3] <= 12 || (Math.min(red, green, blue) >= 238 && Math.max(red, green, blue) - Math.min(red, green, blue) <= 24)) continue;
    sum += 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    counted += 1;
  }
  return counted >= png.width * png.height * 0.02 ? sum / counted : null;
}

function resolveMatte(textColorMode, topStickerImage) {
  if (textColorMode === "dark") return { matteMode: "white", matteColor: "#ffffff", textBrightness: "dark", brightnessSource: "forced-dark" };
  if (textColorMode === "light") return { matteMode: "black", matteColor: "#000000", textBrightness: "light", brightnessSource: "forced-light" };
  const brightness = measureDecorationBrightness(topStickerImage);
  return brightness !== null && brightness < 128
    ? { matteMode: "black", matteColor: "#000000", textBrightness: "light", brightnessSource: "auto-measured" }
    : { matteMode: "white", matteColor: "#ffffff", textBrightness: "dark", brightnessSource: brightness === null ? "auto-default" : "auto-measured" };
}

async function handleStickerBackgrounds(body) {
  const kinds = ["top", "bottom", "side"];
  const prompts = Object.fromEntries(kinds.map((kind) => [
    kind,
    buildStickerPrompt(kind, body.promptText || "")
  ]));
  const singleKind = kinds.includes(body.kind) ? body.kind : "";

  if (!API_KEY) {
    const fallbackKinds = singleKind ? [singleKind] : kinds;
    return {
      ok: true,
      openAIRequestOk: false,
      generated: false,
      provider: IMAGE_PROVIDER.id,
      providerLabel: IMAGE_PROVIDER.label,
      model: IMAGE_MODEL,
      quality: IMAGE_QUALITY,
      baseUrl: OPENAI_BASE_URL,
      useImageEdits: USE_IMAGE_EDITS,
      timeoutMs: IMAGE_TIMEOUT_MS,
      configuredTimeoutMs: CONFIGURED_IMAGE_TIMEOUT_MS,
      timeoutClamped: IMAGE_TIMEOUT_CLAMPED,
      maxTimeoutMs: MAX_IMAGE_TIMEOUT_MS,
      imageEditField: IMAGE_EDIT_FIELD,
      imageEditSize: IMAGE_EDIT_SIZE || "per-sticker-size",
      imageEditFallbackSize: IMAGE_EDIT_FALLBACK_SIZE || "off",
      imageEditIncludeExtras: IMAGE_EDIT_INCLUDE_EXTRAS,
      generationMode: GENERATION_MODE,
      runtimeBuild: RUNTIME_BUILD,
      assets: Object.fromEntries(fallbackKinds.map((kind) => [kind, fallbackSticker(kind, body.promptText)])),
      prompts,
      errors: {},
      message: `未检测到 ${IMAGE_PROVIDER.keyName}，已返回本地 SVG 草稿和完整 prompt。`
    };
  }

  const results = {};
  const errors = {};
  const warnings = {};
  const timings = {};

  if (singleKind) {
    try {
      const result = await requestStickerImage(singleKind, prompts[singleKind], body.referenceImage);
      results[singleKind] = result.image;
      timings[singleKind] = result.metrics || [];
      if (result.warning) warnings[singleKind] = result.warning;
    } catch (error) {
      errors[singleKind] = error.message || "Image generation failed";
      timings[singleKind] = error.metrics || [];
      results[singleKind] = fallbackSticker(singleKind, body.promptText);
    }
  } else if (GENERATION_MODE === "parallel") {
    const settled = await Promise.allSettled(kinds.map(async (kind) => [
      kind,
      await requestStickerImage(kind, prompts[kind], body.referenceImage)
    ]));

    settled.forEach((result, index) => {
      const kind = kinds[index];
      if (result.status === "fulfilled") {
        results[result.value[0]] = result.value[1].image;
        timings[result.value[0]] = result.value[1].metrics || [];
        if (result.value[1].warning) warnings[result.value[0]] = result.value[1].warning;
      } else {
        errors[kind] = result.reason?.message || "Image generation failed";
        timings[kind] = result.reason?.metrics || [];
        results[kind] = fallbackSticker(kind, body.promptText);
      }
    });
  } else {
    for (const kind of kinds) {
      try {
        const result = await requestStickerImage(kind, prompts[kind], body.referenceImage);
        results[kind] = result.image;
        timings[kind] = result.metrics || [];
        if (result.warning) warnings[kind] = result.warning;
      } catch (error) {
        errors[kind] = error.message || "Image generation failed";
        timings[kind] = error.metrics || [];
        results[kind] = fallbackSticker(kind, body.promptText);
      }
    }
  }

  return {
    ok: true,
    openAIRequestOk: Object.keys(errors).length === 0,
    generated: Boolean(API_KEY) && Object.keys(errors).length === 0,
    provider: IMAGE_PROVIDER.id,
    providerLabel: IMAGE_PROVIDER.label,
    model: IMAGE_MODEL,
    quality: IMAGE_QUALITY,
    baseUrl: OPENAI_BASE_URL,
    useImageEdits: USE_IMAGE_EDITS,
    timeoutMs: IMAGE_TIMEOUT_MS,
    configuredTimeoutMs: CONFIGURED_IMAGE_TIMEOUT_MS,
    timeoutClamped: IMAGE_TIMEOUT_CLAMPED,
    maxTimeoutMs: MAX_IMAGE_TIMEOUT_MS,
    imageEditField: IMAGE_EDIT_FIELD,
    imageEditSize: IMAGE_EDIT_SIZE || "per-sticker-size",
    imageEditFallbackSize: IMAGE_EDIT_FALLBACK_SIZE || "off",
    imageEditIncludeExtras: IMAGE_EDIT_INCLUDE_EXTRAS,
    generationMode: GENERATION_MODE,
    runtimeBuild: RUNTIME_BUILD,
    assets: results,
    prompts,
    errors,
    warnings,
    timings,
    message: API_KEY
      ? (Object.keys(errors).length
        ? `${IMAGE_PROVIDER.label} 生图失败，已回退成本地草稿。`
        : (Object.keys(warnings).length ? "贴片背景已生成，但部分图片使用了兼容重试路径。" : "贴片背景已生成。"))
      : `未检测到 ${IMAGE_PROVIDER.keyName}，已返回本地 SVG 草稿和完整 prompt。`
  };
}

function normalizeTextColorMode(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["dark", "deep", "深", "深色"].includes(normalized)) return "dark";
  if (["light", "pale", "浅", "浅色"].includes(normalized)) return "light";
  return "auto";
}

function textColorModePromptLines(textColorMode, matteMode, textBrightness) {
  // Shared across all modes: never emit pure black for dark lettering, anchor on the step-1 top
  // sticker contrast, and keep the lettering distinct from the solid matte it sits on.
  const shared = [
    "Hard color rule: never fill DARK main lettering with pure black #000000 or a flat near-#000 blackest tone. Use deep charcoal, warm ink, dark espresso brown, or a very dark neutral with subtle tint instead, so the type keeps depth and never looks like a flat #000 block.",
    "Authority rule: the step-1 top sticker (Reference image 1) decides the light/dark relationship. Read its real background/ornament brightness (ignoring pure-white fade zones) and keep the lettering's value contrast strong against that.",
    matteMode === "black"
      ? "Matte rule: the background is a flat pure-black matte that will be keyed out. The main lettering must be light (pure white #ffffff is allowed, as are warm white, ivory, or pearl) and clearly separated from the black matte. Any dark outline, shadow, or interior texture must sit INSIDE or touching the letters, never as a separate dark patch floating in the matte."
      : "Matte rule: the background is a flat pure-white matte that will be keyed out. The main lettering must be dark and clearly separated from the white matte. Any white highlight or interior detail must sit INSIDE the letters, never as a separate white patch floating in the matte."
  ];
  if (textColorMode === "dark") {
    return [
      ...shared,
      "Color mode = DARK lettering (forced) on a white matte: make the main type a deep, rich dark tone (charcoal, ink, espresso) — never pure black. It must read clearly dark against the white matte and dark relative to the top sticker."
    ];
  }
  if (textColorMode === "light") {
    return [
      ...shared,
      "Color mode = LIGHT lettering (forced) on a black matte: make the main type a light neutral so it stands out against the pure-black matte. Pure white #ffffff is allowed in light mode; warm white, ivory, or pearl are also fine. Add a subtle darker inner edge or shadow only if it stays attached to the strokes; do not place loose dark shapes in the matte."
    ];
  }
  return [
    ...shared,
    textBrightness === "light"
      ? "Color mode = AUTO resolved to LIGHT lettering on a black matte (the top sticker reads dark/saturated): use light lettering that stands out against the pure-black matte. Pure white #ffffff is allowed here; warm white or ivory are also fine."
      : "Color mode = AUTO resolved to DARK lettering on a white matte (the top sticker reads light/airy): use deep dark — never pure black #000000 — lettering that stands out against the pure-white matte."
  ];
}

async function handleTextLayer(body) {
  const styleKey = body.styleKey === "expressive" ? "expressive" : "clean";
  const textColorMode = normalizeTextColorMode(body.textColorMode);
  const fontPresetKeys = new Set(["elegant-songti", "expressive-calligraphy", "rounded-cute"]);
  const fontPresetKey = fontPresetKeys.has(body.fontPresetKey) ? body.fontPresetKey : "";
  const fontReferenceSource = body.fontReferenceSource === "preset" ? "preset" : "upload";
  const copyText = String(body.copyText || "").replace(/^例如：\n?|^Example:\n?/i, "").replace(/[“”"]/g, "").trim() || "NOBOOK · 618 狂欢季\n重走真理诞生路";
  const topStickerImage = body.topStickerImage || body.referenceImage || "";
  const fontReferenceImage = body.fontReferenceImage || "";
  const sourceTypographyReferenceImage = body.sourceTypographyReferenceImage || "";
  const referenceImages = [topStickerImage, fontReferenceImage, sourceTypographyReferenceImage].filter(Boolean);
  const { matteMode, matteColor, textBrightness } = resolveMatte(textColorMode, topStickerImage);
  const matteName = matteMode === "black" ? "pure black #000000" : "pure white #ffffff";
  const prompt = [
    `Generate a standalone livestream typography asset on a strict ${matteName} background.`,
    "The final image must be a clean solid-matte typography design draft, not a transparent image.",
    "Do not composite onto any reference image or recreate any reference background.",
    topStickerImage
      ? "Reference image 1 is the generated top sticker. It is the primary visual source: inherit typography color direction, material feeling, brightness contrast, and small decorative accents around or attached to letters from this top sticker."
      : "",
    fontReferenceImage
      ? (fontReferenceSource === "preset"
        ? "Reference image 2 is the selected built-in font preset. Use it strongly for letterform family, stroke rhythm, weight distribution, terminal shape, title hierarchy, and local face texture. Do not copy its background, scene, color palette, large decorations, logos, non-target text, products, labels, characters, or composition."
        : "Reference image 2 is an optional font reference. Use it only for letterform, stroke rhythm, font structure, calligraphic energy, layout rhythm, and local face texture. Do not copy its background, scene, color palette, large decorations, logos, non-target text, products, labels, characters, or composition.")
      : "No optional font reference is provided; rely on the chosen typography route and the top sticker reference.",
    sourceTypographyReferenceImage
      ? "An additional source reference is the user's original step-1 reference image. If it contains lettering, extract only broad typography cues such as stroke thickness, terminal shape, weight rhythm, spacing, and title hierarchy. Never copy its actual words, slogans, logo marks, background, scene, palette, decorations, products, people, labels, or composition."
      : "",
    "Color authority: Reference image 1 (the generated top sticker) is the SOLE authority for every color decision — typography fill, global palette, highlights, outline, shadow, edge effects, glow, and all decorative color. Sample colors only from the top sticker, plus neutral contrast tones needed purely for readability.",
    "Color exclusion: the font-reference image (Reference image 2) and the optional source-typography image (Reference image 3) must NEVER contribute any color, global palette, decoration palette, accent color, gradient, scene, or background. Treat those two references as monochrome shape guides only — read their letterform and texture, discard their hues entirely. If they conflict with the top sticker on color, the top sticker always wins.",
    "ABSOLUTE COLOR RULE — Reference image 1 (the generated top sticker) ALONE decides every color in this asset: it alone chooses the lettering fill, the lettering outline, the lettering shadow, the lettering highlights, every gradient, and every decorative-accent color. No other reference and no default palette may introduce a single hue. Sample all color exclusively from Reference image 1, adding only neutral black/white contrast tones when readability strictly requires it.",
    "ABSOLUTE SHAPE-ONLY RULE — Reference image 2 (font reference) and Reference image 3 (optional source typography) are SHAPE-ONLY references and MUST be read as if fully grayscale/desaturated. They may influence ONLY glyph silhouette, stroke construction, and local face texture. They MUST NOT influence ANY color, ANY palette, ANY color temperature (warm/cool), ANY decoration, ANY background, ANY scene, or ANY compositional color. Strip away their colors completely before using them.",
    "These two rules never conflict and never override each other: Reference image 1 is the only color source; References 2 and 3 are the only auxiliary shape sources. Color comes from Reference image 1; shape may come from References 2 and 3; the two channels stay strictly separate.",
    "Letterform lock: the selected typography route controls silhouette, stroke structure, serif/brush/rounded character, and spacing. The top sticker reference must not collapse different typography routes into the same font style.",
    "The font reference and source-typography reference never decide the background, global color, palette, large ornaments, decorative color, or any non-text visual content.",
    "Do not recreate large color blocks, ribbons, watercolor backgrounds, geometric networks, poster scenes, people, products, logos, QR codes, labels, captions, slogans, signatures, or watermarks.",
    "First judge the intended text placement brightness from the top sticker: light placement areas need darker lettering; dark or saturated placement areas need lighter lettering with strong outline, shadow, or contrast edge.",
    "必须逐字保留以下原文案，不增删、不翻译、不改写，保留换行结构：",
    copyText,
    styleKey === "expressive"
      ? "Typography route: calligraphy tension style. Use bold brush-script structure, visible stroke direction, energetic thick-thin rhythm, hand-drawn pressure changes, and controlled dry-brush texture only when it helps. It must look clearly different from Songti serif and rounded cute lettering."
      : "Typography route: elegant Songti serif style. Use Chinese Songti / Ming-style serif letterforms with clear horizontal-thin vertical-thick contrast, sharp triangular terminals, refined printed-title rhythm, graceful but stable strokes, and high readability. Do not turn this route into Heiti, sans-serif, rounded poster lettering, inflated sticker lettering, or calligraphic brush script.",
    fontPresetKey === "elegant-songti"
      ? "Built-in preset lock: elegant Songti. Follow the preset's tall refined Ming/Songti serif silhouette, sharp wedge terminals, slim-to-thick contrast, restrained upper brand line, and graceful horizontal flourish energy. Keep it clearly different from expressive brush calligraphy and rounded cute poster lettering. This preset controls letter shape only; do not copy the preset's blue color unless blue already appears in Reference image 1."
      : "",
    fontPresetKey === "expressive-calligraphy"
      ? "Built-in preset lock: expressive calligraphy. Follow the preset's sweeping brush-script silhouette, connected running strokes, bold pressure variation, dry-brush texture, long gestural tails, and dynamic slanted rhythm. Keep it clearly different from Songti serif and rounded cute lettering. This preset controls letter shape only; do not copy the preset's green color unless green already appears in Reference image 1."
      : "",
    fontPresetKey === "rounded-cute"
      ? "Typography preset: rounded cute sticker lettering. Use bubbly, thick, soft-cornered, playful, high-readability title shapes, friendly inflated strokes, round terminals, and compact launch-poster hierarchy. It must look clearly different from Songti serif and brush calligraphy. This preset controls letter shape only; do not use the preset sample's orange, navy, cyan, or red palette unless those colors already appear in Reference image 1."
      : "",
    ...textColorModePromptLines(textColorMode, matteMode, textBrightness),
    matteMode === "black"
      ? "Keep every glyph readable against the black matte; dark details must stay attached to the lettering."
      : "Keep every glyph readable against the white matte; light highlights must stay inside dark lettering.",
    "Keep the brand line smaller and clean. Make the main title dominant. The middle dot `·` must stay accurate.",
    "Complex Chinese characters, especially `诞` and `路`, must stay structurally correct and readable.",
    body.promptText ? `用户补充要求：${body.promptText}` : ""
  ].filter(Boolean).join("\n");

  const fallbackTransparent = makeTextLayerSvg({ copyText, styleKey, textBrightness });
  const fallbackMatteDraft = makeTextLayerSvg({ copyText, styleKey, background: matteColor, textBrightness });

  if (!API_KEY || !TEXT_LAYER_USE_API) {
    return {
      ok: true,
      generated: false,
      openAIRequestOk: false,
      matteMode,
      matteColor,
      assets: {
        whiteDraft: fallbackMatteDraft,
        transparent: fallbackTransparent
      },
      styleKey,
      fontPresetKey,
      prompt,
      provider: IMAGE_PROVIDER.id,
      providerLabel: IMAGE_PROVIDER.label,
      model: IMAGE_MODEL,
      size: TEXT_LAYER_SIZE,
      message: !API_KEY
        ? `未检测到 ${IMAGE_PROVIDER.keyName}，已返回本地 SVG 文字图层草稿。`
        : "文字图层 API 已关闭，已返回本地 SVG 文字图层草稿。"
    };
  }

  try {
    const failedAttempts = [];
    const tryTextEdit = async (label, options) => {
      try {
        return await requestOpenAIImage({
          prompt: options.prompt || prompt,
          size: TEXT_LAYER_SIZE,
          referenceImages: options.referenceImages,
          referenceImage: options.referenceImage,
          editSize: options.editSize,
          outputFormat: "png"
        });
      } catch (error) {
        if (isImageBillingLimitError(error)) throw error;
        failedAttempts.push(`${label}: ${error.message || "failed"}`);
        return "";
      }
    };

    // Keep the detailed font reference when the gateway accepts it, but fall back progressively
    // to the top sticker alone and then a compact compatible edit size before using local SVG.
    let whiteDraft = await tryTextEdit("top sticker + typography references", { referenceImages });
    let referenceFallback = "";
    if (!whiteDraft && topStickerImage) {
      referenceFallback = failedAttempts[failedAttempts.length - 1] || "Multi-reference image edit failed";
      whiteDraft = await tryTextEdit("top sticker only", {
        prompt: [
          prompt,
          "",
          "The optional typography reference images could not be sent by the image gateway in this retry. Ignore them and rely on the top sticker plus the selected typography route."
        ].join("\n"),
        referenceImage: topStickerImage
      });
    }
    if (!whiteDraft && topStickerImage && TEXT_LAYER_EDIT_FALLBACK_SIZE && TEXT_LAYER_EDIT_FALLBACK_SIZE !== TEXT_LAYER_SIZE) {
      referenceFallback = failedAttempts.join(" / ");
      whiteDraft = await tryTextEdit(`top sticker compatibility ${TEXT_LAYER_EDIT_FALLBACK_SIZE}`, {
        prompt: [
          prompt,
          "",
          "Use the supplied top sticker as the only reference. Preserve the requested text exactly and return a clean solid-matte typography draft."
        ].join("\n"),
        referenceImage: topStickerImage,
        editSize: TEXT_LAYER_EDIT_FALLBACK_SIZE
      });
    }
    if (!whiteDraft) throw new Error(failedAttempts.join(" / ") || "Text layer generation failed");
    let transparent = fallbackTransparent;
    let cutoutOk = false;
    let cutoutError = "";
    try {
      transparent = removeConnectedMatte(whiteDraft, matteMode);
      cutoutOk = true;
    } catch (error) {
      cutoutError = error.message || "Local cutout failed";
    }

    const matteLabel = matteMode === "black" ? "黑底" : "白底";
    return {
      ok: true,
      generated: true,
      openAIRequestOk: true,
      cutoutOk,
      matteMode,
      matteColor,
      assets: {
        whiteDraft,
        transparent
      },
      styleKey,
      fontPresetKey,
      prompt,
      model: IMAGE_MODEL,
      size: TEXT_LAYER_SIZE,
      referenceFallback,
      error: cutoutError || referenceFallback,
      message: cutoutOk
        ? (referenceFallback
          ? `${matteLabel}字体稿已生成，并已本地扣${matteLabel}为透明 PNG。可选文字参考图未被网关接受，本次已退回只以上贴图为参考；请检查文字是否完全正确。`
          : `${matteLabel}字体稿已生成，并已本地扣${matteLabel}为透明 PNG。请检查文字是否完全正确。`)
        : `${matteLabel}字体稿已生成，但本地扣${matteLabel}失败，已回退 SVG 透明稿：${cutoutError}`
    };
  } catch (error) {
    return {
      ok: true,
      generated: false,
      openAIRequestOk: false,
      matteMode,
      matteColor,
      assets: {
        whiteDraft: fallbackMatteDraft,
        transparent: fallbackTransparent
      },
      styleKey,
      fontPresetKey,
      prompt,
      model: IMAGE_MODEL,
      size: TEXT_LAYER_SIZE,
      error: error.message || "Text layer generation failed",
      message: `文字图层 API 生成失败，已回退本地 SVG 草稿：${error.message || "unknown error"}`
    };
  }

}

async function workflowStatus() {
  const workflowDoc = await readWorkflowDoc();
  return {
    ok: true,
    hasOpenAIKey: Boolean(API_KEY),
    hasImageProviderKey: Boolean(API_KEY),
    imageProvider: IMAGE_PROVIDER.id,
    imageProviderLabel: IMAGE_PROVIDER.label,
    providers: Object.fromEntries(Object.entries(imageProviderAdapters).map(([id, adapter]) => [id, {
      configured: Boolean(adapter.apiKey),
      label: adapter.label,
      model: adapter.model,
      baseUrl: adapter.baseUrl
    }])),
    model: IMAGE_MODEL,
    quality: IMAGE_QUALITY,
    baseUrl: OPENAI_BASE_URL,
    useImageEdits: USE_IMAGE_EDITS,
    timeoutMs: IMAGE_TIMEOUT_MS,
    configuredTimeoutMs: CONFIGURED_IMAGE_TIMEOUT_MS,
    timeoutClamped: IMAGE_TIMEOUT_CLAMPED,
    maxTimeoutMs: MAX_IMAGE_TIMEOUT_MS,
    imageEditField: IMAGE_EDIT_FIELD,
    imageEditSize: IMAGE_EDIT_SIZE || "per-sticker-size",
    imageEditFallbackSize: IMAGE_EDIT_FALLBACK_SIZE || "off",
    imageEditIncludeExtras: IMAGE_EDIT_INCLUDE_EXTRAS,
    textLayerSize: TEXT_LAYER_SIZE,
    textLayerUseApi: TEXT_LAYER_USE_API,
    generationMode: GENERATION_MODE,
    runtimeBuild: RUNTIME_BUILD,
    workflowDocPath: WORKFLOW_DOC_PATH,
    workflowDocLoaded: Boolean(workflowDoc),
    workflowDocChars: workflowDoc.length,
    taskMap: {
      provider: TASKMAP_PROVIDER,
      openai: {
        hasApiKey: Boolean(OPENAI_TASKMAP_API_KEY),
        model: OPENAI_TASKMAP_MODEL,
        baseUrl: OPENAI_TASKMAP_BASE_URL
      },
      deepseek: {
        hasApiKey: Boolean(DEEPSEEK_TASKMAP_API_KEY),
        model: DEEPSEEK_TASKMAP_MODEL,
        baseUrl: DEEPSEEK_TASKMAP_BASE_URL
      },
      demoFallback: TASKMAP_DEMO_FALLBACK
    },
    makersModels: {
      configured: Boolean(MAKERS_MODELS_API_KEY && MAKERS_MODELS_BASE_URL),
      hasApiKey: Boolean(MAKERS_MODELS_API_KEY),
      hasBaseUrl: Boolean(MAKERS_MODELS_BASE_URL),
      baseUrl: MAKERS_MODELS_BASE_URL || null,
      textModel: MAKERS_MODELS_TEXT_MODEL,
      imageModel: MAKERS_MODELS_IMAGE_MODEL || null,
      imageProbeEnabled: MAKERS_MODELS_ENABLE_IMAGE_PROBE,
      timeoutMs: MAKERS_MODELS_TIMEOUT_MS
    }
  };
}

function makersProbeError(message, status, details = {}) {
  const error = new Error(message);
  error.status = status;
  Object.assign(error, details);
  return error;
}

function shortResponseBody(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 700);
}

async function requestMakersModels(path, options = {}) {
  if (!MAKERS_MODELS_API_KEY || !MAKERS_MODELS_BASE_URL) {
    throw makersProbeError(
      "Makers Models is not configured. Set MAKERS_MODELS_API_KEY and MAKERS_MODELS_BASE_URL in server-side environment variables.",
      400
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MAKERS_MODELS_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const response = await fetch(`${MAKERS_MODELS_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${MAKERS_MODELS_API_KEY}`,
        ...(options.headers || {})
      },
      signal: controller.signal
    });
    const raw = await response.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }
    if (!response.ok) {
      throw makersProbeError(
        data?.error?.message || `Makers Models request failed with ${response.status}: ${shortResponseBody(raw)}`,
        response.status,
        { responseBody: shortResponseBody(raw) }
      );
    }
    return {
      status: response.status,
      durationMs: elapsedMs(startedAt),
      data,
      raw
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw makersProbeError(`Makers Models request timed out after ${Math.round(MAKERS_MODELS_TIMEOUT_MS / 1000)}s`, 504);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function summarizeMakersImageResponse(data) {
  const first = data?.data?.[0] || {};
  return {
    returnedImage: Boolean(first.b64_json || first.url),
    returnedUrl: Boolean(first.url),
    returnedBase64: Boolean(first.b64_json),
    responseKeys: data && typeof data === "object" ? Object.keys(data) : []
  };
}

async function handleMakersModelsProbe(body = {}) {
  const wantsImage = body.testImage === true;
  const wantsEdit = body.testEdit === true;
  const referenceImages = (Array.isArray(body.referenceImages) ? body.referenceImages : [])
    .filter((image) => typeof image === "string" && image.startsWith("data:"))
    .slice(0, 4);

  if ((wantsImage || wantsEdit) && !MAKERS_MODELS_ENABLE_IMAGE_PROBE) {
    return {
      ok: false,
      code: "makers_image_probe_disabled",
      message: "Image probing is disabled. Set MAKERS_MODELS_ENABLE_IMAGE_PROBE=1 only for this isolated experiment.",
      makersModels: {
        textModel: MAKERS_MODELS_TEXT_MODEL,
        imageModel: MAKERS_MODELS_IMAGE_MODEL || null
      }
    };
  }
  if ((wantsImage || wantsEdit) && !MAKERS_MODELS_IMAGE_MODEL) {
    return {
      ok: false,
      code: "makers_image_model_missing",
      message: "Set MAKERS_MODELS_IMAGE_MODEL to an exact image-capable model ID listed in the Makers Models console before running an image probe."
    };
  }
  if (wantsEdit && !referenceImages.length) {
    return {
      ok: false,
      code: "makers_reference_images_missing",
      message: "A referenceImages data URL array is required for the image-edit probe."
    };
  }

  const result = {
    ok: true,
    experiment: "edgeone-makers-models",
    text: null,
    image: null,
    edit: null
  };

  const textResponse = await requestMakersModels("/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MAKERS_MODELS_TEXT_MODEL,
      messages: [
        { role: "system", content: "Reply in one short sentence." },
        { role: "user", content: "Reply with: Makers Models text probe passed." }
      ],
      temperature: 0
    })
  });
  result.text = {
    ok: true,
    model: MAKERS_MODELS_TEXT_MODEL,
    status: textResponse.status,
    durationMs: textResponse.durationMs,
    output: shortResponseBody(textResponse.data?.choices?.[0]?.message?.content || textResponse.data?.output_text || textResponse.raw)
  };

  if (wantsImage) {
    const imageResponse = await requestMakersModels("/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MAKERS_MODELS_IMAGE_MODEL,
        prompt: "A minimal abstract livestream top-sticker background, no text, no logo, a single soft color field with a clean white lower edge.",
        size: "1024x1024",
        output_format: "jpeg"
      })
    });
    result.image = {
      ok: true,
      model: MAKERS_MODELS_IMAGE_MODEL,
      status: imageResponse.status,
      durationMs: imageResponse.durationMs,
      ...summarizeMakersImageResponse(imageResponse.data)
    };
  }

  if (wantsEdit) {
    const form = new FormData();
    form.append("model", MAKERS_MODELS_IMAGE_MODEL);
    form.append("prompt", "Create a minimal abstract livestream side-sticker background from these visual references. Preserve only color, texture, and edge-decoration character. Do not include text or logos.");
    form.append("size", "1024x1024");
    form.append("output_format", "png");
    referenceImages.forEach((image, index) => {
      const file = dataUrlToUploadFile(image, index);
      if (file) form.append("image", file, file.name || `reference-${index + 1}.png`);
    });
    const editResponse = await requestMakersModels("/images/edits", {
      method: "POST",
      body: form
    });
    result.edit = {
      ok: true,
      model: MAKERS_MODELS_IMAGE_MODEL,
      referenceCount: referenceImages.length,
      status: editResponse.status,
      durationMs: editResponse.durationMs,
      ...summarizeMakersImageResponse(editResponse.data)
    };
  }

  return result;
}

function cleanTaskMapText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function parseRatio(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.min(1, Math.max(0, Math.round(num * 1000) / 1000));
}

function normalizeDependsOn(value, index) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  for (const entry of value) {
    const dep = Number(entry);
    if (!Number.isInteger(dep) || dep < 0 || dep >= index || seen.has(dep)) continue;
    seen.add(dep);
    result.push(dep);
  }
  return result;
}

function normalizeTaskMapBreakdown(rawTasks) {
  const seen = new Set();
  const cleaned = (Array.isArray(rawTasks) ? rawTasks : [])
    .map((task) => ({
      title: cleanTaskMapText(task?.title, 32),
      note: cleanTaskMapText(task?.note, 120),
      startRatio: parseRatio(task?.startRatio),
      endRatio: parseRatio(task?.endRatio),
      dependsOn: task?.dependsOn
    }))
    .filter((task) => {
      if (!task.title || seen.has(task.title)) return false;
      seen.add(task.title);
      return true;
    })
    .slice(0, 6);

  const count = cleaned.length;
  return cleaned.map((task, index) => {
    const defaultStart = count ? Math.round((index / count) * 1000) / 1000 : 0;
    const defaultEnd = count ? Math.round(((index + 1) / count) * 1000) / 1000 : 1;
    let startRatio = task.startRatio === null ? defaultStart : task.startRatio;
    let endRatio = task.endRatio === null ? defaultEnd : task.endRatio;
    if (!(endRatio > startRatio)) {
      startRatio = defaultStart;
      endRatio = defaultEnd;
    }
    return {
      title: task.title,
      note: task.note,
      startRatio,
      endRatio,
      dependsOn: normalizeDependsOn(task.dependsOn, index)
    };
  });
}

function outputTextFromResponse(response) {
  if (response?.output_text) return response.output_text;
  const content = response?.output?.flatMap((item) => item?.content || []) || [];
  return content.map((item) => item?.text || "").filter(Boolean).join("\n");
}

function buildTaskMapPrompt(body) {
  const lang = body.lang === "en" ? "en" : "zh";
  const currentTask = body.currentTask || {};
  const payload = {
    lang,
    currentTask: {
      title: cleanTaskMapText(currentTask.title, 80),
      note: cleanTaskMapText(currentTask.note, 240)
    },
    parentPath: Array.isArray(body.parentPath) ? body.parentPath.map((item) => cleanTaskMapText(item, 80)).filter(Boolean) : [],
    siblingTitles: Array.isArray(body.siblingTitles) ? body.siblingTitles.map((item) => cleanTaskMapText(item, 80)).filter(Boolean) : [],
    existingChildren: Array.isArray(body.existingChildren) ? body.existingChildren.map((item) => cleanTaskMapText(item?.title || item, 80)).filter(Boolean) : [],
    userPrompt: cleanTaskMapText(body.userPrompt, 240),
    maxChildren: Math.min(6, Math.max(3, Number(body.maxChildren) || 5))
  };

  const instruction = lang === "zh"
    ? "你是 Task Map 的任务逻辑拆解引擎。只为当前节点生成 3~6 个下一层直接子任务，不要继续向下展开，不要安排日期、时长、优先级或提醒。输出要像结构化大纲，适合无限嵌套的目标拆分。避开已有同级任务和已有子任务，不要重复。标题短、具体、可编辑。备注只写一句用途说明。"
    : "You are the task-logic breakdown engine for Task Map. Generate only 3 to 6 direct child tasks for the current node. Do not expand deeper levels, schedule dates, durations, priorities, or reminders. Output structured outline items suitable for infinitely nestable goal breakdowns. Avoid duplicates with siblings or existing children. Keep titles short, concrete, and editable. Notes must be one concise sentence.";

  const fieldSpec = lang === "zh"
    ? [
        "每个 task 必须包含字段：title、note、startRatio、endRatio、dependsOn。",
        "startRatio 和 endRatio 是 0~1 之间的小数，表示该子任务在整体进度上的相对起止位置，按子任务的逻辑顺序从前到后排布，endRatio 必须大于 startRatio。",
        "dependsOn 是一个数组，元素是本次输出中作为前置条件的同级子任务下标（从 0 开始，且必须小于当前子任务自身的下标）；没有前置依赖时返回空数组 []。"
      ].join("\n")
    : [
        "Each task must include the fields: title, note, startRatio, endRatio, dependsOn.",
        "startRatio and endRatio are decimals between 0 and 1 marking the child's relative start/end position along overall progress, laid out front-to-back by logical order, with endRatio strictly greater than startRatio.",
        "dependsOn is an array of zero-based sibling indices (within this output) that act as prerequisites; each index must be smaller than the task's own index. Use an empty array [] when there is no prerequisite."
      ].join("\n");

  return [
    instruction,
    "",
    fieldSpec,
    "",
    lang === "zh"
      ? "只返回 JSON，不要返回 Markdown 或解释文字。JSON 结构必须是：{\"tasks\":[{\"title\":\"短标题\",\"note\":\"一句备注\",\"startRatio\":0,\"endRatio\":0.2,\"dependsOn\":[]}]}"
      : "Return JSON only, with no Markdown or explanatory text. The JSON shape must be: {\"tasks\":[{\"title\":\"Short title\",\"note\":\"One concise note\",\"startRatio\":0,\"endRatio\":0.2,\"dependsOn\":[]}]}",
    "",
    "Task Map context JSON:",
    JSON.stringify(payload, null, 2)
  ].join("\n");
}

function withFallbackTaskRatios(tasks) {
  const count = tasks.length;
  return tasks.map((task, index) => ({
    title: task.title,
    note: task.note,
    startRatio: count ? Math.round((index / count) * 1000) / 1000 : 0,
    endRatio: count ? Math.round(((index + 1) / count) * 1000) / 1000 : 1,
    dependsOn: []
  }));
}

function fallbackTaskMapBreakdown(body) {
  const lang = body.lang === "en" ? "en" : "zh";
  const title = cleanTaskMapText(body.currentTask?.title, 80);
  const seed = `${title} ${cleanTaskMapText(body.userPrompt, 120)}`;
  const isExam = /考研|备考|考试|研究生|exam|study/i.test(seed);
  const isSchoolMajor = /院校|专业|科目|择校|major|school|subject/i.test(seed);
  const isReview = /复习|学习|课程|专业课|review|course/i.test(seed);

  if (lang === "en") {
    if (isSchoolMajor) {
      return withFallbackTaskRatios([
        { title: "Target shortlist", note: "Compare programs, locations, and admission fit." },
        { title: "Subject mapping", note: "List every exam subject and its required materials." },
        { title: "Reference collection", note: "Gather official books, syllabi, and past papers." },
        { title: "Scoreline review", note: "Compare recent score lines and admission risks." },
        { title: "Decision checkpoint", note: "Lock the final target before deeper planning." }
      ]);
    }
    if (isExam || isReview) {
      return withFallbackTaskRatios([
        { title: "Goal and scope", note: "Clarify the exact exam target and review boundary." },
        { title: "Foundation review", note: "Build a stable daily routine for core subjects." },
        { title: "Knowledge framework", note: "Turn chapters and concepts into an outline." },
        { title: "Practice loop", note: "Use drills and past papers to expose weak points." },
        { title: "Final consolidation", note: "Keep only high-impact review and mistake repair." }
      ]);
    }
    return withFallbackTaskRatios([
      { title: "Clarify scope", note: "Define what this node includes and excludes." },
      { title: "Collect inputs", note: "Gather the materials needed before execution." },
      { title: "Split modules", note: "Separate the work into independent logical parts." },
      { title: "Create checklist", note: "Turn each part into verifiable outputs." },
      { title: "Review and refine", note: "Check gaps before planning the timeline." }
    ]);
  }

  if (isSchoolMajor) {
    return withFallbackTaskRatios([
      { title: "整理目标院校清单", note: "先列出可选院校、地域、方向和报考限制。" },
      { title: "确认考试科目", note: "把公共课、专业课和特殊要求逐项核对清楚。" },
      { title: "收集参考资料", note: "整理参考书、考试大纲、真题和经验贴来源。" },
      { title: "对比录取难度", note: "横向比较分数线、招生人数和复试比例。" },
      { title: "锁定最终目标", note: "在继续细拆前确定主目标和备选方案。" }
    ]);
  }

  if (isExam || isReview) {
    return withFallbackTaskRatios([
      { title: "明确备考边界", note: "确定目标、考试范围和当前基础差距。" },
      { title: "搭建基础节奏", note: "先建立公共课和核心科目的稳定学习节奏。" },
      { title: "建立知识框架", note: "按章节和题型把内容整理成可展开结构。" },
      { title: "进入练习闭环", note: "通过刷题、真题和错题复盘暴露短板。" },
      { title: "考前收束复盘", note: "停止扩张资料，只保留高价值修补项。" }
    ]);
  }

  return withFallbackTaskRatios([
    { title: "明确目标边界", note: "先判断这个节点包含什么、不包含什么。" },
    { title: "收集必要资料", note: "把继续拆解所需的信息和素材放到一起。" },
    { title: "拆分关键模块", note: "按逻辑关系分出互相独立的下一级部分。" },
    { title: "形成检查清单", note: "把每个模块变成可以验证的输出。" },
    { title: "复盘结构缺口", note: "检查是否有遗漏、重复或层级不清的部分。" }
  ]);
}

function parseTaskMapJson(value) {
  const text = String(value || "").trim();
  if (!text) return {};
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return JSON.parse(fenced ? fenced[1] : text);
}

function assertUsableTaskMapTasks(parsed) {
  const tasks = normalizeTaskMapBreakdown(parsed.tasks);
  if (tasks.length < 3) {
    throw new Error("Task Map AI returned too few usable tasks.");
  }
  return tasks;
}

async function requestOpenAiTaskMapBreakdown(body) {
  const response = await openAiTaskMapClient.responses.create({
    model: OPENAI_TASKMAP_MODEL,
    input: buildTaskMapPrompt(body),
    text: {
      format: {
        type: "json_schema",
        name: "task_map_breakdown",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["tasks"],
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "note", "startRatio", "endRatio", "dependsOn"],
                properties: {
                  title: { type: "string" },
                  note: { type: "string" },
                  startRatio: { type: "number", minimum: 0, maximum: 1 },
                  endRatio: { type: "number", minimum: 0, maximum: 1 },
                  dependsOn: {
                    type: "array",
                    items: { type: "integer", minimum: 0 }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  return assertUsableTaskMapTasks(parseTaskMapJson(outputTextFromResponse(response)));
}

async function requestDeepSeekTaskMapBreakdown(body) {
  const response = await deepSeekTaskMapClient.chat.completions.create({
    model: DEEPSEEK_TASKMAP_MODEL,
    messages: [
      {
        role: "system",
        content: body.lang === "en"
          ? "You are Task Map's task-logic breakdown engine. Return valid JSON only."
          : "你是 Task Map 的任务逻辑拆解引擎。只返回合法 JSON。"
      },
      {
        role: "user",
        content: buildTaskMapPrompt(body)
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3
  });

  return assertUsableTaskMapTasks(parseTaskMapJson(response.choices?.[0]?.message?.content));
}

async function handleTaskMapBreakdown(body) {
  const existingChildren = Array.isArray(body.existingChildren) ? body.existingChildren : [];
  if (existingChildren.length) {
    return {
      ok: false,
      code: "node_has_children",
      message: "已有子任务的节点不能再次 AI 拆解，请继续拆分叶子节点。"
    };
  }

  const provider = TASKMAP_PROVIDER === "openai" ? "openai" : "deepseek";
  const client = provider === "openai" ? openAiTaskMapClient : deepSeekTaskMapClient;
  const missingKeyCode = provider === "openai" ? "missing_openai_taskmap_key" : "missing_deepseek_taskmap_key";
  const missingKeyName = provider === "openai" ? "OPENAI_TASKMAP_API_KEY" : "DEEPSEEK_TASKMAP_API_KEY";
  const model = provider === "openai" ? OPENAI_TASKMAP_MODEL : DEEPSEEK_TASKMAP_MODEL;

  if (!client) {
    if (TASKMAP_DEMO_FALLBACK) {
      return {
        ok: true,
        provider,
        model: "local-demo-fallback",
        fallback: true,
        tasks: fallbackTaskMapBreakdown(body)
      };
    }
    return {
      ok: false,
      code: missingKeyCode,
      message: `未检测到 ${missingKeyName}，Task Map AI 拆解暂不可用。`
    };
  }

  try {
    const tasks = provider === "openai"
      ? await requestOpenAiTaskMapBreakdown(body)
      : await requestDeepSeekTaskMapBreakdown(body);

    return {
      ok: true,
      provider,
      model,
      tasks
    };
  } catch (error) {
    if (TASKMAP_DEMO_FALLBACK) {
      return {
        ok: true,
        provider,
        model: "local-demo-fallback",
        fallback: true,
        error: error?.message || "Task Map AI request failed",
        tasks: fallbackTaskMapBreakdown(body)
      };
    }
    throw error;
  }
}

async function route(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === "GET" && url.pathname === "/api/ai-workflow/status") {
    sendJson(response, 200, await workflowStatus());
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 404, { ok: false, message: "Not found" });
    return;
  }

  try {
    const body = await readRequestJson(request);
    if (url.pathname === "/api/ai-workflow/sticker-backgrounds") {
      sendJson(response, 200, await handleStickerBackgrounds(body));
      return;
    }
    if (url.pathname === "/api/ai-workflow/text-layer") {
      sendJson(response, 200, await handleTextLayer(body));
      return;
    }
    if (url.pathname === "/api/task-map/breakdown") {
      const data = await handleTaskMapBreakdown(body);
      sendJson(response, data.ok ? 200 : 400, data);
      return;
    }
    if (url.pathname === "/api/ai-workflow/makers-models-probe") {
      const data = await handleMakersModelsProbe(body);
      sendJson(response, data.ok ? 200 : 400, data);
      return;
    }
    sendJson(response, 404, { ok: false, message: "Not found" });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      message: error.message || "Local workflow server error"
    });
  }
}

export {
  handleStickerBackgrounds,
  handleTaskMapBreakdown,
  handleTextLayer,
  handleMakersModelsProbe,
  workflowStatus,
  removeConnectedMatte,
  resolveMatte,
  encodeRgbaToPng,
  decodePngToRgba
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createServer(route).listen(PORT, "127.0.0.1", () => {
    console.log(`AI workflow local server listening on http://127.0.0.1:${PORT}`);
    console.log(`Sticker image provider: ${IMAGE_PROVIDER.label}`);
    console.log(`Sticker image base URL: ${OPENAI_BASE_URL}`);
    console.log(`Image model: ${IMAGE_MODEL}`);
    console.log(`Image timeout: ${IMAGE_TIMEOUT_MS}ms${IMAGE_TIMEOUT_CLAMPED ? ` (configured ${CONFIGURED_IMAGE_TIMEOUT_MS}ms clamped)` : ""}`);
    console.log(`Image edit field: ${IMAGE_EDIT_FIELD}`);
    console.log(`Generation mode: ${GENERATION_MODE}`);
    console.log(`${IMAGE_PROVIDER.keyName}: ${API_KEY ? "configured" : "missing, local SVG fallback enabled"}`);
    console.log(`Task Map provider: ${TASKMAP_PROVIDER === "openai" ? "openai" : "deepseek"}`);
    console.log(`Task Map DeepSeek key: ${DEEPSEEK_TASKMAP_API_KEY ? "configured" : "missing"}`);
    console.log(`Task Map OpenAI key: ${OPENAI_TASKMAP_API_KEY ? "configured" : "missing"}`);
    console.log(`Task Map model: ${TASKMAP_PROVIDER === "openai" ? OPENAI_TASKMAP_MODEL : DEEPSEEK_TASKMAP_MODEL}`);
    console.log(`Makers Models experiment: ${MAKERS_MODELS_API_KEY && MAKERS_MODELS_BASE_URL ? "configured" : "not configured"}`);
  });
}
