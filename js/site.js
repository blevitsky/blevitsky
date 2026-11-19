/* ═══════════════════════════════════════════════════
   CASE STUDY DATA
   Each project's content lives in its own file under /data/,
   e.g. data/premier.json, data/soothe.json. Edit those files to
   change case-study text, stats, images, etc. — no JS editing
   needed. This loader fetches them all on page load and fills
   in PROJ, same shape as before.
═══════════════════════════════════════════════════ */
const PROJECT_IDS = ['premier', 'soothe', 'safeplay', 'denmark', 'youtube', 'chordpeek'];
let PROJ = {};

/* Image paths in the /data/*.json files are bare filenames (e.g.
   'premier-mockup.jpg'); the site serves them from /images/, so this
   re-roots every image-like field once, right after each project's
   JSON loads, without anyone having to type 'images/' in the data. */
function rootImg(v) {
  return (typeof v === 'string' && v && !v.startsWith('http') && !v.startsWith('images/')) ? ('images/' + v) : v;
}
function rootProjectImages(p) {
  ['cover', 'hero', 'downloadUrl', 'logo'].forEach(k => { if (p[k]) p[k] = rootImg(p[k]); });
  (p.sections || []).forEach(s => {
    ['_img', 'img', 'video', 'src', 'beforeSrc', 'afterSrc', 'beforeImg', 'afterImg'].forEach(k => { if (s[k]) s[k] = rootImg(s[k]); });
    if (s.desktop) s.desktop.src = rootImg(s.desktop.src);
    if (s.mobile) s.mobile.src = rootImg(s.mobile.src);
    if (s.images) s.images.forEach(im => { if (im.src) im.src = rootImg(im.src); });
    if (s.imgs) s.imgs.forEach(im => { if (im.src) im.src = rootImg(im.src); });
  });
  return p;
}

const PROJ_READY = Promise.all(
  PROJECT_IDS.map(id =>
    fetch(`data/${id}.json?v=1`)
      .then(r => { if (!r.ok) throw new Error('Failed to load data/' + id + '.json'); return r.json(); })
      .then(data => { PROJ[id] = rootProjectImages(data); })
      .catch(err => console.error(err))
  )
);


