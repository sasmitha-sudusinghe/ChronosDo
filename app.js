// --- State Management ---
const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const DEFAULT_STATE = {
    view: 'habit', // 'habit' or 'task'
    habits: [
        { id: 'h1', name: 'Wake up at 6AM' },
        { id: 'h2', name: 'Meditation' },
        { id: 'h3', name: 'Read 10 pages' },
        { id: 'h4', name: 'Workout' }
    ],
    habitHistory: {},
    taskBoard: {
        'Monday': [ { id: 't1', title: 'Plan week', completed: true } ],
        'Tuesday': [ { id: 't2', title: 'Deep work', completed: false } ],
        'Wednesday': [],
        'Thursday': [],
        'Friday': [],
        'Saturday': [],
        'Sunday': []
    },
    reflection: ''
};

let state = JSON.parse(localStorage.getItem('chronosdo_mf2_state')) || DEFAULT_STATE;
if (!state.taskBoard) state.taskBoard = DEFAULT_STATE.taskBoard;

const saveState = () => {
    localStorage.setItem('chronosdo_mf2_state', JSON.stringify(state));
};

// --- View Toggling ---
const appBody = document.getElementById('appBody');
const btnHabitView = document.getElementById('btnHabitView');
const btnTaskView = document.getElementById('btnTaskView');
const habitView = document.getElementById('habitView');
const taskView = document.getElementById('taskView');

function switchView(view) {
    state.view = view;
    saveState();
    
    if (view === 'habit') {
        habitView.classList.remove('hidden');
        taskView.classList.add('hidden');
        
        appBody.classList.remove('bg-green-bg');
        appBody.classList.add('bg-beige-bg');
        
        btnHabitView.classList.replace('bg-white', 'bg-beige-card');
        btnHabitView.classList.replace('text-gray-500', 'text-beige-text');
        
        btnTaskView.classList.replace('bg-green-header', 'bg-white');
        btnTaskView.classList.replace('text-white', 'text-gray-500');
        
        renderHabitTracker();
    } else {
        habitView.classList.add('hidden');
        taskView.classList.remove('hidden');
        
        appBody.classList.remove('bg-beige-bg');
        appBody.classList.add('bg-green-bg');
        
        btnTaskView.classList.replace('bg-white', 'bg-green-header');
        btnTaskView.classList.replace('text-gray-500', 'text-white');
        
        btnHabitView.classList.replace('bg-beige-card', 'bg-white');
        btnHabitView.classList.replace('text-beige-text', 'text-gray-500');
        
        renderTaskTracker();
    }
}

btnHabitView.addEventListener('click', () => switchView('habit'));
btnTaskView.addEventListener('click', () => switchView('task'));


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
    if (banner) {
        banner.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    }
}


// --- HABIT TRACKER LOGIC ---

// Get last 31 days
function getRolling31Days() {
    const days = [];
    const d = new Date();
    for (let i = 30; i >= 0; i--) {
        const temp = new Date(d);
        temp.setDate(d.getDate() - i);
        const dateStr = `${temp.getFullYear()}-${String(temp.getMonth() + 1).padStart(2, '0')}-${String(temp.getDate()).padStart(2, '0')}`;
        days.push({ dateStr, label: temp.getDate() });
    }
    return days;
}

const hbGridHeader = document.getElementById('hbGridHeader');
const hbGridBody = document.getElementById('hbGridBody');
const newHabitInput = document.getElementById('newHabitInput');
const hbKpiList = document.getElementById('hbKpiList');

let hbCharts = {};

