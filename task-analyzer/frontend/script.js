/* script.js — Pro integrated frontend
 - Handles: list view with analyze, kanban, calendar (FullCalendar), gantt (frappe), graph (D3), dashboard (Chart.js)
 - Voice input, natural-language parse, search & filters, weight sliders, local feedback learning
*/

///// State /////
let tasks = []; // in-memory list of tasks (id,title,due_date,estimated_hours,importance,dependencies,status)
let customWeights = null;
const STORAGE_KEY = 'taskai_v1';
const FEEDBACK_KEY = 'taskai_feedback';

// load persisted
try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); if(saved && saved.tasks) tasks = saved.tasks; } catch(e){ tasks = tasks || [] }

// dom refs
const el = id => document.getElementById(id);
const taskList = el('task-list');
const analyzeBtn = el('analyze');
const strategySel = el('strategy');
const applyWeightsBtn = el('apply-weights');
const learnBtn = el('learn-preferences');
const exportBtn = el('export-csv');
const alertsEl = el('alerts');
const searchEl = el('search');
const filterImportance = el('filter-importance');
const filterEffort = el('filter-effort');

// navigation
const setActiveView = (name) => {
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const elv = document.getElementById('view-' + name);
  if(elv) elv.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(btn=>btn.classList.remove('active'));
  const navBtn = {list:'nav-list',kanban:'nav-kanban',calendar:'nav-calendar',gantt:'nav-gantt',graph:'nav-graph',dashboard:'nav-dashboard'}[name];
  if(navBtn) document.getElementById(navBtn).classList.add('active');
}
document.getElementById('nav-list').onclick = ()=>{ setActiveView('list') }
document.getElementById('nav-kanban').onclick = ()=>{ setActiveView('kanban'); renderKanban(); }
document.getElementById('nav-calendar').onclick = ()=>{ setActiveView('calendar'); renderCalendar(); }
document.getElementById('nav-gantt').onclick = ()=>{ setActiveView('gantt'); renderGantt(); }
document.getElementById('nav-graph').onclick = ()=>{ setActiveView('graph'); renderGraph(); }
document.getElementById('nav-dashboard').onclick = ()=>{ setActiveView('dashboard'); renderDashboard(); }

///// UTILITIES /////
const uid = () => String(Date.now()) + Math.random().toString(36).slice(2,6);
const saveState = ()=> localStorage.setItem(STORAGE_KEY, JSON.stringify({tasks}));
const formatDate = d => d ? (new Date(d)).toISOString().slice(0,10) : 'No due';
const parseFloatSafe = v => (v===null||v===undefined||v==='')?null:parseFloat(v);

///// NATURAL LANGUAGE PARSER (simple rule-based) /////
function parseNaturalInput(text){
  // Patterns: tomorrow, in 2 hours, in 3 days, importance 9, 3h, 2 hours, due 2025-11-30
  const res = {title:text, due_date:null, estimated_hours:null, importance:null};
  // dates: YYYY-MM-DD
  const dateMatch = text.match(/(\\d{4}-\\d{2}-\\d{2})/);
  if(dateMatch) res.due_date = dateMatch[1];

  // tomorrow / today / in N days
  if(/\\btomorrow\\b/i.test(text)) { const d = new Date(); d.setDate(d.getDate()+1); res.due_date = d.toISOString().slice(0,10) }
  if(/\\btoday\\b/i.test(text)) { res.due_date = new Date().toISOString().slice(0,10) }
  const inDays = text.match(/in (\\d+) days?/i);
  if(inDays){ const d=new Date(); d.setDate(d.getDate()+parseInt(inDays[1])); res.due_date = d.toISOString().slice(0,10) }

  // hours: "3h" or "3 hours"
  const hours = text.match(/(\\d+(?:\\.\\d+)?)\\s*(h|hours?)/i) || text.match(/(\\d+(?:\\.\\d+)?)h\\b/i);
  if(hours) res.estimated_hours = parseFloat(hours[1]);

  // importance
  const imp = text.match(/importance\\s*(\\d+)/i) || text.match(/imp\\s*(\\d+)/i);
  if(imp) res.importance = Math.max(1, Math.min(10, parseInt(imp[1])));

  return res;
}

