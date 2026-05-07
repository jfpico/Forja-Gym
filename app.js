// ─────────────────────────────────────────────────────────
//  Forja Gym · app.js v3
//  Flujo: planifica en casa → ejecuta en el gym
// ─────────────────────────────────────────────────────────

const STORAGE_KEY = "forja-gym-state-v3";

// ── Catálogo base ─────────────────────────────────────────
const DEFAULT_EXERCISES = [
  { id: "press-banca",    name: "Press banca",     muscle: "Pecho",   hint: "4×6-8" },
  { id: "aperturas",      name: "Aperturas",        muscle: "Pecho",   hint: "3×12" },
  { id: "fondos",         name: "Fondos",           muscle: "Pecho",   hint: "3×max" },
  { id: "press-inclinado",name: "Press inclinado",  muscle: "Pecho",   hint: "4×8" },
  { id: "dominadas",      name: "Dominadas",        muscle: "Espalda", hint: "4×max" },
  { id: "peso-muerto",    name: "Peso muerto",      muscle: "Espalda", hint: "3×5" },
  { id: "remo-barra",     name: "Remo con barra",   muscle: "Espalda", hint: "4×8" },
  { id: "jalones",        name: "Jalones polea",    muscle: "Espalda", hint: "3×10" },
  { id: "sentadilla",     name: "Sentadilla",       muscle: "Pierna",  hint: "5×5" },
  { id: "prensa",         name: "Prensa",           muscle: "Pierna",  hint: "4×10" },
  { id: "zancadas",       name: "Zancadas",         muscle: "Pierna",  hint: "3×10" },
  { id: "curl-femoral",   name: "Curl femoral",     muscle: "Pierna",  hint: "3×12" },
  { id: "press-militar",  name: "Press militar",    muscle: "Hombro",  hint: "4×6" },
  { id: "elevaciones",    name: "Elevaciones lat.", muscle: "Hombro",  hint: "4×12" },
  { id: "pajaros",        name: "Pájaros",          muscle: "Hombro",  hint: "3×15" },
  { id: "curl-biceps",    name: "Curl bíceps",      muscle: "Brazo",   hint: "3×12" },
  { id: "curl-martillo",  name: "Curl martillo",    muscle: "Brazo",   hint: "3×10" },
  { id: "triceps-polea",  name: "Tríceps polea",    muscle: "Brazo",   hint: "3×12" },
  { id: "plancha",        name: "Plancha",          muscle: "Core",    hint: "3×45s" },
  { id: "abdominales",    name: "Abdominales",      muscle: "Core",    hint: "3×20" },
];

const DEFAULT_WEEK = [
  { day: "Lun", name: "Empuje",   exercises: ["press-banca", "press-inclinado", "fondos", "press-militar", "elevaciones"] },
  { day: "Mar", name: "Tirón",    exercises: ["dominadas", "remo-barra", "jalones", "curl-biceps", "curl-martillo"] },
  { day: "Mié", name: "Pierna",   exercises: ["sentadilla", "prensa", "zancadas", "curl-femoral"] },
  { day: "Jue", name: "Descanso", exercises: [] },
  { day: "Vie", name: "Full",     exercises: ["press-banca", "dominadas", "sentadilla", "press-militar", "plancha"] },
  { day: "Sáb", name: "Cardio",   exercises: [] },
  { day: "Dom", name: "Descanso", exercises: [] },
];

let state = loadState();
let activeView   = "today";
let activeFilter = "Todos";
let planDayIndex = null;
let timer = { total: 90, remaining: 90, interval: null };

function $(id) { return document.getElementById(id); }

