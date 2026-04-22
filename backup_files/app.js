// ═══════════════════════════════════════════════════════
//  ProTask · Frontend Logic (Safe Version)
//  API_BASE preserved: talks to backend via Nginx /api
//  For non-docker local test: change to "http://localhost:5000/api"
// ═══════════════════════════════════════════════════════
const API_BASE = "http://localhost:5000/api";

// ── DOM refs ────────────────────────────────────────────
const statusTextEl  = document.getElementById("statusText");
const msgEl         = document.getElementById("msg");
const listEl        = document.getElementById("taskList");
const titleEl       = document.getElementById("taskTitle");
const addBtn        = document.getElementById("addBtn");
const emptyState    = document.getElementById("emptyState");

// Stats
const totalEl       = document.getElementById("total");
const openEl        = document.getElementById("open");
const doneEl        = document.getElementById("done");
const progressEl    = document.getElementById("progress");
const taskCountEl   = document.getElementById("taskCount");
const progressBar   = document.getElementById("progressBar");
const progressGlow  = document.getElementById("progressGlow");

// Gauge
const gaugeFill     = document.getElementById("gaugeFill");
const gaugePct      = document.getElementById("gaugePct");

// Theme
const themeToggle   = document.getElementById("themeToggle");

// ── State ───────────────────────────────────────────────
let allTasks = [];
let activeFilter = "all";

// ── Utility helpers ─────────────────────────────────────
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

// ── Theme toggle ────────────────────────────────────────
(function initTheme() {
  const savedTheme = localStorage.getItem("protask-theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("protask-theme", next);
    });
  }
})();

// ── Filter tabs ──────────────────────────────────────────
(function initFilters() {
  const tabs = document.querySelectorAll(".ftab");
  if (!tabs.length) return;

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter || "all";
      renderList(allTasks);
    });
  });
})();

// ── Better API wrapper ───────────────────────────────────
async function api(path, opts = {}) {
  const url = `${API_BASE}${path}`;

  const config = {
    method: "GET",
    ...opts,
    headers: {
      ...(opts.headers || {})
    }
  };

  let response;

  try {
    response = await fetch(url, config);
  } catch (networkError) {
    throw new Error("Network error: backend ya Nginx reachable nahi.");
  }

  const contentType = response.headers.get("content-type") || "";
  let payload = null;

  try {
    if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      const text = await response.text();
      payload = text ? { message: text } : null;
    }
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (response.status === 405) {
      throw new Error(
        `405 Method Not Allowed: ${config.method} ${url} allowed nahi. Backend route method check karo.`
      );
    }

    if (response.status === 404) {
      throw new Error(`404 Not Found: ${url} route nahi mili.`);
    }

    if (response.status === 500) {
      throw new Error("500 Server Error: backend code ya database issue hai.");
    }

    throw new Error(
      payload?.error ||
      payload?.message ||
      `Request failed: ${response.status}`
    );
  }

  return payload;
}

// ── Stats & gauge ────────────────────────────────────────
function renderStats(tasks) {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const open = total - done;
  const pct = total ? Math.round((done / total) * 100) : 0;

  safeText(totalEl, total);
  safeText(doneEl, done);
  safeText(openEl, open);
  safeText(progressEl, `${pct}%`);
  safeText(taskCountEl, `${total} task${total !== 1 ? "s" : ""}`);

  if (progressBar) progressBar.style.width = `${pct}%`;
  if (progressGlow) progressGlow.style.width = `${pct}%`;

  if (gaugeFill) {
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (pct / 100) * circumference;
    gaugeFill.setAttribute("stroke-dasharray", circumference);
    gaugeFill.setAttribute("stroke-dashoffset", offset);
  }

  safeText(gaugePct, `${pct}%`);
}

// ── Task list render ─────────────────────────────────────
function renderList(tasks) {
  if (!listEl) return;

  const filtered = tasks.filter(t => {
    if (activeFilter === "open") return !t.done;
    if (activeFilter === "done") return t.done;
    return true;
  });

  listEl.innerHTML = "";
  showEmptyState(filtered.length === 0);

  filtered.forEach((t, i) => {
    const item = document.createElement("div");
    item.className = `item${t.done ? " done-item" : ""}`;
    item.style.animationDelay = `${i * 0.04}s`;

    const left = document.createElement("div");
    left.className = "left";

    const dot = document.createElement("div");
    dot.className = `dot${t.done ? " off" : ""}`;

    const info = document.createElement("div");
    info.style.minWidth = "0";

    const titleDiv = document.createElement("div");
    titleDiv.className = "title";
    titleDiv.style.textDecoration = t.done ? "line-through" : "none";
    titleDiv.textContent = t.title || "Untitled task";

    const meta = document.createElement("div");
    meta.className = "meta";

    const createdAt = t.createdAt ? new Date(t.createdAt) : null;
    meta.textContent = createdAt && !Number.isNaN(createdAt.getTime())
      ? createdAt.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      : "No date";

    info.appendChild(titleDiv);
    info.appendChild(meta);
    left.appendChild(dot);
    left.appendChild(info);

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
    delBtn.addEventListener("click", async () => {
      item.style.transition = "opacity 0.25s ease, transform 0.25s ease";
      item.style.opacity = "0";
      item.style.transform = "translateX(20px)";
      setStatus("Working...");
      setMsg("");

      setTimeout(async () => {
        try {
          await api(`/tasks/${t._id}`, { method: "DELETE" });
          await load();
          setMsg("Task deleted ✓");
        } catch (e) {
          item.style.opacity = "1";
          item.style.transform = "translateX(0)";
          setMsg(e.message, true);
        } finally {
          setStatus("Ready");
        }
      }, 220);
    });

    actions.appendChild(toggleBtn);
    actions.appendChild(delBtn);

    item.appendChild(left);
    item.appendChild(actions);
    listEl.appendChild(item);
  });
}

// ── Load all tasks ───────────────────────────────────────
async function load() {
  setStatus("Loading...");
  try {
    const tasks = await api("/tasks", { method: "GET" });
    allTasks = Array.isArray(tasks) ? tasks : [];
    renderStats(allTasks);
    renderList(allTasks);
    setMsg("");
  } catch (e) {
    allTasks = [];
    renderStats(allTasks);
    renderList(allTasks);
    setMsg(e.message, true);
    console.error("Load error:", e);
  } finally {
    setStatus("Ready");
  }
}

// ── Add task ─────────────────────────────────────────────
async function addTask() {
  if (!titleEl) return;

  const title = titleEl.value.trim();

  if (title.length < 2) {
    setMsg("Title needs at least 2 characters.", true);
    return;
  }

  setStatus("Deploying...");
  setMsg("");

  try {
    await api("/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title })
    });

    titleEl.value = "";
    await load();
    setMsg("Task deployed ✓");
  } catch (e) {
    setMsg(e.message, true);
    console.error("Add task error:", e);
  } finally {
    setStatus("Ready");
  }
}

if (addBtn) {
  addBtn.addEventListener("click", addTask);
}

if (titleEl) {
  titleEl.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTask();
    }
  });
}

// ── Inject SVG gradient for gauge ────────────────────────
(function injectGaugeDefs() {
  const svg = document.querySelector(".gauge-svg");
  if (!svg) return;

  const existing = svg.querySelector("#gaugeGrad");
  if (existing) return;

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7b6ff0"></stop>
      <stop offset="100%" stop-color="#00f5c4"></stop>
    </linearGradient>
  `;
  svg.prepend(defs);
})();

// ── Init ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  load();
});