function initHabitCharts() {
    Chart.defaults.font.family = "'JetBrains Mono', monospace";
    Chart.defaults.color = '#7a7065';
    
    // Daily Bar
    const ctxDaily = document.getElementById('hbDailyChart').getContext('2d');
    hbCharts.daily = new Chart(ctxDaily, {
        type: 'bar',
        data: { labels: [], datasets: [{ data: [], backgroundColor: '#7a7065' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false, max: 100 } } }
    });

    // Weekly Bar
    const ctxWeekly = document.getElementById('hbWeeklyChart').getContext('2d');
    hbCharts.weekly = new Chart(ctxWeekly, {
        type: 'bar',
        data: { labels: ['W1', 'W2', 'W3', 'W4'], datasets: [{ data: [0,0,0,0], backgroundColor: '#a39c94' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false, max: 100 } } }
    });

    // Overall Donut
    const ctxOverall = document.getElementById('hbOverallChart').getContext('2d');
    hbCharts.overall = new Chart(ctxOverall, {
        type: 'doughnut',
        data: { datasets: [{ data: [0, 100], backgroundColor: ['#655a50', 'transparent'], borderColor: '#7a7065', borderWidth: 2 }] },
        options: { cutout: '70%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
    });

    // Line Chart
    const ctxLine = document.getElementById('hbLineChart').getContext('2d');
    hbCharts.line = new Chart(ctxLine, {
        type: 'line',
        data: { labels: [], datasets: [{ data: [], borderColor: '#4a433d', backgroundColor: 'rgba(122, 112, 101, 0.1)', fill: true, tension: 0.3, pointRadius: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: true, max: 100 } } }
    });
}

function renderHabitTracker() {
    const days = getRolling31Days();
    
    // Render Grid Header
    hbGridHeader.innerHTML = '';
    days.forEach((day, i) => {
        const div = document.createElement('div');
        div.className = `p-1 flex items-center justify-center border-r border-beige-border ${i === 30 ? 'bg-[#d5b99a] text-black' : ''}`;
        div.textContent = day.label;
        hbGridHeader.appendChild(div);
    });

    // Render Grid Body
    hbGridBody.innerHTML = '';
    const dailyScores = new Array(31).fill(0);
    let totalScore = 0;
    let totalPossible = state.habits.length * 31;

    state.habits.forEach(habit => {
        const row = document.createElement('div');
        row.className = 'grid grid-cols-[200px_repeat(31,minmax(24px,1fr))_120px] border-b border-beige-border group hover:bg-[#e0ddd5] transition-colors';
        
        let html = `
            <div class="p-2 border-r-2 border-beige-border flex justify-between items-center bg-[#dfdcd6]">
                <span class="truncate pr-2 font-medium" contenteditable="true" onblur="editHabit('${habit.id}', this.textContent)">${habit.name}</span>
                <button onclick="deleteHabit('${habit.id}')" class="opacity-0 group-hover:opacity-100 text-red-700 p-1"><i data-lucide="trash" class="w-3 h-3"></i></button>
            </div>
            <div class="col-span-31 grid grid-cols-31">
        `;

        let habitCompleted = 0;
        days.forEach((day, index) => {
            const isCompleted = state.habitHistory[day.dateStr] && state.habitHistory[day.dateStr][habit.id];
            if (isCompleted) {
                habitCompleted++;
                dailyScores[index]++;
                totalScore++;
            }
            html += `
                <div class="p-1 border-r border-beige-border flex items-center justify-center">
                    <input type="checkbox" class="hb-checkbox" ${isCompleted ? 'checked' : ''} onchange="toggleHabit('${day.dateStr}', '${habit.id}')">
                </div>
            `;
        });

        const habitRate = state.habits.length > 0 ? Math.round((habitCompleted / 31) * 100) : 0;
        
        html += `
            </div>
            <div class="p-2 border-l-2 border-beige-border flex items-center justify-end font-mono bg-[#dfdcd6] relative">
                <div class="w-full h-full bg-gray-200 absolute top-0 left-0 opacity-30">
                    <div class="h-full bg-[#655a50]" style="width: ${habitRate}%"></div>
                </div>
                <span class="z-10">${habitRate}%</span>
            </div>
        `;
        row.innerHTML = html;
        hbGridBody.appendChild(row);
    });

    lucide.createIcons();

    // Update Charts
    const dailyPercentages = dailyScores.map(score => state.habits.length > 0 ? Math.round((score / state.habits.length) * 100) : 0);
    
    if (hbCharts.daily) {
        hbCharts.daily.data.labels = days.map(d => d.label);
        hbCharts.daily.data.datasets[0].data = dailyPercentages;
        hbCharts.daily.update();
    }

    if (hbCharts.line) {
        hbCharts.line.data.labels = days.map(d => d.label);
        hbCharts.line.data.datasets[0].data = dailyPercentages;
        hbCharts.line.update();
    }

    const overallRate = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    document.getElementById('hbOverallText').textContent = overallRate + '%';
    if (hbCharts.overall) {
        hbCharts.overall.data.datasets[0].data = [overallRate, 100 - overallRate];
        hbCharts.overall.update();
    }

    // Weekly Mock Data (Averaging segments of the 31 days)
    if (hbCharts.weekly) {
        const w1 = dailyPercentages.slice(0, 7).reduce((a,b)=>a+b,0)/7 || 0;
        const w2 = dailyPercentages.slice(7, 14).reduce((a,b)=>a+b,0)/7 || 0;
        const w3 = dailyPercentages.slice(14, 21).reduce((a,b)=>a+b,0)/7 || 0;
        const w4 = dailyPercentages.slice(21, 28).reduce((a,b)=>a+b,0)/7 || 0;
        hbCharts.weekly.data.datasets[0].data = [w1, w2, w3, w4];
        hbCharts.weekly.update();
    }

    // Update KPIs
    hbKpiList.innerHTML = `
        <div class="flex justify-between"><span>TOTAL DAYS</span><span>31</span></div>
        <div class="flex justify-between"><span>TOTAL TASKS</span><span>${totalPossible}</span></div>
        <div class="flex justify-between"><span>COMPLETED</span><span>${totalScore}</span></div>
        <div class="flex justify-between font-bold"><span>SUCCESS %</span><span>${overallRate}%</span></div>
    `;
}

// Habit Interactions
if (newHabitInput) {
    newHabitInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && newHabitInput.value.trim()) {
            state.habits.push({ id: Date.now().toString(), name: newHabitInput.value.trim() });
            saveState();
            renderHabitTracker();
            newHabitInput.value = '';
        }
    });
}
window.editHabit = (id, newName) => {
    const h = state.habits.find(x => x.id === id);
    if(h && newName.trim() !== '') { h.name = newName.trim(); saveState(); }
    renderHabitTracker();
};
window.deleteHabit = (id) => {
    state.habits = state.habits.filter(x => x.id !== id);
    saveState();
    renderHabitTracker();
};
window.toggleHabit = (dateStr, habitId) => {
    if (!state.habitHistory[dateStr]) state.habitHistory[dateStr] = {};
    state.habitHistory[dateStr][habitId] = !state.habitHistory[dateStr][habitId];
    saveState();
    renderHabitTracker();
};