///// VOICE INPUT /////
const voiceBtn = el('voice');
if(window.SpeechRecognition || window.webkitSpeechRecognition){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.continuous = false; rec.lang = 'en-US';
  voiceBtn.onclick = ()=> {
    rec.start();
    voiceBtn.classList.add('listening');
    rec.onresult = (e)=> {
      const spoken = e.results[0][0].transcript;
      document.getElementById('nl').value = spoken;
      voiceBtn.classList.remove('listening');
    };
    rec.onerror = ()=> voiceBtn.classList.remove('listening');
  }
} else {
  voiceBtn.title = 'Speech not supported in this browser';
}

///// FORM & ADD TASK /////
const form = document.querySelector('#task-form');
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const fd = new FormData(form);
  const t = {
    id: uid(),
    title: fd.get('title'),
    due_date: fd.get('due_date') || null,
    estimated_hours: parseFloatSafe(fd.get('estimated_hours')),
    importance: parseFloatSafe(fd.get('importance')) || 5,
    dependencies: fd.get('dependencies') ? fd.get('dependencies').split(',').map(s=>s.trim()).filter(Boolean):[],
    status: 'backlog'
  };
  tasks.push(t); saveState(); renderLocalTasks();
  form.reset();
});

el('pt-parse').onclick = ()=>{
  const val = el('nl').value.trim();
  if(!val) return;
  const p = parseNaturalInput(val);
  // prefill quick
  form.title.value = p.title;
  form.due_date.value = p.due_date || '';
  form.estimated_hours.value = p.estimated_hours || '';
  form.importance.value = p.importance || '';
}

///// RENDER LIST /////
function renderLocalTasks(list = tasks){
  taskList.innerHTML = '';
  // apply search + filters
  const q = (searchEl.value||'').toLowerCase().trim();
  let filtered = (list||tasks).filter(t=>{
    if(q && !(t.title||'').toLowerCase().includes(q)) return false;
    if(filterImportance.value === 'high' && (t.importance||0) < 7) return false;
    if(filterImportance.value === 'mid' && ((t.importance||0) < 4 || (t.importance||0) > 6)) return false;
    if(filterImportance.value === 'low' && (t.importance||0) > 3) return false;
    if(filterEffort.value === 'quick' && (t.estimated_hours||999) > 1) return false;
    if(filterEffort.value === 'small' && (t.estimated_hours||999) > 4) return false;
    if(filterEffort.value === 'long' && (t.estimated_hours||0) <= 4) return false;
    return true;
  });

  filtered.forEach(t=>{
    const li = document.createElement('li'); li.className='task-card';
    const score = t.score||0;
    const pillClass = score >= 70 ? 'high-pill' : score >= 40 ? 'med-pill' : 'low-pill';
    li.innerHTML = `<div class="priority-pill ${pillClass}">${Math.round(score||0)}</div>
      <h4>${t.title}</h4>
      <div class="task-meta">${formatDate(t.due_date)} • ${t.estimated_hours||'n/a'}h • importance ${t.importance}</div>
      <div class="task-explain" style="margin-top:8px">${(t.explanation||[]).slice(0,3).join(' • ')}</div>
      <div style="margin-top:10px" class="actions">
        <button class="btn small btn-help" data-id="${t.id}">Helpful</button>
        <button class="btn small ghost btn-done" data-id="${t.id}">Done</button>
      </div>`;
    taskList.appendChild(li);
  });

  // attach listeners
  document.querySelectorAll('.btn-help').forEach(b=> b.onclick = (e)=>{
    const id = e.target.dataset.id; pushFeedback(id, 'helpful'); e.target.textContent = 'Thanks ✓';
  });
  document.querySelectorAll('.btn-done').forEach(b=> b.onclick = (e)=>{
    const id = e.target.dataset.id; markDone(id);
  });
}

function markDone(id){
  const t = tasks.find(x=>x.id===id);
  if(t) { t.status='done'; saveState(); renderLocalTasks(); alert('Marked done') }
}

///// FEEDBACK & SIMPLE LEARNING (local heuristic) /////
function pushFeedback(taskId, label){
  const fb = JSON.parse(localStorage.getItem(FEEDBACK_KEY)||'{}');
  fb[taskId] = fb[taskId] || {helpful:0,done:0};
  if(label==='helpful') fb[taskId].helpful += 1;
  if(label==='done') fb[taskId].done += 1;
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(fb));
}

