import assert from "node:assert/strict";
import {
  removeConnectedMatte,
  resolveMatte,
  encodeRgbaToPng,
  decodePngToRgba
} from "./ai-workflow-server.mjs";

// These tests never call the image API. They synthesize matte+glyph PNGs in memory and verify
// that the cutout only removes the border-connected matte while preserving interior detail
// (a white highlight inside dark text, and a black outline inside light text).

const WIDTH = 32;
const HEIGHT = 32;

function makeRgba(fill) {
  const rgba = Buffer.alloc(WIDTH * HEIGHT * 4);
  for (let pixel = 0; pixel < WIDTH * HEIGHT; pixel += 1) {
    const index = pixel * 4;
    rgba[index] = fill[0];
    rgba[index + 1] = fill[1];
    rgba[index + 2] = fill[2];
    rgba[index + 3] = 255;
  }
  return rgba;
}

function setPixel(rgba, x, y, color) {
  const index = (y * WIDTH + x) * 4;
  rgba[index] = color[0];
  rgba[index + 1] = color[1];
  rgba[index + 2] = color[2];
  rgba[index + 3] = 255;
}

function fillRect(rgba, x0, y0, x1, y1, color) {
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) setPixel(rgba, x, y, color);
  }
}

function toDataUrl(rgba) {
  const png = encodeRgbaToPng({ width: WIDTH, height: HEIGHT, rgba });
  return `data:image/png;base64,${png.toString("base64")}`;
}

function alphaAt(rgba, x, y) {
  return rgba[(y * WIDTH + x) * 4 + 3];
}

// ---- Test 1: white matte, dark glyph block with an interior white highlight ----
{
  const rgba = makeRgba([255, 255, 255]); // pure white matte everywhere
  // Dark glyph block in the center (well away from the border).
  fillRect(rgba, 10, 10, 22, 22, [30, 34, 28]);
  // Interior white highlight INSIDE the dark block — must survive (not border-connected).
  fillRect(rgba, 14, 14, 18, 18, [255, 255, 255]);

  const out = removeConnectedMatte(toDataUrl(rgba), "white");
  const decoded = decodePngToRgba(Buffer.from(out.split(",")[1], "base64"));

  // Border matte fully transparent.
  assert.equal(alphaAt(decoded.rgba, 0, 0), 0, "white matte corner should be transparent");
  assert.equal(alphaAt(decoded.rgba, 31, 31), 0, "white matte far corner should be transparent");
  // Dark glyph body fully opaque.
  assert.equal(alphaAt(decoded.rgba, 11, 11), 255, "dark glyph edge should stay opaque");
  assert.equal(alphaAt(decoded.rgba, 20, 20), 255, "dark glyph body should stay opaque");
  // Interior white highlight preserved (NOT keyed out, because it is not border-connected).
  assert.equal(alphaAt(decoded.rgba, 16, 16), 255, "interior white highlight must be preserved");
  console.log("PASS: white matte keeps interior highlight, removes connected matte");
}

// ---- Test 2: black matte, light glyph block with an interior black detail ----
{
  const rgba = makeRgba([0, 0, 0]); // pure black matte everywhere
  // Light glyph block in the center.
  fillRect(rgba, 10, 10, 22, 22, [240, 238, 230]);
  // Interior black detail INSIDE the light block — must survive.
  fillRect(rgba, 14, 14, 18, 18, [0, 0, 0]);

  const out = removeConnectedMatte(toDataUrl(rgba), "black");
  const decoded = decodePngToRgba(Buffer.from(out.split(",")[1], "base64"));

  assert.equal(alphaAt(decoded.rgba, 0, 0), 0, "black matte corner should be transparent");
  assert.equal(alphaAt(decoded.rgba, 31, 31), 0, "black matte far corner should be transparent");
  assert.equal(alphaAt(decoded.rgba, 11, 11), 255, "light glyph edge should stay opaque");
  assert.equal(alphaAt(decoded.rgba, 20, 20), 255, "light glyph body should stay opaque");
  assert.equal(alphaAt(decoded.rgba, 16, 16), 255, "interior black detail must be preserved");
  console.log("PASS: black matte keeps interior detail, removes connected matte");
}

// ---- Test 3: resolveMatte mode mapping ----
{
  const dark = resolveMatte("dark", "");
  assert.equal(dark.matteMode, "white");
  assert.equal(dark.textBrightness, "dark");

  const light = resolveMatte("light", "");
  assert.equal(light.matteMode, "black");
  assert.equal(light.textBrightness, "light");

  // Auto with no decodable sticker defaults to dark-on-white.
  const autoDefault = resolveMatte("auto", "");
  assert.equal(autoDefault.matteMode, "white");
  assert.equal(autoDefault.brightnessSource, "auto-default");

  // Auto over a dark PNG sticker -> light text on black matte.
  const darkSticker = makeRgba([20, 24, 18]);
  const autoDark = resolveMatte("auto", toDataUrl(darkSticker));
  assert.equal(autoDark.matteMode, "black", "auto over dark sticker should pick black matte");
  assert.equal(autoDark.textBrightness, "light");

  // Auto over a bright PNG sticker -> dark text on white matte.
  const brightSticker = makeRgba([210, 205, 180]);
  const autoBright = resolveMatte("auto", toDataUrl(brightSticker));
  assert.equal(autoBright.matteMode, "white", "auto over bright sticker should pick white matte");
  assert.equal(autoBright.textBrightness, "dark");

  console.log("PASS: resolveMatte maps modes and auto-brightness correctly");
}

console.log("ALL MATTE TESTS PASSED");
