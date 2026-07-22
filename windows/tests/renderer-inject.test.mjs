import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const windowsRoot = path.resolve(here, "..");
const template = await fs.readFile(path.join(windowsRoot, "assets", "renderer-inject.js"), "utf8");
const css = await fs.readFile(path.join(windowsRoot, "assets", "dream-skin.css"), "utf8");
const proseGuide = await fs.readFile(path.join(windowsRoot, "assets", "prose-style-guide.md"), "utf8");
const buildPayload = (config = {}) => template
  .replace("__DREAM_CSS_JSON__", JSON.stringify(".fixture { color: blue; }"))
  .replace("__DREAM_ART_JSON__", JSON.stringify("data:image/png;base64,AA=="))
  .replace("__DREAM_THEME_JSON__", JSON.stringify(config))
  .replace("__DREAM_PROSE_GUIDE__", JSON.stringify(proseGuide));
const payload = buildPayload();

assert.doesNotMatch(
  css,
  /main\.main-surface\s*>\s*header\.app-header-tint\s*\{[^}]*\b(?:position|z-index)\s*:/,
  "The skin must preserve Codex's native fixed header so the side-panel toggle remains reachable.",
);

function createFixture({
  shellPresent,
  mainPresent = shellPresent,
  sidebarPresent = shellPresent,
  staleSkin = false,
  homePresent = false,
  utilityPresent = false,
  shellAppearance = "dark",
  computedColorScheme = "",
  osAppearance = "light",
  analysisFixture = null,
  structuredTitle = "",
  structuredMetadataPrefix = "",
}) {
  const nodes = new Map();
  const rootClasses = new Set(staleSkin ? ["codex-dream-skin"] : []);
  const rootStyles = new Map(staleSkin ? [["--dream-art", "url(\"blob:stale\")"]] : []);
  const revokedUrls = [];
  const observers = [];
  let objectUrlCount = 0;
  let hasMain = mainPresent;
  let hasSidebar = sidebarPresent;
  let root;
  const queueRootClassMutation = () => {
    for (const observer of observers) {
      if (observer.target !== root || !observer.options?.attributes) continue;
      if (observer.options.attributeFilter && !observer.options.attributeFilter.includes("class")) continue;
      observer.records.push({ type: "attributes", attributeName: "class", target: root });
    }
  };
  const makeClassList = (classes = new Set(), onMutation = () => {}) => ({
    add(...values) {
      let changed = false;
      for (const value of values) {
        if (!classes.has(value)) { classes.add(value); changed = true; }
      }
      if (changed) onMutation();
    },
    remove(...values) {
      let changed = false;
      for (const value of values) changed = classes.delete(value) || changed;
      if (changed) onMutation();
    },
    toggle(value, enabled) {
      const changed = enabled ? !classes.has(value) : classes.has(value);
      if (enabled) classes.add(value);
      else classes.delete(value);
      if (changed) onMutation();
    },
    contains(value) { return classes.has(value); },
  });
  const messageClasses = new Set();
  const userMessageClasses = new Set();
  const assistantAction = { parentElement: null };
  const makeMessage = (classes) => {
    const children = [];
    return {
      classList: makeClassList(classes),
      querySelector(selector) {
        const name = selector.match(/^:scope > \.([^ ]+)$/)?.[1];
        return name ? children.find((child) => child.className === name) ?? null : null;
      },
      prepend(node) {
        const existingIndex = children.indexOf(node);
        if (existingIndex >= 0) children.splice(existingIndex, 1);
        node.parentElement = this;
        children.unshift(node);
      },
      appendChild(node) {
        const existingIndex = children.indexOf(node);
        if (existingIndex >= 0) children.splice(existingIndex, 1);
        node.parentElement = this;
        children.push(node);
      },
      children,
    };
  };
  const findDirectChild = (node, selector) => {
    const name = selector.match(/^:scope > \.([^ ]+)$/)?.[1];
    return name ? node.children?.find((child) => child.className === name) ?? null : null;
  };
  const assistantMessage = makeMessage(messageClasses);
  const userMessage = makeMessage(userMessageClasses);
  const assistantMetadata = structuredTitle ? {
    textContent: `${structuredMetadataPrefix}${JSON.stringify({ codex_document: { title: structuredTitle } })}`,
    classList: makeClassList(),
  } : null;
  const virtualizedTurn = {
    parentElement: null,
    querySelectorAll(selector) {
      return selector === 'button[aria-label="从这里继续新任务"]' ? [assistantAction] : [];
    },
  };
  assistantAction.closest = (selector) =>
    selector === ".group.flex.min-w-0.flex-col" ? virtualizedTurn : null;
  assistantMessage.classList.add("w-full", "items-end", "justify-end");
  assistantAction.parentElement = assistantMessage;
  assistantMessage.querySelectorAll = (selector) => {
    if (selector === 'button[aria-label="从这里继续新任务"]') return [assistantAction];
    if (selector === "pre, code") return assistantMetadata ? [assistantMetadata] : [];
    return [];
  };

  root = {
    className: shellAppearance,
    classList: makeClassList(rootClasses, queueRootClassMutation),
    getAttribute() { return null; },
    style: {
      setProperty(key, value) { rootStyles.set(key, value); },
      removeProperty(key) { rootStyles.delete(key); },
    },
    appendChild(node) {
      node.parentElement = root;
      nodes.set(node.id, node);
    },
  };
  const body = {
    className: "",
    getAttribute() { return null; },
    appendChild(node) {
      node.parentElement = body;
      nodes.set(node.id, node);
    },
  };
  const shellMain = {
    classList: makeClassList(),
    getBoundingClientRect() {
      return { left: 290, top: 36, width: 990, height: 784 };
    },
  };
  const routeClasses = new Set();
  const utilityClasses = new Set();
  const utilityNode = { classList: makeClassList(utilityClasses) };
  const routeMain = {
    classList: makeClassList(routeClasses),
    querySelectorAll(selector) {
      if (selector === '[class*="_homeUtilityBar_"]' && utilityPresent) return [utilityNode];
      return [];
    },
  };
  const staleHome = { classList: makeClassList(new Set(["dream-home"])) };
  const staleShell = { classList: makeClassList(new Set(["dream-home-shell"])) };

  const createElement = (tagName) => {
    if (tagName === "canvas" && analysisFixture) {
      return {
        width: 0,
        height: 0,
        getContext() {
          return {
            drawImage() {},
            getImageData() { return { data: analysisFixture.pixels }; },
          };
        },
      };
    }
    return {
      id: "",
      dataset: {},
      style: {},
      classList: makeClassList(),
      className: "",
      parentElement: null,
      children: [],
      textContent: "",
      innerHTML: "",
      setAttribute() {},
      querySelector(selector) { return findDirectChild(this, selector); },
      prepend(node) {
        const existingIndex = this.children.indexOf(node);
        if (existingIndex >= 0) this.children.splice(existingIndex, 1);
        node.parentElement = this;
        this.children.unshift(node);
      },
      appendChild(node) {
        const existingIndex = this.children.indexOf(node);
        if (existingIndex >= 0) this.children.splice(existingIndex, 1);
        node.parentElement = this;
        this.children.push(node);
      },
      remove() {
        nodes.delete(this.id);
        if (this.parentElement?.children) {
          const index = this.parentElement.children.indexOf(this);
          if (index >= 0) this.parentElement.children.splice(index, 1);
        }
      },
    };
  };
  if (staleSkin) {
    const style = createElement();
    style.id = "codex-dream-skin-style";
    nodes.set(style.id, style);
    const chrome = createElement();
    chrome.id = "codex-dream-skin-chrome";
    nodes.set(chrome.id, chrome);
  }

  const document = {
    documentElement: root,
    head: root,
    body,
    createElement,
    getElementById(id) { return nodes.get(id) ?? null; },
    querySelector(selector) {
      if (selector === "main.main-surface") return hasMain ? shellMain : null;
      if (selector === "main") return hasMain ? shellMain : null;
      if (selector === "aside.app-shell-left-panel") return hasSidebar ? {} : null;
      if (selector === '[role="main"]:has([data-testid="home-icon"])') {
        return hasMain && homePresent ? routeMain : null;
      }
      if (selector === '[role="main"]') return hasMain ? routeMain : null;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[role="main"]') return hasMain ? [routeMain] : [];
      if (selector === ".dream-task") return routeClasses.has("dream-task") ? [routeMain] : [];
      if (selector === ".dream-home-utility") {
        return utilityClasses.has("dream-home-utility") ? [utilityNode] : [];
      }
      if (selector === '[data-message-author-role="assistant"]') return hasMain ? [assistantMessage] : [];
      if (selector === 'button[aria-label="从这里继续新任务"]') return hasMain ? [assistantAction] : [];
      if (selector === ".codex-document-response") {
        return messageClasses.has("codex-document-response") ? [assistantMessage] : [];
      }
      if (selector === ".codex-document-response-header, .codex-document-response-greeting, .codex-document-response-title, .codex-document-response-footer") {
        return assistantMessage.children.filter((node) =>
          node.className === "codex-document-response-header" ||
          node.className === "codex-document-response-greeting" ||
          node.className === "codex-document-response-title" ||
          node.className === "codex-document-response-footer");
      }
      if (!staleSkin) return [];
      if (selector === ".dream-home") return [staleHome];
      if (selector === ".dream-home-shell") return [staleShell];
      return [];
    },
  };
  const context = {
    window: {
      matchMedia() { return { matches: osAppearance === "dark" }; },
    },
    document,
    MutationObserver: class {
      constructor(callback) {
        this.callback = callback;
        this.records = [];
        this.target = null;
        this.options = null;
        observers.push(this);
      }
      observe(target, options = {}) {
        this.target = target;
        this.options = options;
      }
      disconnect() {
        this.target = null;
        this.records = [];
      }
      takeRecords() {
        const records = this.records;
        this.records = [];
        return records;
      }
    },
    URL: {
      createObjectURL() { objectUrlCount += 1; return `blob:fixture-${objectUrlCount}`; },
      revokeObjectURL(value) { revokedUrls.push(value); },
    },
    Blob,
    Uint8Array,
    atob,
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: () => 2,
    clearTimeout: () => {},
    getComputedStyle() { return { colorScheme: computedColorScheme }; },
  };
  if (analysisFixture) {
    context.Image = class {
      naturalWidth = analysisFixture.naturalWidth;
      naturalHeight = analysisFixture.naturalHeight;
      set src(_) { this.onload(); }
    };
  }

  return {
    context,
    nodes,
    observers,
    rootClasses,
    rootStyles,
    revokedUrls,
    routeClasses,
    utilityClasses,
    messageClasses,
    userMessageClasses,
    assistantMessage,
    assistantMetadata,
    userMessage,
    setShellPresent(value) {
      hasMain = value;
      hasSidebar = value;
    },
    setSidebarPresent(value) { hasSidebar = value; },
    setMainPresent(value) { hasMain = value; },
  };
}

