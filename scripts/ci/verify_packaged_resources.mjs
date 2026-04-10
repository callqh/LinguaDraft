#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve("release");
const platform = process.argv[3];

if (!platform || !["win", "mac"].includes(platform)) {
  console.error("usage: node scripts/ci/verify_packaged_resources.mjs <release-root> <win|mac>");
  process.exit(1);
}

const exists = (p) => fs.existsSync(p);
const fail = (msg) => {
  console.error(`[verify-packaged-resources] ${msg}`);
  process.exit(1);
};

const findMacResources = () => {
  const candidates = [];
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name.endsWith(".app")) {
        const res = path.join(full, "Contents", "Resources");
        if (exists(res)) candidates.push(res);
        continue;
      }
      if (entry.isDirectory()) walk(full);
    }
  };
  walk(root);
  return candidates[0];
};

const resourcesRoot =
  platform === "win"
    ? path.join(root, "win-unpacked", "resources")
    : findMacResources();

if (!resourcesRoot || !exists(resourcesRoot)) {
  fail(`resources root not found for platform=${platform} under ${root}`);
}

const required = [
  path.join(resourcesRoot, "services", "ai-sidecar", "app", "main.py"),
  path.join(resourcesRoot, "services", "ai-sidecar", "requirements.txt"),
  path.join(resourcesRoot, "local-model", "models", "builtin", "translation", "zh-en", "model.bin"),
  path.join(resourcesRoot, "local-model", "models", "builtin", "translation", "en-zh", "model.bin"),
  path.join(resourcesRoot, "local-model", "manifest", "builtin.manifest.json"),
];

for (const item of required) {
  if (!exists(item)) fail(`missing required file: ${item}`);
}

console.log(`[verify-packaged-resources] OK platform=${platform} resources=${resourcesRoot}`);
