((cssText, artDataUrl, rawConfig) => {
  const STATE_KEY = "__CODEX_DREAM_SKIN_STATE__";
  const STYLE_ID = "codex-dream-skin-style";
  const CHROME_ID = "codex-dream-skin-chrome";
  const ROOT_CLASSES = [
    "codex-dream-skin",
    "dream-theme-light",
    "dream-theme-dark",
    "dream-art-wide",
    "dream-art-standard",
    "dream-focus-left",
    "dream-focus-center",
    "dream-focus-right",
    "dream-safe-left",
    "dream-safe-center",
    "dream-safe-right",
    "dream-safe-none",
    "dream-task-ambient",
    "dream-task-banner",
    "dream-task-off",
  ];
  const ROOT_PROPERTIES = [
    "--dream-art",
    "--dream-art-position",
    "--dream-focus-x",
    "--dream-focus-y",
    "--dream-accent",
    "--dream-accent-ink",
    "--dream-image-luma",
  ];
  const HOME_UTILITY_CLASS = "dream-home-utility";
  const DOCUMENT_MODE_CLASS = "codex-document-mode";
  const DOCUMENT_RESPONSE_CLASS = "codex-document-response";
  const DOCUMENT_HEADER_CLASS = "codex-document-response-header";
  const DOCUMENT_GREETING_CLASS = "codex-document-response-greeting";
  const DOCUMENT_TITLE_CLASS = "codex-document-response-title";
  const DOCUMENT_FOOTER_CLASS = "codex-document-response-footer";
  const DOCUMENT_FOOTER_STREAMING_CLASS = "codex-document-response-footer-streaming";
  const DOCUMENT_CLOSING_CLASS = "codex-document-response-closing";
  const DOCUMENT_SIGNATURE_CLASS = "codex-document-response-signature";
  const DOCUMENT_DATE_CLASS = "codex-document-response-date";
  const DOCUMENT_METADATA_CLASS = "codex-document-response-metadata";
  const FEEDBACK_BOARD_ID = "codex-document-feedback-board";
  const FEEDBACK_STATUS_CLASS = "codex-document-feedback-status";
  const FEEDBACK_AGREE = "【反馈：同意】";
  const FEEDBACK_DISAGREE = "【反馈：不同意】";
  const FEEDBACK_UNKNOWN = "【反馈：无法判断】";
  const FEEDBACK_SETTLE_MS = 380;
  const FEEDBACK_DEADLINE_MS = 1500;
  const PROSE_WRAPPER_START = "[CODEX_DOCUMENT_PROSE_WRAPPER_START]";
  const PROSE_WRAPPER_END = "[CODEX_DOCUMENT_PROSE_WRAPPER_END]";
  const PROSE_USER_REQUEST_MARKER = "用户原始请求如下：";
  const PROSE_GUIDE = __DREAM_PROSE_GUIDE__;
  const PROSE_WRAPPER = `${PROSE_WRAPPER_START}
你正在使用 CODEX 正式文风模式。以下约束仅规定表达和结构，不改变用户提供的事实、立场、选材或任务。
回复必须先单独输出一个 JSON 代码块，且仅使用如下结构：
\`\`\`json
{"codex_document":{"title":"关于{事项}的{文种}"}}
\`\`\`
随后输出正常 Markdown 正文。title 必须严格采用“关于{事项}的{文种}”格式。事项必须完整、明确地说明本次回复的对象和核心动作、范围或内容，不得只写宽泛主题名词；例如用户问“什么是星舰”时，应写“关于星舰概念定义说明的报告”，不得写“关于星舰的报告”。文种按沟通目的选择，如通知、请示、报告、函、通报、意见、批复或纪要，不得使用“标题”“说明”等泛称代替文种。正文不得再次输出与 title 相同的 Markdown 标题或首段标题。不得虚构机构、政策、权限、文号、签发、密级或法律效力。代码、命令、日志、表格、JSON、差异和用户指定格式保持原样。

以下是完整文风规则：
${PROSE_GUIDE}
${PROSE_WRAPPER_END}
`;
  const ASSISTANT_MARKER_SELECTOR = '[data-message-author-role="assistant"]';
  const ASSISTANT_ACTION_SELECTOR = 'button[aria-label="从这里继续新任务"]';
  const ASSISTANT_TURN_SELECTOR = ".group.flex.min-w-0.flex-col";
  const installToken = {};
  let samplingNativeShell = false;
  let observer = null;
  let proseCleanup = null;
  let proseTarget = null;
  let proseRestore = null;
  let streamCleanup = null;
  let streamTarget = null;
  let feedbackCleanup = null;
  let feedbackTarget = null;
  let pendingAssistantStream = null;
  window.__CODEX_DREAM_SKIN_DISABLED__ = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number(value)));
  const luminance = (red, green, blue) => {
    const linear = [red, green, blue].map((value) => {
      const channel = value / 255;
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    });
    return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
  };
  const defaultProfile = {
    appearance: "dark",
    accent: [108, 131, 142],
    focusX: .5,
    focusY: .5,
    aspect: 1.6,
    luma: .32,
    safeArea: "center",
  };

  const normalizeConfig = (value) => {
    const config = value && typeof value === "object" ? value : {};
    const art = config.art && typeof config.art === "object" ? config.art : {};
    const hasNumber = (candidate) =>
      (typeof candidate === "number" || (typeof candidate === "string" && candidate.trim() !== "")) &&
      Number.isFinite(Number(candidate));
    const requestedAccent = typeof config?.palette?.accent === "string"
      ? config.palette.accent.trim()
      : "";
    const safeAccent = /^(?:#[\da-f]{3,8}|(?:rgb|hsl|oklch|oklab)\([^;{}]{1,96}\))$/i.test(requestedAccent)
      ? requestedAccent
      : null;
    const appearance = ["auto", "light", "dark"].includes(config.appearance)
      ? config.appearance
      : "auto";
    const safeArea = ["auto", "left", "right", "center", "none"].includes(art.safeArea)
      ? art.safeArea
      : "auto";
    const taskMode = ["auto", "ambient", "banner", "off"].includes(art.taskMode)
      ? art.taskMode
      : "auto";
    const mode = config.mode === "codex-document" ? "codex-document" : "dream-skin";
    const documentConfig = config.document && typeof config.document === "object" ? config.document : {};
    const proseConfig = config.prose && typeof config.prose === "object" ? config.prose : {};
    const normalizedText = (candidate, fallback, maxLength = 80) => {
      if (typeof candidate !== "string") return fallback;
      const value = candidate.trim().replace(/[\r\n]/g, " ");
      return value && value.length <= maxLength ? value : fallback;
    };
    const documentColor = (candidate, fallback) => {
      if (typeof candidate !== "string") return fallback;
      const value = candidate.trim();
      return /^(?:#[\da-f]{3,8}|(?:rgb|hsl|oklch|oklab)\([^;{}]{1,96}\))$/i.test(value)
        ? value
        : fallback;
    };
    const metadataRatio = Number(config?.artMetadata?.ratio);
    return {
      mode,
      appearance,
      safeArea,
      taskMode,
      focusX: hasNumber(art.focusX) ? clamp(art.focusX) : null,
      focusY: hasNumber(art.focusY) ? clamp(art.focusY) : null,
      accent: safeAccent,
      initialAspect: Number.isFinite(metadataRatio) && metadataRatio > 0 ? metadataRatio : null,
      document: {
        masthead: normalizedText(documentConfig.masthead, "美国科代克斯技术服务有限公司", 32),
        greeting: normalizedText(documentConfig.greeting, "尊敬的董事长：", 80),
        closing: normalizedText(documentConfig.closing, "此致", 32),
        signature: normalizedText(documentConfig.signature, "山姆·奥特曼", 80),
        accent: documentColor(documentConfig.accent, "#8B1E1E"),
        surface: documentColor(documentConfig.surface, "#FCFBF7"),
        text: documentColor(documentConfig.text, "#24201D"),
        border: documentColor(documentConfig.border, "#D8D1C6"),
      },
      prose: { enabled: proseConfig.enabled !== false },
      feedback: { autoSend: config?.feedback?.autoSend !== false },
    };
  };

  const previous = window[STATE_KEY];
  if (previous?.observer) previous.observer.disconnect();
  if (previous?.timer) clearInterval(previous.timer);
  if (previous?.scheduler?.timeout) clearTimeout(previous.scheduler.timeout);
  previous?.proseCleanup?.();
  previous?.feedbackCleanup?.();
  if (previous?.artUrl) URL.revokeObjectURL(previous.artUrl);
  const artUrl = (() => {
    const comma = artDataUrl.indexOf(",");
    const binary = atob(artDataUrl.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    const mime = /^data:([^;,]+)/.exec(artDataUrl)?.[1] || "image/png";
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  })();
  const config = normalizeConfig(rawConfig);
  let profile = {
    ...defaultProfile,
    aspect: config.initialAspect ?? defaultProfile.aspect,
  };
  const existingStyle = document.getElementById(STYLE_ID);
  if (existingStyle) {
    existingStyle.textContent = cssText;
    existingStyle.dataset.dreamVersion = "4";
  }

  const analyzeArt = () => new Promise((resolve) => {
    if (typeof Image !== "function") {
      resolve(defaultProfile);
      return;
    }
    const image = new Image();
    image.onload = () => {
      try {
        const width = 48;
        const height = Math.max(12, Math.round(width * image.naturalHeight / image.naturalWidth));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext?.("2d", { willReadFrequently: true });
        if (!context) throw new Error("Canvas is unavailable");
        context.drawImage(image, 0, 0, width, height);
        const pixels = context.getImageData(0, 0, width, height).data;
        let count = 0;
        let totalRed = 0;
        let totalGreen = 0;
        let totalBlue = 0;
        let totalBrightness = 0;
        const samples = [];
        const sampleMap = new Array(width * height);
        for (let offset = 0; offset < pixels.length; offset += 4) {
          if (pixels[offset + 3] < 96) continue;
          const red = pixels[offset];
          const green = pixels[offset + 1];
          const blue = pixels[offset + 2];
          const light = (.2126 * red + .7152 * green + .0722 * blue) / 255;
          const sample = { red, green, blue, light, index: offset / 4 };
          samples.push(sample);
          sampleMap[sample.index] = sample;
          totalRed += red;
          totalGreen += green;
          totalBlue += blue;
          totalBrightness += light;
          count += 1;
        }
        if (!count) throw new Error("Image contains no opaque pixels");
        const average = [totalRed / count, totalGreen / count, totalBlue / count];
        const averageBrightness = totalBrightness / count;
        const information = (start, end) => {
          let total = 0;
          let totalSquared = 0;
          let edges = 0;
          let edgeCount = 0;
          let sampleCount = 0;
          for (let y = 0; y < height; y += 1) {
            for (let x = start; x < end; x += 1) {
              const sample = sampleMap[y * width + x];
              if (!sample) continue;
              total += sample.light;
              totalSquared += sample.light * sample.light;
              sampleCount += 1;
              const previousSample = x > start ? sampleMap[y * width + x - 1] : null;
              const above = y > 0 ? sampleMap[(y - 1) * width + x] : null;
              if (previousSample) { edges += Math.abs(sample.light - previousSample.light); edgeCount += 1; }
              if (above) { edges += Math.abs(sample.light - above.light); edgeCount += 1; }
            }
          }
          const mean = sampleCount ? total / sampleCount : 0;
          const variance = sampleCount ? Math.max(0, totalSquared / sampleCount - mean * mean) : 1;
          return Math.sqrt(variance) * .58 + (edgeCount ? edges / edgeCount : 1) * .42;
        };
        const zoneWidth = Math.max(1, Math.floor(width * .38));
        const leftInformation = information(0, zoneWidth);
        const rightInformation = information(width - zoneWidth, width);
        let safeArea = "center";
        if (leftInformation < rightInformation * .86) safeArea = "left";
        else if (rightInformation < leftInformation * .86) safeArea = "right";
        let focusWeight = 0;
        let focusX = 0;
        let focusY = 0;
        let accentWeight = 0;
        let accent = [0, 0, 0];
        for (const sample of samples) {
          const x = sample.index % width;
          const y = Math.floor(sample.index / width);
          const difference = Math.sqrt(
            (sample.red - average[0]) ** 2 +
            (sample.green - average[1]) ** 2 +
            (sample.blue - average[2]) ** 2,
          ) / 441.7;
          const saliency = .03 + difference ** 1.35;
          focusX += (x / Math.max(1, width - 1)) * saliency;
          focusY += (y / Math.max(1, height - 1)) * saliency;
          focusWeight += saliency;
          const max = Math.max(sample.red, sample.green, sample.blue);
          const min = Math.min(sample.red, sample.green, sample.blue);
          const saturation = max ? (max - min) / max : 0;
          const usableLight = 1 - Math.min(1, Math.abs(sample.light - .46) / .54);
          const weight = saturation ** 2 * (.15 + usableLight);
          accent[0] += sample.red * weight;
          accent[1] += sample.green * weight;
          accent[2] += sample.blue * weight;
          accentWeight += weight;
        }
        const resolvedAccent = accentWeight > 1
          ? accent.map((channel) => Math.round(channel / accentWeight))
          : average.map((channel) => Math.round(channel));
        let resolvedFocusX = clamp(focusX / focusWeight);
        if (safeArea === "left") resolvedFocusX = Math.max(.64, resolvedFocusX);
        if (safeArea === "right") resolvedFocusX = Math.min(.36, resolvedFocusX);
        resolve({
          appearance: averageBrightness >= .58 ? "light" : "dark",
          accent: resolvedAccent,
          focusX: resolvedFocusX,
          focusY: clamp(focusY / focusWeight),
          aspect: image.naturalWidth / Math.max(1, image.naturalHeight),
          luma: clamp(averageBrightness),
          safeArea,
        });
      } catch {
        resolve(defaultProfile);
      }
    };
    image.onerror = () => resolve(defaultProfile);
    image.src = artUrl;
  });

  const detectShellAppearance = () => {
    const root = document.documentElement;
    const body = document.body;
    const classes = `${root?.className || ""} ${body?.className || ""}`
      .toLowerCase()
      .replace(/\bdream-theme-(?:dark|light)\b/g, "");
    if (/\b(dark|electron-dark|theme-dark|appearance-dark)\b/.test(classes)) return "dark";
    if (/\b(light|electron-light|theme-light|appearance-light)\b/.test(classes)) return "light";

    const dataTheme = (
      root?.getAttribute?.("data-theme") ||
      root?.getAttribute?.("data-appearance") ||
      root?.getAttribute?.("data-color-mode") ||
      body?.getAttribute?.("data-theme") ||
      body?.getAttribute?.("data-appearance") ||
      ""
    ).toLowerCase();
    if (dataTheme.includes("dark")) return "dark";
    if (dataTheme.includes("light")) return "light";

    try {
      const hadSkin = root?.classList?.contains?.("codex-dream-skin");
      const savedSkinClasses = hadSkin
        ? ROOT_CLASSES.filter((className) => root.classList.contains(className))
        : [];
      samplingNativeShell = true;
      if (hadSkin) root.classList.remove(...ROOT_CLASSES);
      try {
        const colorScheme = getComputedStyle(root).colorScheme || "";
        if (colorScheme.includes("dark") && !colorScheme.includes("light")) return "dark";
        if (colorScheme.includes("light") && !colorScheme.includes("dark")) return "light";
      } finally {
        if (hadSkin) root.classList.add(...savedSkinClasses);
        observer?.takeRecords?.();
        samplingNativeShell = false;
      }
    } catch {
      samplingNativeShell = false;
    }
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {}
    return "light";
  };

  const clearSkinDom = () => {
    const root = document.documentElement;
    root?.classList.remove(...ROOT_CLASSES);
    root?.classList.remove(DOCUMENT_MODE_CLASS);
    for (const property of ROOT_PROPERTIES) root?.style.removeProperty(property);
    document.querySelectorAll(".dream-home").forEach((node) => node.classList.remove("dream-home"));
    document.querySelectorAll(".dream-task").forEach((node) => node.classList.remove("dream-task"));
    document.querySelectorAll(".dream-home-shell").forEach((node) => node.classList.remove("dream-home-shell"));
    document.querySelectorAll(`.${HOME_UTILITY_CLASS}`).forEach((node) => node.classList.remove(HOME_UTILITY_CLASS));
    document.querySelectorAll(`.${DOCUMENT_RESPONSE_CLASS}`).forEach((node) => node.classList.remove(DOCUMENT_RESPONSE_CLASS));
    document.querySelectorAll(`.${DOCUMENT_HEADER_CLASS}, .${DOCUMENT_GREETING_CLASS}, .${DOCUMENT_TITLE_CLASS}, .${DOCUMENT_FOOTER_CLASS}`).forEach((node) => node.remove());
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById(CHROME_ID)?.remove();
    proseCleanup?.();
    proseCleanup = null;
    proseRestore?.();
    proseRestore = null;
    streamCleanup?.();
    streamCleanup = null;
    streamTarget = null;
    feedbackCleanup?.();
    feedbackCleanup = null;
    pendingAssistantStream = null;
  };

  const composeEditable = () => document.querySelector('.composer-surface-chrome [contenteditable="true"], .composer-surface-chrome textarea');

  const composerText = (editable) => editable?.isContentEditable ? (editable.textContent || "") : (editable?.value || "");
  const setComposerText = (editable, value) => {
    if (!editable) return false;
    editable.focus?.();
    if (editable.isContentEditable) {
      const selection = window.getSelection?.();
      const range = document.createRange?.();
      if (selection && range) {
        range.selectNodeContents(editable);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      const inserted = document.execCommand?.("insertText", false, value);
      if (!inserted && editable.textContent !== value) editable.textContent = value;
    } else {
      editable.value = value;
    }
    editable.dispatchEvent?.(new Event("input", { bubbles: true }));
    return true;
  };

  const pointDistance = (first, second) => Math.hypot(first.x - second.x, first.y - second.y);
  const clamp01 = (value) => Math.min(1, Math.max(0, value));
  const normalizedStrokes = (strokes) => {
    const points = strokes.flat();
    if (points.length < 8) return [];
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    const width = maxX - minX;
    const height = maxY - minY;
    const diagonal = Math.hypot(width, height);
    if (diagonal < .08) return [];
    const resample = (stroke) => {
      const result = [];
      let previous = null;
      for (const point of stroke) {
        const normalized = { x: (point.x - minX) / diagonal, y: (point.y - minY) / diagonal };
        if (!previous || pointDistance(previous, normalized) >= .018) {
          result.push(normalized);
          previous = normalized;
        }
      }
      return result.length >= 2 ? result : [];
    };
    return strokes.map(resample).filter((stroke) => stroke.length >= 2);
  };

  const segmentIntersection = (first, second, third, fourth) => {
    const cross = (left, right) => left.x * right.y - left.y * right.x;
    const firstVector = { x: second.x - first.x, y: second.y - first.y };
    const secondVector = { x: fourth.x - third.x, y: fourth.y - third.y };
    const offset = { x: third.x - first.x, y: third.y - first.y };
    const divisor = cross(firstVector, secondVector);
    if (Math.abs(divisor) < 1e-6) return false;
    const firstRatio = cross(offset, secondVector) / divisor;
    const secondRatio = cross(offset, firstVector) / divisor;
    return firstRatio > .04 && firstRatio < .96 && secondRatio > .04 && secondRatio < .96;
  };

  const circleScoreForPoints = (points) => {
    if (points.length < 12) return 0;
    const first = points[0];
    const last = points.at(-1);
    const closure = pointDistance(first, last);
    if (closure > .52) return 0;
    const center = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
    center.x /= points.length;
    center.y /= points.length;
    let xx = 0;
    let xy = 0;
    let yy = 0;
    for (const point of points) {
      const x = point.x - center.x;
      const y = point.y - center.y;
      xx += x * x;
      xy += x * y;
      yy += y * y;
    }
    xx /= points.length;
    xy /= points.length;
    yy /= points.length;
    const determinant = xx * yy - xy * xy;
    if (determinant < 1e-5) return 0;
    const radii = points.map((point) => {
      const x = point.x - center.x;
      const y = point.y - center.y;
      return Math.sqrt(Math.max(0, (yy * x * x - 2 * xy * x * y + xx * y * y) / determinant));
    });
    const radiusMean = radii.reduce((sum, value) => sum + value, 0) / radii.length;
    const radiusDeviation = Math.sqrt(radii.reduce((sum, value) => sum + (value - radiusMean) ** 2, 0) / radii.length) / radiusMean;
    const angles = points.map((point) => Math.atan2(point.y - center.y, point.x - center.x));
    const bins = new Set(angles.map((angle) => Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 16) % 16));
    let winding = 0;
    for (let index = 1; index < angles.length; index += 1) {
      let delta = angles[index] - angles[index - 1];
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      winding += delta;
    }
    let intersections = 0;
    for (let index = 0; index < points.length - 1; index += 1) {
      for (let other = index + 3; other < points.length - 1; other += 1) {
        if (index === 0 && other === points.length - 2) continue;
        if (segmentIntersection(points[index], points[index + 1], points[other], points[other + 1])) intersections += 1;
      }
    }
    const closureScore = clamp01(1 - closure / .52);
    const coverageScore = clamp01((bins.size - 8) / 7);
    const windingScore = clamp01(1 - Math.abs(Math.abs(winding) / (2 * Math.PI) - 1) / .65);
    const radiusScore = clamp01(1 - radiusDeviation / .62);
    // Hand-drawn circles often touch or slightly overlap at their endpoint.
    // Reject repeated crossings, but do not reject a single close-out wobble.
    const intersectionScore = intersections <= 1 ? 1 : clamp01(1 - (intersections - 1) / 3);
    return Math.min(closureScore, coverageScore, windingScore, radiusScore, intersectionScore);
  };
  const circleScore = (strokes) => {
    if (strokes.length !== 1) return 0;
    const points = strokes[0];
    // Treat a small lead-in or tail as a pen artifact. Evaluate the full
    // stroke and trimmed variants, but never invent a loop from an open arc.
    const trimLimit = Math.floor(points.length * .26);
    const trimStep = Math.max(2, Math.floor(points.length / 18));
    let best = circleScoreForPoints(points);
    for (let start = 0; start <= trimLimit; start += trimStep) {
      for (let end = 0; end <= trimLimit; end += trimStep) {
        if (!start && !end) continue;
        const candidate = points.slice(start, points.length - end);
        if (candidate.length < 12) continue;
        best = Math.max(best, circleScoreForPoints(candidate));
      }
    }
    return best;
  };

  const lineFrom = (first, second) => {
    const length = pointDistance(first, second);
    if (length < .24) return null;
    const dx = (second.x - first.x) / length;
    const dy = (second.y - first.y) / length;
    return { x: first.x, y: first.y, dx, dy };
  };
  const lineProjection = (line, point) => (point.x - line.x) * line.dx + (point.y - line.y) * line.dy;
  const lineDistance = (line, point) => Math.abs((point.x - line.x) * line.dy - (point.y - line.y) * line.dx);
  const lineIntersection = (first, second) => {
    const divisor = first.dx * second.dy - first.dy * second.dx;
    if (Math.abs(divisor) < .001) return null;
    const offsetX = second.x - first.x;
    const offsetY = second.y - first.y;
    const firstScale = (offsetX * second.dy - offsetY * second.dx) / divisor;
    return { x: first.x + first.dx * firstScale, y: first.y + first.dy * firstScale };
  };
  const xScore = (strokes) => {
    const points = strokes.flat();
    if (points.length < 10) return 0;
    if (strokes.length === 1) {
      let turns = 0;
      let previousAngle = null;
      for (let index = 3; index < points.length; index += 3) {
        const first = points[index - 3];
        const second = points[index];
        const angle = Math.atan2(second.y - first.y, second.x - first.x);
        if (previousAngle !== null) {
          let delta = angle - previousAngle;
          while (delta > Math.PI) delta -= 2 * Math.PI;
          while (delta < -Math.PI) delta += 2 * Math.PI;
          if (Math.abs(delta) > .6) turns += 1;
        }
        previousAngle = angle;
      }
      // A one-stroke X has two direction changes: diagonal, turnaround, then
      // the second diagonal. A V has only its single corner.
      if (turns < 2) return 0;
    }
    const candidates = [];
    const step = Math.max(1, Math.floor(points.length / 48));
    for (let firstIndex = 0; firstIndex < points.length; firstIndex += step) {
      for (let secondIndex = firstIndex + 1; secondIndex < points.length; secondIndex += step) {
        const line = lineFrom(points[firstIndex], points[secondIndex]);
        if (!line) continue;
        const inliers = points.filter((point) => lineDistance(line, point) <= .055);
        if (inliers.length < Math.max(5, Math.ceil(points.length * .28))) continue;
        const projections = inliers.map((point) => lineProjection(line, point));
        const span = Math.max(...projections) - Math.min(...projections);
        if (span < .48) continue;
        candidates.push({ line, inliers, projections, span });
      }
    }
    let best = 0;
    for (let firstIndex = 0; firstIndex < candidates.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < candidates.length; secondIndex += 1) {
        const first = candidates[firstIndex];
        const second = candidates[secondIndex];
        const dot = Math.abs(first.line.dx * second.line.dx + first.line.dy * second.line.dy);
        const angleScore = clamp01((Math.acos(Math.min(1, dot)) - .55) / .75);
        if (!angleScore) continue;
        const intersection = lineIntersection(first.line, second.line);
        if (!intersection) continue;
        const interiorScore = (candidate) => {
          const intersectionProjection = lineProjection(candidate.line, intersection);
          const min = Math.min(...candidate.projections);
          const max = Math.max(...candidate.projections);
          const before = intersectionProjection - min;
          const after = max - intersectionProjection;
          return clamp01(Math.min(before, after) / (candidate.span * .18));
        };
        const interior = Math.min(interiorScore(first), interiorScore(second));
        if (!interior) continue;
        const covered = points.filter((point) => lineDistance(first.line, point) <= .055 || lineDistance(second.line, point) <= .055).length / points.length;
        const balanced = Math.min(first.inliers.length, second.inliers.length) / Math.max(first.inliers.length, second.inliers.length);
        const score = Math.min(angleScore, interior, clamp01((covered - .58) / .22), clamp01((balanced - .42) / .35));
        best = Math.max(best, score);
      }
    }
    return best;
  };
  const feedbackClassification = (rawStrokes) => {
    const strokes = normalizedStrokes(rawStrokes);
    const circle = circleScore(strokes);
    const cross = xScore(strokes);
    if (circle >= .5 && circle - cross >= .1) return { kind: "agree", score: circle, circle, cross };
    if (cross >= .72 && cross - circle >= .14) return { kind: "disagree", score: cross, circle, cross };
    return { kind: "unknown", score: Math.max(circle, cross), circle, cross };
  };
  const feedbackHash = (strokes) => JSON.stringify(normalizedStrokes(strokes).map((stroke) =>
    stroke.map((point) => [Math.round(point.x * 100), Math.round(point.y * 100)])));

  const nativeSendButton = (composer) => {
    const candidates = [...composer?.querySelectorAll?.('button:not([data-composer-navigation-target])') || []]
      .filter((node) => node.querySelector?.("svg"));
    const labeledSend = candidates.find((node) => /^(?:发送(?:消息)?|send(?: message)?)$/i.test(
      (node.getAttribute?.("aria-label") || "").trim(),
    ));
    return labeledSend || candidates.filter((node) => !node.getAttribute?.("aria-label")).at(-1) || null;
  };
  const isNativeSendButton = (composer, button) =>
    Boolean(button && !button.disabled && composer?.contains?.(button) && nativeSendButton(composer) === button);
  const markPendingAssistantStream = () => {
    const knownTurns = new Set(document.querySelectorAll?.(ASSISTANT_TURN_SELECTOR) || []);
    pendingAssistantStream = { knownTurns, startedAt: Date.now(), node: null };
  };

  const ensureStreamTracking = () => {
    const editable = composeEditable();
    const composer = editable?.closest?.(".composer-surface-chrome");
    if (!editable || !composer) return;
    if (streamTarget === editable && streamCleanup) return;
    streamCleanup?.();
    streamTarget = editable;
    const onClickCapture = (event) => {
      const button = event.target?.closest?.("button");
      if (!event.defaultPrevented && isNativeSendButton(composer, button)) markPendingAssistantStream();
    };
    const onKeyDownCapture = (event) => {
      if (event.defaultPrevented || event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
      markPendingAssistantStream();
    };
    composer.addEventListener("click", onClickCapture, true);
    editable.addEventListener("keydown", onKeyDownCapture, true);
    streamCleanup = () => {
      composer.removeEventListener?.("click", onClickCapture, true);
      editable.removeEventListener?.("keydown", onKeyDownCapture, true);
      streamTarget = null;
    };
  };

  const ensureProseWrapper = () => {
    if (!config.prose.enabled) return;
    const editable = composeEditable();
    const composer = editable?.closest?.(".composer-surface-chrome");
    if (!editable || !composer) return;
    if (proseTarget === editable && proseCleanup) return;
    proseCleanup?.();
    proseTarget = editable;
    let wrapping = false;
    const wrapCurrentMessage = () => {
      if (wrapping) return;
      const original = composerText(editable);
      if (!original.trim() || original.includes(PROSE_WRAPPER_START)) return;
      wrapping = true;
      setComposerText(editable, `${PROSE_WRAPPER}\n\n${PROSE_USER_REQUEST_MARKER}\n${original}`);
      // Native send handlers run after capture listeners. Restore the visible
      // draft in the next task so the wrapper never remains in the composer.
      const restore = () => {
        if (composerText(editable).includes(PROSE_WRAPPER_START)) setComposerText(editable, original);
        wrapping = false;
        if (proseRestore === restore) proseRestore = null;
      };
      proseRestore = restore;
      setTimeout(restore, 80);
    };
    const onClickCapture = (event) => {
      const button = event.target?.closest?.("button");
      if (!event.defaultPrevented && isNativeSendButton(composer, button)) wrapCurrentMessage();
    };
    const onKeyDownCapture = (event) => {
      if (event.defaultPrevented || event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
      wrapCurrentMessage();
    };
    composer.addEventListener("click", onClickCapture, true);
    editable.addEventListener("keydown", onKeyDownCapture, true);
    proseCleanup = () => {
      composer.removeEventListener?.("click", onClickCapture, true);
      editable.removeEventListener?.("keydown", onKeyDownCapture, true);
      proseTarget = null;
      proseRestore?.();
    };
  };

  const ensureFeedbackBoard = () => {
    const editable = composeEditable();
    const composer = editable?.closest?.(".composer-surface-chrome");
    if (!editable || !composer) return;
    if (feedbackTarget === editable && feedbackCleanup) return;
    feedbackCleanup?.();
    feedbackTarget = editable;
    const board = document.createElement("div");
    board.id = FEEDBACK_BOARD_ID;
    board.setAttribute("role", "group");
    board.setAttribute("aria-label", "圈叉反馈标记");
    const canvas = document.createElement("canvas");
    canvas.className = "codex-document-feedback-canvas";
    canvas.setAttribute("aria-label", "绘制同意或不同意标记");
    const status = document.createElement("span");
    status.className = FEEDBACK_STATUS_CLASS;
    status.setAttribute("aria-live", "polite");
    board.append(canvas, status);
    document.body?.appendChild?.(board);
    if (!board.parentElement) return;

    // Hide instead of using a zero-sized/transitioning composer rect. That rect
    // was the source of the intermittent (8px, 8px) board in the upper left.
    board.hidden = true;
    const state = { strokes: [], current: null, pointerId: null, wasEmpty: false, timer: null, deadline: null, sent: new Set(), settled: false, disposed: false };
    const positionBoard = () => {
      const rect = composer.getBoundingClientRect?.();
      const viewportWidth = window.innerWidth || document.documentElement?.clientWidth || 0;
      const viewportHeight = window.innerHeight || document.documentElement?.clientHeight || 0;
      const valid = composer.isConnected !== false && rect &&
        [rect.left, rect.top, rect.right, rect.bottom, rect.width, rect.height].every(Number.isFinite) &&
        rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0 &&
        (!viewportWidth || rect.left < viewportWidth) && (!viewportHeight || rect.top < viewportHeight);
      if (!valid) {
        board.hidden = true;
        return;
      }
      board.hidden = false;
      board.style.left = `${Math.max(8, Math.round(rect.left - 116))}px`;
      board.style.top = `${Math.max(8, Math.round(rect.top))}px`;
    };
    const redraw = () => {
      const rect = canvas.getBoundingClientRect?.() || { width: 48, height: 48 };
      const width = Math.max(32, rect.width || 48);
      const height = Math.max(32, rect.height || 48);
      const ratio = Math.max(1, Math.min(3, Number(window.devicePixelRatio) || 1));
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      const context = canvas.getContext?.("2d");
      if (!context) return;
      context.setTransform?.(ratio, 0, 0, ratio, 0, 0);
      context.clearRect?.(0, 0, width, height);
      context.strokeStyle = "#b42318";
      context.lineWidth = 2.5;
      context.lineCap = "round";
      context.lineJoin = "round";
      for (const stroke of state.strokes) {
        if (stroke.length < 2) continue;
        context.beginPath();
        context.moveTo(stroke[0].x * width, stroke[0].y * height);
        for (const point of stroke.slice(1)) context.lineTo(point.x * width, point.y * height);
        context.stroke();
      }
    };
    const reset = () => {
      if (state.timer) clearTimeout(state.timer);
      if (state.deadline) clearTimeout(state.deadline);
      state.timer = null;
      state.deadline = null;
      state.strokes = [];
      state.current = null;
      state.sent.clear();
      state.settled = false;
      status.textContent = "";
      redraw();
    };
    const appendAndMaybeSend = () => {
      if (state.disposed || !state.strokes.length) return;
      state.settled = true;
      if (state.timer) clearTimeout(state.timer);
      if (state.deadline) clearTimeout(state.deadline);
      state.timer = null;
      state.deadline = null;
      const hash = feedbackHash(state.strokes);
      if (!hash || state.sent.has(hash)) {
        reset();
        return;
      }
      let result;
      try {
        result = feedbackClassification(state.strokes);
      } catch {
        result = { kind: "unknown" };
      }
      const feedback = result.kind === "agree" ? FEEDBACK_AGREE : result.kind === "disagree" ? FEEDBACK_DISAGREE : FEEDBACK_UNKNOWN;
      const currentText = composerText(editable);
      const canAutoSend = result.kind !== "unknown" && state.wasEmpty && !currentText.trim() && config.feedback.autoSend;
      const appended = currentText ? `${currentText}${currentText.endsWith("\n") ? "" : "\n"}${feedback}` : feedback;
      if (!setComposerText(editable, appended)) {
        status.textContent = "写入失败";
        reset();
        return;
      }
      state.sent.add(hash);
      status.textContent = result.kind === "agree" ? "同意" : result.kind === "disagree" ? "不同意" : "无法判断";
      // Every result consumes the mark. Unknown strokes become editable text
      // rather than leaving a stale drawing on screen.
      state.strokes = [];
      state.current = null;
      redraw();
      if (!canAutoSend) return;
      const sendWhenReady = (attempt = 0) => {
        if (state.disposed || composerText(editable).trim() !== feedback) return;
        const button = nativeSendButton(composer);
        if (button && !button.disabled && button.getAttribute?.("aria-busy") !== "true") {
          button.click?.();
          return;
        }
        if (attempt < 7) setTimeout(() => sendWhenReady(attempt + 1), 80);
      };
      setTimeout(sendWhenReady, 80);
    };
    const scheduleRecognition = () => {
      if (state.timer) clearTimeout(state.timer);
      state.timer = setTimeout(() => {
        state.timer = null;
        appendAndMaybeSend();
      }, FEEDBACK_SETTLE_MS);
      if (state.deadline) clearTimeout(state.deadline);
      state.deadline = setTimeout(() => {
        state.deadline = null;
        appendAndMaybeSend();
      }, FEEDBACK_DEADLINE_MS);
    };
    const pointFrom = (event) => {
      const rect = canvas.getBoundingClientRect?.() || { left: 0, top: 0, width: 48, height: 48 };
      return {
        x: clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1),
        y: clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1),
      };
    };
    const onPointerDown = (event) => {
      if (state.timer) { clearTimeout(state.timer); state.timer = null; }
      if (state.deadline) { clearTimeout(state.deadline); state.deadline = null; }
      if (state.settled) reset();
      state.wasEmpty = !composerText(editable).trim();
      state.pointerId = event.pointerId;
      state.current = [pointFrom(event)];
      state.strokes.push(state.current);
      try { canvas.setPointerCapture?.(event.pointerId); } catch {}
      event.preventDefault?.();
      redraw();
    };
    const onPointerMove = (event) => {
      if (event.pointerId !== state.pointerId || !state.current) return;
      const point = pointFrom(event);
      if (pointDistance(state.current.at(-1), point) >= .008) state.current.push(point);
      redraw();
    };
    const onPointerEnd = (event) => {
      if (event.pointerId !== state.pointerId) return;
      state.pointerId = null;
      state.current = null;
      try { canvas.releasePointerCapture?.(event.pointerId); } catch {}
      scheduleRecognition();
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerEnd);
    canvas.addEventListener("pointercancel", onPointerEnd);
    const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(positionBoard) : null;
    window.addEventListener?.("resize", positionBoard);
    window.addEventListener?.("scroll", positionBoard, true);
    window.visualViewport?.addEventListener?.("resize", positionBoard);
    window.visualViewport?.addEventListener?.("scroll", positionBoard);
    resizeObserver?.observe?.(composer);
    positionBoard();
    const requestFrame = window.requestAnimationFrame?.bind(window) || ((callback) => setTimeout(callback, 0));
    requestFrame(() => { if (!state.disposed) positionBoard(); });
    redraw();
    feedbackCleanup = () => {
      state.disposed = true;
      if (state.timer) clearTimeout(state.timer);
      if (state.deadline) clearTimeout(state.deadline);
      canvas.removeEventListener?.("pointerdown", onPointerDown);
      canvas.removeEventListener?.("pointermove", onPointerMove);
      canvas.removeEventListener?.("pointerup", onPointerEnd);
      canvas.removeEventListener?.("pointercancel", onPointerEnd);
      window.removeEventListener?.("resize", positionBoard);
      window.removeEventListener?.("scroll", positionBoard, true);
      window.visualViewport?.removeEventListener?.("resize", positionBoard);
      window.visualViewport?.removeEventListener?.("scroll", positionBoard);
      resizeObserver?.disconnect?.();
      board.remove?.();
      feedbackTarget = null;
    };
  };

  const documentTitleFrom = (message) => {
    for (const pre of message.querySelectorAll?.("pre, code") || []) {
      // Codex renders the fenced-code language (for example, "json") in the
      // same preformatted block on some builds. Parse from the JSON object,
      // rather than requiring the block's textContent to begin with "{".
      const raw = (pre.querySelector?.("code")?.textContent || pre.textContent || "").trim();
      const objectStart = raw.indexOf("{");
      if (objectStart < 0) continue;
      try {
        const title = JSON.parse(raw.slice(objectStart))?.codex_document?.title;
        if (typeof title !== "string") continue;
        // It is still metadata even when a legacy response used an invalid
        // title. Keep that transport block out of the rendered document.
        const metadataBlock = pre.closest?.('[data-markdown-copy="code-block"]') || pre;
        metadataBlock.classList?.add(DOCUMENT_METADATA_CLASS);
        const value = title.trim().replace(/[\r\n]/g, " ");
        // The model is instructed to choose a conventional document type, but
        // rendering only owns the title shape. Do not hide a valid title such
        // as “关于……的说明” merely because it is outside a local whitelist.
        if (!/^关于.+的[^\s的]+$/.test(value)) continue;
        if (value.length > 56) continue;
        return value;
      } catch {}
    }
    return "";
  };

  const originalRequestFromWrappedText = (text) => {
    if (typeof text !== "string" || !text.includes(PROSE_WRAPPER_START)) return "";
    const requestIndex = text.lastIndexOf(PROSE_USER_REQUEST_MARKER);
    if (requestIndex < 0) return "";
    return text.slice(requestIndex + PROSE_USER_REQUEST_MARKER.length).trim();
  };

  const concealProseWrapper = () => {
    let latestOriginal = "";
    for (const bubble of document.querySelectorAll?.('[data-user-message-bubble="true"]') || []) {
      const original = originalRequestFromWrappedText(bubble.innerText || bubble.textContent || "");
      if (!original) continue;
      latestOriginal = original;
      const content = bubble.querySelector?.('[data-selected-text-overlay-target]');
      if (content) content.textContent = original;
    }
    if (!latestOriginal) return;
    for (const title of document.querySelectorAll?.('[data-thread-title]') || []) {
      if ((title.textContent || "").includes(PROSE_WRAPPER_START)) title.textContent = latestOriginal;
    }
    for (const row of document.querySelectorAll?.('[data-app-action-sidebar-thread-title]') || []) {
      if ((row.getAttribute?.('data-app-action-sidebar-thread-title') || "").includes(PROSE_WRAPPER_START)) {
        row.setAttribute?.('data-app-action-sidebar-thread-title', latestOriginal);
      }
    }
  };

  const ensureDocumentResponses = () => {
    const root = document.documentElement;
    root?.classList.add(DOCUMENT_MODE_CLASS);
    root?.style.setProperty("--codex-document-accent", config.document.accent);
    root?.style.setProperty("--codex-document-surface", config.document.surface);
    root?.style.setProperty("--codex-document-text", config.document.text);
    root?.style.setProperty("--codex-document-border", config.document.border);
    concealProseWrapper();
    const messages = new Set();
    for (const marker of document.querySelectorAll(ASSISTANT_MARKER_SELECTOR)) {
      const message = marker.closest?.("article") || marker.closest?.('[data-message-author-role]') || marker;
      if (message) messages.add(message);
    }
    // Current Codex Desktop builds do not expose a stable role attribute on
    // assistant turns. "从这里继续新任务" is an assistant-only action; unlike
    // "复制消息", it is never attached to a user-authored turn. Use the
    // nearest reply group instead of the action's variable toolbar wrapper.
    for (const action of document.querySelectorAll(ASSISTANT_ACTION_SELECTOR)) {
      const turn = action.closest?.(ASSISTANT_TURN_SELECTOR);
      if (turn && turn.querySelectorAll(ASSISTANT_ACTION_SELECTOR).length === 1) {
        messages.add(turn);
        if (pendingAssistantStream?.node && (pendingAssistantStream.node === turn ||
          pendingAssistantStream.node.contains?.(turn) || turn.contains?.(pendingAssistantStream.node))) {
          pendingAssistantStream = null;
        }
      }
    }
    // Codex adds the assistant turn before it adds its completion-only action.
    // A pending send gives us a bounded, structural way to claim that new turn
    // without reading its text or guessing from streamed content.
    if (pendingAssistantStream) {
      if (Date.now() - pendingAssistantStream.startedAt > 45000) {
        pendingAssistantStream = null;
      } else if (pendingAssistantStream.node) {
        messages.add(pendingAssistantStream.node);
      } else {
        for (const turn of document.querySelectorAll?.(ASSISTANT_TURN_SELECTOR) || []) {
          if (pendingAssistantStream.knownTurns.has(turn)) continue;
          pendingAssistantStream.node = turn;
          messages.add(turn);
          break;
        }
      }
    }
    for (const message of messages) {
      if (!message?.classList || !message.querySelector || !message.prepend || !message.appendChild) continue;
      message.classList.add(DOCUMENT_RESPONSE_CLASS);
      let header = message.querySelector(`:scope > .${DOCUMENT_HEADER_CLASS}`);
      if (!header) {
        header = document.createElement("div");
        header.className = DOCUMENT_HEADER_CLASS;
        header.setAttribute("aria-hidden", "true");
        message.prepend(header);
      }
      header.textContent = config.document.masthead;

      let greeting = message.querySelector(`:scope > .${DOCUMENT_GREETING_CLASS}`);
      if (!greeting) {
        greeting = document.createElement("div");
        greeting.className = DOCUMENT_GREETING_CLASS;
        greeting.setAttribute("aria-hidden", "true");
        message.prepend(greeting);
      }
      greeting.textContent = config.document.greeting;
      const titleText = documentTitleFrom(message);
      let title = message.querySelector(`:scope > .${DOCUMENT_TITLE_CLASS}`);
      if (titleText) {
        if (!title) {
          title = document.createElement("div");
          title.className = DOCUMENT_TITLE_CLASS;
          title.setAttribute("aria-label", "文档标题");
        }
        title.textContent = titleText;
        message.prepend(title);
        for (const nativeTitle of message.querySelectorAll?.("h1, h2, h3, h4") || []) {
          const nativeText = (nativeTitle.textContent || "").trim().replace(/[\r\n]/g, " ");
          if (nativeText === titleText) nativeTitle.remove?.();
        }
      } else {
        title?.remove();
      }
      // Prepend in reverse order so the shell remains header, structured
      // title, greeting, then the unchanged native response content.
      message.prepend(greeting);
      if (titleText) message.prepend(title);
      message.prepend(header);

      let footer = message.querySelector(`:scope > .${DOCUMENT_FOOTER_CLASS}`);
      if (!footer) {
        footer = document.createElement("div");
        footer.className = DOCUMENT_FOOTER_CLASS;
        footer.setAttribute("aria-hidden", "true");
        message.appendChild(footer);
      }
      const isStreamingTurn = Boolean(pendingAssistantStream?.node &&
        (pendingAssistantStream.node === message || pendingAssistantStream.node.contains?.(message) || message.contains?.(pendingAssistantStream.node)));
      footer.classList.toggle(DOCUMENT_FOOTER_STREAMING_CLASS, isStreamingTurn);
      const legacyFooter = footer.textContent.trim().startsWith("CODEX / Response");
      if (legacyFooter) footer.textContent = "";
      let closing = legacyFooter ? null : footer.querySelector(`:scope > .${DOCUMENT_CLOSING_CLASS}`);
      if (!closing) {
        closing = document.createElement("div");
        closing.className = DOCUMENT_CLOSING_CLASS;
        footer.appendChild(closing);
      }
      closing.textContent = config.document.closing;
      let signature = footer.querySelector(`:scope > .${DOCUMENT_SIGNATURE_CLASS}`);
      if (!signature) {
        signature = document.createElement("div");
        signature.className = DOCUMENT_SIGNATURE_CLASS;
        footer.appendChild(signature);
      }
      signature.textContent = config.document.signature;
      let date = footer.querySelector(`:scope > .${DOCUMENT_DATE_CLASS}`);
      if (!date) {
        date = document.createElement("div");
        date.className = DOCUMENT_DATE_CLASS;
        footer.appendChild(date);
      }
      const now = new Date();
      date.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    }
  };

  const applyProfile = (root) => {
    const focusX = config.focusX ?? profile.focusX;
    const focusY = config.focusY ?? profile.focusY;
    const appearance = config.appearance === "auto" ? detectShellAppearance() : config.appearance;
    const focus = focusX < .4 ? "left" : focusX > .6 ? "right" : "center";
    const safeArea = config.safeArea === "auto" ? (profile.safeArea ||
      (focus === "left" ? "right" : focus === "right" ? "left" : "center")) : config.safeArea;
    const taskMode = config.taskMode === "auto"
      ? profile.aspect >= 2.25 ? "banner" : "ambient"
      : config.taskMode;
    const accent = config.accent || `rgb(${profile.accent.join(" ")})`;
    const accentInk = luminance(...profile.accent) > .42 ? "rgb(26 24 28)" : "rgb(250 248 251)";
    root.classList.toggle("dream-theme-light", appearance === "light");
    root.classList.toggle("dream-theme-dark", appearance === "dark");
    root.classList.toggle("dream-art-wide", profile.aspect >= 1.75);
    root.classList.toggle("dream-art-standard", profile.aspect < 1.75);
    for (const value of ["left", "center", "right"]) {
      root.classList.toggle(`dream-focus-${value}`, focus === value);
    }
    for (const value of ["left", "center", "right", "none"]) {
      root.classList.toggle(`dream-safe-${value}`, safeArea === value);
    }
    for (const value of ["ambient", "banner", "off"]) {
      root.classList.toggle(`dream-task-${value}`, taskMode === value);
    }
    root.style.setProperty("--dream-art", `url("${artUrl}")`);
    root.style.setProperty("--dream-art-position", `${Math.round(focusX * 100)}% ${Math.round(focusY * 100)}%`);
    root.style.setProperty("--dream-focus-x", String(focusX));
    root.style.setProperty("--dream-focus-y", String(focusY));
    root.style.setProperty("--dream-accent", accent);
    root.style.setProperty("--dream-accent-ink", accentInk);
    root.style.setProperty("--dream-image-luma", profile.luma.toFixed(3));
  };

  const ensure = () => {
    if (window.__CODEX_DREAM_SKIN_DISABLED__) return;
    const root = document.documentElement;
    if (!root || !document.body) return;

    // Main Codex shell is the content surface. The left rail is optional: Codex
    // removes or rebuilds aside.app-shell-left-panel while collapsing/expanding
    // it, and clearing the skin there flashes native colors over the active theme.
    // True auxiliary windows (pets, blank targets) still have no main surface, so
    // they continue to clear residual skin state.
    const shellMain = document.querySelector("main.main-surface") ||
      document.querySelector("main") ||
      document.querySelector('[role="main"]');
    if (!shellMain) {
      clearSkinDom();
      return;
    }

    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      (document.head || root).appendChild(style);
    }
    if (style.dataset.dreamVersion !== "4") {
      style.textContent = cssText;
      style.dataset.dreamVersion = "4";
    }

    if (config.mode === "codex-document") {
      root.classList.remove(...ROOT_CLASSES);
      ensureDocumentResponses();
      ensureStreamTracking();
      ensureProseWrapper();
      ensureFeedbackBoard();
      return;
    }

    root.classList.remove(DOCUMENT_MODE_CLASS);
    root.classList.add("codex-dream-skin");
    applyProfile(root);

    const home = document.querySelector('[role="main"]:has([data-testid="home-icon"])');
    const mainCandidates = [...document.querySelectorAll('[role="main"]')];
    if (!mainCandidates.length) mainCandidates.push(shellMain);
    for (const candidate of mainCandidates) {
      candidate.classList.toggle("dream-home", candidate === home);
      candidate.classList.toggle("dream-task", candidate !== home);
    }
    const utilityBars = new Set(home ? home.querySelectorAll('[class*="_homeUtilityBar_"]') : []);
    for (const candidate of document.querySelectorAll(`.${HOME_UTILITY_CLASS}`)) {
      if (!utilityBars.has(candidate)) candidate.classList.remove(HOME_UTILITY_CLASS);
    }
    for (const candidate of utilityBars) candidate.classList.add(HOME_UTILITY_CLASS);
    shellMain.classList.toggle("dream-home-shell", Boolean(home));

    let chrome = document.getElementById(CHROME_ID);
    if (!chrome || chrome.parentElement !== document.body) {
      chrome?.remove();
      chrome = document.createElement("div");
      chrome.id = CHROME_ID;
      chrome.setAttribute("aria-hidden", "true");
      document.body.appendChild(chrome);
    }
    chrome.classList.toggle("dream-home-shell", Boolean(home));
  };

  const cleanup = () => {
    const state = window[STATE_KEY];
    if (state?.installToken !== installToken) return false;
    window.__CODEX_DREAM_SKIN_DISABLED__ = true;
    clearSkinDom();
    state?.observer?.disconnect();
    if (state?.timer) clearInterval(state.timer);
    if (state?.scheduler?.timeout) clearTimeout(state.scheduler.timeout);
    if (state?.artUrl) URL.revokeObjectURL(state.artUrl);
    delete window[STATE_KEY];
    return true;
  };

  const scheduler = { timeout: null };
  const scheduleEnsure = (streaming = false) => {
    if (streaming) {
      // Stream mutations arrive for nearly every token. Throttle them so the
      // first assistant container is decorated immediately, rather than
      // debouncing forever until the stream becomes quiet.
      if (scheduler.timeout) return;
      scheduler.timeout = setTimeout(() => {
        scheduler.timeout = null;
        ensure();
      }, 16);
      return;
    }
    if (scheduler.timeout) clearTimeout(scheduler.timeout);
    scheduler.timeout = setTimeout(() => {
      scheduler.timeout = null;
      ensure();
    }, 180);
  };
  observer = new MutationObserver(() => {
    if (samplingNativeShell) return;
    if (config.mode === "codex-document") concealProseWrapper();
    scheduleEnsure(Boolean(pendingAssistantStream));
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "data-theme", "data-appearance", "data-color-mode"],
  });
  const timer = setInterval(ensure, 5000);
  window[STATE_KEY] = {
    ensure, cleanup, observer, timer, scheduler, artUrl, profile, config, installToken,
    // Reapplication must cancel both listeners and any in-flight, temporary
    // composer substitution from the previous renderer instance.
    proseCleanup: () => proseCleanup?.(),
    streamCleanup: () => streamCleanup?.(),
    feedbackCleanup: () => feedbackCleanup?.(),
    feedback: { classify: feedbackClassification, hash: feedbackHash },
    stream: {
      snapshot: () => ({ pending: Boolean(pendingAssistantStream), node: Boolean(pendingAssistantStream?.node) }),
      sendButtonFrom: nativeSendButton,
    },
    version: "1.5.0",
  };
  ensure();
  analyzeArt().then((result) => {
    const state = window[STATE_KEY];
    if (state?.installToken !== installToken || window.__CODEX_DREAM_SKIN_DISABLED__) return;
    profile = result;
    state.profile = result;
    ensure();
  });
  return { installed: true, version: "1.5.0", adaptive: config.mode !== "codex-document", documentMode: config.mode === "codex-document" };
})(__DREAM_CSS_JSON__, __DREAM_ART_JSON__, __DREAM_THEME_JSON__)
