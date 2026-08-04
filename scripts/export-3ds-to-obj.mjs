import fs from "node:fs";
import * as THREE from "three";
import { TDSLoader } from "three/examples/jsm/loaders/TDSLoader.js";

const [source, output] = process.argv.slice(2);
if (!source || !output) throw new Error("Usage: node export-3ds-to-obj.mjs input.3ds output.obj");

const bytes = fs.readFileSync(source);
const scene = new TDSLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
scene.updateMatrixWorld(true);

const lines = ["# Converted locally from 3DS for point-cloud preprocessing"];
let offset = 1;
scene.traverse(node => {
  if (!node.isMesh) return;
  const position = node.geometry.getAttribute("position");
  if (!position) return;
  const vector = new THREE.Vector3();
  for (let index = 0; index < position.count; index += 1) {
    vector.fromBufferAttribute(position, index).applyMatrix4(node.matrixWorld);
    lines.push(`v ${vector.x} ${vector.y} ${vector.z}`);
  }
  const index = node.geometry.index;
  for (let triangle = 0; triangle < (index ? index.count : position.count); triangle += 3) {
    const a = index ? index.getX(triangle) : triangle;
    const b = index ? index.getX(triangle + 1) : triangle + 1;
    const c = index ? index.getX(triangle + 2) : triangle + 2;
    lines.push(`f ${offset + a} ${offset + b} ${offset + c}`);
  }
  offset += position.count;
});

fs.writeFileSync(output, `${lines.join("\n")}\n`);
console.log(`Wrote ${offset - 1} vertices to ${output}`);
