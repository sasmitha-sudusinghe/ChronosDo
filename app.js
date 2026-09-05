// --- Helpers ---
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Returns the ISO week key "YYYY-Www" for a date offset by `offset` weeks from today
function getWeekKey(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offset * 7);
    const jan4 = new Date(d.getFullYear(), 0, 4);
    const week = Math.ceil(((d - jan4) / 86400000 + jan4.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

// Returns the Monday of the week for a given offset
function getMondayOfWeek(offset = 0) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0=Sun
    const diffToMon = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diffToMon + offset * 7);
    return d;
}

function formatWeekLabel(offset) {
    const mon = getMondayOfWeek(offset);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const fmt = d => `${months[d.getMonth()]} ${d.getDate()}`;
    return `${fmt(mon)} – ${fmt(sun)}`;
}

// Returns the actual date for a given day column (e.g. "Monday") in the current offset week
function getDateForDay(dayIndex, offset) {
    const mon = getMondayOfWeek(offset);
    const d = new Date(mon);
    d.setDate(mon.getDate() + dayIndex);
    return d;
}


// --- State Management ---
const DEFAULT_WEEK_BOARD = () =>
    Object.fromEntries(daysOfWeek.map(d => [d, []]));

let state = JSON.parse(localStorage.getItem('chronosdo_task_state')) || { weeks: {}, reflection: '' };
if (!state.weeks) state.weeks = {};

let weekOffset = 0; // 0 = current week, -1 = last week, +1 = next week

function getWeekBoard() {
    const key = getWeekKey(weekOffset);
    if (!state.weeks[key]) state.weeks[key] = DEFAULT_WEEK_BOARD();
    return state.weeks[key];
}

const saveState = () => {
    localStorage.setItem('chronosdo_task_state', JSON.stringify(state));
};