const els = {
  todayLabel:    $("todayLabel"),
  viewTitle:     $("viewTitle"),
  workoutName:   $("workoutName"),
  coachLine:     $("coachLine"),
  exerciseList:  $("exerciseList"),
  metricVolume:  $("metricVolume"),
  metricSets:    $("metricSets"),
  metricTime:    $("metricTime"),
  metricGoal:    $("metricGoal"),
  streakCount:   $("streakCount"),
  streakText:    $("streakText"),
  weekGrid:      $("weekGrid"),
  libraryGrid:   $("libraryGrid"),
  muscleFilters: $("muscleFilters"),
  recordsList:   $("recordsList"),
  volumeChart:   $("volumeChart"),
  timerPreset:   $("timerPreset"),
  timerDisplay:  $("timerDisplay"),
  timerRing:     $("timerRing"),
  energyRange:   $("energyRange"),
  energyText:    $("energyText"),
  planDialog:    $("planDialog"),
  planDayTitle:  $("planDayTitle"),
  planPickList:  $("planPickList"),
};

// ── Persistencia ──────────────────────────────────────────
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved) return {
      exercises:  saved.exercises  || structuredClone(DEFAULT_EXERCISES),
      week:       saved.week       || structuredClone(DEFAULT_WEEK),
      session:    saved.session    || [],
      sessionDay: saved.sessionDay || null,
      logs:       saved.logs       || seedLogs(),
      energy:     saved.energy     || 4,
    };
  } catch { localStorage.removeItem(STORAGE_KEY); }
  return {
    exercises:  structuredClone(DEFAULT_EXERCISES),
    week:       structuredClone(DEFAULT_WEEK),
    session:    [],
    sessionDay: null,
    logs:       seedLogs(),
    energy:     4,
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function seedLogs() {
  const today = new Date();
  return [6,5,3,1].map((ago, i) => {
    const d = new Date(today); d.setDate(today.getDate() - ago);
    return {
      date: dateKey(d),
      volume: [8120,9400,10280,7350][i],
      sets:   [18,21,24,16][i],
      focus:  ["Tirón","Pierna","Empuje","Full"][i],
      records:[
        { exercise:"Press banca", weight: 65+i*2.5, reps:6 },
        { exercise:"Sentadilla",  weight: 90+i*5,   reps:5 },
      ],
    };
  });
}

// ── Helpers ───────────────────────────────────────────────
function dateKey(d = new Date()) { return d.toISOString().slice(0,10); }
function todayDayIndex() { return (new Date().getDay() + 6) % 7; }
function getExercise(id) { return state.exercises.find(e => e.id === id); }
function slugify(v) {
  return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
}
function todayPlan() { return state.week[todayDayIndex()]; }
function sessionStats() {
  let sets = 0, volume = 0;
  state.session.forEach(item =>
    item.sets.forEach(s => { if (s.done) { sets++; volume += (s.reps||0)*(s.weight||0); } })
  );
  return { sets, volume };
}

const I = {
  plus:  `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
  trash: `<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>`,
  x:     `<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  check: `<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>`,
  edit:  `<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>`,
};

// ── Render principal ──────────────────────────────────────
function render() {
  const plan = todayPlan();
  const fmt  = new Intl.DateTimeFormat("es-ES", { weekday:"long", day:"numeric", month:"long" });
  els.todayLabel.textContent  = fmt.format(new Date());
  els.workoutName.textContent = plan.name || "Descanso";
  els.coachLine.textContent   = coachCopy(plan.name, state.energy);
  els.energyRange.value       = state.energy;
  els.energyText.textContent  = energyCopy(state.energy);

  ensureSessionMatchesDay();
  updateMetrics();
  renderSession();
  renderWeek();
  renderLibrary();
  renderProgress();
  renderStreak();
  renderMuscleMap();
}

function ensureSessionMatchesDay() {
  const todayKey = dateKey();
  if (state.sessionDay && state.sessionDay !== todayKey) {
    state.session    = [];
    state.sessionDay = todayKey;
  }
  if (!state.session.length) {
    const plan = todayPlan();
    state.session    = plan.exercises.filter(id => getExercise(id)).map(id => ({ exerciseId: id, sets: [] }));
    state.sessionDay = todayKey;
    saveState();
  }
}

function coachCopy(name, energy) {
  if (!name || name === "Descanso" || name === "Cardio")
    return "Hoy suma recuperación: movilidad, paseo y ganas para volver mejor.";
  if (energy <= 2) return "Baja una marcha: técnica perfecta, volumen moderado.";
  if (energy >= 5) return "Día potente: busca una serie tope, luego volumen limpio.";
  return "Calienta con calma, registra cada serie y deja que el progreso mande.";
}

function energyCopy(v) {
  return {
    1:"Modo conservador: reduce peso y gana calidad.",
    2:"Haz lo previsto, pero deja dos reps en reserva.",
    3:"Buen ritmo: consistencia antes que heroicidades.",
    4:"Buen día para apretar, sin perder técnica.",
    5:"A por marca: intenta subir 2,5 kg o una rep clave.",
  }[v];
}

// ── Sesión ────────────────────────────────────────────────
function renderSession() {
  els.exerciseList.innerHTML = "";

  if (!state.session.length) {
    els.exerciseList.innerHTML = `
      <p class="empty-state">
        Sin ejercicios para hoy.<br>
        <button class="ghost-button inline-btn" id="goToPlanBtn">${I.edit} Editar plan del día</button>
      </p>`;
    $("goToPlanBtn")?.addEventListener("click", () => switchView("plan"));
    return;
  }

  state.session.forEach((item, ei) => {
    const ex = getExercise(item.exerciseId);
    if (!ex) return;
    const doneCount = item.sets.filter(s => s.done).length;
    const allDone   = item.sets.length > 0 && doneCount === item.sets.length;
    const card = document.createElement("article");
    card.className = `exercise-card ${allDone ? "exercise-card--done" : ""}`;
    card.innerHTML = `
      <div class="exercise-top">
        <div class="exercise-title">
          <strong>${ex.name}</strong>
          <span>${ex.muscle} · ${ex.hint}</span>
        </div>
        <div class="exercise-top-actions">
          <span class="set-counter">${doneCount}/${item.sets.length}</span>
          <button class="ghost-button" data-action="add-set" data-ei="${ei}">${I.plus} Serie</button>
          <button class="icon-button danger-btn" data-action="remove-exercise" data-ei="${ei}" title="Quitar">${I.x}</button>
        </div>
      </div>
      <table class="set-table">
        <thead><tr><th>✓</th><th>#</th><th>Reps</th><th>Kg</th><th></th></tr></thead>
        <tbody></tbody>
      </table>
    `;
    const tbody = card.querySelector("tbody");
    if (!item.sets.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-sets">Sin series — pulsa <strong>+ Serie</strong></td></tr>`;
    } else {
      item.sets.forEach((s, si) => {
        const tr = document.createElement("tr");
        tr.className = s.done ? "set-done" : "";
        tr.innerHTML = `
          <td><input type="checkbox" ${s.done?"checked":""} data-action="toggle-set" data-ei="${ei}" data-si="${si}"/></td>
          <td class="set-num">${si+1}</td>
          <td><input type="number" min="0" inputmode="numeric"  value="${s.reps||""}"   placeholder="—" data-field="reps"   data-ei="${ei}" data-si="${si}"/></td>
          <td><input type="number" min="0" step="0.5" inputmode="decimal" value="${s.weight||""}" placeholder="—" data-field="weight" data-ei="${ei}" data-si="${si}"/></td>
          <td><button class="row-button" data-action="remove-set" data-ei="${ei}" data-si="${si}">✕</button></td>
        `;
        tbody.append(tr);
      });
    }
    els.exerciseList.append(card);
  });
}

// ── Plan ──────────────────────────────────────────────────
function renderWeek() {
  els.weekGrid.innerHTML = "";
  const todayIdx = todayDayIndex();

  state.week.forEach((day, di) => {
    const isToday = di === todayIdx;
    const card = document.createElement("article");
    card.className = `week-card ${isToday ? "today" : ""}`;

    const exRows = day.exercises
      .map(id => getExercise(id)).filter(Boolean)
      .map(ex => `
        <div class="plan-ex-row">
          <span class="plan-ex-name">${ex.name}</span>
          <button class="icon-button danger-btn micro-btn"
            data-action="remove-plan-exercise" data-di="${di}" data-id="${ex.id}"
            title="Quitar">${I.x}</button>
        </div>
      `).join("");

    card.innerHTML = `
      <div class="week-card-head">
        <div class="week-card-day">
          <b>${day.day}</b>
          ${isToday ? `<span class="today-badge">Hoy</span>` : ""}
        </div>
        <input class="day-name-input" type="text" value="${day.name}" maxlength="16"
               data-action="rename-day" data-di="${di}" aria-label="Nombre del día"/>
      </div>
      <div class="plan-ex-list">
        ${exRows || `<p class="plan-empty">Sin ejercicios</p>`}
      </div>
      <button class="plan-add-btn" data-action="open-plan-picker" data-di="${di}">
        ${I.plus} Añadir ejercicio
      </button>
    `;
    els.weekGrid.append(card);
  });
}

// ── Plan picker dialog ────────────────────────────────────
function openPlanPicker(di) {
  planDayIndex = di;
  const day = state.week[di];
  els.planDayTitle.textContent = `${day.day} — ${day.name}`;

  const assigned = new Set(day.exercises);
  els.planPickList.innerHTML = "";

  const groups = {};
  state.exercises.forEach(ex => (groups[ex.muscle] = groups[ex.muscle]||[]).push(ex));

  Object.entries(groups).forEach(([muscle, exs]) => {
    const g = document.createElement("div");
    g.className = "pick-group";
    g.innerHTML = `<p class="pick-group-label">${muscle}</p>`;
    exs.forEach(ex => {
      const isIn = assigned.has(ex.id);
      const btn  = document.createElement("button");
      btn.type = "button";
      btn.className = `pick-option ${isIn ? "pick-option--on" : ""}`;
      btn.dataset.action = "toggle-plan-exercise";
      btn.dataset.id     = ex.id;
      btn.innerHTML = `
        <span class="pick-name">${ex.name}</span>
        <span class="pick-hint">${ex.hint}</span>
        <span class="pick-icon">${isIn ? I.check : I.plus}</span>
      `;
      g.append(btn);
    });
    els.planPickList.append(g);
  });

  els.planDialog.showModal();
}

function togglePlanExercise(id) {
  const day = state.week[planDayIndex];
  const idx = day.exercises.indexOf(id);
  if (idx >= 0) day.exercises.splice(idx, 1);
  else day.exercises.push(id);
  saveState();
  openPlanPicker(planDayIndex);
  renderWeek();
}

// ── Biblioteca ────────────────────────────────────────────
function renderLibrary() {
  const muscles = ["Todos", ...new Set(state.exercises.map(e => e.muscle))];
  els.muscleFilters.innerHTML = muscles.map(m =>
    `<button class="filter-chip ${m===activeFilter?"active":""}" data-filter="${m}">${m}</button>`
  ).join("");

  const filtered = state.exercises.filter(e => activeFilter==="Todos" || e.muscle===activeFilter);
  els.libraryGrid.innerHTML = "";

  if (!filtered.length) {
    els.libraryGrid.innerHTML = `<p class="empty-state">No hay ejercicios en esta categoría.</p>`;
    return;
  }

  filtered.forEach(ex => {
    const inToday  = state.session.some(item => item.exerciseId === ex.id);
    const isDef    = DEFAULT_EXERCISES.some(d => d.id === ex.id);
    const card = document.createElement("article");
    card.className = "library-card";
    card.innerHTML = `
      <div class="library-card-top">
        <span class="muscle-pill">${ex.muscle}</span>
        ${!isDef ? `<button class="icon-button danger-btn micro-btn" data-action="delete-exercise" data-id="${ex.id}" title="Eliminar">${I.trash}</button>` : ""}
      </div>
      <div><strong>${ex.name}</strong><span>${ex.hint}</span></div>
      <button class="${inToday?"ghost-button active-session-btn":"ghost-button"}" data-action="queue-exercise" data-id="${ex.id}">
        ${inToday ? `${I.check} En sesión` : `${I.plus} Mandar a hoy`}
      </button>
    `;
    els.libraryGrid.append(card);
  });
}

// ── Progreso ──────────────────────────────────────────────
function renderProgress() {
  const records = bestRecords();
  els.recordsList.innerHTML = records.length
    ? records.map(r => `
        <article class="record-card">
          <div><strong>${r.exercise}</strong><span>${r.reps} reps</span></div>
          <em>${r.weight} kg</em>
        </article>`).join("")
    : `<p class="empty-state">Aún no hay récords. Cierra un entreno para guardar marcas.</p>`;
  drawChart();
}

function bestRecords() {
  const map = new Map();
  state.logs.forEach(log =>
    (log.records||[]).forEach(r => {
      const cur = map.get(r.exercise);
      if (!cur || r.weight > cur.weight) map.set(r.exercise, r);
    })
  );
  state.session.forEach(item => {
    const ex = getExercise(item.exerciseId); if (!ex) return;
    item.sets.filter(s=>s.done).forEach(s => {
      const cur = map.get(ex.name);
      if (!cur || +s.weight > +cur.weight)
        map.set(ex.name, { exercise:ex.name, weight:+s.weight, reps:+s.reps });
    });
  });
  return [...map.values()].sort((a,b)=>b.weight-a.weight).slice(0,6);
}

function drawChart() {
  const canvas = els.volumeChart;
  const ctx = canvas.getContext("2d");
  const W=canvas.width, H=canvas.height, P=42;
  const data = [...state.logs].slice(-7);
  if (!data.length) data.push({ date:dateKey(), volume:0 });
  const max = Math.max(...data.map(l=>l.volume), 1000);
  ctx.clearRect(0,0,W,H); ctx.fillStyle="#fff"; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle="#d9ded7"; ctx.lineWidth=1;
  for (let i=0;i<5;i++) {
    const y=P+((H-P*2)/4)*i;
    ctx.beginPath(); ctx.moveTo(P,y); ctx.lineTo(W-P,y); ctx.stroke();
  }
  const bw=(W-P*2)/data.length-18;
  data.forEach((l,i) => {
    const x=P+i*((W-P*2)/data.length)+9;
    const bh=((H-P*2)*l.volume)/max;
    const y=H-P-bh;
    const g=ctx.createLinearGradient(0,y,0,H-P);
    g.addColorStop(0,"#f45d48"); g.addColorStop(1,"#ffc857");
    ctx.fillStyle=g; roundRect(ctx,x,y,Math.max(18,bw),bh,8); ctx.fill();
    ctx.fillStyle="#66706b"; ctx.font="700 14px Inter,sans-serif"; ctx.textAlign="center";
    ctx.fillText(shortDay(l.date),x+Math.max(18,bw)/2,H-16);
  });
}

function roundRect(ctx,x,y,w,h,r) {
  const rr=Math.min(r,w/2,h/2);
  ctx.beginPath(); ctx.moveTo(x+rr,y);
  ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr);
  ctx.arcTo(x,y+h,x,y,rr);     ctx.arcTo(x,y,x+w,y,rr);
  ctx.closePath();
}

