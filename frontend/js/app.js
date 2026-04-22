// ═══════════════════════════════════════════════════════
//  ProTask · Frontend Logic
//  File: frontend/js/app.js
//
//  AUTO-DETECTS environment:
//    Local (Live Server port 5500/5501) → http://localhost:5000/api
//    Docker / Nginx / AWS              → /api  (same origin proxy)
// ═══════════════════════════════════════════════════════

"use strict";

// ── API base: auto-detect local vs production ────────────
const _port = window.location.port;
const _isLocal = (_port === "5500" || _port === "5501" || _port === "5502");
const API_BASE = _isLocal ? "http://localhost:5000/api" : "/api";

console.log(`[ProTask] API_BASE = ${API_BASE}  (port: ${_port || "80/443"})`);

// ── DOM refs ─────────────────────────────────────────────
const statusTextEl = document.getElementById("statusText");
const msgEl        = document.getElementById("msg");
const listEl       = document.getElementById("taskList");
const titleEl      = document.getElementById("taskTitle");
const addBtn       = document.getElementById("addBtn");
const emptyState   = document.getElementById("emptyState");

const totalEl      = document.getElementById("total");
const openEl       = document.getElementById("open");
const doneEl       = document.getElementById("done");
const progressEl   = document.getElementById("progress");
const taskCountEl  = document.getElementById("taskCount");
const progressBar  = document.getElementById("progressBar");
const progressGlow = document.getElementById("progressGlow");

const gaugeFill    = document.getElementById("gaugeFill");
const gaugePct     = document.getElementById("gaugePct");

const themeToggle  = document.getElementById("themeToggle");

// ── State ─────────────────────────────────────────────────
let allTasks     = [];
let activeFilter = "all";

// ── Helpers ───────────────────────────────────────────────
function setStatus(text) {
  if (statusTextEl) statusTextEl.textContent = text;
}

function setMsg(text = "", isError = false) {
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.style.color = isError ? "var(--accent-3)" : "var(--accent)";
}

function safeText(el, value) {
  if (el) el.textContent = value;
}

function showEmptyState(show) {
  if (!emptyState) return;
  emptyState.classList.toggle("visible", !!show);
}

// ── Theme toggle ──────────────────────────────────────────
(function initTheme() {
  const saved = localStorage.getItem("protask-theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("protask-theme", next);
    });
  }
})();

// ── Filter tabs ───────────────────────────────────────────
(function initFilters() {
  document.querySelectorAll(".ftab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".ftab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter || "all";
      renderList(allTasks);
    });
  });
})();

// ── Inject SVG gradient for gauge ────────────────────────
(function injectGaugeDefs() {
  const svg = document.querySelector(".gauge-svg");
  if (!svg || svg.querySelector("#gaugeGrad")) return;
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#7b6ff0"/>
      <stop offset="100%" stop-color="#00f5c4"/>
    </linearGradient>`;
  svg.prepend(defs);
})();

// ── API fetch wrapper ─────────────────────────────────────
async function api(path, opts = {}) {
  const url = `${API_BASE}${path}`;

  const config = {
    method: "GET",
    ...opts,
    headers: { ...(opts.headers || {}) }
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkErr) {
    // Likely: backend not running, or CORS preflight blocked
    if (_isLocal) {
      throw new Error(
        "Cannot reach backend. Make sure Node.js server is running: cd backend && npm start"
      );
    }
    throw new Error("Network error: server is not reachable.");
  }

  const contentType = response.headers.get("content-type") || "";
  let payload = null;
  try {
    payload = contentType.includes("application/json")
      ? await response.json()
      : { message: await response.text() };
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const msg =
      payload?.error ||
      payload?.message ||
      `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(msg);
  }

  return payload;
}

// ── Stats + gauge ─────────────────────────────────────────
function renderStats(tasks) {
  const total = tasks.length;
  const done  = tasks.filter(t => t.done).length;
  const open  = total - done;
  const pct   = total ? Math.round((done / total) * 100) : 0;

  safeText(totalEl,    total);
  safeText(doneEl,     done);
  safeText(openEl,     open);
  safeText(progressEl, `${pct}%`);
  safeText(taskCountEl, `${total} task${total !== 1 ? "s" : ""}`);

  if (progressBar)  progressBar.style.width  = `${pct}%`;
  if (progressGlow) progressGlow.style.width = `${pct}%`;

  if (gaugeFill) {
    const C      = 2 * Math.PI * 50;           // ≈ 314.16
    const offset = C - (pct / 100) * C;
    gaugeFill.setAttribute("stroke-dasharray",  C);
    gaugeFill.setAttribute("stroke-dashoffset", offset);
  }
  safeText(gaugePct, `${pct}%`);
}