const main = createFixture({ shellPresent: true });
const mainResult = vm.runInNewContext(payload, main.context);
assert.equal(mainResult.installed, true);
assert.equal(main.rootClasses.has("codex-dream-skin"), true);
assert.equal(main.rootStyles.get("--dream-art"), 'url("blob:fixture-1")');
assert.equal(main.nodes.has("codex-dream-skin-style"), true);
assert.equal(main.nodes.has("codex-dream-skin-chrome"), true);
assert.equal(main.rootClasses.has("dream-theme-dark"), true);
assert.equal(main.rootClasses.has("dream-art-standard"), true);
assert.equal(main.rootClasses.has("dream-task-ambient"), true);
assert.equal(main.routeClasses.has("dream-task"), true);
assert.equal(main.context.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);
assert.equal(main.rootClasses.has("codex-dream-skin"), false);
assert.equal(main.rootClasses.has("dream-theme-dark"), false);
assert.equal(main.nodes.has("codex-dream-skin-style"), false);
assert.equal(main.nodes.has("codex-dream-skin-chrome"), false);
assert.deepEqual(main.revokedUrls, ["blob:fixture-1"]);

const reinjected = createFixture({ shellPresent: true });
vm.runInNewContext(payload, reinjected.context);
const firstState = reinjected.context.window.__CODEX_DREAM_SKIN_STATE__;
vm.runInNewContext(payload, reinjected.context);
const secondState = reinjected.context.window.__CODEX_DREAM_SKIN_STATE__;
assert.notEqual(secondState.installToken, firstState.installToken);
assert.equal(secondState.artUrl, "blob:fixture-2");
assert.equal(reinjected.rootStyles.get("--dream-art"), 'url("blob:fixture-2")');
assert.deepEqual(reinjected.revokedUrls, ["blob:fixture-1"]);
assert.equal(firstState.cleanup(), false);
assert.equal(secondState.cleanup(), true);