function shortDay(key) {
  return new Intl.DateTimeFormat("es-ES",{weekday:"short"}).format(new Date(`${key}T12:00:00`)).replace(".","");
}

function renderStreak() {
  const done=new Set(state.logs.map(l=>l.date));
  let streak=0; const cur=new Date();
  while (done.has(dateKey(cur))) { streak++; cur.setDate(cur.getDate()-1); }
  els.streakCount.textContent=`${streak} ${streak===1?"día":"días"}`;
  els.streakText.textContent=streak
    ?"Cadena activa. Mantenerla cuenta más que hacerlo perfecto."
    :"Registra tu primer entreno y empieza la cadena.";
}

function renderMuscleMap() {
  const active=new Set(state.session.map(item=>getExercise(item.exerciseId)?.muscle));
  document.querySelectorAll(".muscle").forEach(p=>p.classList.remove("hot"));
  if (active.has("Pecho"))   document.querySelectorAll(".chest").forEach(p=>p.classList.add("hot"));
  if (active.has("Hombro"))  document.querySelectorAll(".shoulders").forEach(p=>p.classList.add("hot"));
  if (active.has("Pierna"))  document.querySelectorAll(".legs").forEach(p=>p.classList.add("hot"));
}

function updateMetrics() {
  const {sets,volume}=sessionStats();
  els.metricVolume.textContent=`${Math.round(volume).toLocaleString("es-ES")} kg`;
  els.metricSets.textContent=sets;
  els.metricTime.textContent=`${Math.max(20,state.session.reduce((s,i)=>s+i.sets.length,0)*4)} min`;
  els.metricGoal.textContent=todayPlan().name;
}

