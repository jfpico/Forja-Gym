const STORAGE_KEY = "forja-gym-state-v1";

const defaultExercises = [
  { id: "press-banca", name: "Press banca", muscle: "Pecho", hint: "4 x 6-8" },
  { id: "sentadilla", name: "Sentadilla", muscle: "Pierna", hint: "5 x 5" },
  { id: "peso-muerto", name: "Peso muerto", muscle: "Espalda", hint: "3 x 5" },
  { id: "dominadas", name: "Dominadas", muscle: "Espalda", hint: "4 x max" },
  { id: "press-militar", name: "Press militar", muscle: "Hombro", hint: "4 x 6" },
  { id: "remo-barra", name: "Remo con barra", muscle: "Espalda", hint: "4 x 8" },
  { id: "zancadas", name: "Zancadas", muscle: "Pierna", hint: "3 x 10" },
  { id: "curl-biceps", name: "Curl biceps", muscle: "Brazo", hint: "3 x 12" },
  { id: "fondos", name: "Fondos", muscle: "Pecho", hint: "3 x max" },
  { id: "plancha", name: "Plancha", muscle: "Core", hint: "3 x 45 s" },
];

const defaultWeek = [
  { day: "Lun", focus: "Empuje", notes: "Pecho, hombro y triceps. Termina con 8 min de movilidad." },
  { day: "Mar", focus: "Tiron", notes: "Espalda completa. Prioriza dominadas o jalones controlados." },
  { day: "Mie", focus: "Pierna", notes: "Sentadilla primero, accesorios despues. Sin prisa en las bajadas." },
  { day: "Jue", focus: "Descanso", notes: "Caminar, movilidad suave o estiramientos." },
  { day: "Vie", focus: "Full body", notes: "Una serie fuerte por patron. Busca sensaciones buenas." },
  { day: "Sab", focus: "Cardio", notes: "Zona 2 o intervalos cortos segun energia." },
  { day: "Dom", focus: "Descanso", notes: "Revisa records y prepara la semana." },
];

const defaultSession = [
  {
    exerciseId: "press-banca",
    sets: [
      { reps: 8, weight: 60, done: false },
      { reps: 8, weight: 60, done: false },
      { reps: 6, weight: 65, done: false },
    ],
  },
  {
    exerciseId: "press-militar",
    sets: [
      { reps: 8, weight: 35, done: false },
      { reps: 7, weight: 35, done: false },
      { reps: 6, weight: 37.5, done: false },
    ],
  },
  {
    exerciseId: "fondos",
    sets: [
      { reps: 10, weight: 0, done: false },
      { reps: 9, weight: 0, done: false },
      { reps: 8, weight: 0, done: false },
    ],
  },
];

const state = loadState();
let activeView = "today";
let activeFilter = "Todos";
let timer = {
  total: 90,
  remaining: 90,
  interval: null,
};