/* ═══════════════════════════════════════════════════
   CASE STUDY RENDERER
═══════════════════════════════════════════════════ */
/* Small stroked SVG icons for provenance badges — no emoji. */
/* Screen content for the Still iPhone mockups. */
let pendingBAInit = [];
function buildCS(id) {
  const p = PROJ[id];
  const next = PROJ[p.nextId];
  let html = '';
  pendingBAInit = [];

  const typeLabel = p.provenance ? ({internship:'Internship', school:'School', team:'Team Project', vibe:'Personal'}[p.provenance.type] || p.provenance.type) : '';

  html += `
    <div class="cs-hero-text">
      ${p.logo ? `<img class="cs-hero-logo" src="${p.logo}" alt="${p.client}">` : ''}
      <h1 class="cs-hero-title">${p.title.replace(/\n/g,'<br>')}</h1>
      <div class="cs-hero-meta">
        <div class="cs-role-item"><div class="cs-role-label">Year</div><div class="cs-role-value">${p.year}</div></div>
        ${typeLabel ? `<div class="cs-role-item"><div class="cs-role-label">Type</div><div class="cs-role-value">${typeLabel}</div></div>` : ''}
        <div class="cs-role-item"><div class="cs-role-label">Client</div><div class="cs-role-value">${p.client}</div></div>
        <div class="cs-role-item"><div class="cs-role-label">Tools</div><div class="cs-role-value">${p.tags.slice(0,3).join(', ')}</div></div>
      </div>
      ${p.downloadUrl ? `<a class="cs-hero-download" href="${p.downloadUrl}" download onclick="event.stopPropagation()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>Download case study (PDF)</a>` : ''}
    </div>
    ${p.cover ? `<div class="cs-hero"><img class="cs-hero-img" src="${p.cover}" alt="${p.title}"></div>` : ''}
    <div class="cs-content">`;

  p.sections.forEach(s => {

    if (s.type === 'intro') {
      const paras = s.body.split(/\n\n+/).map(p => `<p class="cs-p">${p}</p>`).join('');
      html += `
        <div class="cs-block cs-block--first cs-split">
          <div class="cs-split-l">
            <h2 class="cs-intro-h">${s.headline}</h2>
          </div>
          <div class="cs-split-r">${paras}</div>
        </div>`;
    }
    else if (s.type === 'stats') {
      html += `<div class="cs-block cs-stats${s.centerpiece ? ' cs-stats-center' : ''}">${s.items.map(i=>`
        <div class="cs-stat">
          <div class="cs-stat-n" data-target="${i.n}">${i.n}</div>
          <div class="cs-stat-l">${i.l}</div>
        </div>`).join('')}</div>`;
      // observe after render
      setTimeout(()=>{
        document.querySelectorAll('.cs-stat-n[data-target]').forEach(el => statObs.observe(el));
      }, 100);
    }
    else if (s.type === 'chapter') {
      const paras = s.body.split(/\n\n+/).map(p => `<p class="cs-p">${p}</p>`).join('');
      html += `
        <div class="cs-block cs-split">
          <div class="cs-split-l">
            <h2 class="cs-ch-h">${s.headline}</h2>
          </div>
          <div class="cs-split-r">
            ${paras}
            ${s.cta ? `<a class="cs-inline-cta" href="${s.cta.url}">${s.cta.label}</a>` : ''}
          </div>
        </div>`;
    }
    else if (s.type === 'before-after') {
      const uid = 'ba' + Math.random().toString(36).slice(2, 9);
      html += `
        <div class="cs-block">
          <div class="ba-wrap" id="${uid}">
            ${s.placeholder ? `<span class="ba-placeholder-tag">Placeholder before image</span>` : ''}
            <div class="ba-after"><img src="${s.afterSrc}" alt="${s.afterLabel||'After'}"></div>
            <div class="ba-before" style="width:50%">
              <img src="${s.beforeSrc}" alt="${s.beforeLabel||'Before'}">
            </div>
            <div class="ba-handle" style="left:50%">
              <div class="ba-handle-grip">&#8596;</div>
            </div>
            <span class="ba-tag ba-tag-l">${s.beforeLabel||'Before'}</span>
            <span class="ba-tag ba-tag-r">${s.afterLabel||'After'}</span>
          </div>
          ${s.caption ? `<p class="ba-caption">${s.caption}</p>` : ''}
        </div>`;
      pendingBAInit.push(uid);
    }
    else if (s.type === 'quote') {
      html += `
        <div class="cs-block cs-quote">
          <p class="cs-quote-text">${s.text}</p>
          <p class="cs-quote-attr">${s.attr}</p>
        </div>`;
    }
    else if (s.type === 'compare-table') {
      const checkSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="cs-cmp-check"><path d="M20 6 9 17l-5-5"/></svg>`;
      const dashSvg = `<span class="cs-cmp-dash">—</span>`;
      const headH = s.cols.map((c, ci) => `<div class="cs-cmp-col-h${ci===0 ? ' cs-cmp-hero' : ''}">${c}</div>`).join('');
      const rowsH = s.rows.map(r => `
        <div class="cs-cmp-feature">${r.feature}</div>
        ${r.vals.map((v, ci) => `<div class="cs-cmp-cell${ci===0 ? ' cs-cmp-hero' : ''}">${v ? checkSvg : dashSvg}</div>`).join('')}`).join('');
      html += `
        <div class="cs-block cs-cmp">
          <p class="cs-cmp-hint">Scroll to see every competitor →</p>
          <div class="cs-cmp-scroll">
            <div class="cs-cmp-grid" style="grid-template-columns:1.6fr repeat(${s.cols.length},1fr)">
              <div class="cs-cmp-feature cs-cmp-feature-h"></div>
              ${headH}
              ${rowsH}
            </div>
          </div>
          ${s.note ? `<p class="ba-caption">${s.note}</p>` : ''}
        </div>`;
    }
    else if (s.type === 'timeline') {
      const stepsH = s.steps.map(st => `
        <div class="cs-tl-step">
          <div class="cs-tl-num">${st.n}</div>
          <div class="cs-tl-body">
            <div class="cs-tl-title">${st.title}</div>
            <p class="cs-tl-desc">${st.desc}</p>
          </div>
        </div>`).join('');
      html += `
        <div class="cs-block">
          <h2 class="cs-ch-h">${s.headline}</h2>
          <div class="cs-timeline">${stepsH}</div>
        </div>`;
    }
    else if (s.type === 'phones') {
      const cells = s.imgs.map(i => `
        <div class="cs-phone-wrap">
          <img src="${i.src}" alt="${i.cap}" loading="lazy" onclick="zoomImg(this)">
          <span class="cs-phone-cap">${i.cap}</span>
        </div>`).join('');
      const rowClass = s.imgs.length > 2 ? ' cs-phones-row' : '';
      html += `<div class="cs-block cs-phones${rowClass}">${cells}</div>`;
    }
    else if (s.type === 'phone-single') {
      html += `
        <div class="cs-block cs-phone-solo">
          <img src="${s.src}" alt="${s.cap}" loading="lazy" onclick="zoomImg(this)">
        </div>
        <p style="text-align:center;font-size:9.5px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--ink60);margin-top:20px">${s.cap}</p>`;
    }
    else if (s.type === 'still-live') {
      html += `
        <div class="cs-block cs-still-live">
          <div class="cs-still-live-label">Try it — this is the actual build</div>
          <div class="cs-still-live-frame">
            <iframe src="${s.appSrc}" title="Still — interactive prototype" loading="lazy"></iframe>
          </div>
          <p class="cs-still-live-hint">Fully interactive, not a recording — check in, breathe, then look at Progress.</p>
        </div>`;
    }
    else if (s.type === 'flow-steps') {
      const stepsH = s.steps.map((step, i) => `
          <div class="cs-flow-step">
            <div class="cs-flow-step-img">
              <img src="${step.src}" alt="${step.label}"
                onclick="zoomImg(this)" loading="lazy">
            </div>
            <div class="cs-flow-step-body">
              <div class="cs-flow-step-n">0${i+1}</div>
              <div class="cs-flow-step-label">${step.label}</div>
              <h3 class="cs-flow-step-title">${step.title}</h3>
              <p class="cs-flow-step-desc">${step.desc}</p>
            </div>
          </div>`).join('');
      html += `<div class="cs-block"><div class="cs-flow-steps">${stepsH}</div></div>`;
    }
    else if (s.type === 'flow-image') {
      html += `
        <div style="margin:56px -clamp(20px,5vw,64px);overflow:hidden;background:#111">
          <img src="${s.src}" alt="${s.alt||''}" loading="lazy"
            style="width:100%;display:block;object-fit:contain"
            onclick="zoomImg(this)">
        </div>`;
    }
    else if (s.type === 'watches') {
      const cells = s.imgs.map(i => `
        <div class="cs-watch-wrap">
          <img src="${i.src}" alt="${i.cap}" loading="lazy" onclick="zoomWatch(this)">
          <span class="cs-watch-cap">${i.cap}</span>
        </div>`).join('');
      html += `<div class="cs-block cs-watches">${cells}</div>`;
    }
    else if (s.type === 'sp-screens') {
      // s.steps[] each has: label, title, desc, finding (optional), screenIndex
      const steps = s.steps || SP_SCREENS.map((sc, i) => ({
        label: sc.label,
        title: sc.label,
        desc: '',
        screenIndex: i,
      }));
      const cells = steps.map((step, i) => {
        const sc = SP_SCREENS[step.screenIndex !== undefined ? step.screenIndex : i];
        const finding = step.finding ? `<div class="sp-step-finding">${step.finding}</div>` : '';
        return `
          <div class="cs-block sp-step">
            <div class="sp-step-phone sp-scope">${sc ? sc.html : ''}</div>
            <div class="sp-step-body">
              <div class="sp-step-n">0${i+1}</div>
              <div class="sp-step-eyebrow">${step.label}</div>
              <h3 class="sp-step-title">${step.title}</h3>
              <p class="sp-step-desc">${step.desc}</p>
              ${finding}
            </div>
          </div>`;
      }).join('');
      html += `<div class="sp-steps">${cells}</div>`;
    }
    else if (s.type === 'screens') {
      const cells = s.imgs.map(i => `
        <div class="cs-screen-item">
          <img src="${i.src}" alt="${i.cap}" loading="lazy" onclick="zoomImg(this)">
        </div>`).join('');
      html += `<div class="cs-block cs-screens">${cells}</div>`;
    }
    else if (s.type === 'prototype') {
      // SVG icons for each tech
      const techIcons = {
        html: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"/></svg>`,
        css: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.855L12 19.288l5.373-1.53L18.59 4.413z"/></svg>`,
        js: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"/></svg>`,
        github: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
      };
      const techBadges = s.tech ? s.tech.map(t => `
        <div class="cs-tech-badge" data-tech="${t.icon}">
          ${techIcons[t.icon] || ''}
          ${t.name}
        </div>`).join('') : '';
      html += `
        <div class="cs-block cs-proto">
          <div class="cs-proto-label">Live Prototype</div>
          <div class="cs-proto-shell">
            <div class="cs-proto-island"></div>
            <div class="cs-proto-btn-r"></div>
            <div class="cs-proto-btn-l1"></div>
            <div class="cs-proto-btn-l2"></div>
            <div class="cs-proto-btn-l3"></div>
            <div class="cs-proto-screen">
              <iframe
                src="${s.url}"
                title="${s.title||'Live prototype'}"
                loading="lazy"
                allow="fullscreen"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups">
              </iframe>
            </div>
          </div>
          <p class="cs-proto-hint"><strong>Tap and scroll to explore the app.</strong><br>All four tabs are functional.</p>
          ${techBadges ? `<div class="cs-proto-tech">${techBadges}</div>` : ''}
        </div>`;
    }
    else if (s.type === 'affinity-map') {
      const colours = ['yellow','blue','green','pink','orange','purple'];
      const headColours = ['ch-yellow','ch-blue','ch-green','ch-pink','ch-orange','ch-purple'];
      // Slight rotation values cycling per postit
      const rots = ['-1.8deg','1.2deg','-0.6deg','2.1deg','-1.4deg','0.8deg','-2.2deg','1.6deg','-.9deg','2.4deg'];
      const clusters = s.clusters.map((cl, ci) => {
        const colour = colours[ci % colours.length];
        const hc = headColours[ci % headColours.length];
        const notes = cl.notes.map((note, ni) => {
          const rot = rots[(ci * 3 + ni) % rots.length];
          return `<div class="postit postit-${colour}" style="transform:rotate(${rot})">${note}</div>`;
        }).join('');
        return `
          <div class="cs-cluster">
            <span class="cs-cluster-head ${hc}">${cl.label}</span>
            ${notes}
          </div>`;
      }).join('');
      html += `
        <div class="cs-block cs-affinity">
          <div class="cs-affinity-title">${s.title || 'Affinity Map'}</div>
          <div class="cs-affinity-sub">${s.sub || ''}</div>
          <div class="cs-affinity-clusters">${clusters}</div>
        </div>`;
    }
    else if (s.type === 'role-bar') {
      const items = s.items.map(i => `
        <div class="cs-role-item">
          <div class="cs-role-label">${i.label}</div>
          <div class="cs-role-value">${i.value}</div>
        </div>`).join('');
      html += `<div class="cs-role-bar cs-block">${items}</div>`;
    }
    else if (s.type === 'insights') {
      const cells = s.items.map(i => `
        <div class="cs-insight">
          <div class="cs-insight-n">${i.n}</div>
          <div class="cs-insight-text">${i.text}</div>
        </div>`).join('');
      html += `<div class="cs-block"><div class="cs-insights">${cells}</div></div>`;
    }
    else if (s.type === 'persona') {
      const traits = s.traits.map(t => `<span class="cs-persona-tag">${t}</span>`).join('');
      html += `
        <div class="cs-block">
          <div class="cs-persona">
            <div class="cs-persona-avatar">${s.initial}</div>
            <div>
              <div class="cs-persona-name">${s.name}</div>
              <div class="cs-persona-role">${s.role}</div>
            </div>
            <div class="cs-persona-body">
              <div class="cs-persona-traits">${traits}</div>
              <blockquote class="cs-persona-quote">${s.quote}</blockquote>
            </div>
          </div>
        </div>`;
    }
    else if (s.type === 'decision') {
      html += `
        <div class="cs-block">
          <div class="cs-decision">
            <div class="cs-dec-before">
              <div class="cs-dec-label">V1, What I tried</div>
              <p class="cs-dec-text">${s.before}</p>
            </div>
            <div class="cs-dec-after">
              <div class="cs-dec-label">Final, Why it changed</div>
              <p class="cs-dec-text">${s.after}</p>
            </div>
          </div>
        </div>`;
    }
    else if (s.type === 'artifacts') {
      const pills = s.items.map(item => `
        <span class="cs-artifact">
          <svg viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/></svg>
          ${item}
        </span>`).join('');
      html += `<div class="cs-artifacts cs-block">${pills}</div>`;
    }
    else if (s.type === 'reflection') {
      html += `
        <div class="cs-block cs-reflection">
          <div class="cs-reflection-label">${s.headline || 'What I\'d do differently'}</div>
          <p class="cs-reflection-text">${s.body}</p>
        </div>`;
    }
    else if (s.type === 'watch-wireframes') {
      const items = s.screens.map((sc, i) => {
        return '<div class="cs-sticky" style="--tilt:' + ((i % 2 === 0) ? '-1.6deg' : '1.4deg') + '">'
          + '<div class="cs-sticky-label">' + sc.label + '</div>'
          + '<div class="cs-sticky-ann">' + sc.ann + '</div>'
          + '</div>';
      }).join('');
      html += '<div class="cs-block cs-watch-wf">'
        + '<div class="cs-watch-wf-header">'
        + '<div class="cs-watch-wf-label">Process Notes</div>'
        + '<div class="cs-watch-wf-title">' + (s.title || 'First pass at the three states') + '</div>'
        + '<div class="cs-watch-wf-sub">' + (s.sub || '') + '</div>'
        + '</div>'
        + '<div class="cs-sticky-row">' + items + '</div>'
        + '</div>';
    }
    else if (s.type === 'premier-code-images') {
      const imgs = s.images.map(img => `
        <div onclick="openImg(this)" data-desc="${img.caption}" style="cursor:zoom-in;flex:1;min-width:0;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,.08)">
          <img src="${img.src}" alt="${img.caption}" style="width:100%;display:block">
        </div>`).join('');
      html += `<div class="cs-block"><div style="background:#0D1117;border-radius:16px;padding:16px">
        <div style="font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--coral);margin-bottom:12px">${s.label || 'Code'}</div>
        <div class="cs-media-row" style="display:flex;gap:12px;flex-wrap:wrap">${imgs}</div>
      </div></div>`;
    }
    else if (s.type === 'premier-images') {
      const imgs = s.images.map(img => {
        const inner = img.frame
          ? `<div style="background:#1A1D21">
              <div style="display:flex;align-items:center;gap:6px;padding:9px 12px;background:#22262B;border-bottom:1px solid rgba(255,255,255,.06)">
                <span style="width:9px;height:9px;border-radius:50%;background:#FF5F57;display:inline-block"></span>
                <span style="width:9px;height:9px;border-radius:50%;background:#FEBC2E;display:inline-block"></span>
                <span style="width:9px;height:9px;border-radius:50%;background:#28C840;display:inline-block"></span>
                <div style="flex:1;margin-left:8px;background:#31363C;border-radius:6px;padding:3px 10px;font-size:10.5px;color:rgba(255,255,255,.35);font-weight:500">pdbmarketing.wixstudio.com</div>
              </div>
              <img src="${img.src}" alt="${img.caption}" style="width:100%;display:block">
            </div>`
          : `<img src="${img.src}" alt="${img.caption}" style="width:100%;display:block">`;
        return `
        <div onclick="openImg(this)" data-desc="${img.caption}" style="cursor:zoom-in;border-radius:12px;overflow:hidden;background:#F0F0EE;border:1px solid var(--ink10);flex:1;min-width:0">
          ${inner}
          <div style="padding:9px 13px;font-size:11.5px;color:var(--ink60);font-weight:500">${img.caption}</div>
        </div>`;
      }).join('');
      html += `<div class="cs-block cs-media-row" style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start">${imgs}</div>`;
    }
    else if (s.type === 'cms-map') {
      const rows = s.rows.map((r, i) => `
        <div class="cs-cmsmap-row">
          <span class="cs-cmsmap-n">${i + 1}</span>
          <span class="cs-cmsmap-field">${r.field}</span>
          <svg class="cs-cmsmap-arrow" width="20" height="12" viewBox="0 0 20 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M0 6h17M12 1l5 5-5 5"/></svg>
          <span class="cs-cmsmap-result">${r.result}</span>
        </div>`).join('');
      html += `
        <div class="cs-block cs-cmsmap">
          <div class="cs-cmsmap-imgs">
            <div class="cs-cmsmap-img-col">
              <div class="cs-cmsmap-img-label">${s.beforeLabel || 'Backend'}</div>
              <div onclick="openImg(this)" data-desc="${s.beforeLabel}" style="cursor:zoom-in;border-radius:12px;overflow:hidden;border:1px solid var(--ink10)">
                <img src="${s.beforeImg}" alt="${s.beforeLabel}" style="width:100%;display:block">
              </div>
            </div>
            <div class="cs-cmsmap-img-col">
              <div class="cs-cmsmap-img-label">${s.afterLabel || 'Result'}</div>
              <div onclick="openImg(this)" data-desc="${s.afterLabel}" style="cursor:zoom-in;border-radius:12px;overflow:hidden;border:1px solid var(--ink10)">
                <img src="${s.afterImg}" alt="${s.afterLabel}" style="width:100%;display:block">
              </div>
            </div>
          </div>
          <div class="cs-cmsmap-legend">${rows}</div>
        </div>`;
    }
    else if (s.type === 'premier-home-split') {
      if (s.bleed) {
        html += `<div class="cs-block cs-reveal-scale"><div style="border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.1);background:#1A1D21;box-shadow:0 20px 50px rgba(0,0,0,.3)">
          <div style="display:flex;align-items:center;gap:6px;padding:9px 12px;background:#22262B;border-bottom:1px solid rgba(255,255,255,.06)">
            <span style="width:9px;height:9px;border-radius:50%;background:#FF5F57;display:inline-block"></span>
            <span style="width:9px;height:9px;border-radius:50%;background:#FEBC2E;display:inline-block"></span>
            <span style="width:9px;height:9px;border-radius:50%;background:#28C840;display:inline-block"></span>
            <div style="flex:1;margin-left:8px;background:#31363C;border-radius:6px;padding:3px 10px;font-size:10.5px;color:rgba(255,255,255,.35);font-weight:500">pdbmarketing.wixstudio.com</div>
          </div>
          <video src="${s.video}" autoplay muted loop playsinline style="width:100%;display:block;background:#000"></video>
        </div></div>`;
      } else {
        const reveal = s.mirror ? 'cs-reveal-slide-r' : 'cs-reveal-slide-l';
        const imgCol = `<div class="cs-media-aside" onclick="openImg(this)" data-desc="${s.thumbCaption || 'Full-page screenshot'}" style="cursor:zoom-in;border-radius:12px;overflow:hidden;border:1px solid var(--ink10)">
          <img src="${s.img}" alt="${s.thumbCaption || 'Full-page screenshot'}" style="width:100%;display:block">
        </div>`;
        const vidCol = `<div class="cs-media-main" style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.1);background:#1A1D21;box-shadow:0 12px 32px rgba(0,0,0,.25)">
          <div style="display:flex;align-items:center;gap:6px;padding:9px 12px;background:#22262B;border-bottom:1px solid rgba(255,255,255,.06)">
            <span style="width:9px;height:9px;border-radius:50%;background:#FF5F57;display:inline-block"></span>
            <span style="width:9px;height:9px;border-radius:50%;background:#FEBC2E;display:inline-block"></span>
            <span style="width:9px;height:9px;border-radius:50%;background:#28C840;display:inline-block"></span>
            <div style="flex:1;margin-left:8px;background:#31363C;border-radius:6px;padding:3px 10px;font-size:10.5px;color:rgba(255,255,255,.35);font-weight:500">pdbmarketing.wixstudio.com</div>
          </div>
          <video src="${s.video}" autoplay muted loop playsinline style="width:100%;display:block;background:#000"></video>
        </div>`;
        const layout = s.mirror ? 'thumb-r' : 'thumb-l';
        const ordered = s.mirror ? vidCol + '\n        ' + imgCol : imgCol + '\n        ' + vidCol;
        html += `<div class="cs-block cs-media-split cs-media-split--${layout} ${reveal}">
        ${ordered}
      </div>`;
      }
    }
    else if (s.type === 'premier-nav') {
      const isVideo = s.mobile.src.endsWith('.webm') || s.mobile.src.endsWith('.mp4');
      const mobileEl = isVideo
        ? `<video src="${s.mobile.src}" autoplay muted loop playsinline style="width:100%;display:block;border-radius:12px"></video>`
        : `<img src="${s.mobile.src}" style="width:100%;display:block;border-radius:12px">`;
      html += `<div class="cs-block cs-media-split cs-media-split--nav cs-reveal-slide-l">
        <div class="cs-media-main" onclick="openImg(this)" data-desc="${s.desktop.caption}" style="cursor:zoom-in;border-radius:12px;overflow:hidden;border:1px solid var(--ink10);background:#F5F5F3">
          <img src="${s.desktop.src}" alt="${s.desktop.caption}" style="width:100%;display:block">
          <div style="padding:9px 14px;font-size:11.5px;color:var(--ink60);font-weight:500">${s.desktop.caption}</div>
        </div>
        <div class="cs-media-phone" style="border-radius:12px;overflow:hidden;border:1px solid var(--ink10);background:#111">
          ${mobileEl}
          <div style="padding:9px 14px;font-size:11.5px;color:rgba(255,255,255,.4);font-weight:500">${s.mobile.caption}</div>
        </div>
      </div>`;
    }
    else if (s.type === 'premier-wireframes') {
      const sizing = ['flex:1;min-width:0', 'flex:0 0 260px;max-width:260px'];
      const imgs = s.images.map((img, i) => `
        <div onclick="openImg(this)" data-desc="${img.caption}" style="cursor:zoom-in;border-radius:12px;overflow:hidden;background:#F0F0EE;border:1px solid var(--ink10);${sizing[i]||'flex:1'}">
          <img src="${img.src}" alt="${img.caption}" style="width:100%;display:block">
          <div style="padding:9px 13px;font-size:11.5px;color:var(--ink60);font-weight:500">${img.caption}</div>
        </div>`).join('');
      html += `<div class="cs-block cs-media-row" style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start">${imgs}</div>`;
    }
    else if (s.type === 'premier-video') {
      const isGif = s.src && s.src.endsWith('.gif');
      const media = isGif
        ? `<img src="${s.src}" alt="${s.label||''}" style="width:100%;border-radius:16px;display:block">`
        : `<div style="border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.1);background:#1A1D21;box-shadow:0 12px 32px rgba(0,0,0,.25)">
            <div style="display:flex;align-items:center;gap:6px;padding:9px 12px;background:#22262B;border-bottom:1px solid rgba(255,255,255,.06)">
              <span style="width:9px;height:9px;border-radius:50%;background:#FF5F57;display:inline-block"></span>
              <span style="width:9px;height:9px;border-radius:50%;background:#FEBC2E;display:inline-block"></span>
              <span style="width:9px;height:9px;border-radius:50%;background:#28C840;display:inline-block"></span>
              <div style="flex:1;margin-left:8px;background:#31363C;border-radius:6px;padding:3px 10px;font-size:10.5px;color:rgba(255,255,255,.35);font-weight:500">pdbmarketing.wixstudio.com</div>
            </div>
            <video src="${s.src}" autoplay muted loop playsinline style="width:100%;display:block;background:#000"></video>
          </div>`;
      html += `<div class="cs-block cs-reveal-scale">
        ${media}
        ${s.caption ? `<p style="font-size:12px;color:var(--ink60);margin-top:10px;letter-spacing:.04em;text-align:center">${s.caption}</p>` : ''}
      </div>`;
    }
    else if (s.type === 'premier-placeholder') {
      if (s._img) {
        html += `<div class="cs-block" style="border-radius:20px;overflow:hidden;background:#F5F5F3">
          <img src="${s._img}" alt="${s.label||''}" style="width:100%;display:block">
        </div>`;
      } else {
        const bgCol = s.kind === 'video' ? '#111' : '#F0F0EE';
        const txtCol = s.kind === 'video' ? 'rgba(255,255,255,.55)' : 'var(--ink60)';
        const accentCol = s.kind === 'video' ? 'rgba(255,255,255,.15)' : 'var(--ink10)';
        html += `<div class="cs-block premier-ph" style="background:${bgCol};border-radius:20px;padding:64px 48px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;min-height:320px;border:2px dashed ${accentCol}">
          <div style="font-size:40px;opacity:.4">${s.icon || (s.kind==='video' ? '🎥' : '🖼️')}</div>
          <div style="font-size:20px;font-weight:800;color:${s.kind==='video'?'#fff':'var(--ink)'};letter-spacing:-.02em">${s.label || ''}</div>
          <div style="font-size:14px;color:${txtCol};text-align:center;max-width:42ch;line-height:1.6">${s.desc || ''}</div>
          <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--coral);margin-top:4px">${s.kind==='video' ? 'Video placeholder' : 'Image placeholder'}</div>
        </div>`;
      }
    }
    else if (s.type === 'premier-code') {
      const escaped = (s.code || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      html += `<div class="cs-block" style="background:#0D1117;border-radius:16px;padding:28px 32px;overflow-x:auto">
        <div style="font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--coral);margin-bottom:16px">Velo / JavaScript</div>
        <pre style="font-family:'SF Mono',Monaco,Consolas,monospace;font-size:13px;line-height:1.7;color:#e6edf3;margin:0;white-space:pre;overflow-x:auto">${escaped}</pre>
      </div>`;
    }
    else if (s.type === 'dk-wireframes') {
      const items = s.screens.map((sc, i) => {
        return '<div class="cs-sticky" style="--tilt:' + ((i % 2 === 0) ? '1.5deg' : '-1.7deg') + '">'
          + '<div class="cs-sticky-label">' + sc.label + '</div>'
          + '<div class="cs-sticky-ann">' + sc.ann + '</div>'
          + '</div>';
      }).join('');
      html += '<div class="cs-block cs-dk-wf">'
        + '<div class="cs-dk-wf-header">'
        + '<div class="cs-dk-wf-label">Process Notes</div>'
        + '<div class="cs-dk-wf-title">' + (s.title || 'First pass at the four tabs') + '</div>'
        + '<div class="cs-dk-wf-sub">' + (s.sub || '') + '</div>'
        + '</div>'
        + '<div class="cs-sticky-row">' + items + '</div>'
        + '</div>';
    }
    else if (s.type === 'wireframe-proto') {
      const WF = [
        '<svg width="220" height="456" viewBox="0 0 220 456" fill="none"><rect x="12" y="12" width="40" height="8" rx="2" fill="#CCC"/><rect x="168" y="12" width="40" height="8" rx="2" fill="#CCC"/><rect x="16" y="36" width="80" height="12" rx="3" fill="#AAA"/><rect x="16" y="52" width="120" height="8" rx="2" fill="#DDD"/><circle cx="50" cy="110" r="28" fill="#E0E0E0" stroke="#C0C0C0" stroke-width="1.5"/><circle cx="110" cy="95" r="22" fill="#DCDCDC" stroke="#C0C0C0" stroke-width="1.5"/><circle cx="170" cy="108" r="30" fill="#E5E5E5" stroke="#C0C0C0" stroke-width="1.5"/><circle cx="55" cy="165" r="24" fill="#DADADA" stroke="#C0C0C0" stroke-width="1.5"/><circle cx="120" cy="158" r="34" fill="#D8D8D8" stroke="#B0B0B0" stroke-width="2"/><circle cx="178" cy="162" r="20" fill="#E2E2E2" stroke="#C0C0C0" stroke-width="1.5"/><rect x="16" y="208" width="188" height="36" rx="8" fill="#F0F0F0" stroke="#DDD" stroke-width="1"/><rect x="26" y="218" width="16" height="16" rx="4" fill="#CCC"/><rect x="50" y="220" width="90" height="7" rx="2" fill="#BBB"/><rect x="50" y="231" width="65" height="5" rx="2" fill="#DDD"/><rect x="170" y="218" width="28" height="12" rx="3" fill="#BBB"/><rect x="16" y="256" width="188" height="44" rx="10" fill="#B0B0B0"/><rect x="58" y="271" width="104" height="12" rx="3" fill="#888"/><rect x="68" y="312" width="84" height="8" rx="2" fill="#D5D5D5"/><rect x="16" y="256" width="188" height="44" rx="10" fill="rgba(0,120,255,.05)" stroke="rgba(0,120,255,.4)" stroke-width="1.5" stroke-dasharray="4,3"/></svg>',
        '<svg width="220" height="456" viewBox="0 0 220 456" fill="none"><rect x="12" y="12" width="40" height="8" rx="2" fill="#CCC"/><circle cx="28" cy="44" r="11" fill="#E8E8E8"/><rect x="21" y="41" width="14" height="6" rx="2" fill="#BBB"/><rect x="50" y="40" width="80" height="10" rx="2" fill="#AAA"/><rect x="12" y="64" width="196" height="68" rx="10" fill="#1A1A1A"/><rect x="24" y="74" width="44" height="7" rx="2" fill="rgba(255,255,255,.3)"/><rect x="24" y="85" width="60" height="22" rx="3" fill="rgba(255,255,255,.6)"/><rect x="24" y="111" width="100" height="4" rx="2" fill="rgba(255,255,255,.12)"/><rect x="24" y="111" width="88" height="4" rx="2" fill="rgba(255,255,255,.45)"/><rect x="140" y="76" width="56" height="14" rx="6" fill="rgba(255,255,255,.15)"/><rect x="140" y="94" width="56" height="14" rx="6" fill="rgba(255,255,255,.15)"/><rect x="12" y="144" width="196" height="46" rx="8" fill="#F5F5F5"/><circle cx="40" cy="167" r="16" fill="#DDD"/><rect x="64" y="158" width="80" height="8" rx="2" fill="#AAA"/><rect x="64" y="170" width="60" height="6" rx="2" fill="#CCC"/><rect x="168" y="162" width="32" height="12" rx="6" fill="#C8C8C8"/><rect x="12" y="202" width="92" height="60" rx="8" fill="#F5F5F5"/><rect x="24" y="212" width="18" height="18" rx="4" fill="#DDD"/><rect x="24" y="234" width="40" height="5" rx="2" fill="#C8C8C8"/><rect x="24" y="243" width="55" height="7" rx="2" fill="#AAA"/><rect x="116" y="202" width="92" height="60" rx="8" fill="#F5F5F5"/><rect x="128" y="212" width="18" height="18" rx="4" fill="#DDD"/><rect x="128" y="234" width="40" height="5" rx="2" fill="#C8C8C8"/><rect x="128" y="243" width="55" height="7" rx="2" fill="#AAA"/><rect x="12" y="270" width="92" height="60" rx="8" fill="#F5F5F5"/><rect x="24" y="280" width="18" height="18" rx="4" fill="#DDD"/><rect x="24" y="302" width="40" height="5" rx="2" fill="#C8C8C8"/><rect x="24" y="311" width="55" height="7" rx="2" fill="#AAA"/><rect x="116" y="270" width="92" height="60" rx="8" fill="#F5F5F5"/><rect x="128" y="280" width="18" height="18" rx="4" fill="#DDD"/><rect x="128" y="302" width="40" height="5" rx="2" fill="#C8C8C8"/><rect x="128" y="311" width="55" height="7" rx="2" fill="#AAA"/><circle cx="28" cy="350" r="10" fill="#DDD"/><circle cx="42" cy="350" r="10" fill="#D0D0D0"/><circle cx="56" cy="350" r="10" fill="#C8C8C8"/><rect x="74" y="345" width="90" height="9" rx="2" fill="#BBB"/><rect x="12" y="370" width="196" height="44" rx="10" fill="#1A1A1A"/><rect x="58" y="385" width="104" height="12" rx="3" fill="rgba(255,255,255,.4)"/><rect x="12" y="370" width="196" height="44" rx="10" fill="rgba(0,120,255,.05)" stroke="rgba(0,120,255,.4)" stroke-width="1.5" stroke-dasharray="4,3"/></svg>',
        '<svg width="220" height="456" viewBox="0 0 220 456" fill="none"><rect x="0" y="0" width="220" height="270" fill="#E8E5DC"/><line x1="0" y1="60" x2="220" y2="60" stroke="#D8D4CB" stroke-width="1"/><line x1="0" y1="120" x2="220" y2="120" stroke="#D8D4CB" stroke-width="1"/><line x1="0" y1="180" x2="220" y2="180" stroke="#D8D4CB" stroke-width="1"/><line x1="0" y1="240" x2="220" y2="240" stroke="#D8D4CB" stroke-width="1"/><line x1="55" y1="0" x2="55" y2="270" stroke="#D8D4CB" stroke-width="1"/><line x1="110" y1="0" x2="110" y2="270" stroke="#D8D4CB" stroke-width="1"/><line x1="165" y1="0" x2="165" y2="270" stroke="#D8D4CB" stroke-width="1"/><rect x="0" y="108" width="220" height="16" fill="rgba(255,255,255,.7)"/><rect x="90" y="0" width="16" height="270" fill="rgba(255,255,255,.6)"/><ellipse cx="55" cy="80" rx="40" ry="32" fill="#C8DDB8" opacity=".8"/><path d="M100 95 C100 82 92 76 84 76 C76 76 68 82 68 95 C68 107 84 122 84 122Z" fill="#888"/><circle cx="84" cy="93" r="7" fill="white"/><circle cx="130" cy="140" r="18" fill="rgba(60,60,60,.1)" stroke="#888" stroke-width="1" stroke-dasharray="3,2"/><path d="M142 138 C142 129 136 124 130 124 C124 124 118 129 118 138 C118 147 130 158 130 158Z" fill="#555"/><circle cx="130" cy="136" r="6" fill="white"/><path d="M170 190 C170 181 164 176 158 176 C152 176 146 181 146 190 C146 199 158 210 158 210Z" fill="#888"/><circle cx="158" cy="188" r="6" fill="white"/><rect x="10" y="38" width="200" height="32" rx="8" fill="rgba(255,255,255,.97)"/><circle cx="26" cy="54" r="6" fill="none" stroke="#AAA" stroke-width="1.5"/><line x1="30" y1="58" x2="34" y2="62" stroke="#AAA" stroke-width="1.5" stroke-linecap="round"/><rect x="42" y="49" width="80" height="8" rx="2" fill="#CCC"/><rect x="170" y="47" width="32" height="13" rx="6" fill="#DDD"/><rect x="0" y="268" width="220" height="188" rx="20" fill="white"/><rect x="90" y="276" width="40" height="4" rx="2" fill="#DDD"/><rect x="12" y="290" width="196" height="44" rx="8" fill="#F5F5F5"/><rect x="22" y="300" width="28" height="28" rx="7" fill="#DDD"/><rect x="58" y="302" width="80" height="7" rx="2" fill="#AAA"/><rect x="58" y="313" width="55" height="5" rx="2" fill="#CCC"/><rect x="168" y="304" width="30" height="14" rx="6" fill="#CCC"/><rect x="12" y="344" width="92" height="38" rx="7" fill="#F5F5F5"/><rect x="22" y="352" width="20" height="20" rx="5" fill="#DDD"/><rect x="48" y="354" width="28" height="5" rx="2" fill="#CCC"/><rect x="48" y="363" width="45" height="7" rx="2" fill="#AAA"/><rect x="116" y="344" width="92" height="38" rx="7" fill="#F5F5F5"/><rect x="126" y="352" width="20" height="20" rx="5" fill="#DDD"/><rect x="152" y="354" width="28" height="5" rx="2" fill="#CCC"/><rect x="152" y="363" width="45" height="7" rx="2" fill="#AAA"/><rect x="12" y="394" width="196" height="44" rx="10" fill="#B0B0B0"/><rect x="58" y="409" width="104" height="12" rx="3" fill="#888"/><rect x="12" y="394" width="196" height="44" rx="10" fill="rgba(0,120,255,.05)" stroke="rgba(0,120,255,.4)" stroke-width="1.5" stroke-dasharray="4,3"/></svg>',
        '<svg width="220" height="456" viewBox="0 0 220 456" fill="none"><rect x="12" y="12" width="40" height="8" rx="2" fill="#CCC"/><circle cx="28" cy="44" r="11" fill="#E8E8E8"/><rect x="21" y="41" width="14" height="6" rx="2" fill="#BBB"/><rect x="50" y="40" width="80" height="10" rx="2" fill="#AAA"/><rect x="12" y="64" width="196" height="90" rx="10" fill="#F5F5F5"/><rect x="24" y="74" width="72" height="7" rx="2" fill="#BBB"/><rect x="24" y="92" width="20" height="20" rx="5" fill="#DDD"/><rect x="52" y="95" width="50" height="6" rx="2" fill="#CCC"/><rect x="52" y="105" width="90" height="8" rx="2" fill="#AAA"/><line x1="24" y1="120" x2="196" y2="120" stroke="#E0E0E0" stroke-width="1"/><rect x="24" y="128" width="20" height="20" rx="5" fill="#DDD"/><rect x="52" y="131" width="50" height="6" rx="2" fill="#CCC"/><rect x="52" y="141" width="90" height="8" rx="2" fill="#AAA"/><rect x="12" y="166" width="70" height="7" rx="2" fill="#CCC"/><rect x="12" y="184" width="196" height="50" rx="10" fill="#1A1A1A"/><circle cx="38" cy="209" r="16" fill="#444"/><rect x="62" y="201" width="80" height="8" rx="2" fill="rgba(255,255,255,.5)"/><rect x="62" y="213" width="60" height="6" rx="2" fill="rgba(255,255,255,.25)"/><rect x="162" y="204" width="36" height="14" rx="6" fill="rgba(255,255,255,.15)"/><rect x="12" y="246" width="196" height="48" rx="8" fill="#FAFAFA" stroke="#E0E0E0" stroke-width="1" stroke-dasharray="4,3"/><rect x="24" y="258" width="140" height="7" rx="2" fill="#D0D0D0"/><rect x="24" y="270" width="100" height="7" rx="2" fill="#E0E0E0"/><rect x="12" y="306" width="196" height="36" rx="8" fill="#F0F7F2"/><rect x="22" y="316" width="16" height="16" rx="4" fill="#C8E0D0"/><rect x="46" y="318" width="148" height="6" rx="2" fill="#B0CCB8"/><rect x="46" y="328" width="120" height="6" rx="2" fill="#C0D8C8"/><rect x="12" y="356" width="196" height="44" rx="10" fill="#B0B0B0"/><rect x="58" y="371" width="104" height="12" rx="3" fill="#888"/><rect x="12" y="356" width="196" height="44" rx="10" fill="rgba(0,120,255,.05)" stroke="rgba(0,120,255,.4)" stroke-width="1.5" stroke-dasharray="4,3"/></svg>',
        '<svg width="220" height="456" viewBox="0 0 220 456" fill="none"><rect x="0" y="0" width="220" height="456" fill="#1A1A1A"/><ellipse cx="30" cy="40" rx="60" ry="55" fill="rgba(255,255,255,.06)"/><ellipse cx="195" cy="25" rx="50" ry="45" fill="rgba(255,255,255,.05)"/><circle cx="110" cy="80" r="26" fill="rgba(255,255,255,.15)"/><path d="M98 80 L107 89 L123 72" stroke="rgba(255,255,255,.6)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><rect x="40" y="118" width="140" height="20" rx="4" fill="rgba(255,255,255,.25)"/><rect x="60" y="143" width="100" height="14" rx="3" fill="rgba(255,255,255,.15)"/><rect x="24" y="170" width="172" height="7" rx="2" fill="rgba(255,255,255,.18)"/><rect x="36" y="181" width="148" height="7" rx="2" fill="rgba(255,255,255,.12)"/><rect x="12" y="202" width="196" height="96" rx="12" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.12)" stroke-width="1"/><rect x="28" y="216" width="20" height="20" rx="5" fill="rgba(255,255,255,.12)"/><rect x="56" y="218" width="50" height="5" rx="2" fill="rgba(255,255,255,.2)"/><rect x="56" y="227" width="90" height="8" rx="2" fill="rgba(255,255,255,.4)"/><line x1="28" y1="244" x2="196" y2="244" stroke="rgba(255,255,255,.08)" stroke-width="1"/><rect x="28" y="252" width="20" height="20" rx="5" fill="rgba(255,255,255,.12)"/><rect x="56" y="254" width="50" height="5" rx="2" fill="rgba(255,255,255,.2)"/><rect x="56" y="263" width="90" height="8" rx="2" fill="rgba(255,255,255,.4)"/><rect x="12" y="310" width="196" height="40" rx="10" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.1)" stroke-width="1"/><circle cx="32" cy="330" r="12" fill="rgba(255,255,255,.15)"/><rect x="52" y="324" width="80" height="7" rx="2" fill="rgba(255,255,255,.35)"/><rect x="52" y="335" width="55" height="5" rx="2" fill="rgba(255,255,255,.18)"/><rect x="160" y="323" width="40" height="14" rx="6" fill="rgba(200,160,60,.25)"/><rect x="12" y="362" width="196" height="42" rx="10" fill="rgba(255,255,255,.1)" stroke="rgba(255,255,255,.18)" stroke-width="1"/><rect x="60" y="376" width="100" height="10" rx="2" fill="rgba(255,255,255,.35)"/><rect x="72" y="416" width="76" height="7" rx="2" fill="rgba(255,255,255,.15)"/><rect x="50" y="362" width="120" height="42" rx="10" fill="rgba(0,200,100,.04)" stroke="rgba(0,200,100,.3)" stroke-width="1.5" stroke-dasharray="4,3"/><text x="110" y="387" text-anchor="middle" font-family="system-ui" font-size="7.5" fill="rgba(0,200,100,.7)" font-weight="600">TASK COMPLETE</text></svg>',
      ];
      const WF_ANNS = [
        {
          ctx: 'First thing the participant sees. No explanation, no onboarding. Just the number of verified families and one button. That number is doing a lot of work.',
          tap: '<strong>Tap "Find a Family"</strong>, the single CTA. The screen is built so this is the only decision on it. No sign-up form, no feature list.',
        },
        {
          ctx: 'V1 didn\'t have this screen. Participants would stall before sending because they had no way to evaluate the other family. The Trust Score, shared connections, background check, all visible before you commit to anything.',
          tap: '<strong>Tap "Send Playdate Request"</strong>, the CTA at the bottom. The participant can read the Trust Score (94/100), see 3 mutual families, and see the background check status before tapping.',
        },
        {
          ctx: 'V1 had the calendar sitting on top of the map. Two decisions at once. Participants froze. Now you pick the location first, then the date slides up.',
          tap: '<strong>Tap a location pin</strong> on the map. The active pin gets a pulse ring. The bottom sheet with date and time only shows up after a pin is picked.',
        },
        {
          ctx: 'In V1 the flow jumped from the map to a confirmation screen without this step. Participants had sent a request without consciously choosing to. This screen gives one moment to review everything.',
          tap: '<strong>Tap "Send Request"</strong>, after reviewing the location, date, recipient, and privacy note. This is the explicit commitment moment the original flow skipped.',
        },
        {
          ctx: 'Task done. Original confirmation was three words. People said it felt like nothing happened. This version shows the full booking and a pending status so you know the other family hasn\'t replied yet.',
          tap: 'No more tapping required. <strong>The task is done.</strong> The pending status shows the other family has not responded yet, which removes the false sense that the playdate is already confirmed.',
        },
      ];
      const WF_LBLS = ['Home','Trust Profile','Map','Send Request','Confirmation'];
      // Use a stable ID so the function can be registered on the window before innerHTML
      const pid = 'spwf_safeplay';
      // Register click handler NOW, before HTML is inserted
      window['_spwf_idx_' + pid] = 0;
      window['spWF_' + pid] = function() {
        var screens = window['_spwf_screens_' + pid];
        var lbls    = window['_spwf_lbls_' + pid];
        var bf      = window['_spwf_bf_' + pid];
        if (!screens) return;
        var idx = (window['_spwf_idx_' + pid] + 1) % screens.length;
        window['_spwf_idx_' + pid] = idx;
        var scr = document.getElementById(pid + '_scr');
        if (scr) scr.innerHTML = screens[idx];
        var dots = document.querySelectorAll('#' + pid + '_dots .cs-wf-dot');
        dots.forEach(function(d,i){ d.classList.toggle('active', i === idx); });
        var panel = document.getElementById(pid + '_panel');
        if (panel && bf) panel.innerHTML = bf(idx);
      };
      // Store data on window so the handler can access it
      window['_spwf_screens_' + pid] = WF;
      window['_spwf_anns_'    + pid] = WF_ANNS;
      window['_spwf_lbls_'    + pid] = WF_LBLS;
      window['_spwf_bf_'      + pid] = buildPanel;
      // Build panel HTML for a given screen index
      function buildPanel(idx) {
        var a = WF_ANNS[idx];
        var num = (idx+1) + ' / ' + WF.length;
        var name = WF_LBLS[idx];
        var p = '';
        p += '<div class="cs-wf-screen-num">' + num + '</div>';
        p += '<div class="cs-wf-screen-name">' + name + '</div>';
        if (a.ctx) p += '<p class="cs-wf-context">' + a.ctx + '</p>';
        if (a.tap) {
          p += '<div class="cs-wf-tap">';
          p += '<div class="cs-wf-tap-label">What the user taps</div>';
          p += '<div class="cs-wf-tap-text">' + a.tap + '</div>';
          p += '</div>';
        }
        if (idx < WF.length - 1) {
          p += '<button class="cs-wf-btn" onclick="spWF_' + pid + '()">';
          p += 'Next screen ';
          p += '<svg viewBox="0 0 24 24" fill="none" style="width:16px;height:16px"><path d="M5 12h14M13 6l6 6-6 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          p += '</button>';
        } else {
          p += '<div style="font-size:11px;color:rgba(255,255,255,.3);font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:6px 0">Flow complete</div>';
        }
        return p;
      }
      window['_spwf_bf_' + pid] = buildPanel;
      // Build HTML
      var wfHtml = '';
      wfHtml += '<div class="cs-block cs-wf-wrap" id="' + pid + '">';
      wfHtml += '<div class="cs-wf-header">';
      wfHtml += '<div><div class="cs-wf-label">Low-Fidelity Wireframe Prototype</div>';
      wfHtml += '<div class="cs-wf-title">The prototype that went into usability testing</div></div>';
      wfHtml += '<div class="cs-wf-task"><div class="cs-wf-task-label">Participant Task</div>';
      wfHtml += '<div class="cs-wf-task-text">&ldquo;Find a playground near your location, check a family profile, and send a playdate request.&rdquo;</div></div>';
      wfHtml += '</div>';
      wfHtml += '<div class="cs-wf-stage">';
      wfHtml += '<div>';
      wfHtml += '<div class="cs-wf-phone"><div class="cs-wf-screen-wrap" id="' + pid + '_scr">' + WF[0] + '</div></div>';
      wfHtml += '<div class="cs-wf-dots" id="' + pid + '_dots">';
      WF_LBLS.forEach(function(l,i){
        wfHtml += '<div class="cs-wf-dot' + (i===0?' active':'') + '" title="' + l + '"></div>';
      });
      wfHtml += '</div></div>';
      wfHtml += '<div class="cs-wf-panel" id="' + pid + '_panel">' + buildPanel(0) + '</div>';
      wfHtml += '</div>';
      wfHtml += '<div class="cs-wf-results">';
      wfHtml += '<div class="cs-wf-result"><div class="cs-wf-result-n">6/6</div><div class="cs-wf-result-l">Participants completed the task</div></div>';
      wfHtml += '<div class="cs-wf-result"><div class="cs-wf-result-n">87s</div><div class="cs-wf-result-l">Average completion time</div></div>';
      wfHtml += '<div class="cs-wf-result"><div class="cs-wf-result-n">0</div><div class="cs-wf-result-l">Critical errors</div></div>';
      wfHtml += '<div class="cs-wf-result"><div class="cs-wf-result-n">3</div><div class="cs-wf-result-l">Called the tone warm unprompted</div></div>';
      wfHtml += '</div></div>';
      html += wfHtml;
    }
    else if (s.type === 'outcome') {
      if (s.img) {
        html += `
        <div class="cs-block cs-outcome-banner" style="display:flex;align-items:center;gap:56px;flex-wrap:wrap">
          <div style="flex:1;min-width:280px">
            <p class="cs-ob-text">${s.headline}</p>
            <p class="cs-ob-sub">${s.body}</p>
          </div>
          <div style="position:relative;text-align:center;flex:none;width:220px">
            <svg viewBox="0 0 60 40" style="width:56px;position:absolute;left:-58px;top:-6px;transform:rotate(-8deg)" fill="none">
              <path d="M4 30 C 20 8, 38 4, 54 14" stroke="#F4E04D" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M42 8 L54 14 L46 24" stroke="#F4E04D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
            <div style="border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.12);box-shadow:0 8px 24px rgba(0,0,0,.35)">
              <img src="${s.img}" alt="${s.imgCaption||''}" style="width:100%;display:block">
            </div>
            ${s.imgCaption ? `<p style="font-size:11px;color:rgba(255,255,255,.55);margin-top:8px;font-weight:500;line-height:1.4">${s.imgCaption}</p>` : ''}
          </div>
        </div>`;
      } else {
        html += `
        <div class="cs-block cs-outcome-banner">
          <p class="cs-ob-text">${s.headline}</p>
          <p class="cs-ob-sub">${s.body}</p>
        </div>`;
      }
    }
    else if (s.type === 'heuristics') {
      const rows = s.items.map(i => `
        <div class="cs-heur-row">
          <svg class="cs-heur-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          <div>
            <div class="cs-heur-n">${i.n}</div>
            <div class="cs-heur-d">${i.d}</div>
          </div>
        </div>`).join('');
      html += `<div class="cs-heur-grid cs-block">${rows}</div>`;
    }
    else if (s.type === 'live-embed') {
      html += `
        <div class="cs-block">
          <div class="still-embed-frame">
            <div class="still-embed-bar">
              <span class="still-embed-dot"></span>
              <span class="still-embed-dot"></span>
              <span class="still-embed-dot"></span>
              <span class="still-embed-url">${s.src}</span>
              <a class="still-embed-open" href="${s.src}" target="_blank" rel="noopener">Open in new tab ↗</a>
            </div>
            <iframe class="still-embed-iframe" src="${s.src}" loading="lazy" title="Still — live interactive prototype"></iframe>
          </div>
          ${s.caption ? `<p class="ba-caption">${s.caption}</p>` : ''}
          <p class="ba-caption">Embedded frame not loading? <a href="${s.src}" target="_blank" rel="noopener">Open the prototype directly</a> — it runs standalone.</p>
        </div>`;
    }
  });

  html += `<div class="cs-cta-row">`;
  if (p.externalLink) {
    const ctaClass = p.id === 'premier' ? 'cs-cta-blue' : 'cs-cta-primary';
    html += `<a class="cs-cta ${ctaClass}" href="${p.externalLink}" target="_blank" rel="noopener">
      View full website
      <svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
    </a>`;
  } else {
    html += `<span class="cs-cta cs-cta-ghost" style="cursor:default">Conceptual project, prototype only</span>`;
  }
  html += `</div>`;
  html += `</div>`;

  if (next) {
    html += `
      <button class="cs-next" onclick="openCS('${p.nextId}')">
        <div class="cs-next-left">
          <div class="cs-next-lbl">Next Project</div>
          <div class="cs-next-title">${next.title.replace(/\n/g,' ')}</div>
          <div class="cs-next-sub">${next.sub}</div>
        </div>
        <div class="cs-next-arrow">→</div>
      </button>`;
  }

  return html;
}

