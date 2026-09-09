document.addEventListener('DOMContentLoaded', function () {

    // ============================================================
    // 1. DARK MODE TOGGLE
    // ============================================================
    const toggleBtn = document.getElementById('darkModeToggle');
    const body = document.body;
    const stored = localStorage.getItem('simhaDarkMode');
    if (stored === 'dark') {
        body.classList.add('dark-mode');
        if (toggleBtn) toggleBtn.textContent = '☀️';
    }
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            body.classList.toggle('dark-mode');
            const isDark = body.classList.contains('dark-mode');
            toggleBtn.textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('simhaDarkMode', isDark ? 'dark' : 'light');
        });
    }

    // ============================================================
    // 2. PHONE INPUT SANITISATION
    // ============================================================
    document.querySelectorAll('input[type="tel"]').forEach(function (input) {
        input.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '').slice(0, 10);
        });
    });

    // ============================================================
    // 3. STORAGE KEYS & DEFAULT MATCHES
    // ============================================================
    const VISITORS_KEY = 'simhaVisitors';
    const MATCHES_KEY = 'simhaUpcomingMatches';

    const defaultMatches = [{
        id: 'match-1',
        group: 'U-16 Challenge Cup',
        schoolName: 'Rashtreeya Vidyalaya Public School',
        date: '2026-09-12',
        time: '10:00',
        maps: 'https://www.google.com/maps/search/?api=1&query=Rashtreeya+Vidyalaya+Public+School'
    }, {
        id: 'match-2',
        group: 'District League',
        schoolName: 'Simha Cricket Academy',
        date: '2026-09-18',
        time: '10:00',
        maps: 'https://www.google.com/maps/search/?api=1&query=Simha+Cricket+Academy'
    }];

    function getMatches() {
        try {
            const saved = JSON.parse(localStorage.getItem(MATCHES_KEY));
            if (Array.isArray(saved) && saved.length) return saved;
        } catch (_) { /* fall through */ }
        try {
            const first = JSON.parse(localStorage.getItem('simhaNextMatch'));
            const second = JSON.parse(localStorage.getItem('simhaMatchCentre'));
            if (first || second) {
                const migrated = [{
                    id: 'match-1',
                    group: first?.group || defaultMatches[0].group,
                    schoolName: first?.schoolName || defaultMatches[0].schoolName,
                    date: first?.date || defaultMatches[0].date,
                    time: first?.time || defaultMatches[0].time,
                    maps: first?.maps || defaultMatches[0].maps
                }, {
                    id: 'match-2',
                    group: second?.secondGroup || defaultMatches[1].group,
                    schoolName: second?.schoolName || defaultMatches[1].schoolName,
                    date: second?.secondDate || defaultMatches[1].date,
                    time: '10:00',
                    maps: second?.maps || defaultMatches[1].maps
                }];
                saveMatches(migrated);
                return migrated;
            }
        } catch (_) { /* ignore */ }
        return defaultMatches;
    }

    function saveMatches(matches) {
        localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    }

    // ============================================================
    // 4. RENDER MATCHES ON INDEX PAGE
    // ============================================================
    function renderMatches() {
        const list = document.querySelector('[data-upcoming-matches]');
        const now = Date.now();
        const matches = getMatches()
            .map(function (m) {
                return { match: m, ts: new Date(m.date + 'T' + m.time).getTime() };
            })
            .filter(function (e) { return Number.isFinite(e.ts) && e.ts >= now; })
            .sort(function (a, b) { return a.ts - b.ts; })
            .map(function (e) { return e.match; });

        const formatDate = function (m) {
            const d = new Date(m.date + 'T' + m.time);
            return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
        };

        const summary = document.querySelector('[data-next-match-summary]');
        if (summary) {
            summary.textContent = matches.length ?
                matches[0].group + ' · ' + formatDate(matches[0]) + ' · ' + matches[0].time :
                'No upcoming matches scheduled.';
        }

        if (!list) return;
        list.replaceChildren();
        if (!matches.length) {
            const empty = document.createElement('li');
            empty.className = 'match-item';
            empty.textContent = 'No upcoming matches scheduled.';
            list.appendChild(empty);
            return;
        }
        matches.forEach(function (m) {
            const li = document.createElement('li');
            li.className = 'match-item';
            const strong = document.createElement('strong');
            strong.textContent = m.group;
            const meta = document.createElement('span');
            meta.className = 'match-meta';
            meta.textContent = formatDate(m) + ' · ' + m.time;
            const school = document.createElement('span');
            school.className = 'match-school';
            school.textContent = m.schoolName || '';
            li.append(strong, meta, school);
            if (m.maps) {
                const link = document.createElement('a');
                link.href = m.maps;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = '📍 ' + (m.schoolName || 'Map');
                li.appendChild(link);
            }
            list.appendChild(li);
        });
    }

    // ============================================================
    // 5. VISITOR GATE – name + phone + OTP
    // ============================================================
    const visitorForm = document.getElementById('visitorForm');
    const otpForm = document.getElementById('otpForm');
    if (visitorForm && otpForm) {
        const visitorStep = document.getElementById('visitorStep');
        const otpStep = document.getElementById('otpStep');
        const formMessage = document.getElementById('formMessage');
        const otpMessage = document.getElementById('otpMessage');
        const phoneSummary = document.getElementById('phoneSummary');
        const demoOtp = document.getElementById('demoOtp');
        let generatedOtp = '';

        visitorForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name = document.getElementById('visitorName').value.trim();
            const phone = document.getElementById('visitorPhone').value.trim();

            if (!name || !phone) {
                formMessage.textContent = 'Please fill in both fields.';
                return;
            }
            sessionStorage.setItem('simhaVisitorName', name);
            sessionStorage.setItem('simhaVisitorPhone', phone);

            generatedOtp = '863254';
            phoneSummary.textContent = 'We generated a one-time code for ' + phone + '.';
            demoOtp.textContent = 'Demo OTP: ' + generatedOtp;
            formMessage.textContent = '';
            visitorStep.hidden = true;
            otpStep.hidden = false;
            document.getElementById('otp').focus();
        });

        otpForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const entered = document.getElementById('otp').value.trim();
            if (entered !== generatedOtp) {
                otpMessage.textContent = 'That OTP is incorrect. Please try again.';
                return;
            }
            // Save only name+phone for gate access
            const visitors = JSON.parse(localStorage.getItem(VISITORS_KEY) || '[]');
            visitors.push({
                id: 'visitor-' + Date.now(),
                name: sessionStorage.getItem('simhaVisitorName') || 'Unknown',
                phone: sessionStorage.getItem('simhaVisitorPhone') || 'Not provided',
                email: '',
                message: '',
                visitedAt: new Date().toISOString(),
                from: 'gate'
            });
            localStorage.setItem(VISITORS_KEY, JSON.stringify(visitors));
            sessionStorage.setItem('simhaVisitorVerified', 'true');
            window.location.replace('index.html');
        });
    }

    // ============================================================
    // 6. INDEX REGISTRATION FORM – full name, phone, email, message
    // ============================================================
    const regForm = document.getElementById('registerForm');
    if (regForm) {
        regForm.addEventListener('submit', function (e) {
            const name = document.getElementById('player-name').value.trim();
            const phone = document.getElementById('parent-phone').value.trim();
            const email = document.getElementById('parent-email').value.trim();
            const message = document.getElementById('player-message').value.trim();

            if (!name || !phone || !email) {
                document.getElementById('registrationMessage').textContent = 'Please fill in all required fields.';
                e.preventDefault();
                return;
            }

            // Save to localStorage
            const visitors = JSON.parse(localStorage.getItem(VISITORS_KEY) || '[]');
            visitors.push({
                id: 'reg-' + Date.now(),
                name: name,
                phone: phone,
                email: email,
                message: message || '',
                visitedAt: new Date().toISOString(),
                from: 'registration'
            });
            localStorage.setItem(VISITORS_KEY, JSON.stringify(visitors));

            const msg = document.getElementById('registrationMessage');
            if (msg) msg.textContent = '✅ Registration recorded. Check your email for confirmation.';

            // Allow form to submit via mailto (default action)
        });
    }

    // ============================================================
    // 7. INSTRUCTOR LOGIN & DASHBOARD
    // ============================================================
    const loginSection = document.getElementById('loginSection');
    const loginForm = document.getElementById('loginForm');
    const dashboard = document.getElementById('instructorDashboard');
    const visitorsList = document.getElementById('visitorsList');
    const registrationsList = document.getElementById('registrationsList');
    const matchManagerForm = document.getElementById('matchManagerForm');
    const managedMatches = document.getElementById('managedMatches');

    // ===== 7a. Render VISITORS (gate only – name + phone) =====
    function renderVisitors() {
        if (!visitorsList) return;
        const visitors = JSON.parse(localStorage.getItem(VISITORS_KEY) || '[]');
        // Only show gate entries (no email, from === 'gate')
        const gateVisitors = visitors.filter(function (v) { return v.from === 'gate' || (!v.email && !v.message); });
        visitorsList.replaceChildren();
        if (!gateVisitors.length) {
            const empty = document.createElement('li');
            empty.textContent = 'No gate visitors yet.';
            visitorsList.appendChild(empty);
            return;
        }
        gateVisitors.slice().reverse().forEach(function (v) {
            const li = document.createElement('li');
            li.dataset.id = v.id;

            const info = document.createElement('div');
            info.className = 'visitor-info';
            const name = document.createElement('strong');
            name.textContent = v.name;
            const detail = document.createElement('div');
            detail.className = 'visitor-detail';
            detail.textContent = v.phone + ' · ' + new Date(v.visitedAt).toLocaleString();
            info.append(name, detail);
            li.appendChild(info);

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-visitor';
            delBtn.innerHTML = '✕';
            delBtn.setAttribute('aria-label', 'Delete visitor');
            li.appendChild(delBtn);

            visitorsList.appendChild(li);
        });
    }

    // ===== 7b. Render REGISTRATIONS (full form – name, phone, email, message) =====
    function renderRegistrations() {
        if (!registrationsList) return;
        const visitors = JSON.parse(localStorage.getItem(VISITORS_KEY) || '[]');
        // Only show registration entries (have email, from === 'registration')
        const registrations = visitors.filter(function (v) { return v.from === 'registration' && v.email; });
        registrationsList.replaceChildren();
        if (!registrations.length) {
            const empty = document.createElement('li');
            empty.textContent = 'No registration requests yet.';
            registrationsList.appendChild(empty);
            return;
        }
        registrations.slice().reverse().forEach(function (v) {
            const li = document.createElement('li');
            li.dataset.id = v.id;

            const info = document.createElement('div');
            info.className = 'visitor-info';
            const name = document.createElement('strong');
            name.textContent = v.name;
            const detail = document.createElement('div');
            detail.className = 'visitor-detail';
            detail.textContent = v.phone + ' · ' + v.email + ' · ' + new Date(v.visitedAt).toLocaleString();
            info.append(name, detail);
            li.appendChild(info);

            if (v.message) {
                const msg = document.createElement('div');
                msg.className = 'visitor-message';
                msg.textContent = '📝 ' + v.message;
                li.appendChild(msg);
            }

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-visitor';
            delBtn.innerHTML = '✕';
            delBtn.setAttribute('aria-label', 'Delete registration');
            li.appendChild(delBtn);

            registrationsList.appendChild(li);
        });
    }

    // ===== 7c. Delete visitor (from either list) =====
    function setupDeleteListener(container) {
        if (!container) return;
        container.addEventListener('click', function (e) {
            const delBtn = e.target.closest('.delete-visitor');
            if (!delBtn) return;
            const li = delBtn.closest('li');
            if (!li) return;
            const id = li.dataset.id;
            if (!id) return;
            if (!confirm('Delete this entry?')) return;

            let visitors = JSON.parse(localStorage.getItem(VISITORS_KEY) || '[]');
            visitors = visitors.filter(function (v) { return v.id !== id; });
            localStorage.setItem(VISITORS_KEY, JSON.stringify(visitors));
            renderVisitors();
            renderRegistrations();
        });
    }
    setupDeleteListener(visitorsList);
    setupDeleteListener(registrationsList);

    // ===== 7d. Login form =====
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = document.getElementById('email').value.trim().toLowerCase();
            const pwd = document.getElementById('password').value.trim();
            const msg = document.getElementById('message');
            const ok = email === 'coach@simhaacademy.com' && pwd === '863254';
            msg.textContent = ok ? 'Login successful.' : 'Incorrect login details.';
            if (ok) {
                if (loginSection) loginSection.hidden = true;
                document.querySelector('.instructor-card').classList.add('dashboard-wide');
                if (dashboard) dashboard.hidden = false;
                renderVisitors();
                renderRegistrations();
                renderManagedMatches();
            }
        });
    }

    // ===== 7e. Render managed matches (for instructor) =====
    function renderManagedMatches() {
        if (!managedMatches) return;
        managedMatches.replaceChildren();
        getMatches().forEach(function (m) {
            const li = document.createElement('li');
            li.className = 'managed-match';
            li.innerHTML =
                '<input class="managed-match-group" type="text" value="' + escHtml(m.group) +
                '" aria-label="Match name">' +
                '<input class="managed-match-school-name" type="text" value="' + escHtml(m.schoolName || '') +
                '" placeholder="School name" aria-label="School name">' +
                '<input class="managed-match-date" type="date" value="' + m.date +
                '" aria-label="Match date">' +
                '<input class="managed-match-time" type="time" value="' + m.time +
                '" aria-label="Match time">' +
                '<input class="managed-match-maps" type="url" value="' + escHtml(m.maps || '') +
                '" placeholder="Maps URL" aria-label="Maps link">' +
                '<button type="button" class="save-match" data-match-id="' + m.id + '">Save</button>' +
                '<button type="button" class="delete-match" data-match-id="' + m.id + '">Delete</button>';
            managedMatches.appendChild(li);
        });
    }

    function escHtml(str) {
        return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ===== 7f. Add match =====
    if (matchManagerForm) {
        matchManagerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const matches = getMatches();
            matches.push({
                id: 'match-' + Date.now(),
                group: document.getElementById('managedMatchGroup').value.trim(),
                schoolName: document.getElementById('managedMatchSchoolName').value.trim(),
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

    // ===== 7g. Edit / delete match =====
    if (managedMatches) {
        managedMatches.addEventListener('click', function (e) {
            const id = e.target.dataset.matchId;
            if (!id) return;
            let matches = getMatches();
            const item = e.target.closest('.managed-match');
            if (e.target.classList.contains('delete-match')) {
                matches = matches.filter(function (m) { return m.id !== id; });
                saveMatches(matches);
                renderManagedMatches();
                renderMatches();
                return;
            }
            if (e.target.classList.contains('save-match')) {
                const match = matches.find(function (m) { return m.id === id; });
                if (!match) return;
                match.group = item.querySelector('.managed-match-group').value.trim();
                match.schoolName = item.querySelector('.managed-match-school-name').value.trim();
                match.date = item.querySelector('.managed-match-date').value;
                match.time = item.querySelector('.managed-match-time').value;
                match.maps = item.querySelector('.managed-match-maps').value.trim();
                saveMatches(matches);
                document.getElementById('matchManagerMessage').textContent = 'Match updated.';
                renderMatches();
            }
        });
    }

    // ============================================================
    // 8. REDIRECT: if not verified, send to visitor-login.html
    // ============================================================
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
        if (sessionStorage.getItem('simhaVisitorVerified') !== 'true') {
            window.location.replace('visitor-login.html');
        }
    }

    // ============================================================
    // 9. INITIAL RENDERS & AUTO-UPDATE
    // ============================================================
    renderMatches();
    setInterval(renderMatches, 30000);

    window.addEventListener('storage', function () {
        renderMatches();
        if (managedMatches) renderManagedMatches();
        if (visitorsList) renderVisitors();
        if (registrationsList) renderRegistrations();
    });

});