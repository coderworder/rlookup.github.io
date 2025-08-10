// Data for executors and tutorials

const executorsData = [
  {
    id: 'powerx',
    name: 'PowerX',
    description: 'A fast and stable executor with advanced features.',
    version: '3.4.1',
    platforms: ['Windows', 'Mac'],
    releaseDate: '2024-02-15',
    compatibility: 'Roblox Desktop',
    downloadUrl: 'https://example.com/powerx-download',
    rating: 4.2,
    popularity: 15000,
    downloads: 120000,
  },
  {
    id: 'execpro',
    name: 'ExecPro',
    description: 'User-friendly executor focused on security.',
    version: '2.9.8',
    platforms: ['Windows'],
    releaseDate: '2023-12-10',
    compatibility: 'Roblox Desktop & Xbox',
    downloadUrl: 'https://example.com/execpro-download',
    rating: 4.5,
    popularity: 22000,
    downloads: 180000,
  },
  {
    id: 'rbxmaster',
    name: 'RbxMaster',
    description: 'Powerful executor with scripting tutorials included.',
    version: '1.7.3',
    platforms: ['Windows', 'Linux'],
    releaseDate: '2024-05-01',
    compatibility: 'Roblox Desktop',
    downloadUrl: 'https://example.com/rbxmaster-download',
    rating: 3.8,
    popularity: 8000,
    downloads: 56000,
  },
  {
    id: 'scriptking',
    name: 'ScriptKing',
    description: 'Trusted by pros, high compatibility and low detection.',
    version: '5.2.0',
    platforms: ['Windows', 'Mac'],
    releaseDate: '2023-09-20',
    compatibility: 'Roblox Desktop',
    downloadUrl: 'https://example.com/scriptking-download',
    rating: 4.7,
    popularity: 26000,
    downloads: 230000,
  },
];

const tutorialsData = [
  {
    id: 1,
    title: 'Using Executors Safely',
    description: 'Learn how to use executors without risking your account.',
    icon: '📘',
  },
  {
    id: 2,
    title: 'Writing Lua Scripts',
    description: 'Introduction to scripting for Roblox executors.',
    icon: '✍️',
  },
  {
    id: 3,
    title: 'Top Executor Features',
    description: 'Discover powerful features in popular executors.',
    icon: '⚙️',
  },
  {
    id: 4,
    title: 'Troubleshooting Errors',
    description: 'Fix common executor and script issues.',
    icon: '🛠️',
  },
];

// State

let currentTab = 'home';
let executorRatings = {};

// Try load ratings from localStorage
try {
  const storedRatings = JSON.parse(localStorage.getItem('executorRatings'));
  if (storedRatings && typeof storedRatings === 'object') {
    executorRatings = storedRatings;
  }
} catch {}

// Elements
const tabs = document.querySelectorAll('#nav-tabs button');
const panels = document.querySelectorAll('.tab-panel');
const underconstruction = document.getElementById('underconstruction');
const executorsList = document.getElementById('executors-list');
const tutorialsList = document.getElementById('tutorials-list');
const ratingsTbody = document.getElementById('ratings-tbody');
const ratingsTable = document.getElementById('ratings-table');

// --- Underconstruction logic ---

const keysNeeded = ['w', 'a', 's', 'd'];
const keysPressed = new Set();

function onKeyDown(event) {
  if (underconstruction.classList.contains('hidden')) return;
  const key = event.key.toLowerCase();
  if (keysNeeded.includes(key)) {
    keysPressed.add(key);
    if (keysNeeded.every(k => keysPressed.has(k))) {
      // Unlock site with fade
      underconstruction.classList.add('hidden');
      window.removeEventListener('keydown', onKeyDown);
    }
  }
}

window.addEventListener('keydown', onKeyDown);

// --- Tab switching ---

function switchTab(newTabId) {
  if (newTabId === currentTab) return;
  // Update tab buttons
  tabs.forEach(tab => {
    const selected = tab.id === 'tab-' + newTabId;
    tab.setAttribute('aria-selected', selected);
    tab.tabIndex = selected ? 0 : -1;
  });

  // Update panels
  panels.forEach(panel => {
    if (panel.id === 'panel-' + newTabId) {
      panel.hidden = false;
      panel.classList.add('active');
      panel.focus();
    } else {
      panel.hidden = true;
      panel.classList.remove('active');
    }
  });

  currentTab = newTabId;
}

// Add tab click & keyboard handlers
tabs.forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.id.replace('tab-', '')));
  tab.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const idx = Array.from(tabs).indexOf(tab);
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      let newIndex = (idx + dir + tabs.length) % tabs.length;
      tabs[newIndex].focus();
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      switchTab(tab.id.replace('tab-', ''));
    }
  });
});

// --- Render Executors list ---

function createStarSVG(filled = false) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'star');
  svg.setAttribute('role', 'radio');
  svg.setAttribute('tabindex', '0');
  svg.setAttribute('aria-checked', filled ? 'true' : 'false');
  svg.setAttribute('aria-label', filled ? 'Filled star' : 'Empty star');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z');
  path.setAttribute('fill', filled ? '#ffd54f' : '#bfa33f');
  svg.appendChild(path);
  return svg;
}

function updateExecutorRating(id, newRating) {
  executorRatings[id] = newRating;
  localStorage.setItem('executorRatings', JSON.stringify(executorRatings));
  renderExecutors();
  renderRatingsTable();
}