async function openCS(id) {
  await PROJ_READY;
  const layer = document.getElementById('csLayer');
  const backdrop = document.getElementById('csBackdrop');
  const p = PROJ[id];
  if (!p) { console.error('No project data for', id); return; }
  if (p.embedSrc) {
    document.getElementById('csInner').innerHTML =
      `<iframe class="cs-embed-frame" src="${p.embedSrc}" title="${p.title} — case study"></iframe>`;
  } else {
    document.getElementById('csInner').innerHTML = buildCS(id);
  }
  layer.classList.add('open');
  layer.classList.add('expanded');
  if (backdrop) backdrop.classList.add('open');
  layer.style.setProperty('--cs-accent', p.accentColor || 'var(--coral)');
  layer.style.setProperty('--cs-accent-dark', p.accentColorDark || p.accentColor || 'var(--coral-text)');
  layer.classList.toggle('theme-still', p.theme === 'still');
  /* a full-page embed (the 3D gallery) has its own UI in the top-right
     corner, which the modal's own close button would otherwise sit on
     top of — move close down to the empty bottom-left corner instead */
  layer.classList.toggle('cs-embedded', !!p.embedSrc);
  layer.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  layer.dataset.current = id;
  pendingBAInit.forEach(uid => initBeforeAfter(uid));
  document.querySelectorAll('#csInner .cs-block').forEach(el => csBlockObs.observe(el));
  enhanceCaseStudyMedia();
}