const els = {
  todayLabel: document.querySelector("#todayLabel"),
  viewTitle: document.querySelector("#viewTitle"),
  workoutName: document.querySelector("#workoutName"),
  coachLine: document.querySelector("#coachLine"),
  exerciseList: document.querySelector("#exerciseList"),
  metricVolume: document.querySelector("#metricVolume"),
  metricSets: document.querySelector("#metricSets"),
  metricTime: document.querySelector("#metricTime"),
  metricGoal: document.querySelector("#metricGoal"),
  streakCount: document.querySelector("#streakCount"),
  streakText: document.querySelector("#streakText"),
  weekGrid: document.querySelector("#weekGrid"),
  libraryGrid: document.querySelector("#libraryGrid"),
  muscleFilters: document.querySelector("#muscleFilters"),
  recordsList: document.querySelector("#recordsList"),
  volumeChart: document.querySelector("#volumeChart"),
  dialog: document.querySelector("#exerciseDialog"),
  dialogExerciseList: document.querySelector("#dialogExerciseList"),
  timerPreset: document.querySelector("#timerPreset"),
  timerDisplay: document.querySelector("#timerDisplay"),
  timerRing: document.querySelector("#timerRing"),
  energyRange: document.querySelector("#energyRange"),
  energyText: document.querySelector("#energyText"),
  healthForm: document.querySelector("#healthForm"),
  healthDate: document.querySelector("#healthDate"),
  healthWeight: document.querySelector("#healthWeight"),
  healthGlucose: document.querySelector("#healthGlucose"),
  healthMoment: document.querySelector("#healthMoment"),
  healthNote: document.querySelector("#healthNote"),
  healthSummary: document.querySelector("#healthSummary"),
  healthList: document.querySelector("#healthList"),
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return normalizeState({
        exercises: parsed.exercises || defaultExercises,
        week: parsed.week || defaultWeek,
        session: parsed.session || defaultSession,
        logs: parsed.logs || [],
        health: parsed.health || [],
        energy: parsed.energy || 4,
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  return normalizeState({
    exercises: structuredClone(defaultExercises),
    week: structuredClone(defaultWeek),
    session: structuredClone(defaultSession),
    logs: seedLogs(),
    health: seedHealth(),
    energy: 4,
  });
}

function normalizeState(nextState) {
  const savedById = new Map((nextState.exercises || []).map((exercise) => [exercise.id, exercise]));
  const exercises = [
    ...defaultExercises.map((exercise) => ({ ...exercise, ...(savedById.get(exercise.id) || {}) })),
    ...(nextState.exercises || [])
      .filter((exercise) => !defaultExercises.some((item) => item.id === exercise.id))
      .map((exercise) => ({ ...exercise, custom: true })),
  ];

  return {
    ...nextState,
    exercises,
    week: (nextState.week || defaultWeek).map((day, index) => ({
      ...defaultWeek[index],
      ...day,
      exercises: day.exercises || defaultRoutineForFocus(day.focus || defaultWeek[index].focus),
    })),
  };
}

function defaultRoutineForFocus(focus) {
  const routines = {
    Empuje: ["press-banca", "press-militar", "fondos"],
    Tiron: ["dominadas", "remo-barra", "peso-muerto"],
    Pierna: ["sentadilla", "zancadas"],
    "Full body": ["sentadilla", "press-banca", "remo-barra"],
    Cardio: [],
    Descanso: [],
  };
  return [...(routines[focus] || [])];
}

function seedHealth() {
  const today = new Date();
  return [6, 3, 0].map((daysAgo, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    return {
      id: `health-${dateKey(date)}`,
      date: dateKey(date),
      weight: [82.4, 82.1, 81.8][index],
      glucose: [112, 106, 101][index],
      moment: "Ayunas",
      note: "",
    };
  });
}

function seedLogs() {
  const today = new Date();
  return [6, 5, 3, 1].map((daysAgo, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    return {
      date: dateKey(date),
      volume: [8120, 9400, 10280, 7350][index],
      sets: [18, 21, 24, 16][index],
      focus: ["Tiron", "Pierna", "Empuje", "Full body"][index],
      records: [
        { exercise: "Press banca", weight: 65 + index * 2.5, reps: 6 },
        { exercise: "Sentadilla", weight: 90 + index * 5, reps: 5 },
      ],
    };
  });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getExercise(id) {
  return state.exercises.find((exercise) => exercise.id === id) || state.exercises[0];
}

function getTodayPlan() {
  const dayIndex = (new Date().getDay() + 6) % 7;
  return state.week[dayIndex];
}

function sessionStats() {
  let sets = 0;
  let volume = 0;
  state.session.forEach((item) => {
    item.sets.forEach((set) => {
      if (set.done) {
        sets += 1;
        volume += Number(set.reps || 0) * Number(set.weight || 0);
      }
    });
  });
  return { sets, volume };
}

function render() {
  const today = new Date();
  const plan = getTodayPlan();
  const formatDate = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  els.todayLabel.textContent = formatDate.format(today);
  els.workoutName.textContent = plan.focus === "Descanso" ? "Recuperacion activa" : plan.focus;
  els.coachLine.textContent = coachCopy(plan.focus, state.energy);
  els.energyRange.value = state.energy;
  els.energyText.textContent = energyCopy(state.energy);
  updateMetrics();

  renderSession();
  renderWeek();
  renderLibrary();
  renderDialog();
  renderProgress();
  renderHealth();
  renderStreak();
  renderMuscleMap();
}

function updateMetrics() {
  const stats = sessionStats();
  els.metricVolume.textContent = `${Math.round(stats.volume).toLocaleString("es-ES")} kg`;
  els.metricSets.textContent = stats.sets;
  els.metricTime.textContent = estimateTime();
  els.metricGoal.textContent = getTodayPlan().focus;
}

function coachCopy(focus, energy) {
  if (focus === "Descanso") return "Hoy suma recuperacion: movilidad, paseo y ganas para volver mejor.";
  if (energy <= 2) return "Baja una marcha: tecnica perfecta, volumen moderado y sal con hambre.";
  if (energy >= 5) return "Dia potente: busca una serie top, luego volumen limpio y controlado.";
  return "Calienta con calma, registra cada serie y deja que el progreso mande.";
}

function energyCopy(value) {
  const lines = {
    1: "Modo conservador: reduce peso y gana calidad.",
    2: "Haz lo previsto, pero deja dos repeticiones en reserva.",
    3: "Buen ritmo: busca consistencia antes que heroicidades.",
    4: "Buen dia para apretar, sin perder tecnica.",
    5: "A por marca: intenta subir 2,5 kg o una repeticion clave.",
  };
  return lines[value];
}

function estimateTime() {
  const sets = state.session.reduce((sum, item) => sum + item.sets.length, 0);
  return `${Math.max(25, sets * 5)} min`;
}

function renderSession() {
  els.exerciseList.innerHTML = "";

  state.session.forEach((item, exerciseIndex) => {
    const exercise = getExercise(item.exerciseId);
    const card = document.createElement("article");
    card.className = "exercise-card";
    card.innerHTML = `
      <div class="exercise-top">
        ${exerciseMedia(exercise, "exercise-photo")}
        <div class="exercise-title">
          <strong>${exercise.name}</strong>
          <span>${exercise.muscle} - objetivo ${exercise.hint}</span>
        </div>
        <div class="action-row">
          <button class="ghost-button" data-action="share-exercise" data-exercise-id="${exercise.id}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" /></svg>
            Compartir
          </button>
          <button class="ghost-button" data-action="add-set" data-exercise-index="${exerciseIndex}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            Serie
          </button>
          <button class="icon-button danger-button" data-action="remove-exercise-session" data-exercise-index="${exerciseIndex}" aria-label="Quitar ejercicio de hoy">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
      <table class="set-table">
        <thead>
          <tr>
            <th>OK</th>
            <th>Reps</th>
            <th>Kg</th>
            <th></th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;

    const tbody = card.querySelector("tbody");
    item.sets.forEach((set, setIndex) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="checkbox" ${set.done ? "checked" : ""} data-action="toggle-set" data-exercise-index="${exerciseIndex}" data-set-index="${setIndex}" aria-label="Marcar serie hecha" /></td>
        <td><input type="number" min="0" inputmode="numeric" value="${set.reps}" data-field="reps" data-exercise-index="${exerciseIndex}" data-set-index="${setIndex}" aria-label="Repeticiones" /></td>
        <td><input type="number" min="0" step="0.5" inputmode="decimal" value="${set.weight}" data-field="weight" data-exercise-index="${exerciseIndex}" data-set-index="${setIndex}" aria-label="Peso" /></td>
        <td><button class="row-button" data-action="remove-set" data-exercise-index="${exerciseIndex}" data-set-index="${setIndex}" aria-label="Eliminar serie">x</button></td>
      `;
      tbody.append(row);
    });

    els.exerciseList.append(card);
  });
}

function renderWeek() {
  els.weekGrid.innerHTML = "";
  const todayIndex = (new Date().getDay() + 6) % 7;
  const options = ["Empuje", "Tiron", "Pierna", "Full body", "Cardio", "Descanso"];

  state.week.forEach((day, index) => {
    const dayExercises = (day.exercises || []).map((exerciseId) => getExercise(exerciseId)).filter(Boolean);
    const card = document.createElement("article");
    card.className = `week-card ${index === todayIndex ? "today" : ""}`;
    card.innerHTML = `
      <span>${day.day}</span>
      <h3>${day.focus}</h3>
      <select data-week-field="focus" data-week-index="${index}" aria-label="Tipo de entrenamiento para ${day.day}">
        ${options.map((option) => `<option ${option === day.focus ? "selected" : ""}>${option}</option>`).join("")}
      </select>
      <textarea data-week-field="notes" data-week-index="${index}" aria-label="Notas para ${day.day}">${day.notes}</textarea>
      <div class="routine-list">
        ${
          dayExercises.length
            ? dayExercises
                .map(
                  (exercise) => `
                    <div class="routine-pill">
                      <span>${exercise.name}</span>
                      <button class="row-button" data-action="remove-routine-exercise" data-week-index="${index}" data-exercise-id="${exercise.id}" aria-label="Quitar ${exercise.name}">x</button>
                    </div>
                  `,
                )
                .join("")
            : `<p class="empty-copy">Sin ejercicios asignados.</p>`
        }
      </div>
      <div class="routine-add">
        <select data-routine-picker="${index}" aria-label="Ejercicio para ${day.day}">
          ${state.exercises.map((exercise) => `<option value="${exercise.id}">${exercise.name}</option>`).join("")}
        </select>
        <button class="ghost-button" data-action="add-routine-exercise" data-week-index="${index}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Poner
        </button>
      </div>
      <button class="primary-button load-day-button" data-action="load-routine-day" data-week-index="${index}">Cargar hoy</button>
    `;
    els.weekGrid.append(card);
  });
}

function renderLibrary() {
  const muscles = ["Todos", ...new Set(state.exercises.map((exercise) => exercise.muscle))];
  els.muscleFilters.innerHTML = muscles
    .map((muscle) => `<button class="filter-chip ${muscle === activeFilter ? "active" : ""}" data-filter="${muscle}">${muscle}</button>`)
    .join("");

  els.libraryGrid.innerHTML = "";
  state.exercises
    .filter((exercise) => activeFilter === "Todos" || exercise.muscle === activeFilter)
    .forEach((exercise) => {
      const card = document.createElement("article");
      card.className = "library-card";
      card.innerHTML = `
        ${exerciseMedia(exercise, "library-photo")}
        <span class="muscle-pill">${exercise.muscle}</span>
        <div>
          <strong>${exercise.name}</strong>
          <span>${exercise.hint}</span>
        </div>
        <div class="card-actions">
          <button class="ghost-button" data-action="queue-exercise" data-exercise-id="${exercise.id}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            Hoy
          </button>
          <button class="ghost-button" data-action="share-exercise" data-exercise-id="${exercise.id}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" /></svg>
            Compartir
          </button>
          <label class="ghost-button file-button">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16l4-4 4 4 4-4 4 4M4 20h16M5 8h14M8 4h8" /></svg>
            Foto
            <input type="file" accept="image/*" data-action="set-exercise-photo" data-exercise-id="${exercise.id}" />
          </label>
          ${exercise.image ? `<button class="icon-button" data-action="clear-exercise-photo" data-exercise-id="${exercise.id}" aria-label="Quitar foto"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg></button>` : ""}
          ${
            exercise.custom
              ? `<button class="icon-button danger-button" data-action="delete-library-exercise" data-exercise-id="${exercise.id}" aria-label="Borrar ejercicio"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg></button>`
              : ""
          }
        </div>
      `;
      els.libraryGrid.append(card);
    });
}

function renderDialog() {
  els.dialogExerciseList.innerHTML = "";
  state.exercises.forEach((exercise) => {
    const button = document.createElement("button");
    button.className = "dialog-option";
    button.type = "button";
    button.dataset.action = "queue-exercise";
    button.dataset.exerciseId = exercise.id;
    button.innerHTML = `<strong>${exercise.name}</strong><span>${exercise.muscle} - ${exercise.hint}</span>`;
    els.dialogExerciseList.append(button);
  });
}

function exerciseMedia(exercise, className) {
  if (exercise.image) {
    return `<img class="${className}" src="${exercise.image}" alt="${exercise.name}" loading="lazy" />`;
  }
  return `
    <div class="${className} exercise-visual" aria-hidden="true">
      <span>${exercise.name.slice(0, 2).toUpperCase()}</span>
      <small>${exercise.muscle}</small>
    </div>
  `;
}

function setExercisePhoto(exerciseId, file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 520;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      const scale = Math.max(size / image.width, size / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
      const exercise = getExercise(exerciseId);
      exercise.image = canvas.toDataURL("image/jpeg", 0.78);
      saveState();
      render();
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function renderProgress() {
  const records = bestRecords();
  els.recordsList.innerHTML = records.length
    ? records
        .map(
          (record) => `
            <article class="record-card">
              <div>
                <strong>${record.exercise}</strong>
                <span>${record.reps} reps</span>
              </div>
              <em>${record.weight} kg</em>
            </article>
          `,
        )
        .join("")
    : `<p>Aun no hay records. Cierra un entreno para guardar tus marcas.</p>`;
  drawChart();
}

function renderHealth() {
  if (!els.healthDate) return;
  els.healthDate.value ||= dateKey();
  const entries = [...state.health].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  const last = entries[0];
  const glucoseValues = entries.map((entry) => Number(entry.glucose)).filter(Boolean);
  const avgGlucose = glucoseValues.length
    ? Math.round(glucoseValues.reduce((sum, value) => sum + value, 0) / glucoseValues.length)
    : null;

  els.healthSummary.innerHTML = `
    <article class="metric compact-metric">
      <span>Ultimo peso</span>
      <strong>${last?.weight ? `${last.weight} kg` : "-"}</strong>
    </article>
    <article class="metric compact-metric">
      <span>Ultima azucar</span>
      <strong>${last?.glucose ? `${last.glucose} mg/dL` : "-"}</strong>
    </article>
    <article class="metric compact-metric">
      <span>Media azucar</span>
      <strong>${avgGlucose ? `${avgGlucose} mg/dL` : "-"}</strong>
    </article>
  `;

  els.healthList.innerHTML = entries.length
    ? entries
        .map(
          (entry) => `
            <article class="health-row">
              <div>
                <strong>${formatDate(entry.date)} - ${entry.moment}</strong>
                <span>${entry.weight ? `${entry.weight} kg` : "Sin peso"} · ${entry.glucose ? `${entry.glucose} mg/dL` : "Sin azucar"}${entry.note ? ` · ${entry.note}` : ""}</span>
              </div>
              <button class="icon-button danger-button" data-action="delete-health" data-health-id="${entry.id}" aria-label="Borrar medicion">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
              </button>
            </article>
          `,
        )
        .join("")
    : `<p>No hay mediciones todavia.</p>`;
}

function formatDate(key) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(`${key}T12:00:00`));
}

function downloadText(filename, text, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function shareText(title, text, filename) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return;
    } catch {
      return;
    }
  }
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    alert("Copiado al portapapeles.");
    return;
  }
  downloadText(filename, text);
}

