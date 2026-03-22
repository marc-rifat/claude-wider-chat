(function () {
  "use strict";

  const DEFAULT_WIDTH = 85; // percent
  const MIN_WIDTH = 40;
  const MAX_WIDTH = 98;
  const STORAGE_KEY = "claude-wider-chat-width";

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

  function loadWidth(cb) {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      cb(result[STORAGE_KEY] ?? DEFAULT_WIDTH);
    });
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
          align-items: center;
          gap: 8px;
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
        <span style="font-size:11px;color:#888;">Width</span>
        <input id="cwc-slider" type="range" min="${MIN_WIDTH}" max="${MAX_WIDTH}" step="1" />
        <span id="cwc-value"></span>
        <button id="cwc-reset" title="Reset to default">Reset</button>
      </div>
    `;

    document.body.appendChild(panel);

    const slider = panel.querySelector("#cwc-slider");
    const valueLabel = panel.querySelector("#cwc-value");
    const resetBtn = panel.querySelector("#cwc-reset");
    const toggle = panel.querySelector("#cwc-toggle");

    function setSlider(pct) {
      pct = Math.round(pct);
      slider.value = pct;
      valueLabel.textContent = pct + "%";
      applyWidth(pct);
    }

    slider.addEventListener("input", () => {
      const v = Number(slider.value);
      setSlider(v);
      saveWidth(v);
    });

    resetBtn.addEventListener("click", () => {
      setSlider(DEFAULT_WIDTH);
      saveWidth(DEFAULT_WIDTH);
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
    loadWidth((pct) => {
      setSlider(pct);
      resetCollapseTimer();
    });
  }

  /* ── Init ─────────────────────────────────────────────── */

  // Wait for body to be ready
  if (document.body) {
    createPanel();
  } else {
    document.addEventListener("DOMContentLoaded", createPanel);
  }
})();
