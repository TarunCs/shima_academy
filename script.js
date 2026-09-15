// ============================================================
// SAFE "READY" WRAPPER — works even if DOM is already loaded
// ============================================================
function ready(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

ready(function () {

    // ============================================================
    // 1. DARK MODE TOGGLE
    // ============================================================
    const toggleBtn = document.getElementById('darkModeToggle');
    const bodyEl = document.body;

    // Apply stored theme
    try {
        if (localStorage.getItem('simhaDarkMode') === 'dark') {
            bodyEl.classList.add('dark-mode');
            if (toggleBtn) toggleBtn.textContent = '☀️';
        }
    } catch (e) { /* localStorage blocked */ }

    // Attach click handler (works on tap & click)
    if (toggleBtn) {
        toggleBtn.setAttribute('type', 'button');
        toggleBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            bodyEl.classList.toggle('dark-mode');
            const isDark = bodyEl.classList.contains('dark-mode');
            toggleBtn.textContent = isDark ? '☀️' : '🌙';
            try {
                localStorage.setItem('simhaDarkMode', isDark ? 'dark' : 'light');
            } catch (err) { /* ignore */ }
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
        } catch (_) {}
        return defaultMatches;
    }
    function saveMatches(matches) {
        localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    }

    // ============================================================
    // 4. VISITORS – ensure every entry has an ID
    // ============================================================
    function getVisitorsWithIds() {
        const visitors = JSON.parse(localStorage.getItem(VISITORS_KEY) || '[]');
        let changed = false;
        visitors.forEach(function (v, idx) {
            if (!v.id) {
                v.id = 'v-' + (v.visitedAt ? new Date(v.visitedAt).getTime() : Date.now()) + '-' + idx;
                changed = true;
            }
        });
        if (changed) localStorage.setItem(VISITORS_KEY, JSON.stringify(visitors));
        return visitors;
    }

    // ============================================================
    // 5. RENDER MATCHES ON INDEX PAGE
    // ============================================================
    function renderMatches() {
        const list = document.querySelector('[data-upcoming-matches]');
        if (!list) return;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayTs = startOfToday.getTime();

        const all = getMatches().map(function (m) {
            const ts = new Date(m.date + 'T' + (m.time || '00:00')).getTime();
            return { match: m, ts: isNaN(ts) ? Infinity : ts };
        });

        const upcoming = all.filter(e => e.ts >= todayTs).sort((a, b) => a.ts - b.ts).map(e => e.match);
        const past = all.filter(e => e.ts < todayTs).sort((a, b) => b.ts - a.ts).map(e => e.match);
        const matches = upcoming.length ? upcoming : past;

        const formatDate = function (m) {
            const d = new Date(m.date + 'T' + (m.time || '00:00'));
            if (isNaN(d.getTime())) return m.date || 'TBD';
            return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
        };

        list.replaceChildren();

        if (!matches.length) {
            const empty = document.createElement('li');
            empty.className = 'match-item';
            empty.textContent = 'No Upcoming Matches Scheduled.';
            list.appendChild(empty);
            return;
        }

        matches.forEach(function (m) {
            const isPast = new Date(m.date + 'T' + (m.time || '00:00')).getTime() < todayTs;
            const li = document.createElement('li');
            li.className = 'match-item' + (isPast ? ' match-past' : '');

            const strong = document.createElement('strong');
            strong.textContent = m.group || 'Match';

            const meta = document.createElement('span');
            meta.className = 'match-meta';
            meta.textContent = formatDate(m) + ' · ' + (m.time || '') + (isPast ? ' · Completed' : '');

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
    // 6. VISITOR GATE – name + phone + OTP
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
        const backBtn = document.getElementById('backToVisitorBtn');
        let generatedOtp = '';

        visitorForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name = document.getElementById('visitorName').value.trim();
            const phone = document.getElementById('visitorPhone').value.trim();
            if (!name || !phone) {
                formMessage.textContent = 'Please Fill In Both Fields.';
                return;
            }
            sessionStorage.setItem('simhaVisitorName', name);
            sessionStorage.setItem('simhaVisitorPhone', phone);
            generatedOtp = '863254';
            phoneSummary.textContent = 'We Generated A One-Time Code For ' + phone + '.';
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
                otpMessage.textContent = 'That OTP Is Incorrect. Please Try Again.';
                return;
            }
            const visitors = JSON.parse(localStorage.getItem(VISITORS_KEY) || '[]');
            visitors.push({
                id: 'visitor-' + Date.now(),
                name: sessionStorage.getItem('simhaVisitorName') || 'Unknown',
                phone: sessionStorage.getItem('simhaVisitorPhone') || 'Not Provided',
                email: '',
                message: '',
                visitedAt: new Date().toISOString(),
                from: 'gate'
            });
            localStorage.setItem(VISITORS_KEY, JSON.stringify(visitors));
            localStorage.setItem('simhaVisitorVerified', 'true');
            window.location.replace('index.html');
        });

        if (backBtn) {
            backBtn.addEventListener('click', function () {
                otpStep.hidden = true;
                visitorStep.hidden = false;
                formMessage.textContent = '';
                otpMessage.textContent = '';
            });
        }
    }

    // ============================================================
    // 7. INDEX REGISTRATION FORM
    // ============================================================
    const regForm = document.getElementById('registerForm');
    if (regForm) {
        regForm.addEventListener('submit', function (e) {
            const name = document.getElementById('player-name').value.trim();
            const phone = document.getElementById('parent-phone').value.trim();
            const email = document.getElementById('parent-email').value.trim();
            const message = document.getElementById('player-message').value.trim();

            if (!name || !phone || !email) {
                document.getElementById('registrationMessage').textContent = 'Please Fill In All Required Fields.';
                e.preventDefault();
                return;
            }

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
            if (msg) msg.textContent = '✅ Registration Recorded. Check Your Email For Confirmation.';
        });
    }

    // ============================================================
    // 8. INSTRUCTOR LOGIN & DASHBOARD
    // ============================================================
    const loginSection = document.getElementById('loginSection');
    const loginForm = document.getElementById('loginForm');
    const dashboard = document.getElementById('instructorDashboard');
    const visitorsList = document.getElementById('visitorsList');
    const registrationsList = document.getElementById('registrationsList');
    const matchManagerForm = document.getElementById('matchManagerForm');
    const managedMatches = document.getElementById('managedMatches');

    // ---- 8a. Render VISITORS (gate only) ----
    function renderVisitors() {
        if (!visitorsList) return;
        const visitors = getVisitorsWithIds();
        const gateVisitors = visitors.filter(v => v.from === 'gate' || (!v.email && !v.message));
        visitorsList.replaceChildren();
        if (!gateVisitors.length) {
            const empty = document.createElement('li');
            empty.textContent = 'No Gate Visitors Yet.';
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
            delBtn.setAttribute('aria-label', 'Delete Visitor');
            li.appendChild(delBtn);
            visitorsList.appendChild(li);
        });
    }

    // ---- 8b. Render REGISTRATIONS ----
    function renderRegistrations() {
        if (!registrationsList) return;
        const visitors = getVisitorsWithIds();
        const registrations = visitors.filter(v => v.from === 'registration' || (v.email && v.from !== 'gate'));
        registrationsList.replaceChildren();
        if (!registrations.length) {
            const empty = document.createElement('li');
            empty.textContent = 'No Registration Requests Yet.';
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
            delBtn.setAttribute('aria-label', 'Delete Registration');
            li.appendChild(delBtn);
            registrationsList.appendChild(li);
        });
    }

    // ---- 8c. Delete listener (works on both lists) ----
    function setupDeleteListener(container) {
        if (!container) return;
        container.addEventListener('click', function (e) {
            const delBtn = e.target.closest('.delete-visitor');
            if (!delBtn) return;
            const li = delBtn.closest('li');
            if (!li) return;
            const id = li.dataset.id;
            if (!id || id === 'undefined') {
                alert('This Entry Has No ID. Try Refreshing The Page.');
                return;
            }
            if (!confirm('Delete This Entry?')) return;
            let visitors = JSON.parse(localStorage.getItem(VISITORS_KEY) || '[]');
            visitors = visitors.filter(v => String(v.id) !== String(id));
            localStorage.setItem(VISITORS_KEY, JSON.stringify(visitors));
            renderVisitors();
            renderRegistrations();
        });
    }
    setupDeleteListener(visitorsList);
    setupDeleteListener(registrationsList);

    // ---- 8d. Login ----
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = document.getElementById('email').value.trim().toLowerCase();
            const pwd = document.getElementById('password').value.trim();
            const msg = document.getElementById('message');
            const ok = email === 'coach@simhaacademy.com' && pwd === '863254';
            msg.textContent = ok ? 'Login Successful.' : 'Incorrect Login Details.';
            if (ok) {
                if (loginSection) loginSection.hidden = true;
                document.querySelector('.instructor-card').classList.add('dashboard-wide');
                if (dashboard) dashboard.hidden = false;
                renderVisitors();
                renderRegistrations();
                renderManagedMatches();
                renderPreviewMatches();
            }
        });
    }

    // ---- 8e. Render managed matches (editable list) ----
    function renderManagedMatches() {
        if (!managedMatches) return;
        managedMatches.replaceChildren();
        getMatches().forEach(function (m) {
            const li = document.createElement('li');
            li.className = 'managed-match';
            li.innerHTML =
                '<input class="managed-match-group" type="text" value="' + escHtml(m.group) + '" aria-label="Match Name">' +
                '<input class="managed-match-school-name" type="text" value="' + escHtml(m.schoolName || '') + '" placeholder="School Name">' +
                '<input class="managed-match-date" type="date" value="' + m.date + '" aria-label="Date">' +
                '<input class="managed-match-time" type="time" value="' + m.time + '" aria-label="Time">' +
                '<input class="managed-match-maps" type="url" value="' + escHtml(m.maps || '') + '" placeholder="Maps URL">' +
                '<button type="button" class="save-match" data-match-id="' + m.id + '">Save</button>' +
                '<button type="button" class="delete-match" data-match-id="' + m.id + '">Delete</button>';
            managedMatches.appendChild(li);
        });
    }

    // ---- 8f. Live preview of index page matches ----
    function renderPreviewMatches() {
        const list = document.getElementById('previewMatchesGrid');
        if (!list) return;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayTs = startOfToday.getTime();

        const all = getMatches().map(function (m) {
            const ts = new Date(m.date + 'T' + (m.time || '00:00')).getTime();
            return { match: m, ts: isNaN(ts) ? Infinity : ts };
        });

        const upcoming = all.filter(e => e.ts >= todayTs).sort((a, b) => a.ts - b.ts).map(e => e.match);
        const past = all.filter(e => e.ts < todayTs).sort((a, b) => b.ts - a.ts).map(e => e.match);
        const matches = upcoming.length ? upcoming : past;

        const formatDate = function (m) {
            const d = new Date(m.date + 'T' + (m.time || '00:00'));
            if (isNaN(d.getTime())) return m.date || 'TBD';
            return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
        };

        list.replaceChildren();

        if (!matches.length) {
            const empty = document.createElement('li');
            empty.className = 'match-item';
            empty.textContent = 'No Upcoming Matches Scheduled.';
            list.appendChild(empty);
            return;
        }

        matches.forEach(function (m) {
            const isPast = new Date(m.date + 'T' + (m.time || '00:00')).getTime() < todayTs;
            const li = document.createElement('li');
            li.className = 'match-item' + (isPast ? ' match-past' : '');

            const strong = document.createElement('strong');
            strong.textContent = m.group || 'Match';

            const meta = document.createElement('span');
            meta.className = 'match-meta';
            meta.textContent = formatDate(m) + ' · ' + (m.time || '') + (isPast ? ' · Completed' : '');

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

    function escHtml(str) {
        return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ---- 8g. Add match ----
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
            document.getElementById('matchManagerMessage').textContent = 'Upcoming Match Added.';
            renderManagedMatches();
            renderPreviewMatches();
        });
    }

    // ---- 8h. Edit / delete match ----
    if (managedMatches) {
        managedMatches.addEventListener('click', function (e) {
            const id = e.target.dataset.matchId;
            if (!id) return;
            let matches = getMatches();
            const item = e.target.closest('.managed-match');
            if (e.target.classList.contains('delete-match')) {
                matches = matches.filter(m => m.id !== id);
                saveMatches(matches);
                renderManagedMatches();
                renderPreviewMatches();
                return;
            }
            if (e.target.classList.contains('save-match')) {
                const match = matches.find(m => m.id === id);
                if (!match) return;
                match.group = item.querySelector('.managed-match-group').value.trim();
                match.schoolName = item.querySelector('.managed-match-school-name').value.trim();
                match.date = item.querySelector('.managed-match-date').value;
                match.time = item.querySelector('.managed-match-time').value;
                match.maps = item.querySelector('.managed-match-maps').value.trim();
                saveMatches(matches);
                document.getElementById('matchManagerMessage').textContent = 'Match Updated.';
                renderManagedMatches();
                renderPreviewMatches();
            }
        });
    }

    // ============================================================
    // 9. REDIRECT IF NOT VERIFIED
    // ============================================================
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
        if (localStorage.getItem('simhaVisitorVerified') !== 'true') {
            window.location.replace('visitor-login.html');
        }
    }

    // ============================================================
    // 10. INITIAL RENDERS & AUTO-UPDATE
    // ============================================================
    renderMatches();
    setInterval(renderMatches, 30000);

    window.addEventListener('storage', function () {
        renderMatches();
        if (managedMatches) renderManagedMatches();
        if (visitorsList) renderVisitors();
        if (registrationsList) renderRegistrations();
        if (document.getElementById('previewMatchesGrid')) renderPreviewMatches();
    });

});