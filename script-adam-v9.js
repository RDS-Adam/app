/**
 * BOÎTE À OUTILS ADAM - EDITION PRO v9.2
 * 3 espaces : Salarié / Admin (mdp) / Adam (mdp)
 * Dropdown en bas à gauche pour switcher
 * Adam peut assigner les outils à chaque espace
 */
(function () {
    const _b = atob('aHR0cHM6Ly9yZHMtYWRhbS5naXRodWIuaW8vYXBwLw==');
    const _a = atob('aHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9SRFMtQWRhbS9hcHAvY29udGVudHMv');

    const WORKER_URL  = 'https://rds-github.cwmpw5qpc5.workers.dev';
    const PASS_ADMIN  = 'RH2026';
    const PASS_ADAM   = 'Adam2026';
    const CONFIG_FILE = 'config-outils.json';

    const SYSTEM_RE   = /index|robots|secure|bdd|noindex/i;
    const FIXED_FILES = ['Gestion des tournees.html'];

    const PWD_STORAGE_KEY  = 'rds_adam_pwd_v1';
    const IP_STORAGE_KEY   = 'rds_adam_ip_v1';
    const DATE_STORAGE_KEY = 'rds_adam_date_v1';

    // État de session
    let currentConfig  = { tools: {} };
    let configSha      = null;
    let allGithubTools = []; // { name, rawName, isDir }
    let currentSpace   = 'salarie';
    let unlockedSpaces = new Set(['salarie']); // espaces déverrouillés cette session

    const SPACES = {
        salarie: { label: '👤 Espace Salarié', color: '#4CAF50' },
        admin:   { label: '🏢 Espace Admin',   color: '#ff7200' },
        adam:    { label: '⚙ Espace Adam',     color: '#25737d' },
    };

    /* =========================================================
       MOT DE PASSE WORDPRESS
       ========================================================= */
    function handlePasswordForm() {
        const form = document.querySelector('.post-password-form');
        if (!form) return false;
        const pwdInput  = form.querySelector('input[type="password"]');
        const submitBtn = form.querySelector('input[type="submit"], button[type="submit"]');
        if (!pwdInput) return true;
        const savedPwd = localStorage.getItem(PWD_STORAGE_KEY);
        if (savedPwd) {
            pwdInput.value = savedPwd;
            setTimeout(() => { if (submitBtn) submitBtn.click(); else form.submit(); }, 50);
            return true;
        }
        injectRememberCheckbox(form, pwdInput, submitBtn);
        return true;
    }

    function injectRememberCheckbox(form, pwdInput, submitBtn) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap';
        document.head.appendChild(link);
        const style = document.createElement('style');
        style.innerHTML = `
            .rds-remember-wrap { font-family:'Poppins',sans-serif!important; margin:12px 0 8px; display:flex; align-items:center; gap:8px; font-size:14px; color:#1a1a1a; }
            .rds-remember-wrap input[type="checkbox"] { width:16px; height:16px; accent-color:#ff7200; cursor:pointer; }
            .rds-remember-wrap label { cursor:pointer; user-select:none; }
            .rds-remember-info { font-size:11px; color:#888; margin-top:4px; }
        `;
        document.head.appendChild(style);
        const wrap = document.createElement('div');
        wrap.className = 'rds-remember-wrap';
        wrap.innerHTML = `<input type="checkbox" id="rds-remember-pwd"><label for="rds-remember-pwd">Mémoriser le mot de passe sur cet ordinateur</label>`;
        const info = document.createElement('div');
        info.className = 'rds-remember-info';
        info.textContent = 'Enregistré uniquement sur ce poste.';
        if (submitBtn && submitBtn.parentNode) {
            submitBtn.parentNode.insertBefore(wrap, submitBtn);
            submitBtn.parentNode.insertBefore(info, submitBtn);
        } else { form.appendChild(wrap); form.appendChild(info); }
        form.addEventListener('submit', function () {
            try {
                const remember = document.getElementById('rds-remember-pwd');
                if (remember && remember.checked && pwdInput.value) {
                    localStorage.setItem(PWD_STORAGE_KEY, pwdInput.value);
                    localStorage.setItem(DATE_STORAGE_KEY, new Date().toISOString());
                    fetch('https://api.ipify.org?format=json').then(r=>r.json()).then(d=>{ if(d&&d.ip) localStorage.setItem(IP_STORAGE_KEY,d.ip); }).catch(()=>{});
                }
            } catch (e) {}
        }, true);
    }

    /* =========================================================
       CONFIG GITHUB
       ========================================================= */
    async function fetchConfig() {
        try {
            const r = await fetch(`${WORKER_URL}/repos/RDS-Adam/app/contents/${CONFIG_FILE}`, { headers: { 'Cache-Control': 'no-cache' } });
            if (!r.ok) return { tools: {} };
            const d = await r.json();
            configSha = d.sha;
            return JSON.parse(decodeURIComponent(escape(atob(d.content.replace(/\n/g, '')))));
        } catch (e) { return { tools: {} }; }
    }

    async function saveConfig(config) {
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(config, null, 2))));
        const body = { message: 'Update config-outils', content };
        if (configSha) body.sha = configSha;
        const r = await fetch(`${WORKER_URL}/repos/RDS-Adam/app/contents/${CONFIG_FILE}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        if (!r.ok) throw new Error(`Erreur ${r.status}`);
        const d = await r.json();
        configSha = d.content.sha;
    }

    /* =========================================================
       APP PRINCIPALE
       ========================================================= */
    function launchAdam() {
        if (document.querySelector('.post-password-form')) { handlePasswordForm(); return; }
        document.addEventListener('contextmenu', e => e.preventDefault());

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap';
        document.head.appendChild(link);

        const style = document.createElement('style');
        style.innerHTML = `
            * { font-family:'Poppins',sans-serif!important; -webkit-font-smoothing:antialiased; box-sizing:border-box; }
            #rds-app { position:fixed!important; top:0!important; left:0!important; width:100vw!important; height:100vh!important; display:flex!important; background:#fff!important; z-index:9999999!important; margin:0; padding:0; overflow:hidden; }

            /* Toggle bouton */
            #rds-toggle { position:absolute; top:15px; left:15px; z-index:10000001; width:38px; height:38px; background:#1a1a1a; border:1px solid rgba(255,255,255,0.1); border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.3s; color:#fff; }
            #rds-app.menu-hidden #rds-toggle { background:#fff; border-color:#eee; color:#1a1a1a; box-shadow:0 2px 10px rgba(0,0,0,0.1); }
            #rds-toggle svg { width:20px; height:20px; fill:none; stroke:currentColor; stroke-width:2.5; stroke-linecap:round; }

            /* Sidebar */
            #rds-sidebar { width:280px; background:#1a1a1a; color:#fff; display:flex; flex-direction:column; flex-shrink:0; transition:transform 0.3s cubic-bezier(0.4,0,0.2,1); position:relative; z-index:10000000; border-right:1px solid rgba(255,255,255,0.05); }
            #rds-app.menu-hidden #rds-sidebar { transform:translateX(-280px); margin-right:-280px; }

            /* Header sidebar */
            .side-header { padding:45px 25px 16px; }
            .side-header h2 { margin:0 0 2px; font-size:1.2rem; font-weight:600; letter-spacing:1px; color:#fff; }
            #space-label-display { font-size:0.65rem; text-transform:uppercase; letter-spacing:1.5px; font-weight:500; transition:color 0.3s; }

            /* Recherche */
            .search-container { padding:0 20px 14px; }
            #tool-search { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:8px 12px; color:#fff; font-size:0.75rem; outline:none; }
            #tool-search:focus { border-color:#ff7200; }

            /* Liste outils */
            .nav-list { flex-grow:1; overflow-y:auto; padding:8px 0; scrollbar-width:thin; scrollbar-color:#333 transparent; }
            .nav-item { display:flex; align-items:center; padding:10px 25px; cursor:pointer; transition:0.2s; color:rgba(255,255,255,0.6); font-size:0.8rem; border-left:3px solid transparent; }
            .nav-item:hover { background:rgba(255,255,255,0.05); color:#fff; }
            .nav-item.active { background:rgba(255,114,0,0.1); color:#ff7200; border-left-color:#ff7200; }
            .nav-item b { font-weight:400; }
            .nav-sep { padding:5px 25px 3px; font-size:0.55rem; text-transform:uppercase; letter-spacing:1.5px; color:rgba(255,255,255,0.18); }

            /* Section bas */
            #bottom-section { border-top:1px solid rgba(255,255,255,0.06); padding:12px 0 0; background:#1a1a1a; }

            /* DROPDOWN ESPACE */
            .space-switcher { padding:0 16px 12px; }
            .space-select-wrap { position:relative; }
            #space-select {
                width:100%; padding:10px 36px 10px 14px; border-radius:8px; cursor:pointer; outline:none;
                font-family:'Poppins',sans-serif; font-size:0.78rem; font-weight:500;
                background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12);
                color:#fff; -webkit-appearance:none; appearance:none; transition:border-color 0.2s;
            }
            #space-select:focus { border-color:#ff7200; }
            #space-select option { background:#222; color:#fff; }
            .space-chevron { position:absolute; right:12px; top:50%; transform:translateY(-50%); pointer-events:none; color:rgba(255,255,255,0.4); font-size:0.65rem; }

            /* Bouton oublier mdp */
            .nav-item-sm { padding:8px 25px; font-size:0.68rem; opacity:0.45; }
            .nav-item-sm:hover { opacity:0.8; }

            /* Footer */
            .side-footer { padding:10px 20px 18px; text-align:center; font-size:9px; color:rgba(255,255,255,0.25); }
            .status-dot { width:7px; height:7px; background:#4CAF50; border-radius:50%; display:inline-block; margin-right:4px; }

            /* Contenu principal */
            #rds-content { position:relative; flex-grow:1; height:100vh!important; overflow:hidden; }
            #welcome-screen { display:flex; align-items:center; justify-content:center; width:100%; height:100%; text-align:center; background:#fff; background-image:radial-gradient(#f0f0f0 1px,transparent 1px); background-size:20px 20px; }
            .welcome-box { max-width:400px; animation:fadeIn 0.6s ease; }
            .welcome-box h1 { color:#1a1a1a; font-size:1.4rem; font-weight:500; margin:0; line-height:1.4; }
            .welcome-box p { color:#888; font-size:0.85rem; margin-top:10px; }
            .rds-line { width:36px; height:3px; background:#ff7200; margin:18px auto; border-radius:2px; }

            #iframe-viewer { position:absolute; inset:0; display:none; }
            #target-frame { position:absolute; inset:0; width:100%!important; height:100%!important; border:none!important; }
            #loader-rds { position:absolute; inset:0; background:#fff; display:flex; align-items:center; justify-content:center; z-index:20; }
            .spinner-rds { width:28px; height:28px; border:3px solid #f0f0f0; border-top:3px solid #ff7200; border-radius:50%; animation:rdsRot 0.8s linear infinite; }

            @keyframes rdsRot { to{transform:rotate(360deg);} }
            @keyframes fadeIn { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }

            /* ── PANEL ADAM (gestion) ── */
            #adam-overlay { display:none; position:fixed; inset:0; z-index:10000100; background:rgba(0,0,0,0.5); align-items:center; justify-content:center; padding:20px; }
            #adam-overlay.open { display:flex; }
            #adam-panel { background:#fff; border-radius:14px; width:100%; max-width:660px; max-height:88vh; display:flex; flex-direction:column; box-shadow:0 24px 60px rgba(0,0,0,0.2); overflow:hidden; }
            #adam-panel-header { background:#1a1a1a; padding:18px 22px; display:flex; justify-content:space-between; align-items:flex-start; flex-shrink:0; }
            #adam-panel-header h3 { margin:0 0 3px; font-size:0.9rem; font-weight:500; color:#fff; }
            #adam-panel-header p { margin:0; font-size:0.62rem; color:rgba(255,255,255,0.4); }
            #adam-panel-body { flex:1; overflow-y:auto; }
            #adam-panel-footer { padding:14px 22px; border-top:1px solid #eee; display:flex; justify-content:space-between; align-items:center; flex-shrink:0; background:#fafafa; }
            #adam-save-info { font-size:0.7rem; color:#aaa; }

            /* Rows outils dans le panel */
            .p-section { padding:10px 22px 4px; font-size:0.58rem; text-transform:uppercase; letter-spacing:1px; color:#bbb; font-weight:600; border-top:1px solid #f0f0f0; margin-top:2px; }
            .p-section:first-child { border-top:none; }
            .tool-row { display:flex; align-items:center; gap:10px; padding:10px 22px; border-bottom:1px solid #f8f8f8; transition:background 0.15s; }
            .tool-row:hover { background:#fafafa; }
            .tool-row-name { flex:1; min-width:0; }
            .tn-file { font-size:0.58rem; color:#ccc; margin-bottom:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
            .tool-label-input { width:100%; border:none; border-bottom:1.5px solid #eee; padding:5px 0; font-size:0.82rem; font-family:'Poppins',sans-serif; color:#1a1a1a; outline:none; background:transparent; transition:border-color 0.2s; }
            .tool-label-input:focus { border-bottom-color:#ff7200; }
            .tool-label-input::placeholder { color:#ddd; }
            .space-tag-select {
                padding:5px 10px; border:1px solid #eee; border-radius:6px; font-family:'Poppins',sans-serif;
                font-size:0.72rem; color:#555; outline:none; cursor:pointer; background:#fff;
                -webkit-appearance:none; appearance:none; min-width:130px;
                background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%23aaa'/%3E%3C/svg%3E");
                background-repeat:no-repeat; background-position:right 8px center; padding-right:22px;
            }
            .space-tag-select:focus { border-color:#ff7200; }

            /* Boutons panel */
            .ab { cursor:pointer; font-family:'Poppins',sans-serif; font-weight:500; border-radius:6px; transition:all 0.2s; display:inline-flex; align-items:center; gap:5px; font-size:0.78rem; padding:8px 16px; border:none; }
            .ab-primary { background:#25737d; color:#fff; }
            .ab-primary:hover { background:#1d5f68; }
            .ab-primary:disabled { opacity:0.6; cursor:not-allowed; }
            .ab-ghost { background:transparent; border:1px solid #eee; color:#666; }
            .ab-ghost:hover { border-color:#ff7200; color:#ff7200; }

            @media (max-width:850px) {
                #rds-sidebar { position:fixed; height:100%; box-shadow:10px 0 30px rgba(0,0,0,0.25); }
                #rds-app.menu-hidden #rds-sidebar { transform:translateX(-100%); margin-right:0; }
            }
        `;
        document.head.appendChild(style);
        document.documentElement.style.overflow = 'hidden';
        document.body.style.margin = '0';

        document.body.innerHTML = `
            <div id="rds-app">
                <button id="rds-toggle" title="Menu">
                    <svg viewBox="0 0 24 24"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
                </button>

                <div id="rds-sidebar">
                    <div class="side-header">
                        <h2>ADAM</h2>
                        <div id="space-label-display" style="color:#4CAF50;">👤 Espace Salarié</div>
                    </div>

                    <div class="search-container">
                        <input type="text" id="tool-search" placeholder="Rechercher un outil…">
                    </div>

                    <div id="tool-list" class="nav-list">
                        <div class="nav-item" id="fixed-configurator"><b>🏠 Configurateur RDS</b></div>
                    </div>

                    <div id="bottom-section">
                        <div class="nav-item" id="tournee-manager"><b>🚚 Gestion des Tournées</b></div>

                        <!-- DROPDOWN ESPACE -->
                        <div class="space-switcher" style="margin-top:4px;">
                            <div class="space-select-wrap">
                                <select id="space-select">
                                    <option value="salarie">👤 Espace Salarié</option>
                                    <option value="admin">🏢 Espace Admin</option>
                                    <option value="adam">⚙ Espace Adam</option>
                                </select>
                                <span class="space-chevron">▼</span>
                            </div>
                        </div>

                        <div class="nav-item nav-item-sm" id="forget-pwd"><b>🔓 Oublier le mot de passe</b></div>

                        <div class="side-footer">
                            <span class="status-dot"></span> Système Opérationnel<br>
                            <span style="font-size:7px;opacity:0.6;letter-spacing:1px;">RUE DU STORE © 2026</span>
                        </div>
                    </div>
                </div>

                <div id="rds-content">
                    <div id="welcome-screen">
                        <div class="welcome-box">
                            <h1>Bienvenue sur la boîte à outils d'Adam</h1>
                            <div class="rds-line"></div>
                            <p>Sélectionnez un outil dans le menu de gauche.</p>
                        </div>
                    </div>
                    <div id="iframe-viewer">
                        <div id="loader-rds"><div class="spinner-rds"></div></div>
                        <iframe id="target-frame" src="about:blank" frameborder="0" allowfullscreen></iframe>
                    </div>
                </div>
            </div>

            <!-- PANEL GESTION ADAM -->
            <div id="adam-overlay">
                <div id="adam-panel">
                    <div id="adam-panel-header">
                        <div>
                            <h3>⚙ Gestion des outils — Espace Adam</h3>
                            <p>Assignez chaque outil à un espace · Renommez-les</p>
                        </div>
                        <button class="ab ab-ghost" onclick="closeAdamPanel()" style="color:rgba(255,255,255,0.5);border-color:rgba(255,255,255,0.15);">✕</button>
                    </div>
                    <div id="adam-panel-body">
                        <div style="padding:40px;text-align:center;color:#bbb;font-size:0.82rem;">Chargement…</div>
                    </div>
                    <div id="adam-panel-footer">
                        <span id="adam-save-info">Sauvegardé sur GitHub</span>
                        <div style="display:flex;gap:8px;">
                            <button class="ab ab-ghost" onclick="closeAdamPanel()">Fermer</button>
                            <button class="ab ab-primary" id="adam-save-btn" onclick="saveAdamConfig()">Enregistrer</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // ── Recherche ──
        document.getElementById('tool-search').oninput = function (e) {
            const val = e.target.value.toLowerCase();
            document.querySelectorAll('#tool-list .nav-item, #tool-list .nav-sep').forEach(el => {
                if (el.classList.contains('nav-sep')) { el.style.display = val ? 'none' : ''; return; }
                el.style.display = el.innerText.toLowerCase().includes(val) ? 'flex' : 'none';
            });
        };

        // ── Boutons fixes ──
        document.getElementById('fixed-configurator').onclick = function () {
            loadTool('https://prod.seriousframes.com/Configurateur_RDS/', this);
        };
        document.getElementById('tournee-manager').onclick = function () {
            loadTool(encodeURI(_b + 'Gestion des tournees.html'), this);
        };
        document.getElementById('forget-pwd').onclick = function () {
            if (confirm('Oublier le mot de passe enregistré sur cet ordinateur ?')) {
                localStorage.removeItem(PWD_STORAGE_KEY);
                localStorage.removeItem(IP_STORAGE_KEY);
                localStorage.removeItem(DATE_STORAGE_KEY);
                alert('Mot de passe oublié.');
            }
        };

        // ── Dropdown espace ──
        document.getElementById('space-select').onchange = async function () {
            const target = this.value;
            if (target === currentSpace) return;

            if (target === 'admin' && !unlockedSpaces.has('admin')) {
                const pwd = prompt('Code d\'accès Espace Admin :');
                if (pwd !== PASS_ADMIN) { this.value = currentSpace; return; }
                unlockedSpaces.add('admin');
            }
            if (target === 'adam' && !unlockedSpaces.has('adam')) {
                const pwd = prompt('Code d\'accès Espace Adam :');
                if (pwd !== PASS_ADAM) { this.value = currentSpace; return; }
                unlockedSpaces.add('adam');
            }

            currentSpace = target;
            updateSpaceUI();
            refreshSidebar();
        };

        document.getElementById('rds-toggle').onclick = e => { e.stopPropagation(); document.getElementById('rds-app').classList.toggle('menu-hidden'); };
        document.getElementById('rds-content').onclick = () => { if (window.innerWidth <= 850) document.getElementById('rds-app').classList.add('menu-hidden'); };
        document.getElementById('adam-overlay').onclick = e => { if (e.target.id === 'adam-overlay') closeAdamPanel(); };

        fetchTools();
    }

    /* =========================================================
       UI ESPACE
       ========================================================= */
    function updateSpaceUI() {
        const sp = SPACES[currentSpace];
        const lbl = document.getElementById('space-label-display');
        lbl.textContent = sp.label;
        lbl.style.color = sp.color;
    }

    /* =========================================================
       CHARGEMENT OUTILS GITHUB
       ========================================================= */
    async function fetchTools() {
        currentConfig = await fetchConfig();
        const r = await fetch(_a + '?t=' + Date.now()).catch(() => null);
        if (!r || !r.ok) return;
        const data = await r.json().catch(() => []);

        allGithubTools = [];
        data.forEach(item => {
            const isH = item.name.endsWith('.html'), isD = item.type === 'dir';
            if (!isH && !isD) return;
            if (SYSTEM_RE.test(item.name)) return;
            if (FIXED_FILES.includes(item.name)) return;
            const rawName = decodeURIComponent(item.name).replace('.html','').replace(/-/g,' ').replace(/_/g,' ');
            allGithubTools.push({ name: item.name, rawName, isDir: isD });
        });

        refreshSidebar();
    }

    /* =========================================================
       RAFRAÎCHIR LA SIDEBAR
       ========================================================= */
    function refreshSidebar() {
        const list   = document.getElementById('tool-list');
        const tools  = currentConfig.tools || {};

        // Vider les items dynamiques
        Array.from(list.querySelectorAll('.nav-item:not(#fixed-configurator), .nav-sep')).forEach(el => el.remove());

        const myTools = allGithubTools.filter(t => {
            const cfg = tools[t.name];
            const space = cfg ? cfg.space : 'salarie';
            return space === currentSpace;
        });

        myTools.forEach(tool => {
            const cfg   = tools[tool.name] || {};
            const label = cfg.label || tool.rawName;
            const el    = document.createElement('div');
            el.className = 'nav-item';
            el.innerHTML = `<b>${label}</b>`;
            let p = tool.name;
            if (tool.isDir) p += p.toLowerCase().includes('trapeze') ? '/triangles.html' : '/index.html';
            el.onclick = () => loadTool(_b + encodeURIComponent(p), el);
            list.appendChild(el);
        });

        // Bouton de gestion uniquement dans l'espace Adam
        if (currentSpace === 'adam') {
            if (myTools.length > 0) {
                const sep = document.createElement('div');
                sep.className = 'nav-sep';
                sep.textContent = '──────';
                list.appendChild(sep);
            }
            const mng = document.createElement('div');
            mng.className = 'nav-item';
            mng.style.color = '#25737d';
            mng.innerHTML = '<b>⚙ Gérer les espaces</b>';
            mng.onclick = openAdamPanel;
            list.appendChild(mng);
        }

        // Message si aucun outil
        if (myTools.length === 0 && currentSpace !== 'adam') {
            const empty = document.createElement('div');
            empty.style.cssText = 'padding:20px 25px;font-size:0.75rem;color:rgba(255,255,255,0.25);';
            empty.textContent = 'Aucun outil dans cet espace.';
            list.appendChild(empty);
        }
    }

    /* =========================================================
       CHARGEMENT D'UN OUTIL
       ========================================================= */
    function loadTool(url, element) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        element.classList.add('active');
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('iframe-viewer').style.display = 'block';
        document.getElementById('loader-rds').style.display = 'flex';
        const f = document.getElementById('target-frame');
        f.src = url;
        f.onload = () => document.getElementById('loader-rds').style.display = 'none';
        if (window.innerWidth <= 850) document.getElementById('rds-app').classList.add('menu-hidden');
    }

    /* =========================================================
       PANEL GESTION (ESPACE ADAM)
       ========================================================= */
    function openAdamPanel() {
        document.getElementById('adam-overlay').classList.add('open');
        renderAdamPanel();
    }

    window.closeAdamPanel = function () {
        document.getElementById('adam-overlay').classList.remove('open');
    };

    function renderAdamPanel() {
        const body  = document.getElementById('adam-panel-body');
        const tools = currentConfig.tools || {};
        body.innerHTML = '';

        if (allGithubTools.length === 0) {
            const msg = document.createElement('div');
            msg.style.cssText = 'padding:40px;text-align:center;color:#bbb;font-size:13px;';
            msg.textContent = 'Aucun outil détecté.';
            body.appendChild(msg);
            return;
        }

        const grouped = { salarie: [], admin: [], adam: [] };
        allGithubTools.forEach(t => {
            const sp = (tools[t.name] && tools[t.name].space) || 'salarie';
            if (grouped[sp]) grouped[sp].push(t); else grouped['salarie'].push(t);
        });

        const spaceInfo = [
            { key: 'salarie', label: '👤 Espace Salarié', desc: 'Visible par tous',       color: '#4CAF50' },
            { key: 'admin',   label: '🏢 Espace Admin',   desc: 'Accès par mot de passe',  color: '#ff7200' },
            { key: 'adam',    label: '⚙ Espace Adam',     desc: 'Ton espace privé',         color: '#25737d' },
        ];

        spaceInfo.forEach(({ key, label, desc, color }, si) => {
            const list = grouped[key] || [];

            // ── En-tête de section ──
            const sec = document.createElement('div');
            sec.style.cssText = `padding:10px 20px 6px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:${color};${si > 0 ? 'border-top:2px solid #f0f0f0;margin-top:4px;' : ''}`;
            sec.textContent = label + ' ';
            const sub = document.createElement('span');
            sub.style.cssText = 'color:#bbb;font-weight:400;text-transform:none;letter-spacing:0;';
            sub.textContent = `(${desc} · ${list.length} outil${list.length !== 1 ? 's' : ''})`;
            sec.appendChild(sub);
            body.appendChild(sec);

            if (list.length === 0) {
                const empty = document.createElement('div');
                empty.style.cssText = 'padding:5px 20px 10px;font-size:12px;color:#ccc;font-style:italic;';
                empty.textContent = 'Aucun outil assigné';
                body.appendChild(empty);
                return;
            }

            list.forEach(tool => {
                const cfg      = tools[tool.name] || {};
                const labelVal = cfg.label || '';

                // ── Ligne outil ──
                const row = document.createElement('div');
                row.style.cssText = 'display:flex;align-items:center;gap:14px;padding:10px 20px;border-bottom:1px solid #f5f5f5;background:#fff;';

                // Colonne gauche
                const left = document.createElement('div');
                left.style.cssText = 'flex:1;min-width:0;overflow:hidden;';

                // Nom affiché (rawName) en gras
                const nameEl = document.createElement('div');
                nameEl.style.cssText = 'font-size:13px;font-weight:500;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;';
                nameEl.textContent = tool.rawName;

                // Nom fichier (technique) en petit
                const fileEl = document.createElement('div');
                fileEl.style.cssText = 'font-size:10px;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:5px;';
                fileEl.textContent = tool.name;

                // Input renommage
                const inp = document.createElement('input');
                inp.type = 'text';
                inp.dataset.file = tool.name;
                inp.value = labelVal;
                inp.placeholder = 'Renommer… (laisser vide = nom auto)';
                inp.style.cssText = 'display:block;width:100%;border:none;border-bottom:1.5px solid #e8e8e8;padding:3px 0;font-size:12px;color:#555;background:transparent;outline:none;';
                inp.addEventListener('focus',  () => inp.style.borderBottomColor = '#ff7200');
                inp.addEventListener('blur',   () => inp.style.borderBottomColor = '#e8e8e8');

                left.appendChild(nameEl);
                left.appendChild(fileEl);
                left.appendChild(inp);

                // Select espace
                const sel = document.createElement('select');
                sel.dataset.file = tool.name;
                sel.style.cssText = 'flex-shrink:0;padding:7px 28px 7px 10px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;color:#333;background:#fff;cursor:pointer;outline:none;min-width:118px;-webkit-appearance:none;appearance:none;';
                [
                    { v: 'salarie', t: '👤 Salarié' },
                    { v: 'admin',   t: '🏢 Admin'   },
                    { v: 'adam',    t: '⚙ Adam'     },
                ].forEach(({ v, t }) => {
                    const opt = document.createElement('option');
                    opt.value = v; opt.textContent = t;
                    if (v === key) opt.selected = true;
                    sel.appendChild(opt);
                });
                sel.addEventListener('focus', () => sel.style.borderColor = '#ff7200');
                sel.addEventListener('blur',  () => sel.style.borderColor = '#e0e0e0');

                row.appendChild(left);
                row.appendChild(sel);
                body.appendChild(row);
            });
        });

        document.getElementById('adam-save-info').textContent = 'Sauvegardé sur GitHub';
        document.getElementById('adam-save-info').style.color = '#aaa';
    }

    window.saveAdamConfig = async function () {
        const btn  = document.getElementById('adam-save-btn');
        const info = document.getElementById('adam-save-info');
        btn.disabled = true; btn.textContent = 'Enregistrement…';
        try {
            const newTools = {};
            // Collecter les selects
            document.querySelectorAll('#adam-panel-body .space-tag-select[data-file]').forEach(sel => {
                newTools[sel.dataset.file] = { space: sel.value };
            });
            // Collecter les labels
            document.querySelectorAll('#adam-panel-body .tool-label-input[data-file]').forEach(inp => {
                const val = inp.value.trim();
                if (newTools[inp.dataset.file]) newTools[inp.dataset.file].label = val;
            });

            const newConfig = { tools: newTools };
            await saveConfig(newConfig);
            currentConfig = newConfig;

            renderAdamPanel();
            refreshSidebar();

            info.textContent = '✓ Enregistré ! Menus mis à jour.';
            info.style.color = '#2d9e6b';
            btn.textContent = '✓ Enregistré';
            setTimeout(() => {
                info.textContent = 'Sauvegardé sur GitHub';
                info.style.color = '#aaa';
                btn.textContent  = 'Enregistrer';
                btn.disabled     = false;
            }, 2500);
        } catch (e) {
            info.textContent = '❌ ' + e.message;
            info.style.color = '#e53935';
            btn.textContent  = 'Enregistrer';
            btn.disabled     = false;
        }
    };

    /* =========================================================
       INIT
       ========================================================= */
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', launchAdam);
    else launchAdam();
})();