function weekShareText() {
  return state.week.map((day) => `${day.day}: ${day.focus} - ${day.notes}`).join("\n");
}

function exerciseShareText(exercise) {
  return `${exercise.name}\nGrupo: ${exercise.muscle}\nObjetivo: ${exercise.hint}`;
}

function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
}

function healthCsv() {
  return toCsv([
    ["date", "weight_kg", "glucose_mg_dl", "moment", "note"],
    ...state.health.map((entry) => [entry.date, entry.weight, entry.glucose, entry.moment, entry.note]),
  ]);
}

function workoutCsv() {
  return toCsv([
    ["date", "focus", "sets", "volume_kg", "records"],
    ...state.logs.map((log) => [
      log.date,
      log.focus,
      log.sets,
      log.volume,
      (log.records || []).map((record) => `${record.exercise} ${record.weight}kg x ${record.reps}`).join("; "),
    ]),
  ]);
}

function bestRecords() {
  const map = new Map();

  state.logs.forEach((log) => {
    (log.records || []).forEach((record) => {
      const current = map.get(record.exercise);
      if (!current || Number(record.weight) > Number(current.weight)) {
        map.set(record.exercise, record);
      }
    });
  });

  state.session.forEach((item) => {
    const exercise = getExercise(item.exerciseId);
    item.sets.forEach((set) => {
      if (!set.done) return;
      const current = map.get(exercise.name);
      if (!current || Number(set.weight) > Number(current.weight)) {
        map.set(exercise.name, { exercise: exercise.name, weight: Number(set.weight), reps: Number(set.reps) });
      }
    });
  });

  return [...map.values()].sort((a, b) => b.weight - a.weight).slice(0, 6);
}

