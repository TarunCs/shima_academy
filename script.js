document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('input[type="tel"]').forEach(function (phoneInput) {
    phoneInput.addEventListener('input', function () {
      phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
    });
  });

  const visitorsKey = 'simhaVisitors';
  const matchesKey = 'simhaUpcomingMatches';
  const defaultMatches = [
    { id: 'match-1', group: 'U-16 Challenge Cup', date: '2026-09-12', time: '10:00' },
    { id: 'match-2', group: 'District League', date: '2026-09-18', time: '10:00' }
  ];

  function getMatches() {
    try {
      const saved = JSON.parse(localStorage.getItem(matchesKey));
      if (Array.isArray(saved)) return saved;
    } catch (error) {
      return defaultMatches;
    }
    try {
      const first = JSON.parse(localStorage.getItem('simhaNextMatch'));
      const second = JSON.parse(localStorage.getItem('simhaMatchCentre'));
      if (first || second) {
        const migrated = [
          { id: 'match-1', group: first?.group || defaultMatches[0].group, date: first?.date || defaultMatches[0].date, time: first?.time || defaultMatches[0].time },
          { id: 'match-2', group: second?.secondGroup || defaultMatches[1].group, date: second?.secondDate || defaultMatches[1].date, time: '10:00' }
        ];
        saveMatches(migrated);
        return migrated;
      }
    } catch (error) {
      return defaultMatches;
    }
    return defaultMatches;
  }

  function saveMatches(matches) {
    localStorage.setItem(matchesKey, JSON.stringify(matches));
  }

  function renderMatches() {
    const list = document.querySelector('[data-upcoming-matches]');
    const now = Date.now();
    const matches = getMatches()
      .map(function (match) {
        return { match: match, timestamp: new Date(`${match.date}T${match.time}`).getTime() };
      })
      .filter(function (entry) {
        return Number.isFinite(entry.timestamp) && entry.timestamp >= now;
      })
      .sort(function (first, second) {
        return first.timestamp - second.timestamp;
      })
      .map(function (entry) {
        return entry.match;
      });
    const formatMatch = function (match) {
      const date = new Date(`${match.date}T${match.time}`).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
      return `${match.group} · ${date} · ${match.time}`;
    };
    const summary = document.querySelector('[data-next-match-summary]');
    if (summary) summary.textContent = matches.length ? formatMatch(matches[0]) : 'No upcoming matches scheduled.';
    if (!list) return;
    list.replaceChildren();
    matches.forEach(function (match) {
      const item = document.createElement('li');
      const title = document.createElement('strong');
      const details = document.createElement('span');
      item.className = 'upcoming-match-item';
      title.textContent = match.group;
      details.textContent = formatMatch(match).replace(`${match.group} · `, '');
      item.append(title, details);
      if (match.maps) {
        const mapsLink = document.createElement('a');
        mapsLink.href = match.maps;
        mapsLink.target = '_blank';
        mapsLink.rel = 'noopener noreferrer';
        mapsLink.textContent = 'Maps';
        item.appendChild(mapsLink);
      }
      list.appendChild(item);
    });
    if (!getMatches().length) {
      const empty = document.createElement('li');
      empty.textContent = 'No upcoming matches scheduled.';
      list.appendChild(empty);
    }
  }

  const visitorForm = document.getElementById('visitorForm');
  const otpForm = document.getElementById('otpForm');

  if (visitorForm && otpForm) {
    const visitorStep = document.getElementById('visitorStep');
    const otpStep = document.getElementById('otpStep');
    const visitorMessage = document.getElementById('visitorMessage');
    const otpMessage = document.getElementById('otpMessage');
    const phoneSummary = document.getElementById('phoneSummary');
    const demoOtp = document.getElementById('demoOtp');
    let generatedOtp = '';

    visitorForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const name = document.getElementById('visitorName').value.trim();
      const phone = document.getElementById('visitorPhone').value.trim();

      generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      sessionStorage.setItem('simhaVisitorName', name);
      sessionStorage.setItem('simhaVisitorPhone', phone);
      phoneSummary.textContent = `We generated a one-time code for ${phone}.`;
      demoOtp.textContent = `Demo OTP: ${generatedOtp}`;
      visitorMessage.textContent = '';
      visitorStep.hidden = true;
      otpStep.hidden = false;
      document.getElementById('otp').focus();
    });

    otpForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const enteredOtp = document.getElementById('otp').value.trim();

      if (enteredOtp !== generatedOtp) {
        otpMessage.textContent = 'That OTP is incorrect. Please try again.';
        return;
      }

      const visitors = JSON.parse(localStorage.getItem(visitorsKey) || '[]');
      visitors.push({
        name: sessionStorage.getItem('simhaVisitorName') || 'Unknown visitor',
        phone: sessionStorage.getItem('simhaVisitorPhone') || 'Not provided',
        visitedAt: new Date().toISOString()
      });
      localStorage.setItem(visitorsKey, JSON.stringify(visitors));
      sessionStorage.setItem('simhaVisitorVerified', 'true');
      window.location.replace('index.html');
    });
  }

  const registrationKey = 'simhaRegistrationCount';
  const updatedKey = 'simhaRegistrationUpdated';
  const registrationForm = document.getElementById('registerForm');
  const registrationCount = document.getElementById('registrationCount');
  const registrationUpdated = document.getElementById('registrationUpdated');

  function updateRegistrationStatus() {
    if (!registrationCount) return;

    const count = Number.parseInt(localStorage.getItem(registrationKey) || '0', 10);
    const updated = localStorage.getItem(updatedKey);
    registrationCount.textContent = Number.isNaN(count) ? '0' : count;
    registrationUpdated.textContent = updated
      ? new Date(updated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : 'just now';
  }

  if (registrationForm) {
    registrationForm.addEventListener('submit', function () {
      const count = Number.parseInt(localStorage.getItem(registrationKey) || '0', 10);
      localStorage.setItem(registrationKey, String((Number.isNaN(count) ? 0 : count) + 1));
      localStorage.setItem(updatedKey, new Date().toISOString());
      const message = document.getElementById('registrationMessage');
      if (message) message.textContent = 'Registration request recorded.';
    });
  }

  updateRegistrationStatus();
  window.addEventListener('storage', updateRegistrationStatus);

  const loginForm = document.getElementById('loginForm');
  const instructorDashboard = document.getElementById('instructorDashboard');
  const visitorsList = document.getElementById('visitorsList');
  const matchManagerForm = document.getElementById('matchManagerForm');
  const managedMatches = document.getElementById('managedMatches');

  function renderVisitors() {
    if (!visitorsList) return;
    const visitors = JSON.parse(localStorage.getItem(visitorsKey) || '[]');
    visitorsList.replaceChildren();
    if (!visitors.length) {
      const emptyState = document.createElement('li');
      emptyState.textContent = 'No verified visitors yet.';
      visitorsList.appendChild(emptyState);
      return;
    }
    visitors.slice().reverse().forEach(function (visitor) {
      const item = document.createElement('li');
      const name = document.createElement('strong');
      const details = document.createElement('span');
      name.textContent = visitor.name;
      details.textContent = `${visitor.phone} · ${new Date(visitor.visitedAt).toLocaleString()}`;
      item.append(name, details);
      visitorsList.appendChild(item);
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const email = document.getElementById('email').value.trim().toLowerCase();
      const password = document.getElementById('password').value.trim();
      const message = document.getElementById('message');
      const isValidLogin = email === 'coach@simhaacademy.com' && password === '123456';

      message.textContent = isValidLogin ? 'Login successful.' : 'Incorrect login details.';
      if (isValidLogin) {
        document.querySelector('.instructor-card').classList.add('dashboard-wide');
        loginForm.hidden = true;
        if (instructorDashboard) instructorDashboard.hidden = false;
        renderVisitors();
        renderManagedMatches();
      }
    });
  }

  function renderManagedMatches() {
    if (!managedMatches) return;
    managedMatches.replaceChildren();
    getMatches().forEach(function (match) {
      const item = document.createElement('li');
      item.className = 'managed-match';
      item.innerHTML = `<input class="managed-match-group" type="text" value="${match.group.replace(/"/g, '&quot;')}" aria-label="Match name">
        <input class="managed-match-date" type="date" value="${match.date}" aria-label="Match date">
        <input class="managed-match-time" type="time" value="${match.time}" aria-label="Match time">
        <input class="managed-match-maps" type="url" value="${(match.maps || '').replace(/"/g, '&quot;')}" placeholder="Maps URL" aria-label="Maps link">
        <button type="button" class="save-match" data-match-id="${match.id}">Save</button>
        <button type="button" class="delete-match" data-match-id="${match.id}">Delete</button>`;
      managedMatches.appendChild(item);
    });
  }

  if (matchManagerForm) {
    matchManagerForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const matches = getMatches();
      matches.push({
        id: `match-${Date.now()}`,
        group: document.getElementById('managedMatchGroup').value.trim(),
        date: document.getElementById('managedMatchDate').value,
        time: document.getElementById('managedMatchTime').value,
        maps: document.getElementById('managedMatchMaps').value.trim()
      });
      saveMatches(matches);
      matchManagerForm.reset();
      document.getElementById('matchManagerMessage').textContent = 'Upcoming match added.';
      renderManagedMatches();
      renderMatches();
    });
  }

  if (managedMatches) {
    managedMatches.addEventListener('click', function (event) {
      const matchId = event.target.dataset.matchId;
      if (!matchId) return;
      let matches = getMatches();
      const item = event.target.closest('.managed-match');
      if (event.target.classList.contains('delete-match')) {
        matches = matches.filter(match => match.id !== matchId);
        saveMatches(matches);
        renderManagedMatches();
        renderMatches();
        return;
      }
      if (event.target.classList.contains('save-match')) {
        const match = matches.find(entry => entry.id === matchId);
        match.group = item.querySelector('.managed-match-group').value.trim();
        match.date = item.querySelector('.managed-match-date').value;
        match.time = item.querySelector('.managed-match-time').value;
        match.maps = item.querySelector('.managed-match-maps').value.trim();
        saveMatches(matches);
        document.getElementById('matchManagerMessage').textContent = 'Match updated.';
        renderMatches();
      }
    });
  }

  renderMatches();
  window.setInterval(renderMatches, 30000);
  window.addEventListener('storage', function () {
    renderMatches();
    renderManagedMatches();
    renderVisitors();
  });
});
