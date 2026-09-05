// --- State Management ---
const DEFAULT_STATE = {
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

let state = JSON.parse(localStorage.getItem('chronosdo_task_state')) || DEFAULT_STATE;
if (!state.taskBoard) state.taskBoard = DEFAULT_STATE.taskBoard;

const saveState = () => {
    localStorage.setItem('chronosdo_task_state', JSON.stringify(state));
};


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
        data: { labels: daysOfWeek.map(d => d.substring(0, 3)), datasets: [{ data: [], backgroundColor: '#8bbd8b', borderRadius: 4 }] },
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

    daysOfWeek.forEach((day) => {
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
            <div class="text-[10px] font-bold uppercase mt-1 text-green-text">${day.substring(0, 3)}</div>
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
    if (t && newTitle.trim() !== '') { t.title = newTitle.trim(); saveState(); }
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
    initTaskCharts();
    renderTaskTracker();
});

