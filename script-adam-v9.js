/**
 * BOÎTE À OUTILS RDS v9.4
 * 3 espaces fixes : Salarié / Nicolas (RH2026) / Adam (sans mdp)
 * - Salarié : tous les outils sauf les privés
 * - Nicolas  : Demande de Congés
 * - Adam     : Messages Privés
 */
(function () {
    const BASE_URL  = atob('aHR0cHM6Ly9yZHMtYWRhbS5naXRodWIuaW8vYXBwLw==');
    const API_URL   = atob('aHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9SRFMtQWRhbS9hcHAvY29udGVudHMv');
    const PASS_NICOLAS = 'RH2026';
    const SYSTEM_RE = /index|robots|secure|bdd|noindex|messages-type|conges|cong/i;
    const FIXED_LIST = ['Gestion des tournees.html'];

    // Outils avec espace fixe
    const PRIVATE_TOOLS = {
        'messages-type.html':  { space: 'adam',    label: 'Messages Privés'    },
        'Demande Congés.html': { space: 'nicolas',  label: 'Demande de Congés' },
    };

    let tools        = [];   // [{ name, label }] — outils espace salarié uniquement
    let currentSpace = 'salarie';
    let unlocked     = new Set(['salarie', 'adam']); // adam toujours déverrouillé

    /* ── Chargement des outils depuis GitHub ── */
    async function loadTools() {
        const r = await fetch(API_URL + '?t=' + Date.now()).catch(() => null);
        if (!r || !r.ok) return;
        const data = await r.json().catch(() => []);
        tools = [];
        data.forEach(item => {
            const isH = item.name.endsWith('.html');
            const isD = item.type === 'dir';
            if (!isH && !isD) return;
            if (FIXED_LIST.includes(item.name)) return;
            if (item.name in PRIVATE_TOOLS) return;         // réservé à un espace privé
            if (/script|config|data|json|robots/i.test(item.name)) return;
            const label = decodeURIComponent(item.name).replace('.html','').replace(/[-_]/g,' ');
            tools.push({ name: item.name, label, isDir: isD });
        });
    }

    /* ── Sidebar ── */
    const SPACE_META = {
        salarie: { label: '👤 Espace Salarié', color: '#4CAF50' },
        nicolas: { label: '📋 Espace Nicolas',  color: '#ff7200' },
        adam:    { label: '⚙ Espace Adam',      color: '#25737d' },
    };

    function refreshSidebar() {
        const list = document.getElementById('rds-tool-list');
        // Vider sauf l'élément fixe configurateur
        Array.from(list.querySelectorAll('.rds-nav-item:not(#rds-fixed-config), .rds-nav-sep, .rds-empty'))
            .forEach(e => e.remove());

        const meta = SPACE_META[currentSpace];
        document.getElementById('rds-space-lbl').textContent = meta.label;
        document.getElementById('rds-space-lbl').style.color  = meta.color;

        let spaceTools = [];

        if (currentSpace === 'salarie') {
            spaceTools = tools;
        } else if (currentSpace === 'nicolas' || currentSpace === 'adam') {
            // Un seul outil fixe pour ces espaces
            const entries = Object.entries(PRIVATE_TOOLS).filter(([, v]) => v.space === currentSpace);
            spaceTools = entries.map(([name, v]) => ({ name, label: v.label, isDir: false }));
        }

        if (!spaceTools.length) {
            const empty = document.createElement('div');
            empty.className = 'rds-empty';
            empty.textContent = 'Aucun outil dans cet espace.';
            list.appendChild(empty);
            return;
        }

        spaceTools.forEach(tool => {
            const el = document.createElement('div');
            el.className = 'rds-nav-item';
            el.textContent = tool.label;
            let path = tool.name;
            if (tool.isDir) path += path.toLowerCase().includes('trapeze') ? '/triangles.html' : '/index.html';
            el.onclick = () => openTool(BASE_URL + encodeURIComponent(path), el);
            list.appendChild(el);
        });
    }

    /* ── Ouvrir un outil ── */
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
        const saved = localStorage.getItem('rds_wp_pwd');
        if (saved) { inp.value = saved; setTimeout(() => btn ? btn.click() : form.submit(), 50); return true; }
        const wrap = document.createElement('div');
        wrap.style.cssText = 'margin:10px 0;display:flex;align-items:center;gap:8px;font-size:13px;';
        wrap.innerHTML = '<input type="checkbox" id="_rds_rem"> <label for="_rds_rem">Mémoriser sur cet ordinateur</label>';
        (btn ? btn.parentNode : form).insertBefore(wrap, btn || null);
        form.addEventListener('submit', () => {
            const cb = document.getElementById('_rds_rem');
            if (cb && cb.checked && inp.value) localStorage.setItem('rds_wp_pwd', inp.value);
        }, true);
        return true;
    }

    /* ── Launch ── */
    function launch() {
        if (document.querySelector('.post-password-form')) { handlePasswordForm(); return; }
        document.addEventListener('contextmenu', e => e.preventDefault());

        const lnk = document.createElement('link');
        lnk.rel = 'stylesheet';
        lnk.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap';
        document.head.appendChild(lnk);

        const st = document.createElement('style');
        st.textContent = `
* { font-family: 'Poppins', sans-serif !important; box-sizing: border-box; }
#rds-app { position:fixed !important; inset:0; display:flex !important; z-index:9999999 !important; overflow:hidden; margin:0; padding:0; background:#fff; }

#rds-toggle { position:absolute; top:14px; left:14px; z-index:10000001; width:38px; height:38px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,.12); background:#1a1a1a; color:#fff; transition:.25s; }
#rds-app.menu-hidden #rds-toggle { background:#fff; border-color:#ddd; color:#222; box-shadow:0 2px 8px rgba(0,0,0,.12); }
#rds-toggle svg { width:20px; height:20px; fill:none; stroke:currentColor; stroke-width:2.5; stroke-linecap:round; }

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
.rds-nav-sep { height:1px; background:rgba(255,255,255,.07); margin:6px 0; }
.rds-empty { padding:16px 22px; font-size:.75rem; color:rgba(255,255,255,.22); }

#rds-bottom { border-top:1px solid rgba(255,255,255,.07); padding:10px 0 0; }
.rds-space-wrap { padding:8px 16px 10px; }
#rds-space-select { width:100%; padding:9px 32px 9px 12px; border-radius:8px; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.07); color:#fff; font-size:.78rem; font-weight:500; cursor:pointer; outline:none; -webkit-appearance:none; appearance:none; }
#rds-space-select option { background:#222; }
.rds-space-arrow { position:absolute; right:10px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,.35); font-size:.6rem; pointer-events:none; }
.rds-space-rel { position:relative; }
.rds-foot { padding:10px 18px 18px; text-align:center; font-size:9px; color:rgba(255,255,255,.22); }
.rds-dot { width:7px; height:7px; background:#4CAF50; border-radius:50%; display:inline-block; margin-right:4px; }

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
            <option value="nicolas">📋 Espace Nicolas</option>
            <option value="adam">⚙ Espace Adam</option>
          </select>
          <span class="rds-space-arrow">▼</span>
        </div>
      </div>
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

            if (target === 'nicolas' && !unlocked.has('nicolas')) {
                const p = prompt('Code Espace Nicolas :');
                if (p !== PASS_NICOLAS) { this.value = currentSpace; return; }
                unlocked.add('nicolas');
            }
            // Adam : pas de mot de passe

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

        // Charger et afficher
        (async () => {
            await loadTools();
            refreshSidebar();
        })();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', launch);
    else launch();
})();
