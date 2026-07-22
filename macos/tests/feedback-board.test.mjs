import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const macosRoot = path.resolve(here, "..");
const template = await fs.readFile(path.join(macosRoot, "assets", "renderer-inject.js"), "utf8");
const proseGuide = await fs.readFile(path.join(macosRoot, "assets", "prose-style-guide.md"), "utf8");
const payload = template
  .replace("__DREAM_CSS_JSON__", JSON.stringify(""))
  .replace("__DREAM_ART_JSON__", JSON.stringify("data:image/png;base64,AA=="))
  .replace("__DREAM_THEME_JSON__", JSON.stringify({ mode: "codex-document" }))
  .replace("__DREAM_PROSE_GUIDE__", JSON.stringify(proseGuide));

const classList = { add() {}, remove() {}, contains() { return false; } };
const root = { className: "", classList, style: { setProperty() {}, removeProperty() {} }, getAttribute() { return null; } };
const context = {
  window: { matchMedia: () => ({ matches: false }) },
  document: {
    documentElement: root,
    body: { className: "", getAttribute() { return null; } },
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() { return { style: {}, classList, remove() {} }; },
  },
  MutationObserver: class { observe() {} disconnect() {} takeRecords() { return []; } },
  URL: { createObjectURL: () => "blob:fixture", revokeObjectURL() {} },
  Blob,
  Uint8Array,
  atob,
  setInterval: () => 1,
  clearInterval() {},
  setTimeout: () => 1,
  clearTimeout() {},
  getComputedStyle: () => ({ colorScheme: "light" }),
};

vm.runInNewContext(payload, context);
const { classify } = context.window.__CODEX_DREAM_SKIN_STATE__.feedback;
const { sendButtonFrom } = context.window.__CODEX_DREAM_SKIN_STATE__.stream;
const button = (ariaLabel = null) => ({
  querySelector(selector) { return selector === "svg" ? {} : null; },
  getAttribute(name) { return name === "aria-label" ? ariaLabel : null; },
});
const attachment = button("附加文件");
const labeledSend = button("发送消息");
const legacySend = button();
const composer = {
  querySelectorAll() { return [attachment, legacySend, labeledSend]; },
};
assert.equal(sendButtonFrom(composer), labeledSend,
  "A labeled native send control must be preferred over generic composer buttons.");
assert.equal(sendButtonFrom({ querySelectorAll() { return [attachment, legacySend]; } }), legacySend,
  "Older unlabeled native send controls must remain supported.");
const line = (first, last, count = 24) => Array.from({ length: count }, (_, index) => ({
  x: first.x + (last.x - first.x) * index / (count - 1),
  y: first.y + (last.y - first.y) * index / (count - 1),
}));
const circle = Array.from({ length: 49 }, (_, index) => {
  const angle = -Math.PI / 2 + index * 2 * Math.PI / 48;
  return { x: .5 + .28 * Math.cos(angle), y: .5 + .24 * Math.sin(angle) };
});

assert.equal(classify([circle]).kind, "agree");
assert.equal(classify([
  line({ x: .16, y: .14 }, { x: .84, y: .86 }),
  line({ x: .84, y: .14 }, { x: .16, y: .86 }),
]).kind, "disagree");
assert.equal(classify([[...line({ x: .18, y: .18 }, { x: .5, y: .82 }), ...line({ x: .5, y: .82 }, { x: .82, y: .18 }).slice(1)]]).kind, "unknown");
assert.equal(classify([line({ x: .15, y: .25 }, { x: .75, y: .8 })]).kind, "unknown");

console.log("PASS: feedback board distinguishes circles, crosses, V strokes, and open strokes.");