/* ─── Before / after slider ───
   The "before" image is pinned to the wrap's FULL pixel width
   (not the shrinking clip box's width) so dragging reveals a
   crop instead of squishing the image. */
function initBeforeAfter(id) {
  const wrap = document.getElementById(id);
  if (!wrap) return;
  const before = wrap.querySelector('.ba-before');
  const beforeImg = before.querySelector('img');
  const handle = wrap.querySelector('.ba-handle');
  let dragging = false;

  function syncWidth() {
    beforeImg.style.width = wrap.offsetWidth + 'px';
  }
  syncWidth();
  window.addEventListener('resize', syncWidth, { passive: true });

  function setPct(pct) {
    pct = Math.max(0, Math.min(100, pct));
    before.style.width = pct + '%';
    handle.style.left = pct + '%';
  }
  function pctFromEvent(e) {
    const rect = wrap.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    return (x / rect.width) * 100;
  }
  function start(e) { dragging = true; wrap.classList.add('dragging'); move(e); }
  function move(e) { if (!dragging) return; setPct(pctFromEvent(e)); e.preventDefault(); }
  function end() { dragging = false; wrap.classList.remove('dragging'); }

  handle.addEventListener('mousedown', start);
  wrap.addEventListener('mousedown', start);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  handle.addEventListener('touchstart', start, { passive: false });
  wrap.addEventListener('touchmove', move, { passive: false });
  wrap.addEventListener('touchend', end);
}