// ── Acciones ──────────────────────────────────────────────
function queueExercise(id) {
  if (!state.session.some(item=>item.exerciseId===id))
    state.session.push({ exerciseId:id, sets:[] });
  saveState(); render();
}

function removeFromSession(ei) {
  state.session.splice(ei,1);
  saveState(); renderSession(); renderMuscleMap(); updateMetrics();
}

function addSet(ei) {
  const prev=state.session[ei].sets.slice(-1)[0];
  state.session[ei].sets.push({
    reps:   prev ? prev.reps   : 0,
    weight: prev ? prev.weight : 0,
    done:   false,
  });
  saveState(); renderSession();
  setTimeout(()=>{
    const cards=els.exerciseList.querySelectorAll(".exercise-card");
    cards[ei]?.querySelector("tbody tr:last-child input[data-field='reps']")?.focus();
  },50);
}

function removeSet(ei,si) {
  state.session[ei].sets.splice(si,1);
  saveState(); renderSession(); updateMetrics();
}

function removePlanExercise(di,id) {
  state.week[di].exercises=state.week[di].exercises.filter(e=>e!==id);
  saveState(); renderWeek();
}

function deleteExercise(id) {
  const ex=getExercise(id);
  if (!confirm(`¿Eliminar "${ex?.name}" del catálogo?`)) return;
  state.exercises=state.exercises.filter(e=>e.id!==id);
  state.session=state.session.filter(item=>item.exerciseId!==id);
  state.week.forEach(d=>{ d.exercises=d.exercises.filter(e=>e!==id); });
  saveState(); render();
}

