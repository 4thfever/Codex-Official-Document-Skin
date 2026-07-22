import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const windowsRoot = path.resolve(here, "..");
const renderer = await fs.readFile(path.join(windowsRoot, "assets", "renderer-inject.js"), "utf8");
const css = await fs.readFile(path.join(windowsRoot, "assets", "dream-skin.css"), "utf8");
const proseGuide = await fs.readFile(path.join(windowsRoot, "assets", "prose-style-guide.md"), "utf8");
const documentCss = css.slice(css.indexOf("/* CODEX Document Mode"), css.indexOf("/* End CODEX Document Mode. */"));

assert.ok(documentCss.length > 0, "Document-mode CSS section is missing.");
assert.match(renderer, /mode === "codex-document"/);
assert.match(renderer, /ensureDocumentResponses\(\)/);
assert.match(renderer, /documentTitleFrom/);
assert.match(renderer, /DOCUMENT_FOOTER_STREAMING_CLASS/);
assert.match(renderer, /markPendingAssistantStream/);
assert.match(renderer, /PROSE_WRAPPER_START/);
assert.match(renderer, /用户原始请求如下：/);
assert.match(renderer, /关于星舰概念定义说明的报告/);
assert.match(renderer, /正文不得再次输出与 title 相同/);
assert.match(renderer, /concealProseWrapper/);
assert.match(renderer, /removeEventListener\?\.\("click", onClickCapture, true\)/);
assert.match(proseGuide, /妥否，请批示/);

assert.match(documentCss, /\.codex-document-response \{/);
assert.match(documentCss, /\.codex-document-response-title/);
assert.match(documentCss, /\.codex-document-response-metadata/);
assert.match(documentCss, /\.codex-document-response-footer-streaming/);
assert.match(documentCss, /text-indent: 2em/);
assert.match(documentCss, /Cascadia Code/);
assert.match(documentCss, /font-size: 20px !important/);
assert.doesNotMatch(documentCss, /aside\.app-shell-left-panel/);
assert.doesNotMatch(documentCss, /\.composer-surface-chrome/);

console.log("PASS: document-mode renderer, streaming footer, and reversible prose contracts.");