function closeCS() {
  const layer = document.getElementById('csLayer');
  const backdrop = document.getElementById('csBackdrop');
  layer.classList.remove('open');
  layer.classList.remove('expanded');
  if (backdrop) backdrop.classList.remove('open');
  document.body.style.overflow = '';
}

/* ─── Lightbox ─── */
function zoomImg(img) {
  const lb    = document.getElementById('imgLb');
  const lbImg = document.getElementById('imgLbImg');
  const lbCap = document.getElementById('imgLbCap');
  lbImg.src = img.src;
  lbImg.alt = img.alt;
  lbCap.textContent = img.alt || '';
  lb.classList.add('open');
}
function closeLb() {
  document.getElementById('imgLb').classList.remove('open');
  const back = document.querySelector('.cs-nav');
  if (back) back.style.zIndex = '';
}

/* ─── Watch lightbox ─── */
function zoomWatch(img) {
  const lb    = document.getElementById('watchLb');
  const lbImg = document.getElementById('watchLbImg');
  const lbCap = document.getElementById('watchLbCap');
  lbImg.src = img.src;
  lbImg.alt = img.alt;
  lbCap.textContent = img.alt || '';
  lb.classList.add('open');
}
function closeWatchLb() {
  document.getElementById('watchLb').classList.remove('open');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (document.getElementById('imgLb').classList.contains('open'))   { closeLb();      return; }
    if (document.getElementById('watchLb').classList.contains('open')) { closeWatchLb(); return; }
    // Escape closes only the topmost thing: lightbox first, then the case study.
    const layer = document.getElementById('csLayer');
    if (layer && layer.classList.contains('open')) closeCS();
  }
});

