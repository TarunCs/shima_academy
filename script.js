document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('input[type="tel"]').forEach(function (phoneInput) {
    phoneInput.addEventListener('input', function () {
      phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
    });
  });

  const visitorsKey = 'simhaVisitors';
  const liveScoreKey = 'simhaLiveScore';
  const nextMatchKey = 'simhaNextMatch';
  const matchCentreKey = 'simhaMatchCentre';
  const defaultLiveScore = {
    team: 'Simha Academy',
    runs: '0',
    wickets: '0',
    overs: '0.0',
    status: 'Match has not started'
  };
  const defaultNextMatch = {
    date: '2026-09-12',
    time: '10:00',
    group: 'U-16 Challenge Cup'
  };
  const defaultMatchCentre = {
    secondGroup: 'District League',
    secondDate: '2026-09-18',
    previousOne: 'Simha Academy beat City Stars by 18 runs.',
    previousTwo: 'Simha Academy won by 7 wickets vs Greenfield XI.',
    scoreTeam: 'Simha Academy',
    scoreRuns: '165',
    scoreWickets: '7',
    scoreOvers: '20.0'
  };

  function getLiveScore() {
    try {
      return { ...defaultLiveScore, ...JSON.parse(localStorage.getItem(liveScoreKey) || '{}') };
    } catch (error) {
      return defaultLiveScore;
    }
  }

  function updateLiveScore() {
    const score = getLiveScore();
    document.querySelectorAll('[data-live-score]').forEach(function (element) {
      element.textContent = `${score.team} ${score.runs}/${score.wickets} · ${score.overs} overs`;
    });
    const statusElement = document.querySelector('[data-live-status]');
    if (statusElement) statusElement.textContent = score.status;
  }

  function getNextMatch() {
    try {
      return { ...defaultNextMatch, ...JSON.parse(localStorage.getItem(nextMatchKey) || '{}') };
    } catch (error) {
      return defaultNextMatch;
    }
  }

  function updateNextMatch() {
    const match = getNextMatch();
    const dateElement = document.querySelector('[data-next-match-date]');
    const timeElement = document.querySelector('[data-next-match-time]');
    const groupElement = document.querySelector('[data-next-match-group]');
    if (dateElement) dateElement.textContent = new Date(`${match.date}T${match.time}`).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    if (timeElement) timeElement.textContent = match.time;
    if (groupElement) groupElement.textContent = match.group;
  }

  function getMatchCentre() {
    try {
      return { ...defaultMatchCentre, ...JSON.parse(localStorage.getItem(matchCentreKey) || '{}') };
    } catch (error) {
      return defaultMatchCentre;
    }
  }

  function updateMatchCentre() {
    const centre = getMatchCentre();
    const firstMatch = getNextMatch();
    const firstDate = new Date(`${firstMatch.date}T${firstMatch.time}`).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    const secondDate = new Date(`${centre.secondDate}T00:00:00`).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    const upcomingFirst = document.querySelector('[data-upcoming-first]');
    const upcomingSecond = document.querySelector('[data-upcoming-second]');
    if (upcomingFirst) upcomingFirst.textContent = `${firstMatch.group} · ${firstDate}`;
    if (upcomingSecond) upcomingSecond.textContent = `${centre.secondGroup} · ${secondDate}`;
    const previousOne = document.querySelector('[data-previous-one]');
    const previousTwo = document.querySelector('[data-previous-two]');
    const scoreTeam = document.querySelector('[data-scorecard-team]');
    const scoreValue = document.querySelector('[data-scorecard-value]');
    const scoreOvers = document.querySelector('[data-scorecard-overs]');
    if (previousOne) previousOne.textContent = centre.previousOne;
    if (previousTwo) previousTwo.textContent = centre.previousTwo;
    if (scoreTeam) scoreTeam.textContent = centre.scoreTeam;
    if (scoreValue) scoreValue.textContent = `${centre.scoreRuns}/${centre.scoreWickets}`;
    if (scoreOvers) scoreOvers.textContent = centre.scoreOvers;
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
  const scoreForm = document.getElementById('scoreForm');
  const matchForm = document.getElementById('matchForm');
  const matchCentreForm = document.getElementById('matchCentreForm');

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
        updateLiveScore();
        updateNextMatch();
        updateMatchCentre();
      }
    });
  }

  if (scoreForm) {
    const score = getLiveScore();
    document.getElementById('scoreTeam').value = score.team;
    document.getElementById('scoreRuns').value = score.runs;
    document.getElementById('scoreWickets').value = score.wickets;
    document.getElementById('scoreOvers').value = score.overs;
    document.getElementById('scoreStatus').value = score.status;
    scoreForm.addEventListener('submit', function (event) {
      event.preventDefault();
      localStorage.setItem(liveScoreKey, JSON.stringify({
        team: document.getElementById('scoreTeam').value.trim() || defaultLiveScore.team,
        runs: document.getElementById('scoreRuns').value,
        wickets: document.getElementById('scoreWickets').value,
        overs: document.getElementById('scoreOvers').value,
        status: document.getElementById('scoreStatus').value.trim() || defaultLiveScore.status
      }));
      document.getElementById('scoreMessage').textContent = 'Live score updated.';
      updateLiveScore();
    });
  }

  if (matchForm) {
    const match = getNextMatch();
    document.getElementById('matchDate').value = match.date;
    document.getElementById('matchTime').value = match.time;
    document.getElementById('matchGroup').value = match.group;
    matchForm.addEventListener('submit', function (event) {
      event.preventDefault();
      localStorage.setItem(nextMatchKey, JSON.stringify({
        date: document.getElementById('matchDate').value,
        time: document.getElementById('matchTime').value,
        group: document.getElementById('matchGroup').value.trim() || defaultNextMatch.group
      }));
      document.getElementById('matchMessage').textContent = 'Next match updated.';
      updateNextMatch();
    });
  }

  if (matchCentreForm) {
    const centre = getMatchCentre();
    document.getElementById('secondGroup').value = centre.secondGroup;
    document.getElementById('secondDate').value = centre.secondDate;
    document.getElementById('previousOne').value = centre.previousOne;
    document.getElementById('previousTwo').value = centre.previousTwo;
    document.getElementById('scorecardTeam').value = centre.scoreTeam;
    document.getElementById('scorecardRuns').value = centre.scoreRuns;
    document.getElementById('scorecardWickets').value = centre.scoreWickets;
    document.getElementById('scorecardOvers').value = centre.scoreOvers;
    matchCentreForm.addEventListener('submit', function (event) {
      event.preventDefault();
      localStorage.setItem(matchCentreKey, JSON.stringify({
        secondGroup: document.getElementById('secondGroup').value.trim() || defaultMatchCentre.secondGroup,
        secondDate: document.getElementById('secondDate').value,
        previousOne: document.getElementById('previousOne').value.trim(),
        previousTwo: document.getElementById('previousTwo').value.trim(),
        scoreTeam: document.getElementById('scorecardTeam').value.trim() || defaultMatchCentre.scoreTeam,
        scoreRuns: document.getElementById('scorecardRuns').value,
        scoreWickets: document.getElementById('scorecardWickets').value,
        scoreOvers: document.getElementById('scorecardOvers').value
      }));
      document.getElementById('matchCentreMessage').textContent = 'Match centre updated.';
      updateMatchCentre();
    });
  }

  updateLiveScore();
  updateNextMatch();
  updateMatchCentre();
  window.addEventListener('storage', function () {
    updateLiveScore();
    updateNextMatch();
    updateMatchCentre();
    renderVisitors();
  });
});
