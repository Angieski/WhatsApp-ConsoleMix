const API = "/api";

let activePhone = null;
let activeFilter = { tag: "", status: "" };
let refreshTimer = null;

// ── Init ──────────────────────────────────────────────────────────────────

async function init() {
  await loadBotStatus();
  await loadConversations();
  bindEvents();
  scheduleRefresh();
}

// ── Bot status ────────────────────────────────────────────────────────────

async function loadBotStatus() {
  const data = await apiFetch("/bot");
  renderBotStatus(data);
}

function renderBotStatus(data) {
  const statusEl  = document.getElementById("bot-status");
  const labelEl   = document.getElementById("bot-status-label");
  const toggleBtn = document.getElementById("btn-toggle");
  const phoneEl   = document.querySelector(".navbar-brand");

  if (data.enabled) {
    statusEl.className = "bot-status bot-on";
    labelEl.textContent = "BOT ATIVO";
    toggleBtn.className = "btn btn-toggle btn-danger-outline";
    toggleBtn.textContent = "Desligar";
  } else {
    statusEl.className = "bot-status bot-off";
    labelEl.textContent = "BOT INATIVO";
    toggleBtn.className = "btn btn-toggle btn-success-outline";
    toggleBtn.textContent = "Ligar";
  }

  if (data.phoneDisplay) {
    document.querySelector(".brand-dot").title = data.phoneDisplay;
  }
}

async function toggleBot() {
  const data = await apiFetch("/bot");
  const updated = await apiFetch("/bot", "PATCH", { enabled: !data.enabled });
  renderBotStatus(updated);
}

// ── Conversations list ────────────────────────────────────────────────────

async function loadConversations() {
  const params = new URLSearchParams();
  if (activeFilter.tag)    params.set("tag",    activeFilter.tag);
  if (activeFilter.status) params.set("status", activeFilter.status);

  const list = await apiFetch(`/conversations?${params}`);
  renderConversationList(list);
}

function renderConversationList(list) {
  const ul = document.getElementById("conversation-list");

  if (!list.length) {
    ul.innerHTML = '<li class="list-placeholder">Nenhuma conversa encontrada</li>';
    return;
  }

  ul.innerHTML = list.map(renderConvItem).join("");

  ul.querySelectorAll(".conv-item").forEach((el) => {
    el.addEventListener("click", () => selectConversation(el.dataset.phone));
  });

  // Restaura item ativo após refresh
  if (activePhone) {
    const active = ul.querySelector(`[data-phone="${activePhone}"]`);
    if (active) active.classList.add("active");
  }
}

function renderConvItem(conv) {
  const time    = formatTime(conv.lastMessageAt);
  const name    = conv.customerName ? `<div class="conv-name">${esc(conv.customerName)}</div>` : "";
  const preview = conv.lastMessage  ? `<div class="conv-preview">${esc(conv.lastMessage)}</div>` : "";

  return `
    <li class="conv-item${conv.phone === activePhone ? " active" : ""}" data-phone="${esc(conv.phone)}">
      <div class="conv-top">
        <span class="conv-phone">${formatPhone(conv.phone)}</span>
        <span class="conv-time">${time}</span>
      </div>
      ${name}
      ${preview}
      <div class="conv-badges">
        <span class="badge badge-${conv.tag}">${conv.tag}</span>
        <span class="badge badge-${conv.status}">${conv.status}</span>
      </div>
    </li>`;
}

// ── Thread ────────────────────────────────────────────────────────────────

async function selectConversation(phone) {
  activePhone = phone;

  // Marca item ativo na lista
  document.querySelectorAll(".conv-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.phone === phone);
  });

  document.getElementById("empty-state").classList.add("hidden");
  document.getElementById("thread").classList.remove("hidden");
  document.getElementById("thread-phone").textContent = formatPhone(phone);

  await loadMessages(phone);
  await loadConvMeta(phone);
}

async function loadConvMeta(phone) {
  const list  = await apiFetch(`/conversations?`);
  const conv  = list.find((c) => c.phone === phone);
  if (!conv) return;

  document.getElementById("thread-name").textContent  = conv.customerName || "";
  document.getElementById("tag-select").value         = conv.tag;
  document.getElementById("status-select").value      = conv.status;
}