// Project card clicks, alias openCS as openProj for the onclick attributes in HTML
function openProj(id) { openCS(id); }


/* ═══════════════════════════════════════════════════
   TOGGLE removed


/* ═══════════════════════════════════════════════════
   GRAPHIC DESIGN LIGHTBOX (openImg)
═══════════════════════════════════════════════════ */
// Reuse the cs-layer for single image view
/* ─── Case-study media: friendlier defaults ───
   Videos used to autoplay and loop forever, all at once, with no way to stop
   them. Now: each gets a pause/play button, plays only while it's on screen,
   and never autostarts for people who've asked their OS for reduced motion.
   Zoomable images also become reachable and operable from the keyboard. */
const CS_PLAY_SVG  = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const CS_PAUSE_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
let csVideoObs = null;
function enhanceCaseStudyMedia() {
  const root = document.getElementById('csInner');
  if (!root) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (csVideoObs) csVideoObs.disconnect();
  csVideoObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const v = e.target;
      if (reduce || v.dataset.userPaused === '1') return;
      if (e.isIntersecting) { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); }
      else v.pause();
    });
  }, { root: document.querySelector('.cs-layer'), threshold: 0.25 });
  root.querySelectorAll('video').forEach(v => {
    if (v.dataset.enhanced) return;
    v.dataset.enhanced = '1';
    v.removeAttribute('autoplay'); v.preload = 'metadata'; v.muted = true;
    const wrap = document.createElement('div');
    wrap.className = 'cs-vid';
    v.parentNode.insertBefore(wrap, v); wrap.appendChild(v);
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'cs-vid-btn';
    const sync = () => {
      btn.setAttribute('aria-label', v.paused ? 'Play video' : 'Pause video');
      btn.innerHTML = v.paused ? CS_PLAY_SVG : CS_PAUSE_SVG;
    };
    btn.addEventListener('click', () => {
      if (v.paused) { v.dataset.userPaused = '0'; const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); }
      else { v.dataset.userPaused = '1'; v.pause(); }
    });
    v.addEventListener('play', sync); v.addEventListener('pause', sync);
    wrap.appendChild(btn); sync();
    csVideoObs.observe(v);
  });
  root.querySelectorAll('[onclick^="openImg"]').forEach(el => {
    el.setAttribute('role', 'button'); el.tabIndex = 0;
    el.setAttribute('aria-label', 'Enlarge image: ' + (el.dataset.desc || (el.querySelector('img') || {}).alt || 'image'));
    el.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openImg(el); } });
  });
}

function openImg(el) {
  const img = el.querySelector('img');
  if (!img) return;
  const lb    = document.getElementById('imgLb');
  const lbImg = document.getElementById('imgLbImg');
  const lbCap = document.getElementById('imgLbCap');
  const back  = document.querySelector('.cs-nav');
  const desc  = el.dataset.desc || img.alt || '';
  lbImg.src = img.src;
  lbImg.alt = img.alt;
  lbCap.textContent = desc;
  lb.classList.add('open');
  if (back) back.style.zIndex = '-1';
}


/* ═══════════════════════════════════════════════════
   MOBILE MENU
═══════════════════════════════════════════════════ */
let mOpen = false;
const burgerEl = document.getElementById('burger');
const mobEl    = document.getElementById('mob');