function drawChart() {
  const canvas = els.volumeChart;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = 42;
  const logs = [...state.logs].slice(-7);
  const data = logs.length ? logs : [{ date: dateKey(), volume: 0 }];
  const max = Math.max(...data.map((log) => log.volume), 1000);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#d9ded7";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = padding + ((height - padding * 2) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  const barWidth = (width - padding * 2) / data.length - 18;
  data.forEach((log, index) => {
    const x = padding + index * ((width - padding * 2) / data.length) + 9;
    const barHeight = ((height - padding * 2) * log.volume) / max;
    const y = height - padding - barHeight;
    const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
    gradient.addColorStop(0, "#f45d48");
    gradient.addColorStop(1, "#ffc857");
    ctx.fillStyle = gradient;
    roundRect(ctx, x, y, Math.max(18, barWidth), barHeight, 8);
    ctx.fill();
    ctx.fillStyle = "#66706b";
    ctx.font = "700 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(shortDay(log.date), x + Math.max(18, barWidth) / 2, height - 16);
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function shortDay(key) {
  const date = new Date(`${key}T12:00:00`);
  return new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(date).replace(".", "");
}

function renderStreak() {
  const doneDates = new Set(state.logs.map((log) => log.date));
  let streak = 0;
  const cursor = new Date();

  while (doneDates.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  els.streakCount.textContent = `${streak} ${streak === 1 ? "dia" : "dias"}`;
  els.streakText.textContent = streak
    ? "Cadena activa. Mantenerla cuenta mas que hacer perfecto cada dia."
    : "Registra tu primer entreno y empieza la cadena.";
}

function renderMuscleMap() {
  const activeMuscles = new Set(state.session.map((item) => getExercise(item.exerciseId).muscle));
  document.querySelectorAll(".muscle").forEach((part) => part.classList.remove("hot"));
  if (activeMuscles.has("Pecho")) document.querySelectorAll(".chest").forEach((part) => part.classList.add("hot"));
  if (activeMuscles.has("Hombro")) document.querySelectorAll(".shoulders").forEach((part) => part.classList.add("hot"));
  if (activeMuscles.has("Pierna")) document.querySelectorAll(".legs").forEach((part) => part.classList.add("hot"));
}

function queueExercise(exerciseId) {
  if (!state.session.some((item) => item.exerciseId === exerciseId)) {
    state.session.push({
      exerciseId,
      sets: [
        { reps: 10, weight: 0, done: false },
        { reps: 10, weight: 0, done: false },
        { reps: 10, weight: 0, done: false },
      ],
    });
  }
  saveState();
  els.dialog.close();
  switchView("today");
  render();
}

function finishWorkout() {
  const stats = sessionStats();
  if (!stats.sets) {
    alert("Marca al menos una serie antes de cerrar el entreno.");
    return;
  }

  const records = [];
  state.session.forEach((item) => {
    const exercise = getExercise(item.exerciseId);
    item.sets
      .filter((set) => set.done)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 1)
      .forEach((set) => records.push({ exercise: exercise.name, weight: Number(set.weight), reps: Number(set.reps) }));
  });

  const today = dateKey();
  const log = {
    date: today,
    volume: stats.volume,
    sets: stats.sets,
    focus: getTodayPlan().focus,
    records,
  };
  const existingIndex = state.logs.findIndex((item) => item.date === today);
  if (existingIndex >= 0) state.logs[existingIndex] = log;
  else state.logs.push(log);

  state.session = state.session.map((item) => ({
    ...item,
    sets: item.sets.map((set) => ({ reps: set.reps, weight: set.weight, done: false })),
  }));

  saveState();
  render();
}

function switchView(view) {
  activeView = view;
  const titles = {
    today: "Entreno de hoy",
    plan: "Plan semanal",
    library: "Ejercicios",
    progress: "Progreso",
    health: "Salud",
  };
  els.viewTitle.textContent = titles[view];
  document.querySelectorAll(".view").forEach((section) => section.classList.remove("active"));
  document.querySelector(`#${view}View`).classList.add("active");
  document.querySelectorAll(".nav-tab").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  if (view === "progress") requestAnimationFrame(drawChart);
}

function resetTimer() {
  clearInterval(timer.interval);
  timer.interval = null;
  timer.total = Number(els.timerPreset.value);
  timer.remaining = timer.total;
  document.querySelector("#timerStart").textContent = "Iniciar";
  updateTimer();
}

function updateTimer() {
  const minutes = String(Math.floor(timer.remaining / 60)).padStart(2, "0");
  const seconds = String(timer.remaining % 60).padStart(2, "0");
  els.timerDisplay.textContent = `${minutes}:${seconds}`;
  const progress = timer.remaining / timer.total;
  els.timerRing.style.strokeDashoffset = String(364 - 364 * progress);
}

function startTimer() {
  if (timer.interval) {
    clearInterval(timer.interval);
    timer.interval = null;
    document.querySelector("#timerStart").textContent = "Continuar";
    return;
  }
  document.querySelector("#timerStart").textContent = "Pausar";
  timer.interval = setInterval(() => {
    timer.remaining -= 1;
    if (timer.remaining <= 0) {
      resetTimer();
      els.timerDisplay.textContent = "Listo";
      return;
    }
    updateTimer();
  }, 1000);
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  if (target.classList.contains("nav-tab")) switchView(target.dataset.view);
  if (target.id === "addExerciseBtn") els.dialog.showModal();
  if (target.id === "finishWorkoutBtn") finishWorkout();
  if (target.id === "timerStart") startTimer();
  if (target.id === "timerReset") resetTimer();
  if (target.id === "resetWeekBtn") {
    state.week = structuredClone(defaultWeek);
    saveState();
    render();
  }
  if (target.id === "shareWeekBtn") shareText("Rutina semanal Forja Gym", weekShareText(), `rutina-semanal-${dateKey()}.txt`);
  if (target.id === "exportHealthBtn") downloadText(`salud-forja-${dateKey()}.csv`, healthCsv(), "text/csv");
  if (target.id === "exportWorkoutCsvBtn") downloadText(`entrenos-forja-${dateKey()}.csv`, workoutCsv(), "text/csv");
  if (target.id === "exportBtn") {
    downloadText(`forja-gym-${dateKey()}.json`, JSON.stringify(state, null, 2), "application/json");
  }

  const action = target.dataset.action;
  if (action === "queue-exercise") queueExercise(target.dataset.exerciseId);
  if (action === "share-exercise") {
    const exercise = getExercise(target.dataset.exerciseId);
    shareText(`Ejercicio ${exercise.name}`, exerciseShareText(exercise), `ejercicio-${exercise.id}.txt`);
  }
  if (action === "add-set") {
    state.session[Number(target.dataset.exerciseIndex)].sets.push({ reps: 10, weight: 0, done: false });
    saveState();
    render();
  }
  if (action === "remove-exercise-session") {
    state.session.splice(Number(target.dataset.exerciseIndex), 1);
    saveState();
    render();
  }
  if (action === "add-routine-exercise") {
    const weekIndex = Number(target.dataset.weekIndex);
    const picker = document.querySelector(`[data-routine-picker="${weekIndex}"]`);
    state.week[weekIndex].exercises ||= [];
    if (picker?.value && !state.week[weekIndex].exercises.includes(picker.value)) {
      state.week[weekIndex].exercises.push(picker.value);
      saveState();
      render();
    }
  }
  if (action === "remove-routine-exercise") {
    const weekIndex = Number(target.dataset.weekIndex);
    state.week[weekIndex].exercises = (state.week[weekIndex].exercises || []).filter((id) => id !== target.dataset.exerciseId);
    saveState();
    render();
  }
  if (action === "load-routine-day") {
    const day = state.week[Number(target.dataset.weekIndex)];
    state.session = (day.exercises || []).map((exerciseId) => ({
      exerciseId,
      sets: [
        { reps: 10, weight: 0, done: false },
        { reps: 10, weight: 0, done: false },
        { reps: 10, weight: 0, done: false },
      ],
    }));
    saveState();
    switchView("today");
    render();
  }
  if (action === "remove-set") {
    const item = state.session[Number(target.dataset.exerciseIndex)];
    item.sets.splice(Number(target.dataset.setIndex), 1);
    saveState();
    render();
  }
  if (action === "delete-library-exercise") {
    const exercise = getExercise(target.dataset.exerciseId);
    if (!exercise.custom) return;
    state.exercises = state.exercises.filter((item) => item.id !== exercise.id);
    state.session = state.session.filter((item) => item.exerciseId !== exercise.id);
    state.week = state.week.map((day) => ({
      ...day,
      exercises: (day.exercises || []).filter((id) => id !== exercise.id),
    }));
    saveState();
    render();
  }
  if (action === "clear-exercise-photo") {
    getExercise(target.dataset.exerciseId).image = "";
    saveState();
    render();
  }
  if (action === "delete-health") {
    state.health = state.health.filter((entry) => entry.id !== target.dataset.healthId);
    saveState();
    renderHealth();
  }
});

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.dataset.field) {
    const item = state.session[Number(target.dataset.exerciseIndex)];
    const set = item.sets[Number(target.dataset.setIndex)];
    set[target.dataset.field] = Number(target.value);
    saveState();
    updateMetrics();
    renderProgress();
  }

  if (target.dataset.weekField) {
    state.week[Number(target.dataset.weekIndex)][target.dataset.weekField] = target.value;
    saveState();
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.dataset.action === "set-exercise-photo") {
    setExercisePhoto(target.dataset.exerciseId, target.files?.[0]);
    target.value = "";
  }

  if (target.dataset.action === "toggle-set") {
    const item = state.session[Number(target.dataset.exerciseIndex)];
    item.sets[Number(target.dataset.setIndex)].done = target.checked;
    saveState();
    render();
  }

  if (target.id === "timerPreset") resetTimer();
  if (target.id === "energyRange") {
    state.energy = Number(target.value);
    saveState();
    render();
  }
  if (target.dataset.weekField === "focus") render();
});