// when user clicks learned preferences -> update customWeights based on feedback:
// heuristic: if user marked many helpful tasks that are low-effort => increase effort weight, etc.
learnBtn.onclick = ()=>{
  const fb = JSON.parse(localStorage.getItem(FEEDBACK_KEY)||'{}');
  // aggregate
  let sumHelpful=0, sumHighImp=0, sumQuick=0, sumBlocked=0;
  for(const tid in fb){
    sumHelpful += fb[tid].helpful;
    const t = tasks.find(x=>x.id===tid);
    if(!t) continue;
    if((t.importance||0) >= 7) sumHighImp += fb[tid].helpful;
    if((t.estimated_hours||9) <= 1) sumQuick += fb[tid].helpful;
    if((t.dependencies||[]).length > 0) sumBlocked += fb[tid].helpful;
  }
  // base weights
  let w_u= parseFloat(el('w_u').value), w_i=parseFloat(el('w_i').value), w_e=parseFloat(el('w_e').value), w_d=parseFloat(el('w_d').value);
  // adjust
  if(sumHighImp > sumQuick) { w_i += 0.1 }
  if(sumQuick > sumHighImp) { w_e += 0.12 }
  if(sumBlocked > 0) { w_d += 0.08 }
  // normalize
  const s = w_u + w_i + w_e + w_d;
  customWeights = { w_u: w_u/s, w_i: w_i/s, w_e: w_e/s, w_d: w_d/s };
  // persist to sliders
  el('w_u').value = customWeights.w_u; el('w_i').value = customWeights.w_i; el('w_e').value = customWeights.w_e; el('w_d').value = customWeights.w_d;
  alertsEl.textContent = 'Preferences learned (local)';
}

///// APPLY WEIGHTS (UI) /////
applyWeightsBtn.onclick = ()=>{
  const w_u = parseFloat(el('w_u').value), w_i=parseFloat(el('w_i').value), w_e=parseFloat(el('w_e').value), w_d=parseFloat(el('w_d').value);
  const s = w_u + w_i + w_e + w_d || 1;
  customWeights = { w_u: w_u/s, w_i: w_i/s, w_e: w_e/s, w_d: w_d/s };
  alertsEl.textContent = 'Custom weights applied';
}

///// ANALYZE (call backend) /////
analyzeBtn.onclick = async ()=>{
  if(tasks.length === 0) { alert('No tasks to analyze'); return; }
  // call backend with tasks (use minimal fields)
  const payload = { tasks, weights: customWeights };
  try{
    const res = await fetch('/api/tasks/analyze/?strategy='+encodeURIComponent(strategySel.value), { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const data = await res.json();
    if(!res.ok){ alert('Analyze error: '+JSON.stringify(data)); return; }
    // update tasks with score/explanations
    data.tasks.forEach( t => {
      const local = tasks.find(x=> (x.id===t.id) || (x.title===t.title));
      if(local){
        local.score = t.score; local.explanation = t.explanation;
      }
    });
    renderLocalTasks();
    // show alerts & cycles
    alertsEl.textContent = (data.cycles && data.cycles.length) ? 'Circular deps found: '+ JSON.stringify(data.cycles) : '';
  }catch(err){ alert('Network error: '+err.message) }
}

///// EXPORT CSV /////
exportBtn.onclick = async ()=>{
  try{
    const res = await fetch('/api/tasks/export/?format=csv', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({tasks})});
    if(!res.ok) { const txt = await res.text(); alert('Export error: '+txt); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'tasks.csv'; document.body.appendChild(a); a.click(); a.remove();
  }catch(e){ alert('Export failed: '+e.message) }
}

///// KANBAN /////
function renderKanban(){
  ['backlog','inprogress','review','done'].forEach(c=>{
    const box = el('col-'+c);
    box.innerHTML = '';
    tasks.filter(t=> (t.status||'backlog') === c).forEach(t => {
      const card = document.createElement('div'); card.className='card'; card.draggable = true; card.dataset.id = t.id;
      card.innerHTML = `<strong>${t.title}</strong><div class="meta">${formatDate(t.due_date)} • ${t.estimated_hours||'n/a'}h</div>`;
      box.appendChild(card);
      card.addEventListener('dragstart', (e)=> e.dataTransfer.setData('text/plain', t.id) );
    });
    // drop events
    box.ondragover = (e)=> e.preventDefault();
    box.ondrop = (e)=> {
      const id = e.dataTransfer.getData('text/plain'); const t = tasks.find(x=>x.id===id);
      if(t){ t.status = c; saveState(); renderKanban(); }
    }
  });
}

///// CALENDAR (FullCalendar) /////
let calendarInstance = null;
function renderCalendar(){
  if(calendarInstance) return; // init once
  const calendarEl = document.getElementById('calendar');
  calendarInstance = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    height: 600,
    editable: true,
    events: tasks.filter(t=>t.due_date).map(t=>({ id: t.id, title:t.title, start:t.due_date })),
    eventDrop: function(info){
      const id = info.event.id; const t = tasks.find(x=>x.id===id);
      if(t){ t.due_date = info.event.startStr; saveState(); renderLocalTasks(); }
    }
  });
  calendarInstance.render();
}