const auxiliary = createFixture({ shellPresent: false, staleSkin: true });
const auxiliaryResult = vm.runInNewContext(payload, auxiliary.context);
assert.equal(auxiliaryResult.installed, true);
assert.equal(auxiliary.rootClasses.has("codex-dream-skin"), false);
assert.equal(auxiliary.rootStyles.has("--dream-art"), false);
assert.equal(auxiliary.nodes.has("codex-dream-skin-style"), false);
assert.equal(auxiliary.nodes.has("codex-dream-skin-chrome"), false);

auxiliary.setShellPresent(true);
auxiliary.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(auxiliary.rootClasses.has("codex-dream-skin"), true);
assert.equal(auxiliary.nodes.has("codex-dream-skin-style"), true);
assert.equal(auxiliary.nodes.has("codex-dream-skin-chrome"), true);

// Collapsing the left rail removes aside.app-shell-left-panel while the main
// surface remains. The active theme must stay applied instead of flashing the
// native Codex chrome.
const collapsedSidebar = createFixture({
  shellPresent: true,
  mainPresent: true,
  sidebarPresent: false,
  staleSkin: true,
});
const collapsedResult = vm.runInNewContext(payload, collapsedSidebar.context);
assert.equal(collapsedResult.installed, true);
assert.equal(collapsedSidebar.rootClasses.has("codex-dream-skin"), true);
assert.equal(collapsedSidebar.rootStyles.has("--dream-art"), true);
assert.equal(collapsedSidebar.nodes.has("codex-dream-skin-style"), true);
assert.equal(collapsedSidebar.nodes.has("codex-dream-skin-chrome"), true);
assert.equal(collapsedSidebar.rootClasses.has("dream-theme-dark"), true);