// --- Live Clock ---
function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()} ${now.getFullYear()}`;

    const clockEl = document.getElementById('tkLiveClock');
    const dateEl  = document.getElementById('tkLiveDate');
    if (clockEl) clockEl.textContent = `${hh}:${mm}:${ss}`;
    if (dateEl)  dateEl.textContent  = dateStr;
}


// --- Quote Handling ---
const quotes = [
    "NO SHIFTING. NO LYING. DO THE WORK.",
    "THE CALENDAR DOES NOT FORGET.",
    "REPLACE MOTIVATION WITH STRUCTURE.",
    "DISCIPLINE EQUALS FREEDOM.",
    "EVERY DAY IS A BRICK IN THE WALL."
];
function updateQuote() {
    const banner = document.getElementById('quoteBanner');
    if (banner) banner.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}


// --- TASK TRACKER LOGIC ---

const tkColumnsContainer = document.getElementById('tkColumnsContainer');
const tkRingsContainer   = document.getElementById('tkRingsContainer');
const tkReflection       = document.getElementById('tkReflection');
let tkWeeklyChart = null;
let tkRingCharts  = [];

function initTaskCharts() {
    Chart.defaults.font.family = "'DM Sans', sans-serif";
    Chart.defaults.color = '#3b5a3b';

    const ctxWeekly = document.getElementById('tkWeeklyChart').getContext('2d');
    tkWeeklyChart = new Chart(ctxWeekly, {
        type: 'bar',
        data: {
            labels: daysOfWeek.map(d => d.substring(0, 3)),
            datasets: [{ data: [], backgroundColor: '#8bbd8b', borderRadius: 4 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, suggestedMax: 10 } }
        }
    });
}

function renderTaskTracker() {
    const board = getWeekBoard();

    // Update week label
    document.getElementById('tkWeekLabel').textContent = formatWeekLabel(weekOffset);

    tkColumnsContainer.innerHTML = '';
    tkRingsContainer.innerHTML   = '';
    tkRingCharts.forEach(c => c.destroy());
    tkRingCharts = [];

    let totalTasks = 0, completedTasks = 0;
    const dailyData = [];

    daysOfWeek.forEach((day, dayIndex) => {
        const tasks       = board[day] || [];
        const dayTotal    = tasks.length;
        const dayCompleted = tasks.filter(t => t.completed).length;
        totalTasks    += dayTotal;
        completedTasks += dayCompleted;
        dailyData.push(dayCompleted);

        const rate = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;

        // Actual calendar date for this column
        const colDate = getDateForDay(dayIndex, weekOffset);
        const months  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const dateLabel = `${months[colDate.getMonth()]} ${colDate.getDate()}`;

        // Highlight today
        const today = new Date();
        const isToday = colDate.toDateString() === today.toDateString();
        const headerExtra = isToday ? 'ring-2 ring-white ring-inset' : '';

        // Render Column
        const colDiv = document.createElement('div');
        colDiv.className = `border-2 border-green-border rounded flex flex-col h-[400px] overflow-hidden${isToday ? ' shadow-lg' : ''}`;

        let html = `
            <div class="bg-green-header text-white text-center py-1 font-bold text-sm border-b-2 border-green-border uppercase tracking-widest ${headerExtra}">
                <div>${day}</div>
                <div class="text-[10px] font-normal opacity-80">${dateLabel}</div>
            </div>
            <div class="flex-1 overflow-y-auto bg-white p-2 space-y-2">
        `;

        tasks.forEach(task => {
            html += `
                <div class="flex items-start gap-2 group p-1 hover:bg-green-light rounded border border-transparent hover:border-green-200 transition-colors">
                    <button onclick="deleteTask('${day}', '${task.id}')" class="opacity-0 group-hover:opacity-100 text-red-500 shrink-0 mt-0.5"><i data-lucide="x" class="w-3 h-3"></i></button>
                    <div class="flex-1 text-xs font-medium ${task.completed ? 'line-through text-gray-400' : 'text-green-text'}" contenteditable="true" onblur="editTask('${day}', '${task.id}', this.textContent)">${task.title}</div>
                    <input type="checkbox" class="tk-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${day}', '${task.id}')">
                </div>
            `;
        });

        html += `
            </div>
            <div class="p-2 border-t border-green-border bg-green-light">
                <input type="text" placeholder="Add task..." class="w-full bg-transparent outline-none text-xs text-green-text font-medium" onkeypress="handleTaskInput(event, '${day}', this)">
            </div>
        `;
        colDiv.innerHTML = html;
        tkColumnsContainer.appendChild(colDiv);

        // Render Ring
        const ringDiv = document.createElement('div');
        ringDiv.className = 'flex flex-col items-center justify-center p-2';
        ringDiv.innerHTML = `
            <div class="relative w-16 h-16">
                <canvas id="ring-${day}"></canvas>
                <div class="absolute inset-0 flex items-center justify-center font-bold text-sm text-green-text">${rate}%</div>
            </div>
            <div class="text-[10px] font-bold uppercase mt-1 text-green-text">${day.substring(0, 3)}</div>
            <div class="text-[9px] text-green-text opacity-60">${dateLabel}</div>
        `;
        tkRingsContainer.appendChild(ringDiv);

        const ctxRing = document.getElementById(`ring-${day}`).getContext('2d');
        tkRingCharts.push(new Chart(ctxRing, {
            type: 'doughnut',
            data: { datasets: [{ data: [rate, 100 - rate], backgroundColor: ['#78a678', '#e8f0e8'], borderWidth: 0 }] },
            options: { cutout: '75%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
        }));
    });

    lucide.createIcons();

    const weeklyRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    document.getElementById('tkWeeklyRateText').textContent = weeklyRate + '%';
    document.getElementById('tkWeeklyRateBar').style.width  = weeklyRate + '%';

    if (tkWeeklyChart) {
        tkWeeklyChart.data.datasets[0].data = dailyData;
        tkWeeklyChart.update();
    }

    if (tkReflection) tkReflection.value = state.reflection || '';
}

if (tkReflection) {
    tkReflection.addEventListener('input', () => {
        state.reflection = tkReflection.value;
        saveState();
    });
}

// Week navigation
document.getElementById('tkPrevWeek').addEventListener('click', () => { weekOffset--; renderTaskTracker(); });
document.getElementById('tkNextWeek').addEventListener('click', () => { weekOffset++; renderTaskTracker(); });

window.handleTaskInput = (e, day, input) => {
    if (e.key === 'Enter' && input.value.trim()) {
        const board = getWeekBoard();
        if (!board[day]) board[day] = [];
        board[day].push({ id: Date.now().toString(), title: input.value.trim(), completed: false });
        saveState();
        renderTaskTracker();
    }
};
window.editTask = (day, id, newTitle) => {
    const board = getWeekBoard();
    const t = board[day].find(x => x.id === id);
    if (t && newTitle.trim() !== '') { t.title = newTitle.trim(); saveState(); }
    renderTaskTracker();
};
window.deleteTask = (day, id) => {
    const board = getWeekBoard();
    board[day] = board[day].filter(x => x.id !== id);
    saveState();
    renderTaskTracker();
};
window.toggleTask = (day, id) => {
    const board = getWeekBoard();
    const t = board[day].find(x => x.id === id);
    if (t) { t.completed = !t.completed; saveState(); }
    renderTaskTracker();
};

// --- Boot ---
document.addEventListener('DOMContentLoaded', () => {
    updateQuote();
    setInterval(updateQuote, 5 * 60 * 1000);

    updateClock();
    setInterval(updateClock, 1000);

    initTaskCharts();
    renderTaskTracker();
});

