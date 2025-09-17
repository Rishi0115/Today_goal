// Navbar logic for About/Home
document.addEventListener('DOMContentLoaded', function () {
  const aboutSite = document.querySelector('.about-site');
  const mainContent = document.querySelector('.app-container');
  const navHome = document.getElementById('nav-home');
  const navAbout = document.getElementById('nav-about');

  navHome.addEventListener('click', function () {
    aboutSite.classList.remove('show');
    mainContent.style.display = '';
    navHome.classList.add('active');
    navAbout.classList.remove('active');
  });

  navAbout.addEventListener('click', function () {
    aboutSite.classList.add('show');
    mainContent.style.display = 'none';
    navAbout.classList.add('active');
    navHome.classList.remove('active');
  });
});

// --- Goal logic with countdown and persistence ---

const GOALS_KEY = 'focus_today_goals';

function saveGoalsToStorage() {
  const goals = [];
  document.querySelectorAll('.goal-container').forEach((gc, i) => {
    const input = gc.querySelector('.goal-input');
    const completed = gc.classList.contains('completed');
    goals.push({
      text: input.value,
      completed
    });
  });
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

function loadGoalsFromStorage() {
  const data = localStorage.getItem(GOALS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function updateProgress() {
  const checkBoxList = document.querySelectorAll('.custom-checkbox');
  const inputFields = document.querySelectorAll('.goal-input');
  const progressValue = document.querySelector('.progress-value');
  const completed = [...checkBoxList].filter((checkbox, i) =>
    checkbox.parentElement.classList.contains('completed') && inputFields[i].value
  ).length;
  const total = inputFields.length;
  progressValue.style.width = total ? `${(completed / total) * 100}%` : '0%';
  progressValue.querySelector('span').textContent = `${completed}/${total} Completed`;
}

function getGoalKey(idx) {
  return `goal_timer_${idx}`;
}

function startCountdown(goalContainer, idx) {
  const timerSpan = goalContainer.querySelector('.goal-timer');
  let startTime = localStorage.getItem(getGoalKey(idx));
  if (!startTime) {
    startTime = Date.now();
    localStorage.setItem(getGoalKey(idx), startTime);
  }
  updateCountdown(timerSpan, startTime, idx, goalContainer);
}

function updateCountdown(timerSpan, startTime, idx, goalContainer) {
  if (timerSpan._interval) clearInterval(timerSpan._interval);

  function tick() {
    if (goalContainer.classList.contains('completed')) {
      if (timerSpan._interval) clearInterval(timerSpan._interval);
      return;
    }
    const now = Date.now();
    const endTime = Number(startTime) + 24 * 60 * 60 * 1000;
    let diff = endTime - now;
    if (diff <= 0) {
      timerSpan.textContent = "Time's up!";
      clearInterval(timerSpan._interval);
      timerSpan._interval = null;
      return;
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    timerSpan.textContent = `⏳ ${hours}h ${minutes}m ${seconds}s left`;
  }
  tick();
  timerSpan._interval = setInterval(tick, 1000);
}

function removeGoalTimer(idx) {
  localStorage.removeItem(getGoalKey(idx));
}

function clearGoalEvents(goalContainer) {
  const newContainer = goalContainer.cloneNode(true);
  goalContainer.parentNode.replaceChild(newContainer, goalContainer);
  return newContainer;
}

function attachGoalEvents(goalContainer, idx) {
  goalContainer = clearGoalEvents(goalContainer);

  const checkbox = goalContainer.querySelector('.custom-checkbox');
  const input = goalContainer.querySelector('.goal-input');
  const removeBtn = goalContainer.querySelector('.remove-goal');
  const timerSpan = goalContainer.querySelector('.goal-timer');
  const progressBar = document.querySelector('.progress-bar');

  if (input.value.trim()) {
    let startTime = localStorage.getItem(getGoalKey(idx));
    if (startTime) {
      updateCountdown(timerSpan, startTime, idx, goalContainer);
    }
  } else {
    if (timerSpan._interval) clearInterval(timerSpan._interval);
    timerSpan.textContent = '';
  }

  checkbox.addEventListener('click', () => {
    const allGoalsAdded = [...document.querySelectorAll('.goal-input')].every(input => input.value.trim());
    if (allGoalsAdded) {
      if (input.value.trim()) {
        goalContainer.classList.toggle('completed');
        progressBar.classList.remove('show-error');
        updateProgress();
        saveGoalsToStorage();
        if (goalContainer.classList.contains('completed')) {
          if (timerSpan._interval) clearInterval(timerSpan._interval);
        } else {
          let startTime = localStorage.getItem(getGoalKey(idx));
          if (startTime) {
            updateCountdown(timerSpan, startTime, idx, goalContainer);
          }
        }
      }
    } else {
      progressBar.classList.add('show-error');
    }
  });

  input.addEventListener('focus', () => {
    progressBar.classList.remove('show-error');
  });

  input.addEventListener('input', () => {
    if (!input.value.trim()) {
      goalContainer.classList.remove('completed');
      if (timerSpan._interval) clearInterval(timerSpan._interval);
      timerSpan.textContent = '';
      removeGoalTimer(idx);
      updateProgress();
    } else {
      if (!localStorage.getItem(getGoalKey(idx))) {
        startCountdown(goalContainer, idx);
      }
    }
    saveGoalsToStorage();
  });

  removeBtn.addEventListener('click', () => {
    if (timerSpan._interval) clearInterval(timerSpan._interval);
    goalContainer.remove();
    removeGoalTimer(idx);
    updateProgress();
    saveGoalsToStorage();
    document.querySelectorAll('.goal-container').forEach((gc, i) => attachGoalEvents(gc, i));
  });

  return goalContainer;
}

function addGoal(goalData = { text: '', completed: false }) {
  const goalList = document.querySelector('.goal-list');
  const goalContainer = document.createElement('div');
  goalContainer.className = 'goal-container';
  if (goalData.completed) goalContainer.classList.add('completed');
  goalContainer.innerHTML = `
    <div class="custom-checkbox"></div>
    <input class="goal-input" type="text" placeholder="Add new goal... " value="${goalData.text.replace(/"/g, '&quot;')}" />
    <span class="goal-timer"></span>
    <button class="remove-goal" title="Remove goal">✖</button>
  `;
  goalList.appendChild(goalContainer);
  attachGoalEvents(goalContainer, document.querySelectorAll('.goal-container').length - 1);
  updateProgress();
}

document.addEventListener('DOMContentLoaded', () => {
  // Load goals from storage or create 3 empty by default
  const savedGoals = loadGoalsFromStorage();
  const goalList = document.querySelector('.goal-list');
  goalList.innerHTML = '';
  if (savedGoals.length) {
    savedGoals.forEach(goal => addGoal(goal));
  } else {
    for (let i = 0; i < 3; i++) addGoal();
  }
  document.querySelector('.add-goal').addEventListener('click', () => {
    addGoal();
    saveGoalsToStorage();
  });
  updateProgress();
});