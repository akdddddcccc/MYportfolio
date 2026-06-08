const STORAGE_KEY = 'muyang-task-divide-v1';
const isChinesePage = document.documentElement.lang.toLowerCase().startsWith('zh');

const copy = {
    zh: {
        priority: { high: '高优先级', medium: '中优先级', low: '低优先级' },
        hours: '小时',
        empty: '任务墙目前是空的。新增一个目标后，这里会出现可勾选的拆分步骤。',
        summaryEmpty: '还没有任务。先把脑子里的目标丢进来。',
        summary: (done, total, tasks) => `${tasks} 个任务，${done}/${total} 个步骤已完成。`,
        defaultDescription: '暂无描述，先从最小可执行步骤开始。',
        subtasks: (title, description, estimate) => [
            `确认「${title}」的最终交付物与验收标准`,
            description ? `提取描述中的限制条件：${description.slice(0, 46)}` : '补充背景、限制条件和必须保留的内容',
            `把预计 ${estimate} 小时分成 2-4 个专注时间块`,
            '完成第一版草稿或最小可用版本',
            '复盘并记录下一步优化点'
        ]
    },
    en: {
        priority: { high: 'High priority', medium: 'Medium priority', low: 'Low priority' },
        hours: 'hours',
        empty: 'The task wall is empty. Add a goal to generate checkable subtasks here.',
        summaryEmpty: 'No tasks yet. Drop the goal from your head into the form.',
        summary: (done, total, tasks) => `${tasks} task(s), ${done}/${total} step(s) completed.`,
        defaultDescription: 'No description yet. Start from the smallest executable step.',
        subtasks: (title, description, estimate) => [
            `Define the final deliverable and acceptance criteria for “${title}”`,
            description ? `Extract constraints from the brief: ${description.slice(0, 46)}` : 'Add context, constraints, and must-keep content',
            `Split the estimated ${estimate} hours into 2-4 focus blocks`,
            'Create the first draft or minimum usable version',
            'Review results and write down the next improvement'
        ]
    }
};

const t = isChinesePage ? copy.zh : copy.en;
const form = document.querySelector('#taskForm');
const list = document.querySelector('#taskList');
const template = document.querySelector('#taskCardTemplate');
const completionRate = document.querySelector('#completionRate');
const summaryText = document.querySelector('#summaryText');
const progressBar = document.querySelector('#progressBar');
const clearDoneButton = document.querySelector('#clearDoneButton');

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTask(formData) {
    const title = formData.get('title').trim();
    const description = formData.get('description').trim();
    const priority = formData.get('priority');
    const estimate = formData.get('estimate');
    const subtasks = t.subtasks(title, description, estimate).map((label, index) => ({
        id: `${Date.now()}-${index}`,
        label,
        done: false
    }));

    return {
        id: `${Date.now()}`,
        title,
        description,
        priority,
        estimate,
        createdAt: new Date().toISOString(),
        subtasks
    };
}

function renderSummary() {
    const total = tasks.reduce((sum, task) => sum + task.subtasks.length, 0);
    const done = tasks.reduce((sum, task) => sum + task.subtasks.filter((subtask) => subtask.done).length, 0);
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    completionRate.textContent = `${percent}%`;
    progressBar.style.width = `${percent}%`;
    summaryText.textContent = total === 0 ? t.summaryEmpty : t.summary(done, total, tasks.length);
}

function renderTasks() {
    list.innerHTML = '';

    if (tasks.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'task-empty';
        empty.textContent = t.empty;
        list.append(empty);
        renderSummary();
        return;
    }

    tasks.forEach((task) => {
        const card = template.content.firstElementChild.cloneNode(true);
        const meta = card.querySelector('.task-card__meta');
        const heading = card.querySelector('h3');
        const description = card.querySelector('.task-card__desc');
        const deleteButton = card.querySelector('.task-card__delete');
        const subtaskList = card.querySelector('.subtask-list');

        meta.textContent = `${t.priority[task.priority]} / ${task.estimate} ${t.hours}`;
        heading.textContent = task.title;
        description.textContent = task.description || t.defaultDescription;
        deleteButton.addEventListener('click', () => {
            tasks = tasks.filter((item) => item.id !== task.id);
            saveTasks();
            renderTasks();
        });

        task.subtasks.forEach((subtask) => {
            const item = document.createElement('li');
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            const text = document.createElement('span');

            checkbox.type = 'checkbox';
            checkbox.checked = subtask.done;
            checkbox.addEventListener('change', () => {
                subtask.done = checkbox.checked;
                saveTasks();
                renderSummary();
            });
            text.textContent = subtask.label;
            label.append(checkbox, text);
            item.append(label);
            subtaskList.append(item);
        });

        list.append(card);
    });

    renderSummary();
}

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const task = createTask(new FormData(form));
    tasks = [task, ...tasks];
    saveTasks();
    form.reset();
    renderTasks();
});

clearDoneButton.addEventListener('click', () => {
    tasks = tasks
        .map((task) => ({ ...task, subtasks: task.subtasks.filter((subtask) => !subtask.done) }))
        .filter((task) => task.subtasks.length > 0);
    saveTasks();
    renderTasks();
});

renderTasks();