function finishWorkout() {
  const {sets,volume}=sessionStats();
  if (!sets) { alert("Marca al menos una serie antes de cerrar el entreno."); return; }
  const records=[];
  state.session.forEach(item=>{
    const ex=getExercise(item.exerciseId); if (!ex) return;
    item.sets.filter(s=>s.done).sort((a,b)=>b.weight-a.weight).slice(0,1)
      .forEach(s=>records.push({exercise:ex.name,weight:+s.weight,reps:+s.reps}));
  });
  const today=dateKey();
  const log={date:today,volume,sets,focus:todayPlan().name,records};
  const idx=state.logs.findIndex(l=>l.date===today);
  if (idx>=0) state.logs[idx]=log; else state.logs.push(log);
  state.session=state.session.map(item=>({
    ...item, sets:item.sets.map(s=>({reps:s.reps,weight:s.weight,done:false}))
  }));
  saveState(); render();
}

// ── Timer ─────────────────────────────────────────────────
function resetTimer() {
  clearInterval(timer.interval); timer.interval=null;
  timer.total=timer.remaining=+els.timerPreset.value;
  $("timerStart").textContent="Iniciar";
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const m=String(Math.floor(timer.remaining/60)).padStart(2,"0");
  const s=String(timer.remaining%60).padStart(2,"0");
  els.timerDisplay.textContent=`${m}:${s}`;
  els.timerRing.style.strokeDashoffset=String(364-364*(timer.remaining/timer.total));
}