collapsedSidebar.setSidebarPresent(false);
collapsedSidebar.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(collapsedSidebar.rootClasses.has("codex-dream-skin"), true);
assert.equal(collapsedSidebar.nodes.has("codex-dream-skin-style"), true);

collapsedSidebar.setMainPresent(false);
collapsedSidebar.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(collapsedSidebar.rootClasses.has("codex-dream-skin"), false);
assert.equal(collapsedSidebar.nodes.has("codex-dream-skin-style"), false);

const configured = createFixture({
  shellPresent: true,
  homePresent: true,
  utilityPresent: true,
});
const configuredPayload = buildPayload({
  appearance: "light",
  palette: { accent: "#d45a70" },
  art: { focusX: .15, focusY: .8, safeArea: "right", taskMode: "off" },
});
const configuredResult = vm.runInNewContext(configuredPayload, configured.context);
assert.equal(configuredResult.adaptive, true);
assert.equal(configured.rootClasses.has("dream-theme-light"), true);
assert.equal(configured.rootClasses.has("dream-theme-dark"), false);
assert.equal(configured.rootClasses.has("dream-focus-left"), true);
assert.equal(configured.rootClasses.has("dream-safe-right"), true);
assert.equal(configured.rootClasses.has("dream-task-off"), true);
assert.equal(configured.rootStyles.get("--dream-art-position"), "15% 80%");
assert.equal(configured.rootStyles.get("--dream-accent"), "#d45a70");
assert.equal(configured.routeClasses.has("dream-home"), true);
assert.equal(configured.routeClasses.has("dream-task"), false);
assert.equal(configured.utilityClasses.has("dream-home-utility"), true);
assert.equal(configured.context.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);
assert.equal(configured.utilityClasses.has("dream-home-utility"), false);

