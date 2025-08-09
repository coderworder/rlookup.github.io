const PROXY_URL = 'https://workers-playground-empty-mode-8d6e.nuubzz12.workers.dev/?url=';

const searchInput = document.getElementById('searchInput');
const autocompleteList = document.getElementById('autocompleteList');
const profileContainer = document.getElementById('profileContainer');
const profileName = document.getElementById('profileName');
const profileId = document.getElementById('profileId');
const profileDisplayName = document.getElementById('profileDisplayName');
const profileCreated = document.getElementById('profileCreated');
const profileDescription = document.getElementById('profileDescription');
const badgesList = document.getElementById('badgesList');
const groupsList = document.getElementById('groupsList');
const errorMessage = document.getElementById('errorMessage');

let focusedAutocompleteIndex = -1;

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

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.hidden = false;
  profileContainer.hidden = true;
  autocompleteList.hidden = true;
}

function clearError() {
  errorMessage.hidden = true;
}

async function fetchAutocomplete(query) {
  if (!query || query.length < 2) {
    autocompleteList.hidden = true;
    return [];
  }
  const url = `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(query)}&limit=5`;
  const data = await fetchJSON(url);
  if (!data || !data.data || data.data.length === 0) {
    autocompleteList.hidden = true;
    return [];
  }
  return data.data;
}

function updateAutocomplete(users) {
  autocompleteList.innerHTML = '';
  if (users.length === 0) {
    autocompleteList.hidden = true;
    return;
  }
  users.forEach((user, i) => {
    const li = document.createElement('li');
    li.textContent = `${user.name} (${user.displayName})`;
    li.dataset.userId = user.id;
    li.dataset.username = user.name;
    li.tabIndex = 0;
    if (i === focusedAutocompleteIndex) li.classList.add('focused');
    li.addEventListener('click', () => {
      selectUser(user.id, user.name);
      autocompleteList.hidden = true;
    });
    autocompleteList.appendChild(li);
  });
  autocompleteList.hidden = false;
}

async function selectUser(userId, username) {
  clearError();
  autocompleteList.hidden = true;
  searchInput.value = username;
  profileContainer.hidden = true;

  // Fetch profile info
  const profileUrl = `https://users.roblox.com/v1/users/${userId}`;
  const profile = await fetchJSON(profileUrl);
  if (!profile || profile.id === undefined) {
    showError('User not found.');
    return;
  }

  profileName.textContent = profile.name;
  profileId.textContent = profile.id;
  profileDisplayName.textContent = profile.displayName || '';
  profileCreated.textContent = new Date(profile.created).toLocaleDateString();
  profileDescription.textContent = profile.description || 'No bio available.';

  // Fetch badges
  badgesList.innerHTML = '';
  const badgesUrl = `https://badges.roblox.com/v1/users/${userId}/badges`;
  const badgesData = await fetchJSON(badgesUrl);
  if (badgesData && badgesData.data && badgesData.data.length > 0) {
    badgesData.data.forEach(badge => {
      const li = document.createElement('li');
      li.textContent = badge.name;
      badgesList.appendChild(li);
    });
  } else {
    badgesList.innerHTML = '<li>No badges found.</li>';
  }

  // Fetch groups
  groupsList.innerHTML = '';
  const groupsUrl = `https://groups.roblox.com/v2/users/${userId}/groups/roles`;
  const groupsData = await fetchJSON(groupsUrl);
  if (groupsData && groupsData.data && groupsData.data.length > 0) {
    groupsData.data.forEach(group => {
      const li = document.createElement('li');
      li.textContent = `${group.group.name} — Role: ${group.role.name}`;
      groupsList.appendChild(li);
    });
  } else {
    groupsList.innerHTML = '<li>No groups found.</li>';
  }

  profileContainer.hidden = false;
}

searchInput.addEventListener('input', async () => {
  clearError();
  focusedAutocompleteIndex = -1;
  const query = searchInput.value.trim();
  if (query.length < 2) {
    autocompleteList.hidden = true;
    return;
  }
  const users = await fetchAutocomplete(query);
  updateAutocomplete(users);
});

searchInput.addEventListener('keydown', e => {
  if (autocompleteList.hidden) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query) {
        fetchAutocomplete(query).then(results => {
          if (results.length > 0) {
            selectUser(results[0].id, results[0].name);
          } else {
            showError('User not found.');
          }
        });
      }
    }
    return;
  }
  const items = autocompleteList.querySelectorAll('li');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (focusedAutocompleteIndex < items.length - 1) focusedAutocompleteIndex++;
    updateAutocompleteFocus(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (focusedAutocompleteIndex > 0) focusedAutocompleteIndex--;
    updateAutocompleteFocus(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (focusedAutocompleteIndex >= 0 && focusedAutocompleteIndex < items.length) {
      const user = items[focusedAutocompleteIndex];
      selectUser(user.dataset.userId, user.dataset.username);
    }
  } else if (e.key === 'Escape') {
    autocompleteList.hidden = true;
  }
});

function updateAutocompleteFocus(items) {
  items.forEach((item, i) => {
    if (i === focusedAutocompleteIndex) {
      item.classList.add('focused');
      item.focus();
    } else {
      item.classList.remove('focused');
    }
  });
}

// Close autocomplete when clicking outside
document.addEventListener('click', e => {
  if (!autocompleteList.contains(e.target) && e.target !== searchInput) {
    autocompleteList.hidden = true;
  }
});