els.muscleFilters.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-filter]");
  if (!chip) return;
  activeFilter = chip.dataset.filter;
  renderLibrary();
});

document.querySelector("#newExerciseForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#newExerciseName").value.trim();
  const muscle = document.querySelector("#newExerciseMuscle").value;
  if (!name) return;

  state.exercises.push({
    id: `${slugify(name)}-${Date.now().toString(36)}`,
    name,
    muscle,
    hint: "3 x 10",
    custom: true,
  });
  event.currentTarget.reset();
  saveState();
  render();
});

els.healthForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const weight = els.healthWeight.value ? Number(els.healthWeight.value) : "";
  const glucose = els.healthGlucose.value ? Number(els.healthGlucose.value) : "";
  if (!weight && !glucose) {
    alert("Anade peso, azucar o ambos antes de guardar.");
    return;
  }

  state.health.push({
    id: `health-${Date.now()}`,
    date: els.healthDate.value || dateKey(),
    weight,
    glucose,
    moment: els.healthMoment.value,
    note: els.healthNote.value.trim(),
  });
  els.healthWeight.value = "";
  els.healthGlucose.value = "";
  els.healthNote.value = "";
  saveState();
  renderHealth();
});

resetTimer();
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // La app sigue funcionando aunque el navegador bloquee el modo offline.
    });
  });
}