// --- TASK TRACKER LOGIC ---

const tkColumnsContainer = document.getElementById('tkColumnsContainer');
const tkRingsContainer = document.getElementById('tkRingsContainer');
const tkReflection = document.getElementById('tkReflection');
let tkWeeklyChart = null;
let tkRingCharts = [];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function initTaskCharts() {
    Chart.defaults.font.family = "'DM Sans', sans-serif";
    Chart.defaults.color = '#3b5a3b';

    const ctxWeekly = document.getElementById('tkWeeklyChart').getContext('2d');
    tkWeeklyChart = new Chart(ctxWeekly, {
        type: 'bar',
        data: { labels: daysOfWeek.map(d=>d.substring(0,3)), datasets: [{ data: [], backgroundColor: '#8bbd8b', borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, suggestedMax: 10 } } }
    });
}

function renderTaskTracker() {
    tkColumnsContainer.innerHTML = '';
    tkRingsContainer.innerHTML = '';
    
    // Clear old ring charts
    tkRingCharts.forEach(c => c.destroy());
    tkRingCharts = [];

    let totalTasks = 0;
    let completedTasks = 0;
    const dailyData = [];

    daysOfWeek.forEach((day, index) => {
        const tasks = state.taskBoard[day] || [];
        const dayTotal = tasks.length;
        const dayCompleted = tasks.filter(t => t.completed).length;
        
        totalTasks += dayTotal;
        completedTasks += dayCompleted;
        dailyData.push(dayCompleted);

        const rate = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;

        // Render Column
        const colDiv = document.createElement('div');
        colDiv.className = 'border-2 border-green-border rounded flex flex-col h-[400px] overflow-hidden';
        
        let html = `
            <div class="bg-green-header text-white text-center py-2 font-bold text-sm border-b-2 border-green-border uppercase tracking-widest">${day}</div>
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
            <div class="text-[10px] font-bold uppercase mt-1 text-green-text">${day.substring(0,3)}</div>
        `;
        tkRingsContainer.appendChild(ringDiv);
        
        const ctxRing = document.getElementById(`ring-${day}`).getContext('2d');
        const rChart = new Chart(ctxRing, {
            type: 'doughnut',
            data: { datasets: [{ data: [rate, 100 - rate], backgroundColor: ['#78a678', '#e8f0e8'], borderWidth: 0 }] },
            options: { cutout: '75%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
        });
        tkRingCharts.push(rChart);
    });

    lucide.createIcons();

    // Update Weekly Chart & Rate
    const weeklyRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    document.getElementById('tkWeeklyRateText').textContent = weeklyRate + '%';
    document.getElementById('tkWeeklyRateBar').style.width = weeklyRate + '%';

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

window.handleTaskInput = (e, day, input) => {
    if (e.key === 'Enter' && input.value.trim()) {
        if (!state.taskBoard[day]) state.taskBoard[day] = [];
        state.taskBoard[day].push({ id: Date.now().toString(), title: input.value.trim(), completed: false });
        saveState();
        renderTaskTracker();
    }
};
window.editTask = (day, id, newTitle) => {
    const t = state.taskBoard[day].find(x => x.id === id);
    if(t && newTitle.trim() !== '') { t.title = newTitle.trim(); saveState(); }
    renderTaskTracker();
};
window.deleteTask = (day, id) => {
    state.taskBoard[day] = state.taskBoard[day].filter(x => x.id !== id);
    saveState();
    renderTaskTracker();
};
window.toggleTask = (day, id) => {
    const t = state.taskBoard[day].find(x => x.id === id);
    if (t) { t.completed = !t.completed; saveState(); }
    renderTaskTracker();
};

// --- Boot ---
document.addEventListener('DOMContentLoaded', () => {
    updateQuote();
    setInterval(updateQuote, 5 * 60 * 1000);
    
    initHabitCharts();
    initTaskCharts();
    
    switchView(state.view);
});
