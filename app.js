const searchInput = document.getElementById('searchInput');
const autocompleteList = document.getElementById('autocompleteList');
const profileContainer = document.querySelector('.profile-container');
const tabs = document.querySelectorAll('.tab');
const tabContent = document.getElementById('tabContent');
const errorMessage = document.querySelector('.error-message');
const loadingSpinner = document.querySelector('.loading-spinner');
const clearBtn = document.querySelector('.clear-btn');

let activeUsername = '';
let profileData = null;
let autocompleteItems = [];
let focusedAutocompleteIndex = -1;
let debounceTimeout;

const API = {
  USER_SEARCH: username => `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`,
  USER_INFO: userId => `https://users.roblox.com/v1/users/${userId}`,
  USER_AVATAR: userId => `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=150x150&format=Png&isCircular=true`,
  USER_BADGES: userId => `https://badges.roblox.com/v1/users/${userId}/badges`,
  USER_GROUPS: userId => `https://groups.roblox.com/v2/users/${userId}/groups/roles`,
  USER_FRIENDS: userId => `https://friends.roblox.com/v1/users/${userId}/friends?limit=12`,
  USER_FOLLOWERS: userId => `https://friends.roblox.com/v1/users/${userId}/followers?limit=12`,
};

const PROXY_URL = 'https://workers-playground-empty-mode-8d6e.nuubzz12.workers.dev/?url=';

async function fetchJSON(url) {
  try {
    const response = await fetch(PROXY_URL + encodeURIComponent(url));
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function fetchAutocomplete(query) {
  if (!query) return [];
  showLoading(true);
  clearError();
  const data = await fetchJSON(API.USER_SEARCH(query));
  showLoading(false);
  if (!data || !data.data || data.data.length === 0) {
    showError('No users found matching that username.');
    return [];
  }
  return data.data.map(user => ({ id: user.id, name: user.name }));
}

async function fetchProfile(userId) {
  showLoading(true);
  clearError();
  const [info, avatarData, badgesData, groupsData, friendsData, followersData] = await Promise.all([
    fetchJSON(API.USER_INFO(userId)),
    fetchJSON(API.USER_AVATAR(userId)),
    fetchJSON(API.USER_BADGES(userId)),
    fetchJSON(API.USER_GROUPS(userId)),
    fetchJSON(API.USER_FRIENDS(userId)),
    fetchJSON(API.USER_FOLLOWERS(userId)),
  ]);
  showLoading(false);
  if (!info) {
    showError('Failed to load user profile.');
    return null;
  }
  return {
    info,
    avatarUrl: avatarData && avatarData.data && avatarData.data[0] ? avatarData.data[0].imageUrl : '',
    badges: badgesData && badgesData.data ? badgesData.data : [],
    groups: groupsData && groupsData.data ? groupsData.data : [],
    friends: friendsData && friendsData.data ? friendsData.data : [],
    followers: followersData && followersData.data ? followersData.data : [],
  };
}

function showError(msg) {
  errorMessage.textContent = msg;
}

function clearError() {
  errorMessage.textContent = '';
}

function showLoading(show) {
  loadingSpinner.style.display = show ? 'block' : 'none';
}

async function updateAutocomplete() {
  const query = searchInput.value.trim();
  clearError();
  if (!query) {
    autocompleteList.hidden = true;
    autocompleteList.innerHTML = '';
    clearBtn.hidden = true;
    return;
  }
  clearBtn.hidden = false;
  autocompleteItems = await fetchAutocomplete(query);
  if (autocompleteItems.length === 0) {
    autocompleteList.hidden = true;
    autocompleteList.innerHTML = '';
    return;
  }
  autocompleteList.innerHTML = autocompleteItems
    .map(
      (user, i) =>
        `<li tabindex="-1" role="option" id="autocomplete-item-${i}" data-id="${user.id}" data-name="${user.name}">${user.name}</li>`
    )
    .join('');
  autocompleteList.hidden = false;
  searchInput.setAttribute('aria-expanded', 'true');
  focusedAutocompleteIndex = -1;
}

function selectUsername(name, userId) {
  searchInput.value = name;
  autocompleteList.hidden = true;
  searchInput.setAttribute('aria-expanded', 'false');
  clearBtn.hidden = false;
  loadProfile(userId, name);
}

async function loadProfile(userId, username) {
  profileContainer.hidden = true;
  tabContent.textContent = 'Loading profile data...';
  profileData = await fetchProfile(userId);
  if (!profileData) {
    profileContainer.classList.remove('visible');
    profileContainer.hidden = true;
    return;
  }
  activeUsername = username;
  profileContainer.hidden = false;
  profileContainer.classList.add('visible');
  tabs.forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
    t.setAttribute('tabindex', '-1');
  });
  const firstTab = tabs[0];
  firstTab.classList.add('active');
  firstTab.setAttribute('aria-selected', 'true');
  firstTab.setAttribute('tabindex', '0');
  showTabContent('overview');
}

