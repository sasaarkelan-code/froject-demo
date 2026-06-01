// Froject demo UI — mock interactions (no backend)
document.addEventListener("DOMContentLoaded", () => {
  // ---------- Device mode ----------
  const setDeviceMode = () => {
    const isMobile = window.matchMedia && window.matchMedia("(max-width: 860px)").matches;
    document.documentElement.dataset.device = isMobile ? "mobile" : "desktop";
  };
  setDeviceMode();
  window.addEventListener("resize", setDeviceMode);

  // Icons
  if (window.feather) feather.replace();

  const titles = {
    dashboard: "Главная",
    calendar: "Календарь",
    tasks: "Мои задачи",
    projects: "Проекты",
    chat: "Сообщения",
    mail: "Почта",
    support: "Поддержка",
    settings: "Настройки",
  };


  // ---------- Auth ----------
  const authModal = document.getElementById("auth-modal");
  const authClose = document.getElementById("auth-close");
  const profileName = document.getElementById("top-user-name");
  const authForm = document.getElementById("auth-form");
  const authName = document.getElementById("auth-name");
  const authLogin = document.getElementById("auth-login");
  const authPassword = document.getElementById("auth-password");
  const authTabs = document.querySelectorAll("#auth-modal [data-auth-tab]");
  let authMode = "login";
  function openAuth(){authModal?.classList.add("show");authModal?.setAttribute("aria-hidden","false");setModalOpen(true);}
  function closeAuth(){if(!document.body.classList.contains("authed")) return; authModal?.classList.remove("show");authModal?.setAttribute("aria-hidden","true");setModalOpen(false);}
  authTabs.forEach((t)=>t.addEventListener("click",()=>{authMode=t.dataset.authTab;authTabs.forEach(x=>x.classList.toggle("active",x===t));authName.style.display=authMode==="register"?"block":"none";}));
  const readJson = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      localStorage.removeItem(key);
      return fallback;
    }
  };

  const users = readJson("froject_users", {});
  const saved = readJson("froject_session", null);
  if (saved && (saved.login || saved.name)) {
    if (profileName) profileName.textContent = saved.name || saved.login;
    document.body.classList.add("authed");
  } else {
    openAuth();
  }
  authForm?.addEventListener("submit",(e)=>{e.preventDefault(); const login=authLogin.value.trim(); const pass=authPassword.value.trim(); if(!login||!pass) return; if(authMode==="register"){users[login]={pass,name:(authName.value.trim()||login)};localStorage.setItem("froject_users",JSON.stringify(users));}
  const user=users[login]||{pass,name:login}; if(user.pass!==pass && users[login]) return alert("Неверный пароль"); localStorage.setItem("froject_session",JSON.stringify({login,name:user.name})); if(profileName) profileName.textContent=user.name; document.body.classList.add("authed"); closeAuth();});

  // ---------- Navigation ----------
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".page-section");
  const pageTitle = document.getElementById("page-title");

  function showSection(id) {
    sections.forEach((s) => s.classList.toggle("active", s.id === id));
    navItems.forEach((i) => i.classList.toggle("active", i.dataset.section === id));
    if (pageTitle) pageTitle.textContent = titles[id] || "Froject";
    if (window.feather) feather.replace();
  }

  navItems.forEach((item) => {
    item.addEventListener("click", () => showSection(item.dataset.section));
  });

  // ---------- Demo data ----------
  const demoTasks = [
    { title: "Сверстать новый sidebar + frog‑theme", project: "Froject", key: "froject", status: "inprogress", due: daysFromNow(0), progress: 62 },
    { title: "Сделать «Сообщения» (список чатов + диалог)", project: "Froject", key: "froject", status: "review", due: daysFromNow(1), progress: 88 },
    { title: "Улучшить календарь: неделя + блоки задач", project: "Froject", key: "froject", status: "inprogress", due: daysFromNow(2), progress: 41 },
    { title: "Заполнить демо‑контентом карточки проектов", project: "Демо", key: "demo", status: "done", due: daysFromNow(-1), progress: 100 },
    { title: "Подготовить текст на защиту (слайды 1–6)", project: "Демо", key: "demo", status: "inprogress", due: daysFromNow(3), progress: 35 },
    { title: "Проверить адаптив под ноут/планшет", project: "Froject", key: "froject", status: "inprogress", due: daysFromNow(4), progress: 20 },
  ];

  const autoItems = [
    { title: "Дедлайн: прототип календаря", when: "Ср • 18:00", tag: "Дедлайн", color: "amber" },
    { title: "Фокус‑слот: сделать 2 задачи", when: "Чт • 10:00", tag: "Фокус", color: "green" },
    { title: "Встреча: синк команды", when: "Чт • 12:30", tag: "Встреча", color: "indigo" },
    { title: "Автозадача: напомнить про ревью", when: "Пт • 11:00", tag: "Авто", color: "green" },
  ];

  const meetingSlots = ["Чт • 12:30–13:00", "Ср • 17:00–17:30", "Пт • 10:30–11:00"];

  // ---------- Dashboard ----------
  updateDashboard();

  // ---------- Tasks ----------
  const tasksView = document.getElementById("tasks-view");
  const onTime = document.getElementById("on-time");
  const addDemoBtn = document.getElementById("add-demo-task");
  const taskSearch = document.getElementById("task-search");
  const segButtons = document.querySelectorAll(".segmented .seg");
  const filterChips = document.querySelectorAll(".filters .chip[data-filter]");
  const statusChips = document.querySelectorAll(".filters .chip[data-status]");

  let currentView = "list";
  let currentFilter = "all";
  let currentStatus = "all";

  function filteredTasks() {
    const q = (taskSearch?.value || "").trim().toLowerCase();
    return demoTasks.filter((t) => {
      const okFilter = currentFilter === "all" || t.key === currentFilter;
      const okStatus = currentStatus === "all" || t.status === currentStatus;
      const okQuery = !q || (t.title + " " + t.project).toLowerCase().includes(q);
      return okFilter && okStatus && okQuery;
    });
  }

  function renderTasks() {
    if (!tasksView) return;

    const tasks = filteredTasks();
    const now = new Date();
    const total = tasks.length;
    const onTimeCount = tasks.filter((t) => t.progress === 100 || new Date(t.due) >= startOfDay(now)).length;
    if (onTime) onTime.textContent = total ? `${Math.round((onTimeCount / total) * 100)}%` : "—";

    if (currentView === "kanban") return renderKanban(tasks);
    return renderTaskGroups(tasks);
  }

  function renderTaskGroups(tasks) {
    const groups = {
      "Сегодня": [],
      "На этой неделе": [],
      "Дальше": [],
    };
    const today = startOfDay(new Date());
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 6);

    tasks.forEach((t) => {
      const due = startOfDay(new Date(t.due));
      if (due <= today) groups["Сегодня"].push(t);
      else if (due <= weekEnd) groups["На этой неделе"].push(t);
      else groups["Дальше"].push(t);
    });

    tasksView.innerHTML = Object.entries(groups).map(([name, list]) => {
      return `
        <div class="task-group">
          <div class="task-group-title">
            <span class="strong">${name}</span>
            <span class="muted">${list.length} задач</span>
          </div>
          <div class="task-list-cards">
            ${list.map(taskCard).join("") || `<div class="muted" style="padding:10px 10px 18px">Пусто 👀</div>`}
          </div>
        </div>
      `;
    }).join("");

    if (window.feather) feather.replace();
  }

  function renderKanban(tasks) {
    const cols = [
      { title: "В работе", key: "inprogress" },
      { title: "На ревью", key: "review" },
      { title: "Готово", key: "done" },
    ];
    const by = (k) => tasks.filter((t) => t.status === k);

    tasksView.innerHTML = `
      <div class="kanban">
        ${cols.map(c => `
          <div class="kan-col">
            <h4>${c.title} • ${by(c.key).length}</h4>
            ${by(c.key).map(t => `<div class="task-card kan-card">${taskCardInner(t, true)}</div>`).join("") || `<div class="muted">—</div>`}
          </div>
        `).join("")}
      </div>
    `;
    if (window.feather) feather.replace();
  }

  function taskCard(t) {
    return `<div class="task-card">${taskCardInner(t, false)}</div>`;
  }

  function taskCardInner(t, compact) {
    const dueStr = new Date(t.due).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
    const statusLabel = t.status === "inprogress" ? "В работе" : t.status === "review" ? "Ревью" : "Готово";
    const statusClass = t.status;
    const progress = Math.max(0, Math.min(100, t.progress));

    return `
      <div class="task-top">
        <div>
          <div class="task-title">${escapeHtml(t.title)}</div>
          <div class="task-meta">
            <span class="tag ${t.key === "froject" ? "green" : "indigo"}">${escapeHtml(t.project)}</span>
            <span class="status ${statusClass}">${statusLabel}</span>
            <span class="tag">до ${dueStr}</span>
          </div>
        </div>
        ${compact ? "" : `<button class="icon-btn" title="Открыть"><i data-feather="external-link"></i></button>`}
      </div>
      <div class="task-progress">
        <div class="row"><span>Прогресс</span><span>${progress}%</span></div>
        <div class="progress-bar"><div class="progress" style="width:${progress}%"></div></div>
      </div>
    `;
  }

  segButtons.forEach((b) => b.addEventListener("click", () => {
    segButtons.forEach((x) => x.classList.toggle("active", x === b));
    currentView = b.dataset.view;
    renderTasks();
  }));

  filterChips.forEach((c) => c.addEventListener("click", () => {
    filterChips.forEach((x) => x.classList.toggle("chip-active", x === c));
    currentFilter = c.dataset.filter;
    renderTasks();
  }));

  statusChips.forEach((c) => c.addEventListener("click", () => {
    statusChips.forEach((x) => x.classList.toggle("chip-active", x === c));
    currentStatus = c.dataset.status;
    renderTasks();
  }));

  taskSearch?.addEventListener("input", renderTasks);

  addDemoBtn?.addEventListener("click", () => {
    demoTasks.unshift({
      title: "Задемоить интерфейс для защиты (5 минут)",
      project: "Froject",
      key: "froject",
      status: "inprogress",
      due: daysFromNow(1),
      progress: 10,
    });
    renderTasks();
    updateDashboard();
  });

  renderTasks();

  // ---------- Calendar ----------
  const weekGrid = document.getElementById("week-grid");
  const weekRange = document.getElementById("week-range");
  const autoList = document.getElementById("auto-list");
  const suggestMeeting = document.getElementById("suggest-meeting");
  const meetingSlotEl = document.getElementById("meeting-slot");

  const calEvents = [
    { day: 0, start: "10:00", dur: 60, type: "focus", title: "Фокус‑слот", sub: "Сверстать компоненты" },
    { day: 1, start: "12:00", dur: 30, type: "meeting", title: "Синк дизайна", sub: "UI + лягушки" },
    { day: 2, start: "18:00", dur: 30, type: "deadline", title: "Дедлайн", sub: "Прототип календаря" },
    { day: 3, start: "12:30", dur: 30, type: "meeting", title: "Спринт‑синк", sub: "Smart slot ✅" },
    { day: 4, start: "15:00", dur: 60, type: "personal", title: "Личное", sub: "Перерыв / дела" },
  ];

  let slotIndex = 0;

  function renderAuto() {
    if (!autoList) return;
    autoList.innerHTML = autoItems.map((x) => `
      <div class="auto-item">
        <div class="left">
          <div class="strong">${escapeHtml(x.title)}</div>
          <div class="muted">${escapeHtml(x.when)}</div>
        </div>
        <div class="right">
          <span class="tag ${x.color}">${escapeHtml(x.tag)}</span>
          <span class="muted">авто</span>
        </div>
      </div>
    `).join("");
  }

  function renderWeek() {
    if (!weekGrid) return;

    const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    const startHour = 9;
    const endHour = 18;
    const hours = [];
    for (let h = startHour; h < endHour; h++) hours.push(h);

    const headRow = [
      `<div class="cal-cell header"></div>`,
      ...days.map((d) => `<div class="cal-cell header"><span class="strong">${d}</span><span class="muted"> </span></div>`)
    ].join("");

    const body = hours.map((h) => {
      const timeLabel = `${String(h).padStart(2, "0")}:00`;
      const rowCells = days.map((_, dayIdx) => {
        return `<div class="cal-cell cal-slot" data-day="${dayIdx}" data-hour="${h}"></div>`;
      }).join("");
      return `<div class="cal-cell time">${timeLabel}</div>${rowCells}`;
    }).join("");

    weekGrid.innerHTML = headRow + body;

    const slots = weekGrid.querySelectorAll(".cal-slot");
    slots.forEach((slot) => {
      const day = Number(slot.dataset.day);
      const hour = Number(slot.dataset.hour);

      const evs = calEvents.filter((e) => e.day === day && Number(e.start.split(":")[0]) === hour);
      evs.forEach((e) => {
        const minutes = Number(e.start.split(":")[1] || 0);
        const top = (minutes / 60) * 100;
        const height = (e.dur / 60) * 100;

        const el = document.createElement("div");
        el.className = `event ${e.type}`;
        el.style.top = `${top}%`;
        el.style.height = `${Math.max(60, height)}%`;
        el.innerHTML = `<span class="t">${escapeHtml(e.title)}</span><span class="s">${escapeHtml(e.sub)}</span>`;
        slot.appendChild(el);
      });
    });

    if (weekRange) weekRange.textContent = "Неделя • 09–15 декабря";
    if (window.feather) feather.replace();
  }

  suggestMeeting?.addEventListener("click", () => {
    slotIndex = (slotIndex + 1) % meetingSlots.length;
    if (meetingSlotEl) meetingSlotEl.textContent = meetingSlots[slotIndex];
  });

  renderWeek();
  renderAuto();

  // ---------- Messenger ----------
  const chatItems = document.querySelectorAll(".chat-item");
  const chatMessages = document.getElementById("chat-messages");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-message");
  const activeChatName = document.getElementById("active-chat-name");
  const activeChatSub = document.getElementById("active-chat-sub");
  const activeChatAvatar = document.getElementById("active-chat-avatar");

  const chats = {
    "work-1": {
      name: "Froject • Команда",
      sub: "4 участника • быстрый синк",
      avatar: "🐸",
      messages: [
        { who: "them", text: "Я обновила текст по проблеме и гипотезе. Посмотрите?", time: "12:03" },
        { who: "me", text: "Да, сейчас гляну. Параллельно допилю календарь и чат.", time: "12:07" },
        { who: "them", text: "Smart Scheduling нашёл слот: четверг 12:30 ✅", time: "12:14" },
        { who: "them", text: "И ещё: сделаем лягушачий стиль помягче, без кислотного зелёного.", time: "12:15" },
      ],
    },
    "work-2": {
      name: "Дизайн‑синк",
      sub: "2 участника • UI решения",
      avatar: "UI",
      messages: [
        { who: "them", text: "Давай сделаем карточки более округлыми и добавим стеклянный эффект.", time: "вчера 18:10" },
        { who: "me", text: "Ок. Возьму мягкий мятный градиент + чуть индиго для контраста.", time: "вчера 18:12" },
      ],
    },
    "col-1": {
      name: "Коллега №1",
      sub: "коллега • разработка",
      avatar: "1",
      messages: [
        { who: "them", text: "Скину PR через 15 минут — там фикс по календарю и сетке.", time: "09:01" },
        { who: "me", text: "Ок, гляну сразу и отмечу правки. Спасибо!", time: "09:03" },
      ],
    },
    "col-2": {
      name: "Коллега №2",
      sub: "коллега • менеджмент",
      avatar: "2",
      messages: [
        { who: "them", text: "Напомни, какой дедлайн по MVP для защиты?", time: "пн 20:44" },
        { who: "me", text: "Среда. Я сегодня добью задачи и прогресс‑вид, чтобы было наглядно.", time: "пн 20:47" },
      ],
    },
  };

  let activeChatId = "work-1";

  function renderChat(id) {
    const c = chats[id];
    if (!c || !chatMessages) return;

    activeChatId = id;
    if (activeChatName) activeChatName.textContent = c.name;
    if (activeChatSub) activeChatSub.textContent = c.sub;
    if (activeChatAvatar) activeChatAvatar.textContent = c.avatar;

    chatMessages.innerHTML = c.messages.map((m) => `
      <div class="bubble ${m.who === "me" ? "me" : ""}">
        ${escapeHtml(m.text)}
        <div class="meta">${escapeHtml(m.time)}</div>
      </div>
    `).join("");

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  chatItems.forEach((item) => {
    item.addEventListener("click", () => {
      chatItems.forEach((x) => x.classList.toggle("active", x === item));
      renderChat(item.dataset.chat);
    });
  });

  sendBtn?.addEventListener("click", sendMessage);
  chatInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  function sendMessage() {
    const text = (chatInput?.value || "").trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    chats[activeChatId].messages.push({ who: "me", text, time });
    if (chatInput) chatInput.value = "";
    renderChat(activeChatId);
  }

  renderChat(activeChatId);

  // ---------- Projects ----------
  const projectList = document.getElementById("project-list");
  const addProjectBtn = document.getElementById("add-project-btn");
  const projectNameInput = document.getElementById("project-name");
  const projectDeadlineInput = document.getElementById("project-deadline");

  const demoProjects = [
    { name: "Froject — MVP", status: "Активен", deadline: daysFromNow(12), health: "Низкий риск", progress: 72, members: 4 },
    { name: "Дизайн‑система (frog)", status: "Активен", deadline: daysFromNow(7), health: "Средний риск", progress: 54, members: 3 },
    { name: "Презентация к защите", status: "Активен", deadline: daysFromNow(3), health: "Высокий риск", progress: 38, members: 5 },
    { name: "Личный трекер учёбы", status: "Пауза", deadline: daysFromNow(30), health: "Низкий риск", progress: 15, members: 1 },
  ];

  function renderProjects() {
    if (!projectList) return;
    projectList.innerHTML = demoProjects.map((p, idx) => {
      const dl = new Date(p.deadline).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
      const statusTag = p.status === "Активен" ? "green" : "indigo";
      return `
        <div class="project-card">
          <div class="project-head">
            <div>
              <div class="strong">${escapeHtml(p.name)}</div>
              <div class="muted">Дедлайн: ${dl} • Участников: ${p.members}</div>
            </div>
            <span class="tag ${statusTag}">${escapeHtml(p.status)}</span>
          </div>
          <div class="project-body">
            <div class="project-metrics">
              <div class="mini-metric"><span class="muted">Состояние</span><span class="strong">${escapeHtml(p.health)}</span></div>
              <div class="mini-metric"><span class="muted">Прогресс</span><span class="strong">${p.progress}%</span></div>
            </div>
            <div class="progress-bar"><div class="progress" style="width:${p.progress}%"></div></div>
          </div>
          <div class="project-actions">
            <button class="btn btn-primary" data-open-workspace="true" data-project="${idx}">
              <i data-feather="external-link"></i> Открыть workspace
            </button>
            <button class="btn btn-ghost"><i data-feather="user-plus"></i> Пригласить</button>
          </div>
        </div>
      `;
    }).join("");

    if (window.feather) feather.replace();
  }

  addProjectBtn?.addEventListener("click", () => {
    const name = (projectNameInput?.value || "").trim() || "Новый проект";
    const deadline = projectDeadlineInput?.value || daysFromNow(14);
    demoProjects.unshift({ name, status: "Активен", deadline, health: "Низкий риск", progress: 12, members: 3 });
    if (projectNameInput) projectNameInput.value = "";
    renderProjects();
    updateDashboard();
    bindWorkspaceOpeners();
  });

  renderProjects();

  // ---------- Workspace modal ----------
  function setModalOpen(isOpen) {
    document.body.classList.toggle("modal-open", !!isOpen);
  }

  const workspaceModal = document.getElementById("workspace-modal");
  const wsClose = document.getElementById("ws-close");
  const modalBackdrop = document.querySelector(".modal-backdrop");
  let openWorkspaceButtons = [];

  function bindWorkspaceOpeners() {
    openWorkspaceButtons = Array.from(document.querySelectorAll("[data-open-workspace]"));
    openWorkspaceButtons.forEach((b) => {
      b.addEventListener("click", () => {
        const idx = Number(b.dataset.project || 0);
        const p = demoProjects[idx] || null;
        const nameEl = document.getElementById("ws-project-name");
        const statusEl = document.getElementById("ws-project-status");
        const nextMeetingEl = document.getElementById("ws-next-meeting");
        if (p && nameEl) nameEl.textContent = p.name;
        if (p && statusEl) statusEl.textContent = p.status;
        if (nextMeetingEl) nextMeetingEl.textContent = "Ближайшая встреча: " + meetingSlots[slotIndex];
        openModal();
      });
    });
  }

  function openModal() {
    if (!workspaceModal) return;
    setModalOpen(true);
    workspaceModal.classList.add("show");
    workspaceModal.setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    if (!workspaceModal) return;
    workspaceModal.classList.remove("show");
    workspaceModal.setAttribute("aria-hidden", "true");
    setModalOpen(false);
  }

  bindWorkspaceOpeners();
  wsClose?.addEventListener("click", closeModal);
  modalBackdrop?.addEventListener("click", (e) => {
    if (e.target?.dataset?.close) closeModal();
  });

  // ---------- Profile modal ----------
  const profileBtn = document.getElementById("profile-btn");
  const profileModal = document.getElementById("profile-modal");
  const profileClose = document.getElementById("profile-close");
  const profileBackdrop = profileModal?.querySelector(".modal-backdrop");
  const profTabs = profileModal?.querySelectorAll("[data-prof-tab]") || [];
  const profSections = profileModal?.querySelectorAll(".ws-section") || [];

  function openProfile() {
    if (!profileModal) return;
    setModalOpen(true);
    profileModal.classList.add("show");
    profileModal.setAttribute("aria-hidden", "false");
    if (window.feather) feather.replace();
  }
  function closeProfile() {
    if (!profileModal) return;
    profileModal.classList.remove("show");
    profileModal.setAttribute("aria-hidden", "true");
    setModalOpen(false);
  }

  profileBtn?.addEventListener("click", () => { if(localStorage.getItem("froject_session")) openProfile(); else openAuth(); });
  authClose?.addEventListener("click", closeAuth);
  authModal?.querySelector(".modal-backdrop")?.addEventListener("click",(e)=>{if(e.target?.dataset?.closeAuth) closeAuth();});
  profileClose?.addEventListener("click", closeProfile);
  profileBackdrop?.addEventListener("click", (e) => {
    if (e.target?.dataset?.closeProfile) closeProfile();
  });

  document.getElementById("logout-btn")?.addEventListener("click",()=>{
    localStorage.removeItem("froject_session");
    document.body.classList.remove("authed");
    if(profileName) profileName.textContent="Войти";
    closeProfile();
    openAuth();
  });

  profTabs.forEach((t) => {
    t.addEventListener("click", () => {
      profTabs.forEach((x) => x.classList.toggle("active", x === t));
      profSections.forEach((s) => s.classList.toggle("active", s.id === t.dataset.profTab));
      if (window.feather) feather.replace();
    });
  });

  // ---------- Support ----------
  const supportThread = document.getElementById("support-thread");
  const supportForm = document.getElementById("support-form");
  const supportSubject = document.getElementById("support-subject");
  const supportMessage = document.getElementById("support-message");

  function addSupportBubble(who, text, meta) {
    if (!supportThread) return;
    const cls = who === "me" ? "me" : "agent";
    const safe = escapeHtml(text);
    const m = meta ? `<div class="meta">${escapeHtml(meta)}</div>` : "";
    supportThread.insertAdjacentHTML("beforeend", `<div class="support-bubble ${cls}">${safe}${m}</div>`);
    supportThread.scrollTop = supportThread.scrollHeight;
  }

  if (supportThread && !supportThread.dataset.seeded) {
    supportThread.dataset.seeded = "1";
    addSupportBubble("agent", "Привет! 🐸 Я Froject Support. Опишите вопрос — и я помогу.", "бот • сейчас");
    addSupportBubble("me", "Нужно красиво показать календарь и задачи для защиты.", "вы • 1 мин назад");
    addSupportBubble("agent", "Ок! Могу подсказать, как лучше визуализировать прогресс и дедлайны. Что важнее: Гант или календарь?", "оператор • сейчас");
  }

  supportForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const subj = (supportSubject?.value || "").trim();
    const msg = (supportMessage?.value || "").trim();
    if (!msg) return;
    addSupportBubble("me", msg, subj ? `тема: ${subj}` : "");
    if (supportSubject) supportSubject.value = "";
    if (supportMessage) supportMessage.value = "";

    window.setTimeout(() => {
      addSupportBubble("agent", "Принято! ✅ Добавьте 2–3 блока в календарь (встреча/дедлайн/фокус) и прогресс‑бар у задач — так нагляднее всего.", "оператор • сейчас");
    }, 600);
  });

  
  document.querySelectorAll("[data-section-jump]").forEach((b)=>b.addEventListener("click",()=>showSection(b.dataset.sectionJump)));
  document.getElementById("theme-select")?.addEventListener("change",(e)=>{document.documentElement.dataset.theme=e.target.value; localStorage.setItem("froject_theme",e.target.value);});
  const th=localStorage.getItem("froject_theme"); if(th){document.documentElement.dataset.theme=th; const sel=document.getElementById("theme-select"); if(sel) sel.value=th;}

  // workspace tabs fix
  document.querySelectorAll("#workspace-modal .ws-tab").forEach((t)=>t.addEventListener("click",()=>{
    if (t.dataset.wsTab === "ws-chat") {
      closeModal();
      showSection("chat");
      return;
    }
    document.querySelectorAll("#workspace-modal .ws-tab").forEach(x=>x.classList.toggle("active",x===t));
    document.querySelectorAll("#workspace-modal .ws-section").forEach(s=>s.classList.toggle("active",s.id===t.dataset.wsTab));
  }));

  const calendarModal=document.getElementById("calendar-modal");
  document.getElementById("open-calendar-modal")?.addEventListener("click",()=>{calendarModal?.classList.add("show"); setModalOpen(true);});
  document.getElementById("calendar-close")?.addEventListener("click",()=>{calendarModal?.classList.remove("show"); setModalOpen(false);});
  calendarModal?.querySelector(".modal-backdrop")?.addEventListener("click",(e)=>{if(e.target?.dataset?.closeCalendar){calendarModal.classList.remove("show"); setModalOpen(false);}});

  // custom calendar events
  document.getElementById("calendar-note-form")?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const title=document.getElementById("calendar-note-title").value.trim();
    const day=Number(document.getElementById("calendar-note-day").value);
    const start=document.getElementById("calendar-note-time").value||"11:00";
    if(!title) return;
    const type=document.getElementById("calendar-note-type").value||"personal";
    calEvents.push({day,start,dur:30,type,title,sub:"Пользовательское"});
    calendarModal?.classList.remove("show"); setModalOpen(false);
    document.getElementById("calendar-note-title").value="";
    renderWeek();
  });

  const mailList=document.getElementById("mail-list"), mailBody=document.getElementById("mail-body"), mailSubject=document.getElementById("mail-subject");
  const mails=[{subject:"Добро пожаловать в Froject Mail",from:"support@froject.local",name:"Froject Support",time:"сегодня, 10:24",body:"Это демо-письмо вашего нового ящика. Здесь будут уведомления, апдейты и ответы команды."},{subject:"Напоминание: дедлайн проекта",from:"team@froject.local",name:"Команда Froject",time:"вчера, 18:42",body:"Не забудьте обновить задачи и календарь. Рекомендуем закрыть 2 ключевые задачи до конца дня."}];
  // Old mail UI replaced by Froject Mail in expansion patch — skip if new UI present
  if(mailList && mailSubject && mailBody){mailList.innerHTML=mails.map((m,i)=>`<button class="chat-item mail-item ${i===0?"active":""}" data-mail="${i}"><div class="chat-meta"><div class="chat-top"><span class="chat-name">${m.name}</span><span class="chat-time">${m.time}</span></div><div class="chat-preview">${m.subject}</div><div class="muted">${m.from}</div></div></button>`).join("");
  const openMail=(i)=>{const m=mails[i]; mailSubject.textContent=m.subject; mailBody.innerHTML=`<div class="msg them"><div class="bubble"><strong>${m.subject}</strong><br><span class="muted">От: ${m.name} • ${m.from}</span><br><br>${m.body}</div></div>`; mailList.querySelectorAll(".mail-item").forEach((x,idx)=>x.classList.toggle("active",idx===i));};
  mailList.querySelectorAll("[data-mail]").forEach(b=>b.addEventListener("click",()=>openMail(Number(b.dataset.mail))));
  openMail(0);}


  // ---------- Helpers ----------
  function updateDashboard() {
    const tasksCount = document.getElementById("tasks-count");
    const projectsCount = document.getElementById("projects-count");
    const dateElem = document.getElementById("today-date");
    const weekdayElem = document.getElementById("today-weekday");

    const total = demoTasks.length;
    if (tasksCount) tasksCount.textContent = String(total);
    if (projectsCount) projectsCount.textContent = "4";

    const now = new Date();
    if (dateElem) {
      dateElem.textContent = now.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    }
    if (weekdayElem) {
      const weekdays = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
      weekdayElem.textContent = weekdays[now.getDay()];
    }
  }

  function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ---------- Багофиксы ----------
  document.documentElement.style.setProperty('--left', '0%');
  document.documentElement.style.setProperty('--width', '0%');

  // Фикс Гант: CSS-переменные вместо inline
  document.querySelectorAll('.bar-fill').forEach(bar => {
    const style = bar.style;
    if (style.left)  bar.style.setProperty('--left',  style.left);
    if (style.width) bar.style.setProperty('--width', style.width);
    style.left = style.width = ''; // убираем inline
  });

  // Убираем текстовый курсор
  document.addEventListener('selectstart', e => {
    if (e.target.closest('input, textarea')) return;
    e.preventDefault();
  });

  // ---------- Floating AI suggestion (TZ §12) ----------
  const aiFloat = document.getElementById('ai-float');
  const aiFloatClose = document.getElementById('ai-float-close');
  if (aiFloatClose && aiFloat) {
    aiFloatClose.addEventListener('click', () => {
      aiFloat.style.transition = 'opacity .24s, transform .24s';
      aiFloat.style.opacity = '0';
      aiFloat.style.transform = 'translateY(12px) scale(.96)';
      setTimeout(() => aiFloat.remove(), 240);
    });
  }

  /* ==========================================================
     EXPANSION PATCH — bug fixes + new features (prompt v2)
     ========================================================== */

  // ---------- 0. Role system & current user ----------
  const ROLES = {
    user:    { label: 'Пользователь',  canCreateProject: false, canEditTask: false, canDeleteTask: false, canSetPriority: false },
    manager: { label: 'Менеджер',      canCreateProject: true,  canEditTask: true,  canDeleteTask: true,  canSetPriority: true  },
    admin:   { label: 'Администратор', canCreateProject: true,  canEditTask: true,  canDeleteTask: true,  canSetPriority: true  },
  };
  function currentUser() {
    try {
      const s = JSON.parse(localStorage.getItem('froject_session') || 'null');
      return s || null;
    } catch { return null; }
  }
  function currentRole() {
    const s = currentUser();
    return (s && ROLES[s.role]) ? s.role : 'user';
  }
  function can(action) { return !!ROLES[currentRole()][action]; }
  function mailAddrFor(login) {
    return (String(login || 'user').toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'user') + '@fmail.ru';
  }

  // Update topbar live mail preview during register
  const authLoginInput = document.getElementById('auth-login');
  const authMailPreview = document.getElementById('auth-mail-preview');
  const authRoleSelect = document.getElementById('auth-role');
  authLoginInput?.addEventListener('input', () => {
    if (authMailPreview) authMailPreview.textContent = mailAddrFor(authLoginInput.value);
  });
  const _authTabs = document.querySelectorAll('#auth-modal [data-auth-tab]');
  _authTabs.forEach(t => t.addEventListener('click', () => {
    const isReg = t.dataset.authTab === 'register';
    if (authRoleSelect) authRoleSelect.style.display = isReg ? 'block' : 'none';
  }));

  // Hook into auth form to persist role + mail
  const _authForm = document.getElementById('auth-form');
  _authForm?.addEventListener('submit', () => {
    // Runs AFTER original handler (event listener stacking) — we read session and enrich
    setTimeout(() => {
      try {
        const s = JSON.parse(localStorage.getItem('froject_session') || 'null');
        if (s && !s.role) {
          s.role = authRoleSelect && authRoleSelect.style.display !== 'none' ? authRoleSelect.value : 'user';
          s.mail = mailAddrFor(s.login);
          s.createdAt = s.createdAt || Date.now();
          localStorage.setItem('froject_session', JSON.stringify(s));
        }
        applySessionUI();
        showWelcomeToast();
        seedMailbox();
      } catch {}
    }, 0);
  });

  // Apply session-derived UI (role badges, mail address, restrictions)
  function applySessionUI() {
    const s = currentUser();
    const name = (s && (s.name || s.login)) || 'Гость';
    const role = (s && ROLES[s.role]) ? s.role : 'user';
    const mail = (s && s.mail) || mailAddrFor(s && s.login);

    document.body.dataset.role = role;

    const pmName = document.getElementById('pm-name');
    const pmMail = document.getElementById('pm-mail');
    const pmRole = document.getElementById('pm-role');
    if (pmName) pmName.textContent = name;
    if (pmMail) pmMail.textContent = mail;
    if (pmRole) {
      pmRole.textContent = ROLES[role].label;
      pmRole.dataset.role = role;
    }
    const mailSelf = document.getElementById('mail-self-addr');
    if (mailSelf) mailSelf.textContent = mail;

    // Disable create-project for basic users
    const addProjectBtn = document.getElementById('add-project');
    const addProjectBtn2 = document.getElementById('add-project-btn');
    [addProjectBtn, addProjectBtn2].forEach(b => {
      if (!b) return;
      if (!can('canCreateProject')) {
        b.disabled = true;
        b.title = '🔒 Только менеджер/администратор';
        b.classList.add('role-disabled');
      } else {
        b.disabled = false;
        b.title = '';
        b.classList.remove('role-disabled');
      }
    });
  }

  function showWelcomeToast() {
    const s = currentUser();
    if (!s) return;
    const toast = document.getElementById('welcome-toast');
    const n = document.getElementById('welcome-name');
    const r = document.getElementById('welcome-role');
    if (!toast) return;
    if (n) n.textContent = s.name || s.login;
    if (r) r.textContent = ROLES[s.role || 'user'].label;
    toast.hidden = false;
    toast.classList.add('show');
    clearTimeout(showWelcomeToast._t);
    showWelcomeToast._t = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => { toast.hidden = true; }, 320);
    }, 3500);
  }

  // ---------- Profile menu dropdown + Logout ----------
  const pBtn2 = document.getElementById('profile-btn');
  const profileMenu = document.getElementById('profile-menu');
  function openProfileMenu(open) {
    if (!profileMenu) return;
    profileMenu.hidden = !open;
    profileMenu.classList.toggle('show', open);
  }
  pBtn2?.addEventListener('click', (e) => {
    e.stopPropagation();
    // If not authed, let original handler open auth modal
    if (!document.body.classList.contains('authed')) return;
    openProfileMenu(profileMenu.hidden);
  });
  document.addEventListener('click', (e) => {
    if (!profileMenu || profileMenu.hidden) return;
    if (!e.target.closest('#profile-menu') && !e.target.closest('#profile-btn')) openProfileMenu(false);
  });
  document.getElementById('pm-open-profile')?.addEventListener('click', () => {
    openProfileMenu(false);
    document.getElementById('profile-modal')?.classList.add('show');
  });
  document.getElementById('pm-settings')?.addEventListener('click', () => {
    openProfileMenu(false);
    document.querySelector('.nav-item[data-section="settings"]')?.click();
  });
  // Logout modal
  const logoutModal = document.getElementById('logout-modal');
  function openLogout(open) {
    if (!logoutModal) return;
    logoutModal.classList.toggle('show', open);
    logoutModal.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  document.getElementById('pm-logout')?.addEventListener('click', () => { openProfileMenu(false); openLogout(true); });
  document.getElementById('logout-close')?.addEventListener('click', () => openLogout(false));
  document.getElementById('logout-cancel')?.addEventListener('click', () => openLogout(false));
  logoutModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => openLogout(false));
  document.getElementById('logout-confirm')?.addEventListener('click', () => {
    localStorage.removeItem('froject_session');
    document.body.classList.remove('authed');
    openLogout(false);
    location.reload();
  });

  // ---------- Light/Dark theme ----------
  const themeSelect = document.getElementById('theme-select');
  function applyTheme(name) {
    const t = (name === 'light') ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    localStorage.setItem('froject_theme', t);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'light' ? '#F4F6F8' : '#0F1115');
  }
  const savedTheme = localStorage.getItem('froject_theme') || 'dark';
  applyTheme(savedTheme);
  if (themeSelect) themeSelect.value = savedTheme;
  themeSelect?.addEventListener('change', (e) => applyTheme(e.target.value));

  // ---------- 1. Daily Task List (under calendar, prompt §2.2) ----------
  const dailyListEl = document.getElementById('daily-list');
  const dailyDateEl = document.getElementById('daily-date');
  const dailyHideDone = document.getElementById('daily-hide-done');
  let dailySort = 'time';
  document.querySelectorAll('#daily-sort .seg').forEach(s => {
    s.addEventListener('click', () => {
      document.querySelectorAll('#daily-sort .seg').forEach(x => x.classList.toggle('active', x === s));
      dailySort = s.dataset.sort;
      renderDaily();
    });
  });
  dailyHideDone?.addEventListener('change', renderDaily);

  // Backing dataset for daily list (independent of week-grid events so we can add checkboxes)
  const dailyTasks = JSON.parse(localStorage.getItem('froject_daily') || 'null') || [
    { id: 'd1', title: 'Подготовить макеты dashboard', time: '09:30', prio: 'high',   done: false },
    { id: 'd2', title: 'Синк дизайна (UI + лягушки)',   time: '12:00', prio: 'med',    done: false },
    { id: 'd3', title: 'Code review PR #142',           time: '14:00', prio: 'med',    done: true  },
    { id: 'd4', title: 'Спринт-синк команды',           time: '12:30', prio: 'urgent', done: false },
    { id: 'd5', title: 'Закрыть тикеты поддержки',      time: '16:30', prio: 'low',    done: false },
    { id: 'd6', title: 'Подготовить ретроспективу',     time: '17:00', prio: 'med',    done: false },
  ];
  function persistDaily() { localStorage.setItem('froject_daily', JSON.stringify(dailyTasks)); }
  const prioWeight = { urgent: 4, high: 3, med: 2, low: 1 };
  const prioLabel  = { urgent: 'Срочный', high: 'Высокий', med: 'Средний', low: 'Низкий' };
  function renderDaily() {
    if (!dailyListEl) return;
    if (dailyDateEl) dailyDateEl.textContent = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
    let list = dailyTasks.slice();
    if (dailyHideDone?.checked) list = list.filter(t => !t.done);
    if (dailySort === 'time') list.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    else list.sort((a, b) => prioWeight[b.prio] - prioWeight[a.prio]);

    dailyListEl.innerHTML = list.map(t => `
      <li class="daily-row ${t.done ? 'done' : ''}" data-id="${t.id}" data-ctx-type="daily">
        <label class="daily-check">
          <input type="checkbox" data-daily-toggle="${t.id}" ${t.done ? 'checked' : ''}>
          <span class="dc-box"></span>
        </label>
        <div class="daily-main">
          <div class="daily-title">${escapeHtmlLocal(t.title)}</div>
          <div class="daily-meta">
            <span class="daily-time mono">${escapeHtmlLocal(t.time || '')}</span>
            <span class="prio-pill prio-${t.prio}">${prioLabel[t.prio] || ''}</span>
          </div>
        </div>
        <button class="icon-btn daily-more" data-daily-menu="${t.id}" title="Меню"><span>⋯</span></button>
      </li>
    `).join('') || '<li class="muted" style="padding:14px;text-align:center">На сегодня задач нет 🎉</li>';
  }
  function escapeHtmlLocal(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  dailyListEl?.addEventListener('change', (e) => {
    const id = e.target.dataset?.dailyToggle;
    if (!id) return;
    const t = dailyTasks.find(x => x.id === id);
    if (t) { t.done = e.target.checked; persistDaily(); renderDaily(); }
  });
  dailyListEl?.addEventListener('click', (e) => {
    const more = e.target.closest('[data-daily-menu]');
    if (more) {
      const id = more.dataset.dailyMenu;
      const row = more.closest('.daily-row');
      const rect = more.getBoundingClientRect();
      openCtxMenu(rect.left - 160, rect.bottom + 6, { type: 'daily', id, el: row });
    }
  });

  renderDaily();

  // ---------- 2. Right-click context menu ----------
  const ctxMenu = document.getElementById('ctx-menu');
  let ctxTarget = null;
  function openCtxMenu(x, y, target) {
    if (!ctxMenu) return;
    ctxTarget = target;
    ctxMenu.hidden = false;
    // clamp to viewport
    const W = window.innerWidth, H = window.innerHeight;
    ctxMenu.style.left = '0px';
    ctxMenu.style.top = '0px';
    const r = ctxMenu.getBoundingClientRect();
    let nx = Math.min(x, W - r.width - 8);
    let ny = Math.min(y, H - r.height - 8);
    ctxMenu.style.left = Math.max(8, nx) + 'px';
    ctxMenu.style.top  = Math.max(8, ny) + 'px';
    // Role restrictions
    const editBtn   = ctxMenu.querySelector('[data-ctx="edit"]');
    const delBtn    = ctxMenu.querySelector('[data-ctx="delete"]');
    const prioBtn   = ctxMenu.querySelector('[data-ctx="prio"]');
    if (editBtn) editBtn.classList.toggle('ctx-disabled', !can('canEditTask'));
    if (delBtn)  delBtn.classList.toggle('ctx-disabled',  !can('canDeleteTask'));
    if (prioBtn) prioBtn.classList.toggle('ctx-disabled', !can('canSetPriority'));
  }
  function closeCtxMenu() { if (ctxMenu) { ctxMenu.hidden = true; ctxTarget = null; } }

  // Attach right-click to tasks (.task-card), kanban cards (.kan-card), and daily rows
  document.addEventListener('contextmenu', (e) => {
    const t = e.target.closest('.task-card, .kan-card, .daily-row, .ws-tasklist li');
    if (!t) return;
    e.preventDefault();
    let type = 'task';
    let id = t.dataset.id || t.dataset.taskId || '';
    if (t.classList.contains('daily-row')) { type = 'daily'; id = t.dataset.id; }
    openCtxMenu(e.clientX, e.clientY, { type, id, el: t });
  });
  document.addEventListener('click', (e) => {
    if (!ctxMenu || ctxMenu.hidden) return;
    if (!e.target.closest('#ctx-menu')) closeCtxMenu();
  });
  document.addEventListener('scroll', closeCtxMenu, true);
  window.addEventListener('resize', closeCtxMenu);

  // Ctx menu actions
  ctxMenu?.addEventListener('click', (e) => {
    const action = e.target.closest('[data-ctx]')?.dataset.ctx;
    const prioBtn = e.target.closest('.ctx-prio');
    if (prioBtn) {
      const p = prioBtn.dataset.prio;
      if (!can('canSetPriority')) return showRoleHint();
      if (ctxTarget?.type === 'daily') {
        const t = dailyTasks.find(x => x.id === ctxTarget.id);
        if (t) { t.prio = p; persistDaily(); renderDaily(); }
      }
      closeCtxMenu();
      return;
    }
    if (!action || action === 'prio') return;
    handleCtxAction(action);
  });
  function handleCtxAction(action) {
    if (!ctxTarget) return;
    const { type, id, el } = ctxTarget;

    if (action === 'edit') {
      if (!can('canEditTask') && type !== 'daily') return showRoleHint();
      if (type === 'daily') openTaskEditModal(id, 'daily');
      else openTaskEditModal(id, 'task');
    }
    if (action === 'done') {
      if (type === 'daily') {
        const t = dailyTasks.find(x => x.id === id);
        if (t) { t.done = true; persistDaily(); renderDaily(); }
      } else {
        // bring task into "done" status visually
        el?.classList.add('task-done-flash');
        el?.querySelectorAll('.status').forEach(s => { s.className = 'status done'; s.textContent = 'Готово'; });
        const bar = el?.querySelector('.progress');
        if (bar) bar.style.width = '100%';
      }
    }
    if (action === 'delete') {
      if (!can('canDeleteTask')) return showRoleHint();
      if (type === 'daily') {
        const i = dailyTasks.findIndex(x => x.id === id);
        if (i > -1) { dailyTasks.splice(i, 1); persistDaily(); renderDaily(); }
      } else {
        el?.style.setProperty('transition', 'opacity .25s, transform .25s');
        el?.style.setProperty('opacity', '0');
        el?.style.setProperty('transform', 'translateX(-12px) scale(.95)');
        setTimeout(() => el?.remove(), 260);
      }
    }
    closeCtxMenu();
  }
  function showRoleHint() {
    closeCtxMenu();
    const toast = document.createElement('div');
    toast.className = 'role-toast';
    toast.textContent = '🔒 Недоступно для вашей роли';
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 250); }, 2200);
  }

  // ---------- Task edit modal ----------
  const taskModal = document.getElementById('task-modal');
  const taskEditForm = document.getElementById('task-edit-form');
  const taskEditTitle = document.getElementById('task-edit-title');
  const taskEditDue   = document.getElementById('task-edit-due');
  const taskEditStatus = document.getElementById('task-edit-status');
  const taskEditProgress = document.getElementById('task-edit-progress');
  const taskEditProgressLabel = document.getElementById('task-edit-progress-label');
  const taskRoleWarn = document.getElementById('task-edit-role-warn');
  let taskEditCtx = null;
  function openTaskEditModal(id, kind) {
    if (!taskModal) return;
    taskEditCtx = { id, kind };
    if (kind === 'daily') {
      const t = dailyTasks.find(x => x.id === id);
      if (!t) return;
      taskEditTitle.value = t.title;
      taskEditDue.value = '';
      taskEditStatus.value = t.done ? 'done' : 'inprogress';
      taskEditProgress.value = t.done ? 100 : 0;
    } else {
      // Pull from a .task-card if available
      const card = document.querySelector(`.task-card[data-id="${id}"]`);
      if (card) {
        taskEditTitle.value = card.querySelector('.task-title')?.textContent || '';
        taskEditStatus.value = card.querySelector('.status')?.classList?.[1] || 'inprogress';
        const w = card.querySelector('.progress')?.style?.width || '0%';
        taskEditProgress.value = parseInt(w) || 0;
      }
    }
    taskEditProgressLabel.textContent = taskEditProgress.value + '%';
    // Role-based field locking
    const restricted = !can('canEditTask');
    taskEditTitle.disabled = restricted && kind !== 'daily';
    taskEditDue.disabled   = restricted;
    taskEditProgress.disabled = restricted;
    if (taskRoleWarn) taskRoleWarn.hidden = !restricted;
    taskModal.classList.add('show');
    taskModal.setAttribute('aria-hidden', 'false');
  }
  function closeTaskModal() {
    taskModal?.classList.remove('show');
    taskModal?.setAttribute('aria-hidden', 'true');
  }
  taskEditProgress?.addEventListener('input', () => { taskEditProgressLabel.textContent = taskEditProgress.value + '%'; });
  document.getElementById('task-modal-close')?.addEventListener('click', closeTaskModal);
  document.getElementById('task-modal-cancel')?.addEventListener('click', closeTaskModal);
  taskModal?.querySelector('.modal-backdrop')?.addEventListener('click', closeTaskModal);
  taskEditForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!taskEditCtx) return;
    if (taskEditCtx.kind === 'daily') {
      const t = dailyTasks.find(x => x.id === taskEditCtx.id);
      if (t) {
        if (!taskEditTitle.disabled) t.title = taskEditTitle.value.trim() || t.title;
        t.done = taskEditStatus.value === 'done';
        persistDaily();
        renderDaily();
      }
    } else {
      const card = document.querySelector(`.task-card[data-id="${taskEditCtx.id}"]`);
      if (card) {
        const titleEl = card.querySelector('.task-title');
        if (titleEl && !taskEditTitle.disabled) titleEl.textContent = taskEditTitle.value;
        const st = card.querySelector('.status');
        if (st) { st.className = 'status ' + taskEditStatus.value; st.textContent = ({inprogress:'В работе', review:'Ревью', done:'Готово'})[taskEditStatus.value]; }
        const bar = card.querySelector('.progress');
        if (bar) bar.style.width = taskEditProgress.value + '%';
      }
    }
    closeTaskModal();
  });

  // ---------- 3. Froject Mail (Fmail) ----------
  const _mailbox = (() => {
    try { return JSON.parse(localStorage.getItem('froject_mailbox') || 'null') || null; } catch { return null; }
  })();
  let mailbox = _mailbox;
  let currentFolder = 'inbox';
  let currentMailId = null;

  function seedMailbox() {
    if (mailbox && mailbox.inbox && mailbox.inbox.length) return;
    const s = currentUser() || { name: 'Гость', login: 'guest' };
    mailbox = {
      inbox: [
        { id: 'm1', from: 'Froject Support', addr: 'support@fmail.ru', subject: 'Добро пожаловать в Froject Mail', time: 'сегодня, 10:24', body: 'Привет, ' + (s.name || s.login) + '!\n\nЭто ваш встроенный почтовый ящик. Адрес: ' + mailAddrFor(s.login) + '. Здесь будут уведомления, апдейты команды и системные письма.\n\n— Froject Team', unread: true, avatar: '🐸' },
        { id: 'm2', from: 'Команда Froject', addr: 'team@fmail.ru', subject: 'Напоминание: дедлайн проекта в четверг', time: 'вчера, 18:42', body: 'Привет! Напоминаю, что в четверг закрываем спринт. Не забудь:\n• подбить статусы задач\n• подготовить демо\n• скинуть метрики в чат\n\nХорошего дня!', unread: true, avatar: 'T' },
        { id: 'm3', from: 'AI Insights', addr: 'ai@fmail.ru', subject: 'Еженедельный отчёт по продуктивности', time: 'пн, 09:00', body: 'За прошлую неделю команда закрыла 19 задач (+12%). Среднее время до решения: 1.8 дня. Лучшая загрузка: четверг 10:00-13:00 (фокус-окно).\n\nПодсказка: перенесите 2 встречи на пятницу, чтобы освободить вторник под глубокий фокус.', unread: false, avatar: '✦' },
        { id: 'm4', from: 'HR · Дайджест', addr: 'hr@fmail.ru', subject: 'Дайджест: новости команды и события', time: '24 мая', body: 'На этой неделе:\n• Onboarding нового PM — Алёна\n• Внутренний митап «UI-системы»\n• Анкета по интервью кандидатов\n\nЗаходи в раздел Events.', unread: false, avatar: 'H' },
      ],
      sent: [
        { id: 's1', from: s.name || s.login, addr: mailAddrFor(s.login), subject: 'RE: Дедлайн проекта', time: 'вчера, 19:11', body: 'Принято. Сегодня закрою последние задачи и отправлю демо.', unread: false, avatar: '🐸' },
      ],
      archive: [],
      trash: [],
    };
    persistMail();
    renderMail();
  }
  function persistMail() { localStorage.setItem('froject_mailbox', JSON.stringify(mailbox)); }

  function renderMail() {
    if (!mailbox) return;
    // counts
    ['inbox','sent','archive','trash'].forEach(f => {
      const el = document.getElementById('mf-count-' + f);
      if (el) {
        const unread = mailbox[f].filter(m => m.unread).length;
        el.textContent = f === 'inbox' ? unread : mailbox[f].length;
        el.classList.toggle('zero', el.textContent === '0');
      }
    });

    // folder name + counter
    const fName = { inbox:'Входящие', sent:'Отправленные', archive:'Архив', trash:'Корзина' }[currentFolder];
    const folderNameEl = document.getElementById('mail-folder-name');
    const folderCountEl = document.getElementById('mail-folder-count');
    if (folderNameEl) folderNameEl.textContent = fName;
    if (folderCountEl) folderCountEl.textContent = mailbox[currentFolder].length;

    // list
    const listEl = document.getElementById('mail-list');
    const search = (document.getElementById('mail-search')?.value || '').toLowerCase();
    const items = mailbox[currentFolder].filter(m =>
      !search || m.subject.toLowerCase().includes(search) || m.from.toLowerCase().includes(search) || m.body.toLowerCase().includes(search)
    );
    if (listEl) {
      listEl.innerHTML = items.map(m => `
        <button class="mail-row ${m.unread ? 'unread' : ''} ${currentMailId === m.id ? 'active' : ''}" data-mail="${m.id}">
          <div class="mr-avatar">${escapeHtmlLocal(m.avatar || m.from.charAt(0))}</div>
          <div class="mr-body">
            <div class="mr-top">
              <span class="mr-from">${escapeHtmlLocal(m.from)}</span>
              <span class="mr-time">${escapeHtmlLocal(m.time)}</span>
            </div>
            <div class="mr-subject">${escapeHtmlLocal(m.subject)}</div>
            <div class="mr-preview">${escapeHtmlLocal(m.body.split('\n')[0].slice(0, 90))}</div>
          </div>
          ${m.unread ? '<span class="mr-dot"></span>' : ''}
        </button>
      `).join('') || '<div class="muted" style="padding:24px;text-align:center">Папка пуста</div>';
    }
  }
  document.getElementById('mail-search')?.addEventListener('input', renderMail);

  document.querySelectorAll('.mail-folder').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.mail-folder').forEach(x => x.classList.toggle('active', x === b));
    currentFolder = b.dataset.folder;
    currentMailId = null;
    document.getElementById('mail-reader-empty').hidden = false;
    document.getElementById('mail-reader-body').hidden = true;
    renderMail();
  }));

  document.getElementById('mail-list')?.addEventListener('click', (e) => {
    const row = e.target.closest('[data-mail]');
    if (!row) return;
    openMail(row.dataset.mail);
  });

  function openMail(id) {
    if (!mailbox) return;
    const m = mailbox[currentFolder].find(x => x.id === id);
    if (!m) return;
    currentMailId = id;
    m.unread = false;
    persistMail();
    document.getElementById('mail-reader-empty').hidden = true;
    document.getElementById('mail-reader-body').hidden = false;
    document.getElementById('mail-r-subject').textContent = m.subject;
    document.getElementById('mail-r-from').textContent = m.from;
    document.getElementById('mail-r-addr').textContent = m.addr;
    document.getElementById('mail-r-time').textContent = m.time;
    document.getElementById('mail-r-avatar').textContent = m.avatar || m.from.charAt(0);
    document.getElementById('mail-r-body').innerHTML = escapeHtmlLocal(m.body).replace(/\n/g, '<br>');
    renderMail();
  }
  document.getElementById('mail-archive-btn')?.addEventListener('click', () => {
    if (!currentMailId) return;
    const i = mailbox[currentFolder].findIndex(m => m.id === currentMailId);
    if (i < 0) return;
    const [m] = mailbox[currentFolder].splice(i, 1);
    mailbox.archive.unshift(m);
    persistMail();
    currentMailId = null;
    document.getElementById('mail-reader-empty').hidden = false;
    document.getElementById('mail-reader-body').hidden = true;
    renderMail();
  });
  document.getElementById('mail-delete-btn')?.addEventListener('click', () => {
    if (!currentMailId) return;
    const i = mailbox[currentFolder].findIndex(m => m.id === currentMailId);
    if (i < 0) return;
    const [m] = mailbox[currentFolder].splice(i, 1);
    if (currentFolder !== 'trash') mailbox.trash.unshift(m);
    persistMail();
    currentMailId = null;
    document.getElementById('mail-reader-empty').hidden = false;
    document.getElementById('mail-reader-body').hidden = true;
    renderMail();
  });
  document.getElementById('mail-reply-btn')?.addEventListener('click', () => {
    const input = document.getElementById('mail-reply-input');
    const text = (input?.value || '').trim();
    if (!text || !currentMailId) return;
    const orig = mailbox[currentFolder].find(m => m.id === currentMailId);
    if (!orig) return;
    const s = currentUser() || {};
    mailbox.sent.unshift({
      id: 'sx' + Date.now(),
      from: s.name || s.login || 'Я',
      addr: mailAddrFor(s.login),
      subject: 'RE: ' + orig.subject,
      time: 'только что',
      body: text + '\n\n---\n> ' + orig.body.split('\n').slice(0, 2).join('\n> '),
      unread: false,
      avatar: '🐸',
    });
    persistMail();
    input.value = '';
    const toast = document.createElement('div');
    toast.className = 'role-toast';
    toast.textContent = '✉️ Ответ отправлен';
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 250); }, 1800);
  });

  // Compose mail modal
  const composeModal = document.getElementById('compose-modal');
  function openCompose(open) { composeModal?.classList.toggle('show', open); composeModal?.setAttribute('aria-hidden', open?'false':'true'); }
  document.getElementById('mail-compose-btn')?.addEventListener('click', () => openCompose(true));
  document.getElementById('compose-close')?.addEventListener('click', () => openCompose(false));
  document.getElementById('compose-cancel')?.addEventListener('click', () => openCompose(false));
  composeModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => openCompose(false));
  document.getElementById('compose-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const to   = document.getElementById('compose-to').value.trim();
    const subj = document.getElementById('compose-subject').value.trim();
    const body = document.getElementById('compose-body').value.trim();
    if (!to || !subj || !body) return;
    const s = currentUser() || {};
    mailbox.sent.unshift({
      id: 'sx' + Date.now(),
      from: to,
      addr: to,
      subject: subj,
      time: 'только что',
      body: body,
      unread: false,
      avatar: to.charAt(0).toUpperCase(),
    });
    persistMail();
    renderMail();
    openCompose(false);
    document.getElementById('compose-form').reset();
  });

  // Seed mailbox on load if user already authed
  if (document.body.classList.contains('authed')) {
    seedMailbox();
    renderMail();
  }

  // ---------- 4. Tickets (Support, prompt §8) ----------
  let tickets = (() => {
    try { return JSON.parse(localStorage.getItem('froject_tickets') || 'null') || null; } catch { return null; }
  })();
  if (!tickets) {
    tickets = [
      { id: 't1', title: 'Календарь не показывает дедлайны', desc: 'После обновления исчезли пометки дедлайнов в недельном виде.', status: 'open', prio: 'med', createdAt: Date.now() - 86400000,
        thread: [
          { who: 'me', text: 'Здравствуйте, после обновления пропали дедлайны в календаре.', time: 'вчера, 11:02' },
          { who: 'agent', text: 'Принято. Уже воспроизвели — выкатим хотфикс в течение часа.', time: 'вчера, 11:18' },
        ] },
      { id: 't2', title: 'Не работает Smart Scheduling',     desc: 'Алгоритм перестал предлагать окна.', status: 'progress', prio: 'high', createdAt: Date.now() - 2*86400000,
        thread: [
          { who: 'me', text: 'AI не предлагает встречи второй день.', time: 'пн, 14:30' },
        ] },
      { id: 't3', title: 'Запрос: тёмная тема для письма',   desc: 'Хотелось бы тёмный фон в письмах.', status: 'resolved', prio: 'low', createdAt: Date.now() - 5*86400000,
        thread: [
          { who: 'me', text: 'Можно ли добавить тёмную тему в почту?', time: 'чт, 09:00' },
          { who: 'agent', text: 'Добавили в Froject Mail. Доступно в настройках.', time: 'чт, 10:14' },
        ] },
    ];
    persistTickets();
  }
  function persistTickets() { localStorage.setItem('froject_tickets', JSON.stringify(tickets)); }

  let activeTicketId = null;
  let ticketFilter = 'all';
  const statusLabel = { open: 'Открыт', progress: 'В работе', resolved: 'Решён' };
  const statusClass = { open: 'st-open', progress: 'st-progress', resolved: 'st-resolved' };

  function renderTickets() {
    const listEl = document.getElementById('tickets-list');
    if (!listEl) return;
    const search = (document.getElementById('ticket-search')?.value || '').toLowerCase();
    let list = tickets.slice().sort((a, b) => b.createdAt - a.createdAt);
    if (ticketFilter !== 'all') list = list.filter(t => t.status === ticketFilter);
    if (search) list = list.filter(t => t.title.toLowerCase().includes(search) || (t.desc||'').toLowerCase().includes(search));
    listEl.innerHTML = list.map(t => `
      <button class="ticket-row ${activeTicketId === t.id ? 'active' : ''}" data-ticket="${t.id}">
        <span class="ticket-status-dot ${statusClass[t.status]}"></span>
        <div class="ticket-row-body">
          <div class="ticket-row-top">
            <span class="ticket-row-title">${escapeHtmlLocal(t.title)}</span>
            <span class="prio-pill prio-${t.prio}">${prioLabel[t.prio]}</span>
          </div>
          <div class="ticket-row-meta">
            <span class="ticket-status-label ${statusClass[t.status]}">${statusLabel[t.status]}</span>
            <span class="muted">· ${t.thread.length} сообщ.</span>
          </div>
        </div>
      </button>
    `).join('') || '<div class="muted" style="padding:24px;text-align:center">Нет тикетов</div>';
  }
  document.getElementById('ticket-search')?.addEventListener('input', renderTickets);
  document.querySelectorAll('[data-tfilter]').forEach(c => c.addEventListener('click', () => {
    document.querySelectorAll('[data-tfilter]').forEach(x => x.classList.toggle('chip-active', x === c));
    ticketFilter = c.dataset.tfilter;
    renderTickets();
  }));

  document.getElementById('tickets-list')?.addEventListener('click', (e) => {
    const r = e.target.closest('[data-ticket]');
    if (!r) return;
    openTicket(r.dataset.ticket);
  });
  function openTicket(id) {
    const t = tickets.find(x => x.id === id);
    if (!t) return;
    activeTicketId = id;
    document.getElementById('ticket-view-empty').hidden = true;
    document.getElementById('ticket-view-body').hidden = false;
    document.getElementById('tv-title').textContent = t.title;
    document.getElementById('tv-desc').textContent = t.desc;
    document.getElementById('tv-created').textContent = new Date(t.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
    const sp = document.getElementById('tv-status-pill');
    sp.textContent = statusLabel[t.status];
    sp.className = 'ticket-status ' + statusClass[t.status];
    const pp = document.getElementById('tv-prio-pill');
    pp.textContent = prioLabel[t.prio];
    pp.className = 'ticket-prio prio-pill prio-' + t.prio;
    const thread = document.getElementById('tv-thread');
    thread.innerHTML = t.thread.map(m => `
      <div class="tt-msg ${m.who === 'me' ? 'me' : 'agent'}">
        <div class="tt-bubble">${escapeHtmlLocal(m.text)}</div>
        <div class="tt-meta">${escapeHtmlLocal(m.time)}</div>
      </div>
    `).join('');
    thread.scrollTop = thread.scrollHeight;
    renderTickets();
  }
  document.getElementById('tv-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!activeTicketId) return;
    const input = document.getElementById('tv-input');
    const text = input.value.trim();
    if (!text) return;
    const t = tickets.find(x => x.id === activeTicketId);
    if (!t) return;
    const now = new Date();
    t.thread.push({ who: 'me', text, time: 'только что' });
    if (t.status === 'open') t.status = 'progress';
    persistTickets();
    openTicket(activeTicketId);
    input.value = '';
    // Auto-reply from "agent" after a moment
    setTimeout(() => {
      const t2 = tickets.find(x => x.id === activeTicketId);
      if (!t2) return;
      t2.thread.push({ who: 'agent', text: 'Принято! Возьмём в работу и вернёмся с апдейтом.', time: 'только что' });
      persistTickets();
      openTicket(activeTicketId);
    }, 900);
  });
  document.getElementById('tv-resolve-btn')?.addEventListener('click', () => {
    if (!activeTicketId) return;
    const t = tickets.find(x => x.id === activeTicketId);
    if (!t) return;
    t.status = t.status === 'resolved' ? 'open' : 'resolved';
    persistTickets();
    openTicket(activeTicketId);
  });
  document.getElementById('tv-delete-btn')?.addEventListener('click', () => {
    if (!activeTicketId) return;
    if (!confirm('Удалить тикет?')) return;
    tickets = tickets.filter(x => x.id !== activeTicketId);
    activeTicketId = null;
    persistTickets();
    document.getElementById('ticket-view-empty').hidden = false;
    document.getElementById('ticket-view-body').hidden = true;
    renderTickets();
  });

  // Ticket create/edit modal
  const ticketModal = document.getElementById('ticket-modal');
  let editingTicketId = null;
  function openTicketModal(open, ticketId) {
    if (!ticketModal) return;
    editingTicketId = ticketId || null;
    document.getElementById('ticket-modal-title').textContent = ticketId ? 'Редактировать тикет' : 'Новый тикет';
    if (ticketId) {
      const t = tickets.find(x => x.id === ticketId);
      if (t) {
        document.getElementById('ticket-title-input').value = t.title;
        document.getElementById('ticket-desc-input').value = t.desc;
        document.getElementById('ticket-prio-input').value = t.prio;
        document.getElementById('ticket-status-input').value = t.status;
      }
    } else {
      document.getElementById('ticket-form').reset();
    }
    ticketModal.classList.toggle('show', open);
    ticketModal.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  document.getElementById('ticket-new-btn')?.addEventListener('click', () => openTicketModal(true));
  document.getElementById('tv-edit-btn')?.addEventListener('click', () => openTicketModal(true, activeTicketId));
  document.getElementById('ticket-modal-close')?.addEventListener('click', () => openTicketModal(false));
  document.getElementById('ticket-modal-cancel')?.addEventListener('click', () => openTicketModal(false));
  ticketModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => openTicketModal(false));
  document.getElementById('ticket-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      title: document.getElementById('ticket-title-input').value.trim(),
      desc:  document.getElementById('ticket-desc-input').value.trim(),
      prio:  document.getElementById('ticket-prio-input').value,
      status:document.getElementById('ticket-status-input').value,
    };
    if (!data.title) return;
    if (editingTicketId) {
      const t = tickets.find(x => x.id === editingTicketId);
      if (t) Object.assign(t, data);
    } else {
      const id = 't' + Date.now();
      tickets.unshift({ id, ...data, createdAt: Date.now(), thread: [] });
      activeTicketId = id;
    }
    persistTickets();
    renderTickets();
    if (activeTicketId) openTicket(activeTicketId);
    openTicketModal(false);
  });

  renderTickets();

  // ---------- 5. Apply session UI on load ----------
  applySessionUI();

  /* ==========================================================
     WELCOME SCREEN + PRODUCTIVITY CENTER (profile rebuild)
     ========================================================== */

  // ---------- Welcome screen (after login, ?welcome=1) ----------
  function maybeShowWelcome() {
    const params = new URLSearchParams(location.search);
    if (params.get('welcome') !== '1') return;
    const s = currentUser();
    if (!s) return;
    const screen = document.getElementById('welcome-screen');
    if (!screen) return;

    document.getElementById('ws-name').textContent = (s.name || s.login || 'Гость').split(' ')[0];
    document.getElementById('ws-role-line').textContent = (ROLES[s.role]?.label || 'Пользователь') + ' · ' + (s.team || 'Моя команда');

    // populate quick stats
    const tasksCount = (typeof dailyTasks !== 'undefined') ? dailyTasks.filter(t => !t.done).length : 6;
    document.getElementById('ws-tasks-count').textContent = tasksCount;

    screen.hidden = false;
    document.body.style.overflow = 'hidden';

    // animated progress bar (auto-advance after 4.5s)
    const bar = document.getElementById('ws-progress-bar');
    if (bar) { bar.style.width = '0%'; requestAnimationFrame(() => { bar.style.transition = 'width 4.5s linear'; bar.style.width = '100%'; }); }
    const autoTimer = setTimeout(enterDashboard, 4800);

    function enterDashboard() {
      clearTimeout(autoTimer);
      screen.style.transition = 'opacity .5s ease, transform .5s ease';
      screen.style.opacity = '0';
      screen.style.transform = 'scale(1.03)';
      setTimeout(() => {
        screen.hidden = true;
        document.body.style.overflow = '';
        // clean the ?welcome param
        history.replaceState(null, '', location.pathname);
        showWelcomeToast();
      }, 480);
    }
    document.getElementById('ws-enter')?.addEventListener('click', enterDashboard);
    document.getElementById('ws-skip')?.addEventListener('click', enterDashboard);
    if (window.feather) feather.replace();
  }

  // ---------- Productivity Center render ----------
  const PC = {
    efficiency: 87,
    effPrev: 79,
    hours: 38,
    done: 42,
    avg: 1.8,
    streak: 12,
    // 8-week productivity series [efficiency%, hours]
    weeks: [
      { eff: 71, hrs: 34 },
      { eff: 68, hrs: 36 },
      { eff: 75, hrs: 32 },
      { eff: 79, hrs: 38 },
      { eff: 74, hrs: 40 },
      { eff: 82, hrs: 35 },
      { eff: 79, hrs: 37 },
      { eff: 87, hrs: 38 },
    ],
    tasks: [
      { title: 'Сверстать новый sidebar + frog-theme', proj: 'Froject MVP', prog: 62 },
      { title: 'Улучшить календарь: неделя + блоки', proj: 'Froject MVP', prog: 41 },
      { title: 'Подготовить текст на защиту', proj: 'Презентация', prog: 35 },
    ],
    deadlines: [
      { title: 'Прототип календаря', when: 'Ср · 18:00', urgency: 'high' },
      { title: 'Демо для команды', when: 'Чт · 12:30', urgency: 'med' },
      { title: 'Ревью PR #142', when: 'Пт · 11:00', urgency: 'low' },
    ],
  };

  function renderProfileCenter() {
    const s = currentUser() || {};
    const name = s.name || s.login || 'Гость';
    const role = ROLES[s.role] ? s.role : 'user';
    const mail = s.mail || mailAddrFor(s.login);
    const team = s.team || 'Моя команда';

    setText('pc-name', name);
    setText('pc-team', team);
    setText('pc-mail', mail);
    const rb = document.getElementById('pc-role-badge');
    if (rb) { rb.textContent = ROLES[role].label; rb.dataset.role = role; }
    const av = document.getElementById('pc-avatar');
    if (av) av.textContent = s.avatar || (name ? name.charAt(0).toUpperCase() : '🐸');

    // efficiency ring
    setText('pc-eff-val', PC.efficiency);
    setText('pc-eff-prev', PC.effPrev + '%');
    const delta = PC.efficiency - PC.effPrev;
    const trendEl = document.getElementById('pc-eff-trend');
    if (trendEl) {
      trendEl.textContent = (delta >= 0 ? '▲ +' : '▼ ') + Math.abs(delta) + '% к прошлой неделе';
      trendEl.className = 'chip ' + (delta >= 0 ? 'chip-green' : 'chip-amber');
    }
    const ring = document.getElementById('pc-ring-fill');
    if (ring) {
      const r = 50, circ = 2 * Math.PI * r;
      ring.style.strokeDasharray = circ;
      ring.style.strokeDashoffset = circ;
      // animate
      requestAnimationFrame(() => {
        ring.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)';
        ring.style.strokeDashoffset = circ * (1 - PC.efficiency / 100);
      });
    }

    setHtml('pc-hours', PC.hours + '<small>ч</small>');
    setText('pc-done', PC.done);
    setHtml('pc-avg', PC.avg + '<small>дн</small>');
    setText('pc-streak', PC.streak);

    // current tasks
    const tl = document.getElementById('pc-tasks');
    if (tl) tl.innerHTML = PC.tasks.map(t => `
      <li class="pc-task">
        <div class="pc-task-top">
          <span class="pc-task-title">${escapeHtmlLocal(t.title)}</span>
          <span class="pc-task-prog mono">${t.prog}%</span>
        </div>
        <div class="pc-task-sub"><span class="chip chip-gray">${escapeHtmlLocal(t.proj)}</span></div>
        <div class="progress-bar"><span class="progress" style="width:${t.prog}%"></span></div>
      </li>`).join('');

    // deadlines
    const dl = document.getElementById('pc-deadlines');
    if (dl) dl.innerHTML = PC.deadlines.map(d => `
      <li class="pc-deadline">
        <span class="pc-dl-dot pc-dl-${d.urgency}"></span>
        <div class="pc-dl-body">
          <span class="pc-dl-title">${escapeHtmlLocal(d.title)}</span>
          <span class="pc-dl-when mono">${escapeHtmlLocal(d.when)}</span>
        </div>
      </li>`).join('');

    renderProfileChart();
  }

  function renderProfileChart() {
    const wrap = document.getElementById('pc-chart');
    if (!wrap) return;
    const W = 640, H = 200, pad = 30;
    const weeks = PC.weeks;
    const n = weeks.length;
    const maxEff = 100, maxHrs = 48;
    const x = i => pad + (i * (W - pad * 2) / (n - 1));
    const yEff = v => H - pad - (v / maxEff) * (H - pad * 2);
    const yHrs = v => H - pad - (v / maxHrs) * (H - pad * 2);

    const effPts = weeks.map((w, i) => `${x(i)},${yEff(w.eff)}`).join(' ');
    const hrsPts = weeks.map((w, i) => `${x(i)},${yHrs(w.hrs)}`).join(' ');
    const effArea = `${pad},${H - pad} ${effPts} ${x(n - 1)},${H - pad}`;

    const gridLines = [0, 25, 50, 75, 100].map(v =>
      `<line x1="${pad}" y1="${yEff(v)}" x2="${W - pad}" y2="${yEff(v)}" class="pcc-grid"/>
       <text x="${pad - 8}" y="${yEff(v) + 4}" class="pcc-axis" text-anchor="end">${v}</text>`).join('');

    const labels = ['7н','6н','5н','4н','3н','2н','1н','тек'];
    const xLabels = weeks.map((w, i) => `<text x="${x(i)}" y="${H - 8}" class="pcc-axis" text-anchor="middle">${labels[i]}</text>`).join('');

    const dots = weeks.map((w, i) => `<circle cx="${x(i)}" cy="${yEff(w.eff)}" r="3.5" class="pcc-dot"/>`).join('');

    wrap.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="pccGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="var(--green-ai)" stop-opacity="0.35"/>
            <stop offset="1" stop-color="var(--green-ai)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${gridLines}
        <polygon points="${effArea}" fill="url(#pccGrad)"/>
        <polyline points="${hrsPts}" class="pcc-hrs" fill="none"/>
        <polyline points="${effPts}" class="pcc-eff" fill="none"/>
        ${dots}
        ${xLabels}
      </svg>`;
  }

  function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
  function setHtml(id, v) { const el = document.getElementById(id); if (el) el.innerHTML = v; }

  // Profile tab switching (Обзор / Аналитика / Работа / Аккаунт)
  document.querySelectorAll('[data-prof-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-prof-tab]').forEach(t => t.classList.toggle('active', t === tab));
      const target = tab.dataset.profTab;
      document.querySelectorAll('#profile-modal .ws-section').forEach(sec => {
        sec.classList.toggle('active', sec.id === target);
      });
      if (target === 'prof-stats') renderProfileChart();
    });
  });

  // Re-render profile center whenever the profile modal opens
  const profileModalEl = document.getElementById('profile-modal');
  if (profileModalEl) {
    const mo = new MutationObserver(() => {
      if (profileModalEl.classList.contains('show')) renderProfileCenter();
    });
    mo.observe(profileModalEl, { attributes: true, attributeFilter: ['class'] });
  }
  // also wire profile center buttons
  document.getElementById('pc-edit-btn')?.addEventListener('click', () => {
    document.querySelector('[data-prof-tab="prof-account"]')?.click();
  });
  document.getElementById('pc-avatar-btn')?.addEventListener('click', () => {
    const emojis = ['🐸','🦊','🐼','🦉','🐱','🚀','⚡','🌿','🦋','🐙'];
    const s = currentUser() || {};
    const cur = s.avatar || '🐸';
    const next = emojis[(emojis.indexOf(cur) + 1) % emojis.length];
    s.avatar = next;
    localStorage.setItem('froject_session', JSON.stringify(s));
    const av = document.getElementById('pc-avatar'); if (av) av.textContent = next;
    document.querySelectorAll('.avatar.frog, .big-avatar').forEach(a => { if (a.textContent.length <= 2) a.textContent = next; });
  });

  renderProfileCenter();
  maybeShowWelcome();

  /* ==========================================================
     MOBILE UX PATCH — drawer, bottom-nav, calendar list
     ========================================================== */

  // ---------- Sidebar drawer (mobile) ----------
  const sidebarEl = document.querySelector('.sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const topbarBurger = document.getElementById('topbar-burger');

  function openDrawer(open) {
    if (!sidebarEl) return;
    sidebarEl.classList.toggle('drawer-open', open);
    if (sidebarBackdrop) sidebarBackdrop.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  }
  topbarBurger?.addEventListener('click', () => openDrawer(!sidebarEl.classList.contains('drawer-open')));
  sidebarBackdrop?.addEventListener('click', () => openDrawer(false));
  // Close drawer when a nav item is clicked
  document.querySelectorAll('.sidebar .nav-item').forEach(n => {
    n.addEventListener('click', () => { if (window.innerWidth <= 860) openDrawer(false); });
  });
  // Close drawer on resize to desktop
  window.addEventListener('resize', () => { if (window.innerWidth > 860) openDrawer(false); });

  // ---------- Bottom nav (mobile) ----------
  const bottomNav = document.getElementById('bottom-nav');
  const moreMenu = document.getElementById('bn-more-menu');
  const moreBtn = document.getElementById('bn-more-btn');

  function setActiveBn(section) {
    bottomNav?.querySelectorAll('.bn-item').forEach(b => {
      b.classList.toggle('active', b.dataset.section === section);
    });
    if (section && !['dashboard','calendar','tasks','mail'].includes(section)) {
      // not a direct bottom-nav item — highlight "more"
      bottomNav?.querySelectorAll('.bn-item').forEach(b => b.classList.remove('active'));
      document.getElementById('bn-more-btn')?.classList.add('active');
    }
  }
  function gotoSection(section) {
    const el = document.querySelector(`.nav-item[data-section="${section}"]`);
    if (el) el.click();
    setActiveBn(section);
    if (moreMenu) moreMenu.hidden = true;
  }
  bottomNav?.querySelectorAll('.bn-item[data-section]').forEach(b => {
    b.addEventListener('click', () => gotoSection(b.dataset.section));
  });
  moreBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (moreMenu) moreMenu.hidden = !moreMenu.hidden;
  });
  moreMenu?.querySelectorAll('[data-section]').forEach(b => {
    b.addEventListener('click', () => gotoSection(b.dataset.section));
  });
  document.addEventListener('click', (e) => {
    if (moreMenu && !moreMenu.hidden && !e.target.closest('#bn-more-menu') && !e.target.closest('#bn-more-btn')) {
      moreMenu.hidden = true;
    }
  });
  // Sync bottom-nav with main nav clicks
  document.querySelectorAll('.sidebar .nav-item[data-section]').forEach(n => {
    n.addEventListener('click', () => setActiveBn(n.dataset.section));
  });

  // ---------- Calendar mobile list (events as agenda) ----------
  function renderCalendarMobileList() {
    const list = document.getElementById('calendar-mobile-list');
    if (!list) return;
    const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
    // Pull events from the week-grid if rendered, otherwise from a static demo set
    const slots = document.querySelectorAll('#week-grid .cal-slot .event');
    const eventsByDay = {};
    days.forEach((_, i) => eventsByDay[i] = []);
    slots.forEach(ev => {
      const slot = ev.closest('.cal-slot');
      const day = +(slot?.dataset.day ?? 0);
      const hour = slot?.dataset.hour || '';
      const t = ev.querySelector('.t')?.textContent || ev.textContent;
      const s = ev.querySelector('.s')?.textContent || '';
      const cls = ev.className.replace('event', '').trim();
      eventsByDay[day].push({ hour, t, s, cls });
    });

    list.innerHTML = days.map((dn, i) => {
      const items = eventsByDay[i].sort((a, b) => (a.hour || '').localeCompare(b.hour || ''));
      if (!items.length) {
        return `<div class="cml-day empty">
          <div class="cml-day-head"><span class="cml-dn">${dn}</span><span class="muted">— событий нет —</span></div>
        </div>`;
      }
      return `<div class="cml-day">
        <div class="cml-day-head"><span class="cml-dn">${dn}</span><span class="muted">${items.length} ${items.length === 1 ? 'событие' : 'событий'}</span></div>
        ${items.map(e => `
          <div class="cml-event ${e.cls}">
            <span class="cml-time mono">${e.hour}:00</span>
            <div class="cml-body">
              <div class="cml-t">${e.t}</div>
              ${e.s ? `<div class="cml-s">${e.s}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>`;
    }).join('');
  }
  // re-render whenever week-grid changes
  const wg = document.getElementById('week-grid');
  if (wg) {
    const mo2 = new MutationObserver(renderCalendarMobileList);
    mo2.observe(wg, { childList: true, subtree: true });
    renderCalendarMobileList();
  }

  if (document.body.classList.contains('authed')) {
    // First-load welcome toast (only if not arriving via welcome screen)
    if (new URLSearchParams(location.search).get('welcome') !== '1') {
      setTimeout(showWelcomeToast, 600);
    }
  }
}); // ← закрываем DOMContentLoaded