function startTimer() {
  if (timer.interval) {
    clearInterval(timer.interval); timer.interval=null;
    $("timerStart").textContent="Continuar"; return;
  }
  $("timerStart").textContent="Pausar";
  timer.interval=setInterval(()=>{
    if (--timer.remaining<=0) { resetTimer(); els.timerDisplay.textContent="¡Listo!"; return; }
    updateTimerDisplay();
  },1000);
}

function switchView(view) {
  activeView=view;
  const titles={today:"Entreno de hoy",plan:"Plan semanal",library:"Ejercicios",progress:"Progreso"};
  $("viewTitle").textContent=titles[view];
  document.querySelectorAll(".view").forEach(s=>s.classList.remove("active"));
  $(`${view}View`).classList.add("active");
  document.querySelectorAll(".nav-tab").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  if (view==="progress") requestAnimationFrame(drawChart);
}

// ── Eventos ───────────────────────────────────────────────
document.addEventListener("click", e => {
  const btn=e.target.closest("button");
  if (!btn) return;

  if (btn.classList.contains("nav-tab"))   return switchView(btn.dataset.view);
  if (btn.id==="finishWorkoutBtn")          return finishWorkout();
  if (btn.id==="timerStart")                return startTimer();
  if (btn.id==="timerReset")                return resetTimer();
  if (btn.id==="planDialogClose")           return els.planDialog.close();
  if (btn.id==="resetWeekBtn") {
    if (!confirm("¿Restaurar el plan semanal por defecto?")) return;
    state.week=structuredClone(DEFAULT_WEEK); saveState(); render(); return;
  }
  if (btn.id==="exportBtn") {
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:`forja-gym-${dateKey()}.json`});
    a.click(); URL.revokeObjectURL(a.href); return;
  }

  const a=btn.dataset.action;
  if (a==="add-set")              return addSet(+btn.dataset.ei);
  if (a==="remove-set")           return removeSet(+btn.dataset.ei,+btn.dataset.si);
  if (a==="remove-exercise")      return removeFromSession(+btn.dataset.ei);
  if (a==="queue-exercise")       return queueExercise(btn.dataset.id);
  if (a==="delete-exercise")      return deleteExercise(btn.dataset.id);
  if (a==="open-plan-picker")     return openPlanPicker(+btn.dataset.di);
  if (a==="toggle-plan-exercise") return togglePlanExercise(btn.dataset.id);
  if (a==="remove-plan-exercise") return removePlanExercise(+btn.dataset.di, btn.dataset.id);
});