function showTabContent(tabName) {
  if (!profileData) return;
  tabContent.style.opacity = 0;
  setTimeout(() => {
    switch (tabName) {
      case 'overview':
        tabContent.innerHTML = `
          <img src="${profileData.avatarUrl}" alt="${activeUsername} avatar" class="avatar" />
          <h2>${activeUsername}</h2>
          <p><strong>User ID:</strong> ${profileData.info.id}</p>
          <p><strong>Created:</strong> ${new Date(profileData.info.created).toLocaleDateString()}</p>
          <p><strong>Description:</strong> ${profileData.info.description || 'No description.'}</p>
          <p><strong>Status:</strong> ${profileData.info.status || 'No status.'}</p>
        `;
        break;
      case 'badges':
        if (profileData.badges.length === 0) {
          tabContent.textContent = 'No badges found.';
          break;
        }
        tabContent.innerHTML = profileData.badges
          .map(
            badge =>
              `<div class="badge" title="${badge.name}">${badge.name}</div>`
          )
          .join('');
        break;
      case 'groups':
        if (profileData.groups.length === 0) {
          tabContent.textContent = 'No groups found.';
          break;
        }
        tabContent.innerHTML = profileData.groups
          .map(
            g =>
              `<div class="group" title="${g.group.name} - Role: ${g.role.name}">${g.group.name} (${g.role.name})</div>`
          )
          .join('');
        break;
      case 'friends':
        if (profileData.friends.length === 0) {
          tabContent.textContent = 'No friends found.';
          break;
        }
        tabContent.innerHTML =
          `<div class="user-list">` +
          profileData.friends
            .map(
              f => `
            <div class="user-list-item" title="${f.name}">
              <img src="https://thumbnails.roblox.com/v1/users/avatar?userIds=${f.id}&size=48x48&format=Png&isCircular=true" alt="${f.name} avatar" />
              <div>${f.name}</div>
            </div>`
            )
            .join('') +
          `</div>`;
        break;
      case 'followers':
        if (profileData.followers.length === 0) {
          tabContent.textContent = 'No followers found.';
          break;
        }
        tabContent.innerHTML =
          `<div class="user-list">` +
          profileData.followers
            .map(
              f => `
            <div class="user-list-item" title="${f.name}">
              <img src="https://thumbnails.roblox.com/v1/users/avatar?userIds=${f.id}&size=48x48&format=Png&isCircular=true" alt="${f.name} avatar" />
              <div>${f.name}</div>
            </div>`
            )
            .join('') +
          `</div>`;
        break;
      default:
        tabContent.textContent = 'Invalid tab.';
    }
    tabContent.style.opacity = 1;
  }, 100);
}

// Tab switching logic
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    showTabContent(tab.dataset.tab);
    tabContent.focus();
  });
});

// Clear button logic
clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  autocompleteList.hidden = true;
  clearBtn.hidden = true;
  clearError();
  profileContainer.classList.remove('visible');
  profileContainer.hidden = true;
  searchInput.focus();
});

// Debounce for input
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(updateAutocomplete, 350);
});

// Keyboard nav for autocomplete
searchInput.addEventListener('keydown', e => {
  if (autocompleteList.hidden) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query) {
        fetchAutocomplete(query).then(results => {
          if (results.length > 0) {
            selectUsername(results[0].name, results[0].id);
          } else {
            showError('User not found.');
            profileContainer.classList.remove('visible');
            profileContainer.hidden = true;
          }
        });
      }
    }
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (focusedAutocompleteIndex < autocompleteItems.length - 1) focusedAutocompleteIndex++;
    updateAutocompleteFocus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (focusedAutocompleteIndex > 0) focusedAutocompleteIndex--;
    updateAutocompleteFocus();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (focusedAutocompleteIndex >= 0 && focusedAutocompleteIndex < autocompleteItems.length) {
      const user = autocompleteItems[focusedAutocompleteIndex];
      selectUsername(user.name, user.id);
    }
  } else if (e.key === 'Escape') {
    autocompleteList.hidden = true;
    searchInput.setAttribute('aria-expanded', 'false');
  }
});

function updateAutocompleteFocus() {
  const children = autocompleteList.querySelectorAll('li');
  children.forEach((li, i) => {
    if (i === focusedAutocompleteIndex) {
      li.classList.add('focused');
      li.focus();
      searchInput.setAttribute('aria-activedescendant', li.id);
    } else {
      li.classList.remove('focused');
    }
  });
}

// Click selection for autocomplete
autocompleteList.addEventListener('click', e => {
  if (e.target.tagName === 'LI') {
    selectUsername(e.target.dataset.name, e.target.dataset.id);
  }
});

// Close autocomplete if click outside
document.addEventListener('click', e => {
  if (!autocompleteList.contains(e.target) && e.target !== searchInput) {
    autocompleteList.hidden = true;
    searchInput.setAttribute('aria-expanded', 'false');
  }
});