function renderExecutors() {
  executorsList.innerHTML = '';
  executorsData.forEach(exec => {
    const card = document.createElement('article');
    card.className = 'executor-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${exec.name} executor card`);

    // Icon (simple gold box with initials)
    const icon = document.createElement('div');
    icon.className = 'executor-icon';
    icon.textContent = exec.name.slice(0, 2).toUpperCase();
    card.appendChild(icon);

    // Name
    const name = document.createElement('h3');
    name.className = 'executor-name';
    name.textContent = exec.name;
    card.appendChild(name);

    // Description
    const desc = document.createElement('p');
    desc.className = 'executor-desc';
    desc.textContent = exec.description;
    card.appendChild(desc);

    // Meta
    const meta = document.createElement('p');
    meta.className = 'executor-meta';
    meta.textContent = 
      `Version: ${exec.version}\nPlatforms: ${exec.platforms.join(', ')}\nReleased: ${exec.releaseDate}\nCompatibility: ${exec.compatibility}`;
    card.appendChild(meta);

    // Star rating
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'star-rating';
    ratingContainer.setAttribute('role', 'radiogroup');
    ratingContainer.setAttribute('aria-label', `Rate executor ${exec.name}`);

    const userRating = executorRatings[exec.id] ?? exec.rating;

    for (let i = 1; i <= 5; i++) {
      const star = createStarSVG(i <= userRating);
      star.setAttribute('aria-label', `${i} star${i > 1 ? 's' : ''}`);
      star.addEventListener('click', () => updateExecutorRating(exec.id, i));
      star.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          updateExecutorRating(exec.id, i);
        }
      });
      ratingContainer.appendChild(star);
    }

    card.appendChild(ratingContainer);

    // Buttons container
    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group';

    // Learn More (alert placeholder)
    const learnBtn = document.createElement('button');
    learnBtn.textContent = 'Learn More';
    learnBtn.setAttribute('aria-label', `Learn more about ${exec.name}`);
    learnBtn.addEventListener('click', () => alert(`More info about ${exec.name} coming soon!`));
    btnGroup.appendChild(learnBtn);

    // Download
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = 'Official Download';
    downloadBtn.setAttribute('aria-label', `Download official ${exec.name}`);
    downloadBtn.addEventListener('click', () => {
      window.open(exec.downloadUrl, '_blank', 'noopener');
    });
    btnGroup.appendChild(downloadBtn);

    card.appendChild(btnGroup);

    executorsList.appendChild(card);
  });
}

// --- Render Tutorials list ---

function renderTutorials() {
  tutorialsList.innerHTML = '';
  tutorialsData.forEach(tut => {
    const card = document.createElement('article');
    card.className = 'tutorial-card';
    card.setAttribute('tabindex', '-1');
    card.setAttribute('aria-label', `Tutorial: ${tut.title}`);

    const iconDiv = document.createElement('div');
    iconDiv.className = 'tutorial-icon';
    iconDiv.textContent = tut.icon;
    iconDiv.setAttribute('aria-hidden', 'true');
    card.appendChild(iconDiv);

    const title = document.createElement('h3');
    title.className = 'tutorial-title';
    title.textContent = tut.title;
    card.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'tutorial-desc';
    desc.textContent = tut.description;
    card.appendChild(desc);

    tutorialsList.appendChild(card);
  });
}

// --- Render Ratings Table ---

let ratingsSortKey = 'rating';
let ratingsSortDirection = 'desc';

function renderRatingsTable() {
  // Sort
  const sorted = [...executorsData].sort((a, b) => {
    let valA = a[ratingsSortKey];
    let valB = b[ratingsSortKey];

    // Use user rating if available
    if (ratingsSortKey === 'rating') {
      valA = executorRatings[a.id] ?? valA;
      valB = executorRatings[b.id] ?? valB;
    }

    if (ratingsSortKey === 'releaseDate') {
      valA = new Date(valA);
      valB = new Date(valB);
    }

    if (typeof valA === 'string') {
      return ratingsSortDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    } else {
      return ratingsSortDirection === 'asc'
        ? valA - valB
        : valB - valA;
    }
  });

  // Update aria-sort on headers
  const headers = ratingsTable.querySelectorAll('th[data-key]');
  headers.forEach(th => {
    if (th.dataset.key === ratingsSortKey) {
      th.setAttribute('aria-sort', ratingsSortDirection);
    } else {
      th.setAttribute('aria-sort', 'none');
    }
  });

  ratingsTbody.innerHTML = '';
  sorted.forEach(exec => {
    const tr = document.createElement('tr');

    // Name
    const tdName = document.createElement('td');
    tdName.textContent = exec.name;
    tr.appendChild(tdName);

    // Rating (user rating or default)
    const tdRating = document.createElement('td');
    const ratingValue = executorRatings[exec.id] ?? exec.rating;
    tdRating.textContent = ratingValue.toFixed(1);
    tr.appendChild(tdRating);

    // Popularity
    const tdPopularity = document.createElement('td');
    tdPopularity.textContent = exec.popularity.toLocaleString();
    tr.appendChild(tdPopularity);

    // Released
    const tdReleased = document.createElement('td');
    tdReleased.textContent = exec.releaseDate;
    tr.appendChild(tdReleased);

    // Downloads
    const tdDownloads = document.createElement('td');
    tdDownloads.textContent = exec.downloads.toLocaleString();
    tr.appendChild(tdDownloads);

    ratingsTbody.appendChild(tr);
  });
}

// Handle header clicks for sorting ratings table
ratingsTable.querySelectorAll('th[data-key]').forEach(th => {
  th.addEventListener('click', () => {
    if (ratingsSortKey === th.dataset.key) {
      ratingsSortDirection = ratingsSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      ratingsSortKey = th.dataset.key;
      ratingsSortDirection = 'desc';
    }
    renderRatingsTable();
  });

  th.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      th.click();
    }
  });
});

// --- Initial Render ---

renderExecutors();
renderTutorials();
renderRatingsTable();

