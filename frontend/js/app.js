// Frontend talks to backend via Nginx reverse proxy in Docker: /api
// For non-docker local test, change API_BASE to "http://localhost:5000/api"
const API_BASE = "/api";

const statusEl = document.getElementById("status");
const msgEl = document.getElementById("msg");
const listEl = document.getElementById("taskList");
const titleEl = document.getElementById("taskTitle");
const addBtn = document.getElementById("addBtn");

const totalEl = document.getElementById("total");
const openEl = document.getElementById("open");
const doneEl = document.getElementById("done");
const progressEl = document.getElementById("progress");

function setStatus(t) { statusEl.textContent = t; }
function setMsg(t) { msgEl.textContent = t || ""; }

async function api(path, opts) {
  const r = await fetch(`${API_BASE}${path}`, opts);
  if (!r.ok) {
    let e = {};
    try { e = await r.json(); } catch {}
    throw new Error(e.error || `Request failed: ${r.status}`);
  }
  return r.json();
}

function renderStats(tasks) {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const open = total - done;
  totalEl.textContent = total;
  doneEl.textContent = done;
  openEl.textContent = open;
  progressEl.textContent = total ? `${Math.round((done / total) * 100)}%` : "0%";
}

function renderList(tasks) {
  listEl.innerHTML = "";
  tasks.forEach(t => {
    const item = document.createElement("div");
    item.className = "item";

    const left = document.createElement("div");
    left.className = "left";

    const dot = document.createElement("div");
    dot.className = `dot ${t.done ? "" : "off"}`;

    const info = document.createElement("div");
    const title = document.createElement("div");
    title.className = "title";
    title.style.textDecoration = t.done ? "line-through" : "none";
    title.textContent = t.title;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = new Date(t.createdAt).toLocaleString();

    info.appendChild(title);
    info.appendChild(meta);

    left.appendChild(dot);
    left.appendChild(info);

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.gap = "8px";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "secondary";
    toggleBtn.textContent = t.done ? "Undo" : "Done";
    toggleBtn.onclick = async () => {
      setStatus("Working...");
      try {
        await api(`/tasks/${t._id}/toggle`, { method: "PATCH" });
        await load();
      } catch (e) { setMsg(e.message); }
      setStatus("Ready");
    };

    const delBtn = document.createElement("button");
    delBtn.className = "secondary";
    delBtn.textContent = "Delete";
    delBtn.onclick = async () => {
      setStatus("Working...");
      try {
        await api(`/tasks/${t._id}`, { method: "DELETE" });
        await load();
        setMsg("Deleted ✅");
      } catch (e) { setMsg(e.message); }
      setStatus("Ready");
    };

    right.appendChild(toggleBtn);
    right.appendChild(delBtn);

    item.appendChild(left);
    item.appendChild(right);
    listEl.appendChild(item);
  });
}

async function load() {
  const tasks = await api("/tasks");
  renderStats(tasks);
  renderList(tasks);
}

addBtn.onclick = async () => {
  const title = titleEl.value.trim();
  if (title.length < 2) return setMsg("Title min 2 chars.");
  setStatus("Working...");
  setMsg("");
  try {
    await api("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });
    titleEl.value = "";
    await load();
    setMsg("Task created ✅");
  } catch (e) {
    setMsg(e.message);
  }
  setStatus("Ready");
};

load().catch(e => setMsg(e.message));