document.addEventListener("input", e => {
  const t=e.target;
  if (t.dataset.field) {
    const set=state.session[+t.dataset.ei]?.sets[+t.dataset.si]; if (!set) return;
    set[t.dataset.field]=+t.value;
    saveState(); updateMetrics(); renderProgress();
  }
  if (t.dataset.action==="rename-day") {
    state.week[+t.dataset.di].name=t.value; saveState();
  }
});

document.addEventListener("change", e => {
  const t=e.target;
  if (t.dataset.action==="toggle-set") {
    const set=state.session[+t.dataset.ei]?.sets[+t.dataset.si]; if (!set) return;
    set.done=t.checked; saveState(); renderSession(); updateMetrics(); renderMuscleMap();
  }
  if (t.id==="timerPreset")  resetTimer();
  if (t.id==="energyRange")  { state.energy=+t.value; saveState(); render(); }
});

els.muscleFilters.addEventListener("click", e => {
  const chip=e.target.closest("[data-filter]");
  if (chip) { activeFilter=chip.dataset.filter; renderLibrary(); }
});

$("newExerciseForm").addEventListener("submit", e => {
  e.preventDefault();
  const name=$("newExerciseName").value.trim();
  const muscle=$("newExerciseMuscle").value;
  if (!name) return;
  state.exercises.push({ id:`${slugify(name)}-${Date.now().toString(36)}`, name, muscle, hint:"3×10" });
  e.currentTarget.reset();
  saveState(); render();
});

resetTimer();
render();

if ("serviceWorker" in navigator)
  window.addEventListener("load", ()=>
    navigator.serviceWorker.register("./service-worker.js").catch(()=>{})
  );
