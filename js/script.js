// Froject demo UI — mock interactions (no backend)
document.addEventListener("DOMContentLoaded", () => {
  // ---------- Device mode (desktop/mobile) ----------
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
    support: "Поддержка",
    settings: "Настройки",
  };

  // ---------- Navigation ----------
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".page-section");
  const pageTitle = document.getElementById("page-title");

  function showSection(id) {
    sections.forEach((s) => s.classList.toggle("active", s.id === id));
    navItems.forEach((i) => i.classList.toggle("active", i.dataset.section === id));
    if (pageTitle) pageTitle.textContent = titles[id] || "Froject";
    // re-render icons (new nodes)
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

  // ---------- Dashboard metrics ----------
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
    const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 6);

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
    const dueStr = new Date(t.due).toLocaleDateString("ru-RU", { day:"2-digit", month:"short" });
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

  // View toggles
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

  // ---------- Calendar (week grid) ----------
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

    const days = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
    const startHour = 9;
    const endHour = 18; // exclusive end label
    const hours = [];
    for (let h = startHour; h < endHour; h++) hours.push(h);

    const headRow = [
      `<div class="cal-cell header"></div>`,
      ...days.map((d) => `<div class="cal-cell header"><span class="strong">${d}</span><span class="muted"> </span></div>`)
    ].join("");

    const body = hours.map((h) => {
      const timeLabel = `${String(h).padStart(2,"0")}:00`;
      const rowCells = days.map((_, dayIdx) => {
        return `<div class="cal-cell cal-slot" data-day="${dayIdx}" data-hour="${h}"></div>`;
      }).join("");
      return `<div class="cal-cell time">${timeLabel}</div>${rowCells}`;
    }).join("");

    weekGrid.innerHTML = headRow + body;

    // Place events
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

    // Week range label (mock)
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
  const addProjectBtn = document.getElementById("add-project");
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
      const dl = new Date(p.deadline).toLocaleDateString("ru-RU", { day:"2-digit", month:"short" });
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

// ---------- Workspace modal (kept from previous build, minimal) ----------

  function setModalOpen(isOpen){
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
        // Fill header in workspace modal (demo)
        const idx = Number(b.dataset.project || 0);
        const p = (typeof demoProjects !== "undefined" && demoProjects[idx]) ? demoProjects[idx] : null;
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

  // ---------- Profile modal (top-right icon) ----------
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

  profileBtn?.addEventListener("click", openProfile);
  profileClose?.addEventListener("click", closeProfile);
  profileBackdrop?.addEventListener("click", (e) => {
    if (e.target?.dataset?.closeProfile) closeProfile();
  });

  profTabs.forEach((t) => {
    t.addEventListener("click", () => {
      profTabs.forEach((x) => x.classList.toggle("active", x === t));
      profSections.forEach((s) => s.classList.toggle("active", s.id === t.dataset.profTab));
      if (window.feather) feather.replace();
    });
  });

  // ---------- Support "ticket chat" (demo) ----------
  const supportThread = document.getElementById("support-thread");
  const supportForm = document.getElementById("support-form");
  const supportSubject = document.getElementById("support-subject");
  const supportMessage = document.getElementById("support-message");

  function addSupportBubble(who, text, meta) {
    if (!supportThread) return;
    const cls = who === "me" ? "me" : "agent";
    const safe = escapeHtml(text);
    const m = meta ? `<div class="meta">${escapeHtml(meta)}</div>` : "";
    supportThread.insertAdjacentHTML(
      "beforeend",
      `<div class="support-bubble ${cls}">${safe}${m}</div>`
    );
    supportThread.scrollTop = supportThread.scrollHeight;
  }

  // seed conversation
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

    // fake agent reply
    window.setTimeout(() => {
      addSupportBubble(
        "agent",
        "Принято! ✅ Добавьте 2–3 блока в календарь (встреча/дедлайн/фокус) и прогресс‑бар у задач — так нагляднее всего.",
        "оператор • сейчас"
      );
    }, 600);
  });

  // Helpers
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
      const weekdays = ["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"];
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
    x.setHours(0,0,0,0);
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
});
