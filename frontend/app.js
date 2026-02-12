const form = document.getElementById("plan-form");
const result = document.getElementById("plan-result");
const statusTag = document.getElementById("status-tag");
const accountStatus = document.getElementById("account-status");
const logoutButton = document.getElementById("logout-button");
const addSubjectBtn = document.getElementById("add-subject");
const subjectsList = document.getElementById("subjects-list");
const emptyHint = document.getElementById("empty-hint");

let subjectCount = 0;

const createSubjectRow = (id, name = "", hours = "") => {
  const row = document.createElement("div");
  row.id = `subject-row-${id}`;
  row.className = "flex gap-3 items-end";
  row.innerHTML = `
    <div class="flex-1">
      <label class="text-xs uppercase tracking-[0.15em] text-slate-400">Subject name</label>
      <input
        type="text"
        class="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 p-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
        placeholder="e.g., Math, Physics"
        data-subject-name
        value="${name}"
      />
    </div>
    <div class="w-24">
      <label class="text-xs uppercase tracking-[0.15em] text-slate-400">Hours</label>
      <input
        type="number"
        min="0.5"
        step="0.5"
        class="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 p-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
        placeholder="1"
        data-subject-hours
        value="${hours}"
      />
    </div>
    <button
      type="button"
      class="px-3 py-2 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
      onclick="removeSubjectRow(${id})"
    >
      Remove
    </button>
  `;
  return row;
};

const removeSubjectRow = (id) => {
  const row = document.getElementById(`subject-row-${id}`);
  if (row) {
    row.remove();
    updateEmptyHint();
  }
};

const updateEmptyHint = () => {
  const hasSubjects = subjectsList.children.length > 0;
  emptyHint.classList.toggle("hidden", hasSubjects);
};

const getSubjects = () => {
  const subjects = [];
  subjectsList.querySelectorAll("[data-subject-name]").forEach((nameInput, idx) => {
    const hoursInput = subjectsList.querySelectorAll("[data-subject-hours]")[idx];
    const name = nameInput.value.trim();
    const hours = parseFloat(hoursInput.value) || 0;
    if (name && hours > 0) {
      subjects.push({ name, hours });
    }
  });
  return subjects;
};

addSubjectBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const row = createSubjectRow(subjectCount++);
  subjectsList.appendChild(row);
  updateEmptyHint();
  row.querySelector("input").focus();
});

const renderPlan = (payload) => {
  result.innerHTML = "";
  if (!payload.plan.length) {
    result.innerHTML = "<p class=\"text-slate-500\">Add subjects with hours to generate a plan.</p>";
    return;
  }

  payload.plan.forEach((day) => {
    const isBreakDay = day.type === "break" || day.hoursPlanned === 0;
    const dayCard = document.createElement("div");
    
    if (isBreakDay) {
      dayCard.className = "plan-card rounded-3xl p-6 space-y-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200";
      dayCard.innerHTML = `
        <div class="text-center">
          <p class="text-xs uppercase tracking-[0.2em] text-emerald-600">${day.date}</p>
          <h3 class="text-xl font-semibold text-emerald-700 mt-2">Rest & recharge</h3>
          <p class="text-sm text-emerald-600 mt-1">You earned this break day</p>
        </div>
      `;
    } else {
      dayCard.className = "plan-card rounded-3xl p-6 space-y-4";
      
      const header = document.createElement("div");
      header.className = "flex items-center justify-between";
      header.innerHTML = `
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-slate-400">${day.date}</p>
          <h3 class="text-lg font-semibold">${day.hoursPlanned} hours</h3>
        </div>
        <span class="badge px-3 py-1 rounded-full text-xs text-slate-500">Study day</span>
      `;

      const sessions = document.createElement("div");
      sessions.className = "flex flex-wrap gap-2 mb-4";

      day.sessions.forEach((session) => {
        const pill = document.createElement("span");
        pill.className = "session-pill rounded-full px-3 py-1 text-sm cursor-pointer hover:shadow-md transition";
        pill.textContent = `${session.subject} ${session.hours}h`;
        pill.addEventListener("click", () => {
          window.location.href = `/pomodoro.html?subject=${encodeURIComponent(session.subject)}`;
        });
        sessions.appendChild(pill);
      });

      const focusBtn = document.createElement("button");
      focusBtn.className = "w-full mt-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 text-sm font-semibold transition";
      focusBtn.textContent = "Start focus session";
      focusBtn.addEventListener("click", () => {
        const firstSubject = day.sessions[0]?.subject || "Study";
        window.location.href = `/pomodoro.html?subject=${encodeURIComponent(firstSubject)}`;
      });

      dayCard.appendChild(header);
      dayCard.appendChild(sessions);
      dayCard.appendChild(focusBtn);
    }
    
    result.appendChild(dayCard);
  });
};

const loadUser = async () => {
  if (!accountStatus) {
    return;
  }

  try {
    const response = await fetch("/api/me");
    if (!response.ok) {
      throw new Error("Not signed in");
    }

    const user = await response.json();
    accountStatus.textContent = `Signed in as ${user.name}`;
    if (logoutButton) {
      logoutButton.classList.remove("hidden");
    }
  } catch (error) {
    accountStatus.textContent = "Not signed in";
  }
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusTag.textContent = "Planning...";
  statusTag.classList.remove("bg-emerald-100", "text-emerald-700");
  statusTag.classList.add("bg-amber-100", "text-amber-700");

  const subjects = getSubjects();
  if (subjects.length === 0) {
    alert("Please add at least one subject.");
    statusTag.textContent = "Ready";
    statusTag.classList.remove("bg-amber-100", "text-amber-700");
    statusTag.classList.add("bg-emerald-100", "text-emerald-700");
    return;
  }

  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;
  const hoursPerDay = Number(document.getElementById("hours-per-day").value || 2);

  try {
    const response = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjects, startDate, endDate, hoursPerDay }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch plan");
    }

    const payload = await response.json();
    renderPlan(payload);
    statusTag.textContent = "Plan ready";
    statusTag.classList.remove("bg-amber-100", "text-amber-700");
    statusTag.classList.add("bg-emerald-100", "text-emerald-700");
  } catch (error) {
    result.innerHTML = "<p class=\"text-rose-500\">Unable to reach the planner API. Start the backend first.</p>";
    statusTag.textContent = "Offline";
    statusTag.classList.remove("bg-amber-100", "text-amber-700");
    statusTag.classList.add("bg-rose-100", "text-rose-700");
  }
});

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  });
}

loadUser();