const documentMode = createFixture({ shellPresent: true });
const documentPayload = buildPayload({
  mode: "codex-document",
  appearance: "light",
  document: {
    masthead: "美国科代克斯技术服务有限公司",
    greeting: "尊敬的董事长：",
    closing: "此致",
    signature: "山姆·奥特曼",
    accent: "#a80000",
    surface: "#f8f7f2",
    text: "#1d1d1d",
    border: "#c9c3ba",
  },
});
const documentResult = vm.runInNewContext(documentPayload, documentMode.context);
assert.equal(documentResult.documentMode, true);
assert.equal(documentResult.adaptive, false);
assert.equal(documentMode.rootClasses.has("codex-dream-skin"), false);
assert.equal(documentMode.rootClasses.has("codex-document-mode"), true);
assert.equal(documentMode.rootStyles.has("--dream-art"), false);
assert.equal(documentMode.messageClasses.has("codex-document-response"), true);
assert.equal(documentMode.userMessageClasses.has("codex-document-response"), false);
assert.equal(documentMode.assistantMessage.children.length, 3);
assert.equal(documentMode.assistantMessage.children[0].className, "codex-document-response-header");
assert.equal(documentMode.assistantMessage.children[0].textContent, "美国科代克斯技术服务有限公司");
assert.equal(documentMode.assistantMessage.children[1].className, "codex-document-response-greeting");
assert.equal(documentMode.assistantMessage.children[1].textContent, "尊敬的董事长：");
assert.equal(documentMode.assistantMessage.children[2].className, "codex-document-response-footer");
assert.equal(documentMode.assistantMessage.children[2].children[0].textContent, "此致");
assert.equal(documentMode.assistantMessage.children[2].children[1].textContent, "山姆·奥特曼");
assert.match(documentMode.assistantMessage.children[2].children[2].textContent, /^\d{4}年\d{1,2}月\d{1,2}日$/);
const feedback = documentMode.context.window.__CODEX_DREAM_SKIN_STATE__.feedback;
const line = (from, to, steps = 18) => Array.from({ length: steps + 1 }, (_, index) => ({
  x: from.x + ((to.x - from.x) * index / steps),
  y: from.y + ((to.y - from.y) * index / steps),
}));
const circle = Array.from({ length: 49 }, (_, index) => {
  const angle = index * 2 * Math.PI / 48;
  return { x: .5 + .33 * Math.cos(angle), y: .5 + .24 * Math.sin(angle) };
});
assert.equal(feedback.classify([circle]).kind, "agree", "Elliptical closed strokes must map to agreement.");
assert.equal(feedback.classify([
  line({ x: .16, y: .14 }, { x: .84, y: .86 }),
  line({ x: .84, y: .14 }, { x: .16, y: .86 }),
]).kind, "disagree", "Two-stroke crosses must map to disagreement.");
assert.equal(feedback.classify([[
  ...line({ x: .16, y: .14 }, { x: .84, y: .86 }),
  ...line({ x: .84, y: .86 }, { x: .84, y: .14 }).slice(1),
  ...line({ x: .84, y: .14 }, { x: .16, y: .86 }).slice(1),
]]).kind, "disagree", "Connected crosses may contain a short turnaround segment.");
assert.equal(feedback.classify([[
  ...line({ x: .18, y: .18 }, { x: .5, y: .82 }),
  ...line({ x: .5, y: .82 }, { x: .82, y: .18 }).slice(1),
]]).kind, "unknown", "A V shape must not be mapped to disagreement.");
assert.equal(feedback.classify([line({ x: .15, y: .25 }, { x: .75, y: .8 })]).kind, "unknown", "An open stroke must not be mapped to agreement.");
documentMode.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(documentMode.assistantMessage.children.length, 3, "Document shell must remain idempotent during streaming updates.");
assert.equal(documentMode.context.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);
assert.equal(documentMode.rootClasses.has("codex-document-mode"), false);
assert.equal(documentMode.messageClasses.has("codex-document-response"), false);
assert.equal(documentMode.assistantMessage.children.length, 0);

const titledDocument = createFixture({ shellPresent: true, structuredTitle: "关于项目进展情况的报告" });
vm.runInNewContext(documentPayload, titledDocument.context);
assert.equal(titledDocument.assistantMessage.children.length, 4);
assert.equal(titledDocument.assistantMessage.children[1].className, "codex-document-response-title");
assert.equal(titledDocument.assistantMessage.children[1].textContent, "关于项目进展情况的报告");
assert.equal(titledDocument.assistantMetadata.classList.contains("codex-document-response-metadata"), true);

const languageLabeledTitle = createFixture({
  shellPresent: true,
  structuredTitle: "关于项目进展情况的报告",
  structuredMetadataPrefix: "json\n",
});
vm.runInNewContext(documentPayload, languageLabeledTitle.context);
assert.equal(languageLabeledTitle.assistantMessage.children[1].textContent, "关于项目进展情况的报告");
assert.equal(languageLabeledTitle.assistantMetadata.classList.contains("codex-document-response-metadata"), true);