burgerEl.addEventListener('click', () => {
  mOpen = !mOpen;
  if (mOpen) {
    mobEl.style.display = 'flex';
    requestAnimationFrame(() => mobEl.classList.add('open'));
    burgerEl.classList.add('open');
    document.body.style.overflow = 'hidden';
  } else { closeMob(); }
});

function closeMob() {
  mOpen = false;
  mobEl.classList.remove('open');
  burgerEl.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => { mobEl.style.display = 'none'; }, 310);
}


/* ═══════════════════════════════════════════════════
   NAV, stuck on scroll
═══════════════════════════════════════════════════ */
const navEl = document.getElementById('nav');
window.addEventListener('scroll', () => {
  navEl.classList.toggle('stuck', window.scrollY > 24);
}, { passive: true });


/* ═══════════════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════════════ */
const rvObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); rvObs.unobserve(e.target); }
  });
}, { threshold: 0.09 });
document.querySelectorAll('.rv').forEach(el => rvObs.observe(el));

/* Case-study blocks fade in the same way, but they're injected
   dynamically each time a case study opens, so they're observed
   from openCS() rather than once at page load. */
const csBlockObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('cs-visible'); csBlockObs.unobserve(e.target); }
  });
}, { threshold: 0.08 });


/* ═══════════════════════════════════════════════════
   SKILL BARS
═══════════════════════════════════════════════════ */
const skObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      skObs.unobserve(e.target);
    }
  });
}, { threshold: 0.2 });
document.querySelectorAll('.skills').forEach(el => skObs.observe(el));

/* Keyboard support for project cards */
document.querySelectorAll('.pc[tabindex]').forEach(card => {
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
  });
});


/* ═══════════════════════════════════════════════════
   READING PROGRESS BAR
═══════════════════════════════════════════════════ */
const prog = document.getElementById('read-progress');
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  prog.style.width = pct + '%';
}, { passive: true });


/* ═══════════════════════════════════════════════════
   MAGNETIC PROJECT CARD TILT
═══════════════════════════════════════════════════ */
// Card tilt removed — flat cards with border/shadow hover


/* ═══════════════════════════════════════════════════
   STAT NUMBER COUNT-UP
═══════════════════════════════════════════════════ */
function animateCount(el, target, suffix) {
  const dur = 1400;
  const start = performance.now();
  const isFloat = target % 1 !== 0;
  (function tick(now){
    const t = Math.min((now - start) / dur, 1);
    // ease out cubic
    const ease = 1 - Math.pow(1 - t, 3);
    const val = isFloat ? (target * ease).toFixed(1) : Math.round(target * ease);
    el.textContent = val + suffix;
    if (t < 1) requestAnimationFrame(tick);
    else { el.textContent = target + suffix; el.classList.add('done'); }
  })(start);
}

const statObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const raw = el.dataset.target;
    if (!raw) return;
    // Only animate simple "number + suffix" values (e.g. "80+", "3 months").
    // Compound values like a "3300px → 390px" range have two numbers in
    // them, which the count-up logic can't parse — show those as-is.
    const isSimple = /^[\d.]+[^\d]*$/.test(raw);
    if (!isSimple) { el.textContent = raw; statObs.unobserve(el); return; }
    const suffix = raw.replace(/[\d.]/g,'');
    const num    = parseFloat(raw);
    animateCount(el, num, suffix);
    statObs.unobserve(el);
  });
}, { threshold: 0.5 });


/* ═══════════════════════════════════════════════════
   PARALLAX WATERMARK ON SCROLL
═══════════════════════════════════════════════════ */
const wmCols = document.querySelectorAll('.wm-col');
window.addEventListener('scroll', () => {
  const sy = window.scrollY;
  wmCols.forEach((col, i) => {
    const dir = i % 2 === 0 ? 1 : -1;
    col.style.transform = `${col.classList.contains('r') ? 'rotate(180deg) ' : ''}translateY(${sy * dir * 0.18}px)`;
  });
}, { passive: true });





/* ═══════════════════════════════════════════════════
   HERO BACKGROUND SUBTLE MOUSE PARALLAX
═══════════════════════════════════════════════════ */
const hero = document.querySelector('.hero');
if (hero) {
  document.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth  - 0.5) * 14;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;
    hero.style.backgroundPosition = `${50 + x * 0.3}% ${50 + y * 0.3}%`;
    // move h-stack slightly
    const stack = hero.querySelector('.h-stack');
    if (stack) stack.style.transform = `translate(${x * 0.4}px, ${y * 0.4}px)`;
  });
}


/* ═══════════════════════════════════════════════════
   HOOK STAT COUNT-UP INTO EXISTING SCROLL REVEAL
═══════════════════════════════════════════════════ */
// After DOM ready, set data-target on stat numbers
// sk-bar tracking removed