// ── Task list render ──────────────────────────────────────
function renderList(tasks) {
  if (!listEl) return;

  const filtered = tasks.filter(t => {
    if (activeFilter === "open") return !t.done;
    if (activeFilter === "done") return  t.done;
    return true;
  });

  listEl.innerHTML = "";
  showEmptyState(filtered.length === 0);

  filtered.forEach((t, i) => {
    const item = document.createElement("div");
    item.className = `item${t.done ? " done-item" : ""}`;
    item.style.animationDelay = `${i * 0.04}s`;

    // ── Left: dot + text
    const left = document.createElement("div");
    left.className = "left";

    const dot = document.createElement("div");
    dot.className = `dot${t.done ? " off" : ""}`;

    const info     = document.createElement("div");
    info.style.minWidth = "0";

    const titleDiv = document.createElement("div");
    titleDiv.className = "title";
    titleDiv.style.textDecoration = t.done ? "line-through" : "none";
    titleDiv.textContent = t.title || "Untitled";

    const meta = document.createElement("div");
    meta.className = "meta";
    const d = t.createdAt ? new Date(t.createdAt) : null;
    meta.textContent = d && !isNaN(d)
      ? d.toLocaleString(undefined, { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })
      : "—";

    info.appendChild(titleDiv);
    info.appendChild(meta);
    left.appendChild(dot);
    left.appendChild(info);

    // ── Right: action buttons
    const actions = document.createElement("div");
    actions.className = "task-actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "btn-sm";
    toggleBtn.textContent = t.done ? "Undo" : "Done";
    toggleBtn.addEventListener("click", async () => {
      setStatus("Working...");
      setMsg("");
      try {
        await api(`/tasks/${t._id}/toggle`, { method: "PATCH" });
        await load();
        setMsg("Task updated ✓");
      } catch (e) {
        setMsg(e.message, true);
      } finally {
        setStatus("Ready");
      }
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn-sm del";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      // animate out, then DELETE
      item.style.transition = "opacity 0.22s ease, transform 0.22s ease";
      item.style.opacity    = "0";
      item.style.transform  = "translateX(20px)";
      setStatus("Working...");
      setMsg("");

      setTimeout(async () => {
        try {
          await api(`/tasks/${t._id}`, { method: "DELETE" });
          await load();
          setMsg("Task deleted ✓");
        } catch (e) {
          // restore visibility if delete failed
          item.style.opacity   = "1";
          item.style.transform = "translateX(0)";
          setMsg(e.message, true);
        } finally {
          setStatus("Ready");
        }
      }, 240);
    });

    actions.appendChild(toggleBtn);
    actions.appendChild(delBtn);

    item.appendChild(left);
    item.appendChild(actions);
    listEl.appendChild(item);
  });
}

// ── Load ──────────────────────────────────────────────────
async function load() {
  setStatus("Loading...");
  try {
    const tasks = await api("/tasks");
    allTasks = Array.isArray(tasks) ? tasks : [];
    renderStats(allTasks);
    renderList(allTasks);
    setMsg("");
  } catch (e) {
    allTasks = [];
    renderStats([]);
    renderList([]);
    setMsg(e.message, true);
    console.error("[ProTask] Load error:", e);
  } finally {
    setStatus("Ready");
  }
}

// ── Add task ──────────────────────────────────────────────
async function addTask() {
  if (!titleEl) return;
  const title = titleEl.value.trim();
  if (title.length < 2) { setMsg("Title needs at least 2 characters.", true); return; }

  setStatus("Deploying...");
  setMsg("");
  try {
    await api("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });
    titleEl.value = "";
    await load();
    setMsg("Task deployed ✓");
  } catch (e) {
    setMsg(e.message, true);
    console.error("[ProTask] Add error:", e);
  } finally {
    setStatus("Ready");
  }
}

if (addBtn)   addBtn.addEventListener("click", addTask);
if (titleEl)  titleEl.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); addTask(); } });

// ── Boot ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", load);