const explanatoryDocumentTitle = createFixture({ shellPresent: true, structuredTitle: "关于项目进展情况的说明" });
vm.runInNewContext(documentPayload, explanatoryDocumentTitle.context);
assert.equal(explanatoryDocumentTitle.assistantMessage.children[1].textContent, "关于项目进展情况的说明");
assert.equal(explanatoryDocumentTitle.assistantMetadata.classList.contains("codex-document-response-metadata"), true);

const invalidDocumentTitle = createFixture({ shellPresent: true, structuredTitle: "项目进展情况说明" });
vm.runInNewContext(documentPayload, invalidDocumentTitle.context);
assert.equal(invalidDocumentTitle.assistantMessage.children.some((node) => node.className === "codex-document-response-title"), false);
assert.equal(invalidDocumentTitle.assistantMetadata.classList.contains("codex-document-response-metadata"), true);

const documentCssStart = css.indexOf("/* CODEX Document Mode");
const documentCssEnd = css.indexOf("/* End CODEX Document Mode. */");
const documentCss = css.slice(documentCssStart, documentCssEnd);
assert.ok(documentCss.length > 0, "Document-mode CSS marker is missing.");
assert.doesNotMatch(
  documentCss,
  /aside\.app-shell-left-panel/,
  "Document mode must not style the native left sidebar.",
);
assert.doesNotMatch(
  documentCss,
  /\.composer-surface-chrome/,
  "Document mode must not restyle the native composer.",
);
assert.match(documentCss, /\.codex-document-response \{/);
assert.match(documentCss, /Cascadia Code/, "Document mode must preserve a monospace stack for code.");
assert.match(documentCss, /\.codex-document-response-title/, "Document mode must format structured response titles.");
assert.match(documentCss, /\.codex-document-response-metadata/, "Document metadata must be hidden without removing it.");
assert.match(documentCss, /font-size: 20px !important/, "Document body text must remain readable at the increased size.");
assert.doesNotMatch(template, /range\.collapse\(true\)/, "Composer replacement must not prepend the wrapper to the existing request.");
assert.match(documentCss, /text-indent: 2em/, "Document paragraphs must follow the two-character first-line indent convention.");
assert.match(template, /关于星舰概念定义说明的报告/, "The wrapper must require titles with a specific, complete subject matter.");
assert.match(template, /正文不得再次输出与 title 相同/, "The wrapper must forbid a duplicate Markdown title in the body.");
assert.match(template, /nativeTitle\.remove/, "The renderer must remove a legacy duplicate native title.");
assert.match(documentCss, /codex-document-response h3/, "Document mode must size third-level headings explicitly.");
assert.match(documentCss, /codex-document-response h4/, "Document mode must size fourth-level headings explicitly.");
assert.doesNotMatch(documentCss, /codex-document-prose-toggle/, "The prose wrapper must not create visible composer controls.");

assert.match(template, /PROSE_WRAPPER_START/, "Document mode must contain a reversible prose wrapper marker.");
assert.match(template, /concealProseWrapper/, "Wrapped user messages must be locally restored after Codex renders them.");
assert.match(template, /data-user-message-bubble/, "The wrapper concealment must target Codex user-message bubbles.");
assert.match(template, /\[data-markdown-copy="code-block"\]/, "Structured metadata must hide Codex's complete code-block container.");
assert.match(template, /__DREAM_PROSE_GUIDE__/, "The renderer must receive the complete prose guide through the payload.");
assert.match(template, /"codex_document"/, "The wrapper must require structured document metadata.");
assert.match(template, /documentTitleFrom/, "Structured titles must be parsed from assistant metadata.");
assert.match(template, /ensureProseWrapper/, "The prose wrapper must install during document mode.");
assert.match(template, /removeEventListener\?\.\("click", onClickCapture, true\)/, "Cleanup must remove the native send wrapper listener.");
assert.doesNotMatch(template, /PROSE_TOGGLE_ID/, "The prose wrapper must not expose a visible toggle.");
assert.match(proseGuide, /妥否，请批示/, "The full prose guide must include formal phrase rules.");
assert.match(template, /feedbackClassification/, "Document mode must provide local circle/cross classification.");
assert.match(template, /nativeSendButton/, "Auto-send must use the native composer send control.");
assert.match(template, /state\.wasEmpty && !currentText\.trim\(\) && config\.feedback\.autoSend/,
  "Auto-send must require an originally and currently empty composer.");
assert.match(template, /turns < 2/, "One-stroke V gestures must not be accepted as connected crosses.");
assert.match(css, /#codex-document-feedback-board/, "Document mode must style its scoped feedback board.");
assert.match(css, /touch-action: none/, "The feedback canvas must own pointer gestures only within its bounds.");
assert.match(css, /position: fixed/, "The feedback canvas must sit beside rather than inside the native composer.");
assert.doesNotMatch(template, /撤销最近笔画|清空标记|自动发送反馈/,
  "The compact feedback surface must contain only the handwriting canvas.");

const analysisPixels = new Uint8ClampedArray(48 * 12 * 4);
for (let index = 0; index < 48 * 12; index += 1) {
  const offset = index * 4;
  const x = index % 48;
  const subject = x >= 34 && x <= 42;
  analysisPixels[offset] = subject ? 210 : 246;
  analysisPixels[offset + 1] = subject ? 84 : 239;
  analysisPixels[offset + 2] = subject ? 112 : 237;
  analysisPixels[offset + 3] = 255;
}
const analyzed = createFixture({
  shellPresent: true,
  analysisFixture: { naturalWidth: 1200, naturalHeight: 400, pixels: analysisPixels },
});
vm.runInNewContext(payload, analyzed.context);
await Promise.resolve();
assert.equal(analyzed.rootClasses.has("dream-theme-dark"), true);
assert.equal(analyzed.rootClasses.has("dream-theme-light"), false);
assert.equal(analyzed.rootClasses.has("dream-art-wide"), true);
assert.equal(analyzed.rootClasses.has("dream-task-banner"), true);
assert.equal(analyzed.rootClasses.has("dream-safe-left"), true);
assert.notEqual(analyzed.rootStyles.get("--dream-accent"), "rgb(216 104 119)");

const standardArt = createFixture({
  shellPresent: true,
  analysisFixture: { naturalWidth: 800, naturalHeight: 800, pixels: analysisPixels },
});
vm.runInNewContext(payload, standardArt.context);
await Promise.resolve();
assert.equal(standardArt.rootClasses.has("dream-art-standard"), true);
assert.equal(standardArt.rootClasses.has("dream-task-ambient"), true);
assert.equal(standardArt.rootClasses.has("dream-task-banner"), false);

const mediumWide = createFixture({
  shellPresent: true,
  analysisFixture: { naturalWidth: 2100, naturalHeight: 1000, pixels: analysisPixels },
});
vm.runInNewContext(payload, mediumWide.context);
await Promise.resolve();
assert.equal(mediumWide.rootClasses.has("dream-art-wide"), true);
assert.equal(mediumWide.rootClasses.has("dream-task-ambient"), true);
assert.equal(mediumWide.rootClasses.has("dream-task-banner"), false);

const nativeLight = createFixture({ shellPresent: true, shellAppearance: "light" });
vm.runInNewContext(payload, nativeLight.context);
assert.equal(nativeLight.rootClasses.has("dream-theme-light"), true);
assert.equal(nativeLight.rootClasses.has("dream-theme-dark"), false);

const nativeComputedDark = createFixture({
  shellPresent: true,
  shellAppearance: "",
  computedColorScheme: "dark",
  osAppearance: "light",
});
vm.runInNewContext(payload, nativeComputedDark.context);
assert.equal(nativeComputedDark.rootClasses.has("dream-theme-dark"), true);
assert.equal(nativeComputedDark.rootClasses.has("dream-theme-light"), false);
nativeComputedDark.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(nativeComputedDark.rootClasses.has("dream-theme-dark"), true);
const nativeObserver = nativeComputedDark.observers[0];
nativeObserver.takeRecords();
nativeComputedDark.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(nativeObserver.takeRecords().length, 0,
  "Sampling the native computed color-scheme must not queue a self-triggering root mutation pass.");

const metadataWide = createFixture({ shellPresent: true });
vm.runInNewContext(buildPayload({ artMetadata: { ratio: 16 / 9 } }), metadataWide.context);
assert.equal(metadataWide.rootClasses.has("dream-art-wide"), true);
assert.equal(metadataWide.rootClasses.has("dream-art-standard"), false);

console.log("PASS: renderer applies adaptive theme metadata, keeps skin without a sidebar, and preserves transparent auxiliary windows.");