const SP_SCREENS = [
    {html: '<div class="phone"> <div class="lbtn" style="top:86px;height:32px"></div> <div class="lbtn" style="top:130px;height:56px"></div> <div class="lbtn" style="top:198px;height:56px"></div> <div class="screen s1"> <div class="sb"> <span class="sb-t" style="color:rgba(255,255,255,.65)">9:41</span> <svg width="34" height="12" viewBox="0 0 34 12" fill="none" opacity=".55"> <rect x="0" y="3" width="3" height="9" rx="1" fill="white"/> <rect x="5" y="2" width="3" height="10" rx="1" fill="white"/> <rect x="10" y="1" width="3" height="11" rx="1" fill="white"/> <rect x="15" y="0" width="3" height="12" rx="1" fill="white"/> <rect x="22" y="4" width="9" height="6" rx="1.5" stroke="white" stroke-width="1.2"/> <rect x="31" y="5.5" width="1.5" height="3" rx=".75" fill="white"/> <rect x="23" y="5" width="6" height="4" rx=".8" fill="white"/> </svg> </div> <div class="s1-inner"> <div class="s1-badge"> <div class="s1-badge-dot"> <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 4.42 3.45 8.56 8 9.57C16.55 20.56 20 16.42 20 12V6L12 2z" fill="white"/><path d="M8 12l3 3 5-5" stroke="#2F8A50" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg> </div> <p>Verified parent network</p> </div> <div class="s1-logo">Safe<span>Play</span></div> <p class="s1-sub">Find families from your school. Meet at a playground. No group chats required.</p> <div class="bubbles"> <div class="bub bub-a"></div> <div class="bub bub-b"></div> <div class="bub bub-c"></div> <div class="bub bub-d"></div> <div class="bub bub-e"></div> <div class="bub bub-f"></div> <div class="bub-hero"> <!-- Playground A-frame slide: specific, drawn for SafePlay --> <svg width="52" height="44" viewBox="0 0 52 44" fill="none"> <!-- Slide surface --> <path d="M14 8 L36 36" stroke="white" stroke-width="3.5" stroke-linecap="round"/> <!-- Left leg --> <line x1="14" y1="8" x2="6" y2="36" stroke="rgba(255,255,255,.6)" stroke-width="2.5" stroke-linecap="round"/> <!-- Crossbar --> <line x1="8" y1="28" x2="32" y2="20" stroke="rgba(255,255,255,.45)" stroke-width="2" stroke-linecap="round"/> <!-- Ladder rungs --> <line x1="10" y1="14" x2="16" y2="12" stroke="rgba(255,255,255,.55)" stroke-width="1.8" stroke-linecap="round"/> <line x1="9" y1="20" x2="15" y2="18" stroke="rgba(255,255,255,.55)" stroke-width="1.8" stroke-linecap="round"/> <!-- Kid on slide --> <circle cx="30" cy="29" r="5" fill="white" opacity=".95"/> <path d="M27 38 Q30 42 33 38" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/> <!-- Arms out --> <line x1="26" y1="31" x2="22" y2="28" stroke="white" stroke-width="1.8" stroke-linecap="round"/> <line x1="34" y1="31" x2="38" y2="27" stroke="white" stroke-width="1.8" stroke-linecap="round"/> </svg> </div> </div> <div class="s1-trust"> <div class="s1-trust-ico"> <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 4.42 3.45 8.56 8 9.57C16.55 20.56 20 16.42 20 12V6L12 2z" fill="white"/></svg> </div> <div> <div class="s1-trust-label">247 families verified nearby</div> <div class="s1-trust-sub">School-linked and ID-checked</div> </div> </div> <a class="cta cta-green" style="margin-bottom:0">Find a Family</a> <span class="scr-link" style="color:rgba(255,255,255,.32)">Already signed up? <strong style="color:rgba(255,255,255,.6);font-weight:600">Sign in</strong></span> </div> </div> </div>', label: 'Home'},
    {html: '<div class="phone"> <div class="lbtn" style="top:86px;height:32px"></div> <div class="lbtn" style="top:130px;height:56px"></div> <div class="lbtn" style="top:198px;height:56px"></div> <div class="screen s2"> <div class="sb"><span class="sb-t" style="color:var(--sp-ink)">9:41</span></div> <div class="s2-inner"> <div class="s2-topbar"> <div class="back-btn"> <svg width="7" height="13" viewBox="0 0 7 13" fill="none"><path d="M6 1L1 6.5l5 5.5" stroke="var(--sp-ink)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg> </div> <h2>Family Profile</h2> </div> <div class="s2-score"> <div class="s2-score-top"> <div> <div class="s2-score-label">Trust Score</div> <div class="s2-score-num">94<span class="s2-score-denom">/100</span></div> </div> <div class="s2-pills"> <span class="chip chip-green-outline"> <svg width="7" height="7" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 4.42 3.45 8.56 8 9.57C16.55 20.56 20 16.42 20 12V6L12 2z" fill="var(--sp-green)"/></svg> ID Verified </span> <span class="chip chip-green-outline"> <svg width="7" height="7" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 4.42 3.45 8.56 8 9.57C16.55 20.56 20 16.42 20 12V6L12 2z" fill="var(--sp-green)"/></svg> School Linked </span> </div> </div> <div class="s2-bar-track"><div class="s2-bar-fill"></div></div> </div> <div class="s2-profile"> <div class="s2-avatar"> <div class="s2-av-ring"></div> <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="4" fill="white"/><path d="M4 20c0-4.42 3.58-8 8-8s8 3.58 8 8" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg> </div> <div> <div class="s2-name">Sarah &amp; Tom K.</div> <div class="s2-meta">Lincoln Park · 3 kids · Since 2023</div> </div> <span class="chip chip-green s2-dist">0.4 mi</span> </div> <div class="s2-grid"> <div class="s2-sig verified"> <div class="ico" style="width:24px;height:24px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--sp-green-dk)" stroke-width="1.8"/><path d="M8 10h8M8 14h5" stroke="var(--sp-green-dk)" stroke-width="1.7" stroke-linecap="round"/></svg></div> <div class="s2-sig-label">School</div> <div class="s2-sig-val">Lincoln Elem.</div> </div> <div class="s2-sig verified"> <div class="ico" style="width:24px;height:24px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="var(--sp-green-dk)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="var(--sp-green-dk)" stroke-width="1.8"/></svg></div> <div class="s2-sig-label">Background</div> <div class="s2-sig-val">Cleared 2024</div> </div> <div class="s2-sig"> <div class="ico" style="width:24px;height:24px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" stroke="var(--sp-ink40)" stroke-width="1.6" stroke-linejoin="round"/></svg></div> <div class="s2-sig-label">Rating</div> <div class="s2-sig-val">4.9 · 12 reviews</div> </div> <div class="s2-sig"> <div class="ico" style="width:24px;height:24px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="var(--sp-ink40)" stroke-width="1.8"/><path d="M12 7v5l3 3" stroke="var(--sp-ink40)" stroke-width="1.8" stroke-linecap="round"/></svg></div> <div class="s2-sig-label">Response</div> <div class="s2-sig-val">Under 1 hr</div> </div> </div> <div class="s2-mutual" style="margin-top:auto"> <div class="s2-faces"> <div class="s2-face" style="background:linear-gradient(145deg,#F0B880,#C9843A)"></div> <div class="s2-face" style="background:linear-gradient(145deg,#6EC6C2,#3A9E9A)"></div> <div class="s2-face" style="background:linear-gradient(145deg,#A8D9A8,#5BAF6A)"></div> </div> <div class="s2-mutual-text"><strong>3 mutual families</strong> via Lincoln PTA</div> </div> <a class="cta cta-navy" style="margin-top:auto">Send Playdate Request</a> <span class="scr-link s2-report">Report a concern</span> </div> </div> </div>', label: 'Trust Profile'},
    {html: '<div class="phone"> <div class="lbtn" style="top:86px;height:32px"></div> <div class="lbtn" style="top:130px;height:56px"></div> <div class="lbtn" style="top:198px;height:56px"></div> <div class="screen s3"> <div class="sb" style="z-index:5"><span class="sb-t" style="color:var(--sp-ink)">9:41</span></div> <div class="s3-map"> <div class="road road-h1"></div> <div class="road road-h2"></div> <div class="road road-v1"></div> <div class="road road-v2"></div> <div class="s3-water"></div> <div class="s3-park"></div> <!-- Active pin --> <div class="pin" style="top:104px;left:37%"> <div class="pin-pulse"></div> <div class="pin-body active"> <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3" stroke="var(--sp-green-dk)" stroke-width="1.8"/><path d="M9 15c0-1.66 1.34-3 3-3s3 1.34 3 3" stroke="var(--sp-green-dk)" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg> </div> </div> <div class="pin" style="top:52px;right:20%"> <div class="pin-body"><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3" stroke="white" stroke-width="1.8"/><path d="M9 15c0-1.66 1.34-3 3-3s3 1.34 3 3" stroke="white" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg></div> </div> <div class="pin" style="top:192px;left:14%"> <div class="pin-body"><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3" stroke="white" stroke-width="1.8"/><path d="M9 15c0-1.66 1.34-3 3-3s3 1.34 3 3" stroke="white" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg></div> </div> <div class="s3-searchbar"> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="flex-shrink:0"><circle cx="11" cy="11" r="7" stroke="var(--sp-ink40)" stroke-width="2"/><path d="M16.5 16.5L21 21" stroke="var(--sp-ink40)" stroke-width="2" stroke-linecap="round"/></svg> <input value="Chicago, IL" readonly> <span class="chip chip-green s3-filter">Near me</span> </div> </div> <div class="s3-sheet"> <div class="s3-handle"></div> <div class="s3-loc"> <div class="ico s3-loc .ico" style="width:36px;height:36px;border-radius:10px"> <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="var(--sp-green-pl)" stroke="var(--sp-green-dk)" stroke-width="1.6"/><circle cx="12" cy="9" r="2.5" fill="var(--sp-green-dk)"/></svg> </div> <div> <div class="s3-loc-name">Lincoln Park Playground</div> <div class="s3-loc-sub">0.4 mi · Verified · Open now</div> </div> <span class="chip chip-green s3-loc-score">4.9</span> </div> <div class="s3-dt"> <div class="s3-dt-btn"> <div class="ico" style="width:26px;height:26px"> <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="3" stroke="var(--sp-green-dk)" stroke-width="1.8"/><path d="M8 2v4M16 2v4M3 10h18" stroke="var(--sp-green-dk)" stroke-width="1.8" stroke-linecap="round"/></svg> </div> <div> <div class="s3-dt-label">Date</div> <div class="s3-dt-val">Jan 18</div> </div> </div> <div class="s3-dt-btn"> <div class="ico" style="width:26px;height:26px"> <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="var(--sp-green-dk)" stroke-width="1.8"/><path d="M12 7v5l3 3" stroke="var(--sp-green-dk)" stroke-width="1.8" stroke-linecap="round"/></svg> </div> <div> <div class="s3-dt-label">Time</div> <div class="s3-dt-val">1:30 PM</div> </div> </div> </div> <a class="cta cta-green">Choose This Spot</a> </div> </div> </div>', label: 'Map and Schedule'},
    {html: '<div class="phone"> <div class="lbtn" style="top:86px;height:32px"></div> <div class="lbtn" style="top:130px;height:56px"></div> <div class="lbtn" style="top:198px;height:56px"></div> <div class="screen s4"> <div class="sb"><span class="sb-t" style="color:var(--sp-ink)">9:41</span></div> <div class="s4-inner"> <div class="s4-topbar"> <div class="back-btn"> <svg width="7" height="13" viewBox="0 0 7 13" fill="none"><path d="M6 1L1 6.5l5 5.5" stroke="var(--sp-ink)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg> </div> <h2>Send Request</h2> </div> <div class="s4-card"> <div class="scr-eyebrow s4-card-label" style="color:var(--sp-green-dk)">Playdate Summary</div> <div class="s4-row"> <div class="ico s4-row .ico" style="width:26px;height:26px"> <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="var(--sp-green-pl)" stroke="var(--sp-green-dk)" stroke-width="1.6"/></svg> </div> <div> <div class="s4-row-label">Location</div> <div class="s4-row-val">Lincoln Park Playground</div> </div> </div> <div class="s4-row"> <div class="ico" style="width:26px;height:26px"> <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="3" stroke="var(--sp-green-dk)" stroke-width="1.8"/><path d="M3 10h18" stroke="var(--sp-green-dk)" stroke-width="1.8" stroke-linecap="round"/></svg> </div> <div> <div class="s4-row-label">Date and Time</div> <div class="s4-row-val">Sat Jan 18 · 1:30 PM</div> </div> </div> </div> <div class="scr-eyebrow s4-to-label" style="color:var(--sp-ink40)">Sending to</div> <div class="s4-family"> <div class="s4-fav"> <div class="s4-fav-ring"></div> <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="4" fill="rgba(255,255,255,.9)"/><path d="M4 20c0-4.42 3.58-8 8-8s8 3.58 8 8" stroke="rgba(255,255,255,.9)" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg> </div> <div> <div class="s4-fam-name">Sarah &amp; Tom K.</div> <div class="s4-fam-sub">Trust score 94 · 3 mutual families</div> </div> <span class="chip chip-green-outline s4-fam-score">94</span> </div> <div class="s4-note">Our kids love the swings, see you Saturday!</div> <div class="s4-privacy"> <div class="ico s4-privacy .ico" style="width:22px;height:22px;background:var(--sp-green)"> <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 4.42 3.45 8.56 8 9.57C16.55 20.56 20 16.42 20 12V6L12 2z" fill="white"/></svg> </div> <p>Your number stays private. All messages stay in-app until you are both ready.</p> </div> <a class="cta cta-green" style="position:absolute;bottom:0;left:0;right:0;border-radius:0;margin:0">Send Request</a> </div> </div> </div>', label: 'Send Request'},
    {html: '<div class="phone"> <div class="lbtn" style="top:86px;height:32px"></div> <div class="lbtn" style="top:130px;height:56px"></div> <div class="lbtn" style="top:198px;height:56px"></div> <div class="screen s5"> <div class="blob blob-1"></div> <div class="blob blob-2"></div> <div class="blob blob-3"></div> <div class="blob blob-4"></div> <div class="blob blob-5"></div> <div class="sb" style="z-index:3"><span class="sb-t" style="color:rgba(255,255,255,.45)">9:41</span></div> <div class="s5-inner"> <div class="s5-check"> <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> </div> <div class="s5-title">Ready<br>to Play!</div> <p class="s5-sub">Request sent to Sarah &amp; Tom K. They usually reply within the hour.</p> <div class="s5-card"> <div class="s5-card-row"> <div class="s5-row-ico"> <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="rgba(255,255,255,.55)" stroke-width="1.8"/></svg> </div> <div> <div class="s5-row-label">Location</div> <div class="s5-row-val">Lincoln Park Playground</div> </div> </div> <div class="s5-card-row"> <div class="s5-row-ico"> <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="3" stroke="rgba(255,255,255,.55)" stroke-width="1.8"/><path d="M3 10h18" stroke="rgba(255,255,255,.55)" stroke-width="1.8" stroke-linecap="round"/></svg> </div> <div> <div class="s5-row-label">Date and Time</div> <div class="s5-row-val">Saturday Jan 18 at 1:30 PM</div> </div> </div> <div class="s5-card-row"> <div class="s5-row-ico"> <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 4.42 3.45 8.56 8 9.57C16.55 20.56 20 16.42 20 12V6L12 2z" stroke="rgba(255,255,255,.55)" stroke-width="1.8"/></svg> </div> <div> <div class="s5-row-label">Safety Status</div> <div class="s5-row-val">All checks passed</div> </div> </div> </div> <div class="s5-family"> <div class="s5-fam-av"> <div class="s5-fam-ring"></div> <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="4" fill="rgba(255,255,255,.9)"/><path d="M4 20c0-4.42 3.58-8 8-8s8 3.58 8 8" stroke="rgba(255,255,255,.9)" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg> </div> <div> <div class="s5-fam-name">Sarah &amp; Tom K.</div> <div class="s5-fam-sub">Usually replies fast</div> </div> <span class="chip chip-gold" style="margin-left:auto">Pending</span> </div> <a class="cta cta-ghost" style="position:absolute;bottom:0;left:0;right:0;border-radius:0;margin:0">Share with your family</a> </div> </div> </div>', label: 'Confirmation'}
];

// ── navTo: scroll to section with nav offset ──
function navTo(id, e) {
  if (e) e.preventDefault();
  const layer = document.getElementById('csLayer');
  if (layer && layer.classList.contains('open')) {
    closeCS();
    setTimeout(() => scrollToSection(id), 320);
    return;
  }
  scrollToSection(id);
}
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const navH = document.getElementById('nav')?.offsetHeight || 64;
  const top = el.getBoundingClientRect().top + window.scrollY - navH - 8;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}