async function loadMessages(phone) {
  const msgs = await apiFetch(`/conversations/${encodeURIComponent(phone)}/messages`);
  const container = document.getElementById("messages");

  if (!msgs.length) {
    container.innerHTML = '<div class="list-placeholder">Sem mensagens ainda</div>';
    return;
  }

  container.innerHTML = msgs.map(renderMessage).join("");
  container.scrollTop = container.scrollHeight;
}

function renderMessage(msg) {
  const cls  = msg.role === "user" ? "msg-user" : "msg-assistant";
  const time = new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return `
    <div class="msg ${cls}">
      <div>${esc(msg.content)}</div>
      <div class="msg-time">${time}</div>
    </div>`;
}

// ── Patch conversation ────────────────────────────────────────────────────

async function patchConversation(phone, data) {
  await apiFetch(`/conversations/${encodeURIComponent(phone)}`, "PATCH", data);
  await loadConversations(); // atualiza lista com novo tag/status
}

// ── Settings modal ────────────────────────────────────────────────────────

async function openSettings() {
  const data = await apiFetch("/bot");
  document.getElementById("s-phone").value       = data.phoneDisplay || "";
  document.getElementById("s-instance-id").value = data.instanceId   || "";
  document.getElementById("s-token").value        = "";
  document.getElementById("s-client-token").value = "";
  document.getElementById("modal-overlay").classList.remove("hidden");
}

function closeSettings() {
  document.getElementById("modal-overlay").classList.add("hidden");
}

async function saveSettings(e) {
  e.preventDefault();

  const payload = {};
  const phone       = document.getElementById("s-phone").value.trim();
  const instanceId  = document.getElementById("s-instance-id").value.trim();
  const token       = document.getElementById("s-token").value.trim();
  const clientToken = document.getElementById("s-client-token").value.trim();

  if (phone)       payload.phoneDisplay = phone;
  if (instanceId)  payload.instanceId   = instanceId;
  if (token)       payload.token        = token;
  if (clientToken) payload.clientToken  = clientToken;

  if (!Object.keys(payload).length) { closeSettings(); return; }

  const updated = await apiFetch("/bot", "PATCH", payload);
  renderBotStatus(updated);
  closeSettings();
}

// ── Auto refresh ──────────────────────────────────────────────────────────

function scheduleRefresh() {
  clearInterval(refreshTimer);
  refreshTimer = setInterval(async () => {
    await loadConversations();
    if (activePhone) await loadMessages(activePhone);
  }, 10_000);
}

// ── Event bindings ────────────────────────────────────────────────────────

function bindEvents() {
  document.getElementById("btn-toggle").addEventListener("click", toggleBot);
  document.getElementById("btn-settings").addEventListener("click", openSettings);
  document.getElementById("btn-close-modal").addEventListener("click", closeSettings);
  document.getElementById("btn-cancel-settings").addEventListener("click", closeSettings);
  document.getElementById("settings-form").addEventListener("submit", saveSettings);

  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeSettings();
  });

  document.querySelectorAll(".filter").forEach((btn) => {
    btn.addEventListener("click", async () => {
      document.querySelectorAll(".filter").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = { tag: btn.dataset.tag, status: btn.dataset.status };
      await loadConversations();
    });
  });

  document.getElementById("tag-select").addEventListener("change", async (e) => {
    if (!activePhone) return;
    await patchConversation(activePhone, { tag: e.target.value });
  });

  document.getElementById("status-select").addEventListener("change", async (e) => {
    if (!activePhone) return;
    await patchConversation(activePhone, { status: e.target.value });
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function apiFetch(path, method = "GET", body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API}${path}`, opts);
  if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`);
  return res.json();
}

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPhone(phone) {
  // 5511999999999 → +55 11 99999-9999
  const d = String(phone).replace(/\D/g, "");
  if (d.length === 13) {
    return `+${d.slice(0,2)} ${d.slice(2,4)} ${d.slice(4,9)}-${d.slice(9)}`;
  }
  return phone;
}

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// ── Start ─────────────────────────────────────────────────────────────────
init();