///// GANTT (frappe-gantt simple) /////
function renderGantt(){
  const ganttEl = document.getElementById('gantt');
  // simple mapping: tasks with due_date become single-day tasks
  const gTasks = tasks.filter(t=>t.due_date).map((t,idx)=>({
    id: t.id,
    name: t.title,
    start: t.due_date,
    end: t.due_date,
    progress: 0
  }));
  ganttEl.innerHTML = '';
  if(gTasks.length === 0){ ganttEl.innerHTML = '<div style="padding:20px;color:var(--muted)">No dated tasks to show</div>'; return; }
  new Gantt("#gantt", gTasks, { view_mode: 'Day' });
}

///// GRAPH (D3) /////
function renderGraph(){
  const container = document.getElementById('graph'); container.innerHTML = '';
  const nodes = tasks.map(t=>({id:t.id,title:t.title}));
  const links = [];
  tasks.forEach(t=> (t.dependencies||[]).forEach(d=> links.push({source:t.id, target:d})));
  const width = container.clientWidth || 800; const height = 420;
  const svg = d3.select(container).append('svg').attr('width',width).attr('height',height);
  const sim = d3.forceSimulation(nodes).force('link', d3.forceLink(links).id(d=>d.id).distance(120)).force('charge', d3.forceManyBody().strength(-300)).force('center', d3.forceCenter(width/2,height/2));
  const link = svg.append('g').selectAll('line').data(links).enter().append('line').attr('stroke','#aaa');
  const node = svg.append('g').selectAll('g').data(nodes).enter().append('g');
  node.append('circle').attr('r',16).attr('fill','#fff').attr('stroke', 'url(#grad)');
  node.append('text').text(d=>d.title).attr('x',20).attr('y',5);
  sim.on('tick', ()=>{ link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y); node.attr('transform',d=>`translate(${d.x},${d.y})`) });
}

///// DASHBOARD (Chart.js) /////
function renderDashboard(){
  const pieCtx = document.getElementById('chart-pie').getContext('2d');
  const barCtx = document.getElementById('chart-bar').getContext('2d');
  // generate data
  const byPriority = {high:0,med:0,low:0};
  tasks.forEach(t=> { const s = t.score||0; if(s>=70) byPriority.high++; else if(s>=40) byPriority.med++; else byPriority.low++; });
  // pie
  new Chart(pieCtx, { type:'pie', data:{labels:['High','Medium','Low'], datasets:[{ data:[byPriority.high,byPriority.med,byPriority.low], backgroundColor:['#ff6b6b','#ffd166','#6bff95'] }] }});
  // bar: urgency buckets (due soon / due later / no due)
  const dueSoon = tasks.filter(t=> t.due_date && (new Date(t.due_date) - new Date())/86400000 <= 3).length;
  const dueLater = tasks.filter(t=> t.due_date && (new Date(t.due_date) - new Date())/86400000 > 3).length;
  const noDue = tasks.filter(t=> !t.due_date).length;
  new Chart(barCtx, { type:'bar', data:{ labels:['Due soon','Due later','No due'], datasets:[{ data:[dueSoon,dueLater,noDue], backgroundColor:['#ff6b6b','#7C3AED','#00E5A8'] }] }});
  // insights
  const ins = el('insights');
  ins.innerHTML = `<h3>Insights</h3><p>${tasks.length} tasks • ${dueSoon} due within 3 days • ${noDue} without dates</p>`;
}

///// Search + Filters handlers /////
searchEl.oninput = ()=> renderLocalTasks();
filterImportance.onchange = ()=> renderLocalTasks();
filterEffort.onchange = ()=> renderLocalTasks();

///// init demo + render /////
if(tasks.length === 0){
  tasks = [
    { id: '1', title: 'Fix login bug', due_date: '2025-11-30', estimated_hours: 3, importance: 8, dependencies: [], status:'backlog' },
    { id: '2', title: 'Write README', due_date: null, estimated_hours: 1, importance: 6, dependencies: ['1'], status:'backlog' }
  ];
}
renderLocalTasks();

///// theme toggle /////
document.getElementById('toggle-theme').onclick = ()=>{
  const body = document.body;
  body.dataset.theme = body.dataset.theme === 'dark' ? 'light' : 'dark';
}
