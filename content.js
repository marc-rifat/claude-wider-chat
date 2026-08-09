(function () {
  "use strict";

  const DEFAULT_WIDTH = 75; // percent
  const MIN_WIDTH = 40;
  const MAX_WIDTH = 98;
  const STORAGE_KEY = "claude-wider-chat-width";
  const FONT_STORAGE_KEY = "claude-wider-chat-font";
  const DEFAULT_FONT = "default";

  const FONTS = {
    default: { label: "Default", stack: null },
    inter: { label: "Inter", stack: '"Inter Variable", "anthropic-sans", system-ui, sans-serif' },
    lexend: { label: "Lexend", stack: '"Lexend Variable", "anthropic-sans", system-ui, sans-serif' },
    lora: { label: "Lora", stack: '"Lora Variable", "anthropic-serif", Georgia, serif' },
    merriweather: { label: "Merriweather", stack: '"Merriweather Variable", "anthropic-serif", Georgia, serif' },
    "jetbrains-mono": { label: "JetBrains Mono", stack: '"JetBrains Mono Variable", "anthropic-mono", monospace' },
  };

  const FONT_FILES = [
    ["Inter Variable", "inter", "normal", "100 900"],
    ["Inter Variable", "inter", "italic", "100 900"],
    ["Lexend Variable", "lexend", "normal", "100 900"],
    ["Lora Variable", "lora", "normal", "400 700"],
    ["Lora Variable", "lora", "italic", "400 700"],
    ["Merriweather Variable", "merriweather", "normal", "300 900"],
    ["Merriweather Variable", "merriweather", "italic", "300 900"],
    ["JetBrains Mono Variable", "jetbrains-mono", "normal", "100 800"],
    ["JetBrains Mono Variable", "jetbrains-mono", "italic", "100 800"],
  ];

  const SUBSETS = {
    latin:
      "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    "latin-ext":
      "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1EFF, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
  };

  /* ── Helpers ─────────────────────────────────────────── */

  function applyWidth(pct) {
    document.documentElement.style.setProperty(
      "--claude-wider-chat-width",
      pct + "%"
    );
  }

  function saveWidth(pct) {
    chrome.storage.local.set({ [STORAGE_KEY]: pct });
  }

  function loadSettings(cb) {
    chrome.storage.local.get([STORAGE_KEY, FONT_STORAGE_KEY], (result) => {
      cb({
        width: result[STORAGE_KEY] ?? DEFAULT_WIDTH,
        font: result[FONT_STORAGE_KEY] ?? DEFAULT_FONT,
      });
    });
  }

  function injectFontFaces() {
    let css = "";
    for (const [family, slug, style, weight] of FONT_FILES) {
      for (const [subset, range] of Object.entries(SUBSETS)) {
        const url = chrome.runtime.getURL(
          "fonts/" + slug + "-" + subset + "-" + style + ".woff2"
        );
        css +=
          '@font-face{font-family:"' + family + '";' +
          "font-style:" + style + ";" +
          "font-weight:" + weight + ";" +
          "font-display:swap;" +
          'src:url("' + url + '") format("woff2-variations");' +
          "unicode-range:" + range + ";}\n";
      }
    }
    const el = document.createElement("style");
    el.id = "cwc-fonts";
    el.textContent = css;
    document.documentElement.appendChild(el);
  }

  function applyFont(key) {
    const font = FONTS[key] || FONTS[DEFAULT_FONT];
    if (font.stack) {
      document.documentElement.style.setProperty(
        "--claude-wider-chat-font",
        font.stack
      );
      document.documentElement.setAttribute("data-cwc-font", key);
    } else {
      document.documentElement.style.removeProperty("--claude-wider-chat-font");
      document.documentElement.removeAttribute("data-cwc-font");
    }
  }

  function saveFont(key) {
    chrome.storage.local.set({ [FONT_STORAGE_KEY]: key });
  }

  /* ── Build the floating control panel ────────────────── */

  function createPanel() {
    const panel = document.createElement("div");
    panel.id = "cwc-panel";
    panel.innerHTML = `
      <style>
        #cwc-panel {
          position: fixed;
          bottom: 16px;
          right: 16px;
          z-index: 99999;
          background: #1a1a2e;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 13px;
          color: #ccc;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          user-select: none;
          transition: opacity 0.2s;
        }
        #cwc-panel:hover {
          opacity: 1 !important;
        }
        #cwc-panel.cwc-collapsed {
          padding: 6px 10px;
          cursor: pointer;
        }
        #cwc-panel.cwc-collapsed #cwc-controls {
          display: none;
        }
        #cwc-toggle {
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          flex-shrink: 0;
        }
        #cwc-controls {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .cwc-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cwc-label {
          font-size: 11px;
          color: #888;
          width: 34px;
          flex-shrink: 0;
        }
        #cwc-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 120px;
          height: 5px;
          border-radius: 4px;
          background: #444;
          outline: none;
          cursor: pointer;
        }
        #cwc-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #c97b3a;
          cursor: pointer;
        }
        #cwc-value {
          min-width: 36px;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        #cwc-font {
          flex: 1;
          min-width: 0;
          background: #24243c;
          border: 1px solid #555;
          color: #ccc;
          border-radius: 6px;
          padding: 3px 6px;
          font-size: 12px;
          font-family: inherit;
          outline: none;
          cursor: pointer;
        }
        #cwc-font:hover {
          border-color: #888;
        }
        #cwc-reset {
          background: none;
          border: 1px solid #555;
          color: #aaa;
          border-radius: 6px;
          padding: 2px 8px;
          cursor: pointer;
          font-size: 11px;
        }
        #cwc-reset:hover {
          border-color: #888;
          color: #fff;
        }
      </style>
      <span id="cwc-toggle" title="Toggle panel">↔</span>
      <div id="cwc-controls">
        <div class="cwc-row">
          <span class="cwc-label">Width</span>
          <input id="cwc-slider" type="range" min="${MIN_WIDTH}" max="${MAX_WIDTH}" step="1" />
          <span id="cwc-value"></span>
        </div>
        <div class="cwc-row">
          <span class="cwc-label">Font</span>
          <select id="cwc-font"></select>
          <button id="cwc-reset" title="Reset to defaults">Reset</button>
        </div>
      </div>
    `;

    panel.classList.add("cwc-collapsed");
    panel.style.opacity = "0.35";
    document.body.appendChild(panel);

    const slider = panel.querySelector("#cwc-slider");
    const valueLabel = panel.querySelector("#cwc-value");
    const resetBtn = panel.querySelector("#cwc-reset");
    const toggle = panel.querySelector("#cwc-toggle");
    const fontSelect = panel.querySelector("#cwc-font");

    for (const [key, font] of Object.entries(FONTS)) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = font.label;
      fontSelect.appendChild(opt);
    }

    function setSlider(pct) {
      pct = Math.round(pct);
      slider.value = pct;
      valueLabel.textContent = pct + "%";
      applyWidth(pct);
    }

    function setFont(key) {
      fontSelect.value = key;
      applyFont(key);
    }

    slider.addEventListener("input", () => {
      const v = Number(slider.value);
      setSlider(v);
      saveWidth(v);
    });

    fontSelect.addEventListener("change", () => {
      setFont(fontSelect.value);
      saveFont(fontSelect.value);
    });

    resetBtn.addEventListener("click", () => {
      setSlider(DEFAULT_WIDTH);
      saveWidth(DEFAULT_WIDTH);
      setFont(DEFAULT_FONT);
      saveFont(DEFAULT_FONT);
    });

    toggle.addEventListener("click", () => {
      panel.classList.toggle("cwc-collapsed");
      resetCollapseTimer();
    });

    // Auto-collapse after 5 seconds of inactivity
    let collapseTimer;
    function resetCollapseTimer() {
      clearTimeout(collapseTimer);
      collapseTimer = setTimeout(() => {
        panel.classList.add("cwc-collapsed");
        panel.style.opacity = "0.35";
      }, 3000);
    }

    panel.addEventListener("mouseenter", () => {
      clearTimeout(collapseTimer);
      panel.classList.remove("cwc-collapsed");
      panel.style.opacity = "1";
    });
    panel.addEventListener("mouseleave", resetCollapseTimer);

    // Init
    loadSettings(({ width, font }) => {
      setSlider(width);
      setFont(font);
    });
  }

  /* ── Init ─────────────────────────────────────────────── */

  injectFontFaces();

  if (document.body) {
    createPanel();
  } else {
    document.addEventListener("DOMContentLoaded", createPanel);
  }
})();
