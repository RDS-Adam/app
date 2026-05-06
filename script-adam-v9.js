/**
 * BOÎTE À OUTILS ADAM v9.3
 * 3 espaces : Salarié / Admin (RH2026) / Adam (Adam2026)
 * Dropdown switcher en bas à gauche
 */
(function () {
    const BASE_URL   = atob('aHR0cHM6Ly9yZHMtYWRhbS5naXRodWIuaW8vYXBwLw==');
    const API_URL    = atob('aHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9SRFMtQWRhbS9hcHAvY29udGVudHMv');
    const WORKER     = 'https://rds-github.cwmpw5qpc5.workers.dev';
    const PASS_ADMIN = 'RH2026';
    const PASS_ADAM  = 'Adam2026';
    const CONFIG     = 'config-outils.json';
    const SYSTEM_RE  = /index|robots|secure|bdd|noindex/i;
    const FIXED      = ['Gestion des tournees.html'];
    const PWD_KEY    = 'rds_adam_pwd_v1';

    let config        = { tools: {} };   // { "file.html": { space, label } }
    let configSha     = null;
    let tools         = [];              // [{ name, label, isDir }]
    let currentSpace  = 'salarie';
    let unlocked      = new Set(['salarie']);

    /* ── GitHub ── */
    async function loadConfig() {
        try {
            const r = await fetch(`${WORKER}/repos/RDS-Adam/app/contents/${CONFIG}`, { headers: { 'Cache-Control': 'no-cache' } });
            if (!r.ok) return { tools: {} };
            const d = await r.json();
            configSha = d.sha;
            return JSON.parse(decodeURIComponent(escape(atob(d.content.replace(/\n/g,'')))));
        } catch { return { tools: {} }; }
    }

    async function saveConfigToGitHub(newConfig) {
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(newConfig, null, 2))));
        const body = JSON.stringify({ message: 'Update config', content, sha: configSha });
        const r = await fetch(`${WORKER}/repos/RDS-Adam/app/contents/${CONFIG}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body
        });
        if (!r.ok) throw new Error('Sauvegarde échouée (' + r.status + ')');
        configSha = (await r.json()).content.sha;
    }

    async function loadTools() {
        const r = await fetch(API_URL + '?t=' + Date.now()).catch(() => null);
        if (!r || !r.ok) return;
        const data = await r.json().catch(() => []);
        tools = [];
        data.forEach(item => {
            const isH = item.name.endsWith('.html');
            const isD = item.type === 'dir';
            if (!isH && !isD) return;
            if (SYSTEM_RE.test(item.name)) return;
            if (FIXED.includes(item.name)) return;
            const label = decodeURIComponent(item.name).replace('.html','').replace(/[-_]/g,' ');
            tools.push({ name: item.name, label, isDir: isD });
        });
    }

    /* ── Sidebar ── */
    function getToolSpace(name) {
        return (config.tools[name] && config.tools[name].space) || 'salarie';
    }
    function getToolLabel(name) {
        const t = tools.find(x => x.name === name);
        return (config.tools[name] && config.tools[name].label) || (t ? t.label : name);
    }

    function refreshSidebar() {
        const list = document.getElementById('rds-tool-list');
        Array.from(list.querySelectorAll('.rds-nav-item:not(#rds-fixed-config), .rds-nav-sep')).forEach(e => e.remove());

        const spaceTools = tools.filter(t => getToolSpace(t.name) === currentSpace);

        spaceTools.forEach(tool => {
            const el = document.createElement('div');
            el.className = 'rds-nav-item';
            el.textContent = getToolLabel(tool.name);
            let path = tool.name;
            if (tool.isDir) path += path.toLowerCase().includes('trapeze') ? '/triangles.html' : '/index.html';
            el.onclick = () => openTool(BASE_URL + encodeURIComponent(path), el);
            list.appendChild(el);
        });

        if (currentSpace === 'adam') {
            if (spaceTools.length) {
                const sep = document.createElement('div');
                sep.className = 'rds-nav-sep';
                list.appendChild(sep);
            }
            const btn = document.createElement('div');
            btn.className = 'rds-nav-item rds-manage-btn';
            btn.textContent = '⚙ Gérer les espaces';
            btn.onclick = openPanel;
            list.appendChild(btn);
        }

        if (!spaceTools.length && currentSpace !== 'adam') {
            const empty = document.createElement('div');
            empty.className = 'rds-empty';
            empty.textContent = 'Aucun outil dans cet espace.';
            list.appendChild(empty);
        }

        // Couleur du label espace
        const colors = { salarie: '#4CAF50', admin: '#ff7200', adam: '#25737d' };
        const labels = { salarie: '👤 Espace Salarié', admin: '🏢 Espace Admin', adam: '⚙ Espace Adam' };
        const lbl = document.getElementById('rds-space-lbl');
        lbl.textContent = labels[currentSpace];
        lbl.style.color = colors[currentSpace];
    }

    /* ── Panel de gestion ── */
    function openPanel() {
        document.getElementById('rds-panel-overlay').style.display = 'flex';
        renderPanel();
    }
    function closePanel() {
        document.getElementById('rds-panel-overlay').style.display = 'none';
    }

    function renderPanel() {
        const body = document.getElementById('rds-panel-body');
        body.innerHTML = '';

        if (!tools.length) {
            body.innerHTML = '<p style="padding:30px;text-align:center;color:#aaa;">Aucun outil chargé.</p>';
            return;
        }

        // ── Table simple ──
        const table = document.createElement('table');
        table.style.cssText = 'width:100%;border-collapse:collapse;';

        // Header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background:#f7f7f7;">
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #eee;">Outil</th>
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #eee;width:160px;">Nom affiché</th>
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #eee;width:140px;">Espace</th>
            </tr>`;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        tools.forEach((tool, i) => {
            const currentCfg = config.tools[tool.name] || {};
            const space = currentCfg.space || 'salarie';
            const lbl   = currentCfg.label || '';

            const tr = document.createElement('tr');
            tr.style.cssText = i % 2 === 0 ? 'background:#fff;' : 'background:#fafafa;';

            // Col 1 : nom du fichier
            const td1 = document.createElement('td');
            td1.style.cssText = 'padding:11px 16px;border-bottom:1px solid #f0f0f0;';
            const nameDiv = document.createElement('div');
            nameDiv.style.cssText = 'font-size:13px;font-weight:500;color:#222;';
            nameDiv.textContent = tool.label;        // nom lisible
            const fileDiv = document.createElement('div');
            fileDiv.style.cssText = 'font-size:10px;color:#aaa;margin-top:2px;';
            fileDiv.textContent = tool.name;         // nom fichier
            td1.appendChild(nameDiv);
            td1.appendChild(fileDiv);

            // Col 2 : input label
            const td2 = document.createElement('td');
            td2.style.cssText = 'padding:11px 16px;border-bottom:1px solid #f0f0f0;';
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.value = lbl;
            inp.placeholder = tool.label;
            inp.dataset.file = tool.name;
            inp.dataset.role = 'label';
            inp.style.cssText = 'width:100%;border:1px solid #e0e0e0;border-radius:5px;padding:6px 8px;font-size:12px;color:#333;font-family:inherit;outline:none;box-sizing:border-box;';
            inp.onfocus = () => inp.style.borderColor = '#ff7200';
            inp.onblur  = () => inp.style.borderColor = '#e0e0e0';
            td2.appendChild(inp);

            // Col 3 : select espace
            const td3 = document.createElement('td');
            td3.style.cssText = 'padding:11px 16px;border-bottom:1px solid #f0f0f0;';
            const sel = document.createElement('select');
            sel.dataset.file = tool.name;
            sel.dataset.role = 'space';
            sel.style.cssText = 'width:100%;border:1px solid #e0e0e0;border-radius:5px;padding:6px 8px;font-size:12px;color:#333;font-family:inherit;outline:none;cursor:pointer;background:#fff;';
            sel.onfocus = () => sel.style.borderColor = '#ff7200';
            sel.onblur  = () => sel.style.borderColor = '#e0e0e0';
            [
                { v: 'salarie', t: '👤 Salarié' },
                { v: 'admin',   t: '🏢 Admin'   },
                { v: 'adam',    t: '⚙ Adam'     },
            ].forEach(({ v, t }) => {
                const o = document.createElement('option');
                o.value = v; o.textContent = t;
                if (v === space) o.selected = true;
                sel.appendChild(o);
            });
            td3.appendChild(sel);

            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        body.appendChild(table);
    }

    async function savePanel() {
        const btn  = document.getElementById('rds-panel-save');
        const info = document.getElementById('rds-panel-info');
        btn.disabled = true; btn.textContent = 'Enregistrement…';

        try {
            const newTools = {};
            // Lire tous les selects [data-role="space"]
            document.querySelectorAll('#rds-panel-body select[data-role="space"]').forEach(sel => {
                newTools[sel.dataset.file] = { space: sel.value };
            });
            // Lire tous les inputs [data-role="label"]
            document.querySelectorAll('#rds-panel-body input[data-role="label"]').forEach(inp => {
                const v = inp.value.trim();
                if (newTools[inp.dataset.file]) newTools[inp.dataset.file].label = v;
            });

            await saveConfigToGitHub({ tools: newTools });
            config = { tools: newTools };

            refreshSidebar();
            info.textContent = '✓ Enregistré — barre latérale mise à jour';
            info.style.color = '#2d9e6b';
            btn.textContent = '✓ OK';
            setTimeout(() => {
                info.textContent = 'Sauvegardé sur GitHub';
                info.style.color = '#aaa';
                btn.textContent = 'Enregistrer';
                btn.disabled = false;
            }, 2500);
        } catch (e) {
            info.textContent = '❌ ' + e.message;
            info.style.color = '#e53935';
            btn.textContent = 'Enregistrer';
            btn.disabled = false;
        }
    }

    /* ── Charger un outil ── */
    function openTool(url, el) {
        document.querySelectorAll('.rds-nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
        document.getElementById('rds-welcome').style.display = 'none';
        document.getElementById('rds-iframe-wrap').style.display = 'block';
        document.getElementById('rds-loader').style.display = 'flex';
        const f = document.getElementById('rds-frame');
        f.src = url;
        f.onload = () => document.getElementById('rds-loader').style.display = 'none';
        if (window.innerWidth <= 850) document.getElementById('rds-app').classList.add('menu-hidden');
    }

    /* ── WP password form ── */
    function handlePasswordForm() {
        const form = document.querySelector('.post-password-form');
        if (!form) return false;
        const inp = form.querySelector('input[type="password"]');
        const btn = form.querySelector('input[type="submit"], button[type="submit"]');
        if (!inp) return true;
        const saved = localStorage.getItem(PWD_KEY);
        if (saved) { inp.value = saved; setTimeout(() => btn ? btn.click() : form.submit(), 50); return true; }
        // Checkbox mémoriser
        const wrap = document.createElement('div');
        wrap.style.cssText = 'margin:10px 0;display:flex;align-items:center;gap:8px;font-size:13px;';
        wrap.innerHTML = '<input type="checkbox" id="_rds_rem"> <label for="_rds_rem">Mémoriser sur cet ordinateur</label>';
        (btn ? btn.parentNode : form).insertBefore(wrap, btn || null);
        form.addEventListener('submit', () => {
            const cb = document.getElementById('_rds_rem');
            if (cb && cb.checked && inp.value) localStorage.setItem(PWD_KEY, inp.value);
        }, true);
        return true;
    }

    /* ── App ── */
    function launch() {
        if (document.querySelector('.post-password-form')) { handlePasswordForm(); return; }
        document.addEventListener('contextmenu', e => e.preventDefault());

        // Google Fonts
        const lnk = document.createElement('link');
        lnk.rel = 'stylesheet';
        lnk.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap';
        document.head.appendChild(lnk);

        // Styles
        const st = document.createElement('style');
        st.textContent = `
* { font-family: 'Poppins', sans-serif !important; box-sizing: border-box; }
#rds-app { position:fixed !important; inset:0; display:flex !important; z-index:9999999 !important; overflow:hidden; margin:0; padding:0; background:#fff; }

/* Toggle */
#rds-toggle { position:absolute; top:14px; left:14px; z-index:10000001; width:38px; height:38px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,.12); background:#1a1a1a; color:#fff; transition:.25s; }
#rds-app.menu-hidden #rds-toggle { background:#fff; border-color:#ddd; color:#222; box-shadow:0 2px 8px rgba(0,0,0,.12); }
#rds-toggle svg { width:20px; height:20px; fill:none; stroke:currentColor; stroke-width:2.5; stroke-linecap:round; }

/* Sidebar */
#rds-sidebar { width:272px; flex-shrink:0; background:#1a1a1a; display:flex; flex-direction:column; transition:transform .3s cubic-bezier(.4,0,.2,1); position:relative; z-index:10000000; }
#rds-app.menu-hidden #rds-sidebar { transform:translateX(-272px); margin-right:-272px; }

.rds-side-header { padding:44px 22px 14px; }
.rds-side-header h2 { margin:0 0 3px; font-size:1.15rem; font-weight:600; letter-spacing:1px; color:#fff; }
#rds-space-lbl { font-size:.6rem; font-weight:500; text-transform:uppercase; letter-spacing:1.5px; color:#4CAF50; }

.rds-search { padding:0 18px 12px; }
.rds-search input { width:100%; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:6px; padding:8px 11px; color:#fff; font-size:.75rem; outline:none; }
.rds-search input:focus { border-color:#ff7200; }
.rds-search input::placeholder { color:rgba(255,255,255,.3); }

#rds-tool-list { flex:1; overflow-y:auto; padding:6px 0; scrollbar-width:thin; scrollbar-color:#333 transparent; }
.rds-nav-item { padding:10px 22px; cursor:pointer; font-size:.8rem; color:rgba(255,255,255,.6); border-left:3px solid transparent; transition:.15s; }
.rds-nav-item:hover { background:rgba(255,255,255,.05); color:#fff; }
.rds-nav-item.active { color:#ff7200; background:rgba(255,114,0,.1); border-left-color:#ff7200; }
.rds-manage-btn { color:#25737d !important; }
.rds-manage-btn:hover { color:#25737d !important; background:rgba(37,115,125,.08) !important; }
.rds-nav-sep { height:1px; background:rgba(255,255,255,.07); margin:6px 0; }
.rds-empty { padding:16px 22px; font-size:.75rem; color:rgba(255,255,255,.22); }

/* Bottom */
#rds-bottom { border-top:1px solid rgba(255,255,255,.07); padding:10px 0 0; }
.rds-space-wrap { padding:8px 16px 10px; }
#rds-space-select { width:100%; padding:9px 32px 9px 12px; border-radius:8px; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.07); color:#fff; font-size:.78rem; font-weight:500; cursor:pointer; outline:none; -webkit-appearance:none; appearance:none; }
#rds-space-select option { background:#222; }
.rds-space-arrow { position:absolute; right:10px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,.35); font-size:.6rem; pointer-events:none; }
.rds-space-rel { position:relative; }
.rds-forget { padding:6px 22px 8px; font-size:.68rem; color:rgba(255,255,255,.3); cursor:pointer; }
.rds-forget:hover { color:rgba(255,255,255,.6); }
.rds-foot { padding:10px 18px 18px; text-align:center; font-size:9px; color:rgba(255,255,255,.22); }
.rds-dot { width:7px; height:7px; background:#4CAF50; border-radius:50%; display:inline-block; margin-right:4px; }

/* Contenu */
#rds-content { flex:1; position:relative; overflow:hidden; }
#rds-welcome { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:#fff; background-image:radial-gradient(#efefef 1px,transparent 1px); background-size:20px 20px; text-align:center; }
.rds-welcome-inner h1 { font-size:1.4rem; font-weight:500; color:#1a1a1a; margin:0; line-height:1.4; }
.rds-welcome-inner p { font-size:.85rem; color:#999; margin-top:10px; }
.rds-line { width:36px; height:3px; background:#ff7200; border-radius:2px; margin:16px auto; }
#rds-iframe-wrap { position:absolute; inset:0; display:none; }
#rds-frame { position:absolute; inset:0; width:100% !important; height:100% !important; border:none !important; }
#rds-loader { position:absolute; inset:0; background:#fff; display:flex; align-items:center; justify-content:center; z-index:10; }
.rds-spinner { width:28px; height:28px; border:3px solid #eee; border-top-color:#ff7200; border-radius:50%; animation:rds-spin .8s linear infinite; }
@keyframes rds-spin { to { transform:rotate(360deg); } }

/* Panel */
#rds-panel-overlay { display:none; position:fixed; inset:0; z-index:10001000; background:rgba(0,0,0,.5); align-items:center; justify-content:center; padding:20px; }
#rds-panel { background:#fff; border-radius:12px; width:100%; max-width:700px; max-height:88vh; display:flex; flex-direction:column; box-shadow:0 20px 50px rgba(0,0,0,.2); overflow:hidden; }
#rds-panel-head { background:#1a1a1a; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; flex-shrink:0; }
#rds-panel-head h3 { margin:0; font-size:.9rem; font-weight:500; color:#fff; }
#rds-panel-head p  { margin:3px 0 0; font-size:.62rem; color:rgba(255,255,255,.4); }
#rds-panel-body { flex:1; overflow-y:auto; }
#rds-panel-foot { padding:12px 20px; border-top:1px solid #eee; display:flex; justify-content:space-between; align-items:center; flex-shrink:0; background:#fafafa; }
#rds-panel-info { font-size:.7rem; color:#aaa; }
.rds-btn { cursor:pointer; font-family:inherit; font-weight:500; border-radius:6px; border:none; font-size:.78rem; padding:8px 16px; transition:.2s; display:inline-flex; align-items:center; gap:5px; }
.rds-btn-primary { background:#25737d; color:#fff; }
.rds-btn-primary:hover { background:#1d5f68; }
.rds-btn-primary:disabled { opacity:.6; cursor:not-allowed; }
.rds-btn-ghost { background:transparent; border:1px solid #ddd; color:#555; }
.rds-btn-ghost:hover { border-color:#ff7200; color:#ff7200; }
.rds-btn-close { background:transparent; border:1px solid rgba(255,255,255,.2); color:rgba(255,255,255,.6); }
.rds-btn-close:hover { border-color:#fff; color:#fff; }

@media (max-width:850px) {
    #rds-sidebar { position:fixed; height:100%; box-shadow:10px 0 30px rgba(0,0,0,.2); }
    #rds-app.menu-hidden #rds-sidebar { transform:translateX(-100%); margin-right:0; }
}`;
        document.head.appendChild(st);
        document.documentElement.style.overflow = 'hidden';
        document.body.style.margin = '0';

        document.body.innerHTML = `
<div id="rds-app">
  <button id="rds-toggle"><svg viewBox="0 0 24 24"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg></button>
  <div id="rds-sidebar">
    <div class="rds-side-header">
      <h2>ADAM</h2>
      <div id="rds-space-lbl">👤 Espace Salarié</div>
    </div>
    <div class="rds-search"><input id="rds-search" type="text" placeholder="Rechercher…"></div>
    <div id="rds-tool-list">
      <div class="rds-nav-item" id="rds-fixed-config">🏠 Configurateur RDS</div>
    </div>
    <div id="rds-bottom">
      <div class="rds-nav-item" id="rds-tournees">🚚 Gestion des Tournées</div>
      <div class="rds-space-wrap">
        <div class="rds-space-rel">
          <select id="rds-space-select">
            <option value="salarie">👤 Espace Salarié</option>
            <option value="admin">🏢 Espace Admin</option>
            <option value="adam">⚙ Espace Adam</option>
          </select>
          <span class="rds-space-arrow">▼</span>
        </div>
      </div>
      <div class="rds-forget" id="rds-forget">🔓 Oublier le mot de passe</div>
      <div class="rds-foot"><span class="rds-dot"></span>Système opérationnel<br><span style="font-size:7px;opacity:.6;letter-spacing:1px;">RUE DU STORE © 2026</span></div>
    </div>
  </div>
  <div id="rds-content">
    <div id="rds-welcome">
      <div class="rds-welcome-inner">
        <h1>Boîte à outils d'Adam</h1>
        <div class="rds-line"></div>
        <p>Sélectionnez un outil dans le menu.</p>
      </div>
    </div>
    <div id="rds-iframe-wrap">
      <div id="rds-loader"><div class="rds-spinner"></div></div>
      <iframe id="rds-frame" src="about:blank"></iframe>
    </div>
  </div>
</div>

<!-- Panel gestion -->
<div id="rds-panel-overlay">
  <div id="rds-panel">
    <div id="rds-panel-head">
      <div>
        <h3>⚙ Gestion des outils</h3>
        <p>Choisissez l'espace de chaque outil · Renommez-les</p>
      </div>
      <button class="rds-btn rds-btn-close" id="rds-panel-close">✕</button>
    </div>
    <div id="rds-panel-body"></div>
    <div id="rds-panel-foot">
      <span id="rds-panel-info">Sauvegardé sur GitHub</span>
      <div style="display:flex;gap:8px;">
        <button class="rds-btn rds-btn-ghost" id="rds-panel-cancel">Fermer</button>
        <button class="rds-btn rds-btn-primary" id="rds-panel-save">Enregistrer</button>
      </div>
    </div>
  </div>
</div>`;

        // Events
        document.getElementById('rds-fixed-config').onclick = () =>
            openTool('https://prod.seriousframes.com/Configurateur_RDS/', document.getElementById('rds-fixed-config'));

        document.getElementById('rds-tournees').onclick = () =>
            openTool(BASE_URL + encodeURIComponent('Gestion des tournees.html'), document.getElementById('rds-tournees'));

        document.getElementById('rds-search').oninput = e => {
            const v = e.target.value.toLowerCase();
            document.querySelectorAll('#rds-tool-list .rds-nav-item:not(#rds-fixed-config)').forEach(el => {
                el.style.display = el.textContent.toLowerCase().includes(v) ? '' : 'none';
            });
        };

        document.getElementById('rds-space-select').onchange = async function () {
            const target = this.value;
            if (target === currentSpace) return;
            if (target === 'admin' && !unlocked.has('admin')) {
                const p = prompt('Code Espace Admin :');
                if (p !== PASS_ADMIN) { this.value = currentSpace; return; }
                unlocked.add('admin');
            }
            if (target === 'adam' && !unlocked.has('adam')) {
                const p = prompt('Code Espace Adam :');
                if (p !== PASS_ADAM) { this.value = currentSpace; return; }
                unlocked.add('adam');
            }
            currentSpace = target;
            refreshSidebar();
        };

        document.getElementById('rds-toggle').onclick = e => {
            e.stopPropagation();
            document.getElementById('rds-app').classList.toggle('menu-hidden');
        };

        document.getElementById('rds-content').onclick = () => {
            if (window.innerWidth <= 850) document.getElementById('rds-app').classList.add('menu-hidden');
        };

        document.getElementById('rds-forget').onclick = () => {
            if (confirm('Oublier le mot de passe enregistré ?')) { localStorage.removeItem(PWD_KEY); alert('Mot de passe oublié.'); }
        };

        document.getElementById('rds-panel-close').onclick  = closePanel;
        document.getElementById('rds-panel-cancel').onclick = closePanel;
        document.getElementById('rds-panel-save').onclick   = savePanel;
        document.getElementById('rds-panel-overlay').onclick = e => { if (e.target.id === 'rds-panel-overlay') closePanel(); };

        // Charger les données
        (async () => {
            config = await loadConfig();
            await loadTools();
            refreshSidebar();
        })();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', launch);
    else launch();
})();
