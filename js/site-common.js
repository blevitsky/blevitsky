/* ═══════════════════════════════════════════════════
   SITE-WIDE: nav, mobile menu, active link, pixel egg
   Runs on every page.
═══════════════════════════════════════════════════ */

/* Mobile menu */
(function(){
  const burgerEl = document.getElementById('burger');
  const mobEl    = document.getElementById('mob');
  if (!burgerEl || !mobEl) return;
  let mOpen = false;
  burgerEl.addEventListener('click', () => {
    mOpen = !mOpen;
    if (mOpen) {
      mobEl.style.display = 'flex';
      requestAnimationFrame(() => mobEl.classList.add('open'));
      burgerEl.classList.add('open');
      document.body.style.overflow = 'hidden';
    } else { closeMob(); }
  });
  window.closeMob = function closeMob() {
    mOpen = false;
    mobEl.classList.remove('open');
    burgerEl.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { mobEl.style.display = 'none'; }, 310);
  };
})();

/* Nav stuck-on-scroll shadow */
(function(){
  const navEl = document.getElementById('nav');
  if (!navEl) return;
  window.addEventListener('scroll', () => {
    navEl.classList.toggle('stuck', window.scrollY > 24);
  }, { passive: true });
})();

/* Active nav link, based on current page filename */
(function(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-mid a, .mob a').forEach(a => {
    const href = a.getAttribute('href') || '';
    const file = href.split('#')[0];
    if (file === path || (path === 'index.html' && file === '')) {
      a.classList.add('active');
    }
  });
})();

/* Reading progress bar (Work/case-study heavy pages only, harmless elsewhere) */
(function(){
  const prog = document.getElementById('read-progress');
  if (!prog) return;
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    prog.style.width = (isFinite(pct) ? pct : 0) + '%';
  }, { passive: true });
})();

/* Scroll reveal */
(function(){
  const rvObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); rvObs.unobserve(e.target); }
    });
  }, { threshold: 0.09 });
  document.querySelectorAll('.rv').forEach(el => rvObs.observe(el));
})();

/* ═══════════════════════════════════════════════════
   CORNER CHARACTERS — persistent, interactive
   Same pixel-Ben figures from the intro, now living on
   the actual site. Desk-Ben waves; Drum-Ben plays a real
   (synthesized, no audio file needed) drum fill on click.
   Runs on every page.
═══════════════════════════════════════════════════ */
(function(){
  // These two live on the home page only — they leave with a fade
  // rather than just vanishing when you navigate elsewhere.
  const path = location.pathname.split('/').pop();
  const isHome = path === '' || path === 'index.html';
  if (!isHome) return;

  function build(){
    if (document.getElementById('drumBen')) return;

    const drum = document.createElement('div');
    drum.id = 'drumBen';
    drum.className = 'corner-pixel corner-pixel-right corner-pixel-grand';
    drum.setAttribute('role', 'button');
    drum.setAttribute('tabindex', '0');
    drum.setAttribute('aria-label', 'Play the drums');
    drum.title = 'Play the drums';
    drum.innerHTML = `<svg viewBox="0 0 32 32">
      <!-- hi-hat, stage left -->
      <line x1="3" y1="28" x2="3" y2="13" stroke="#8A8A8A" stroke-width=".6"/>
      <ellipse cx="3" cy="12.6" rx="3.1" ry=".9" fill="#C9A227"/>
      <ellipse cx="3" cy="11.4" rx="2.9" ry=".85" fill="#D4AF37"/>
      <!-- crash cymbal, stage right -->
      <line x1="28.5" y1="28" x2="27.4" y2="10" stroke="#8A8A8A" stroke-width=".6"/>
      <ellipse class="cymbal-crash" cx="27.4" cy="9.4" rx="4" ry="1.1" fill="#D4AF37"/>
      <!-- snare, front-left, on its stand -->
      <line x1="6.6" y1="28.5" x2="6" y2="24.6" stroke="#6B6B6B" stroke-width=".6"/>
      <line x1="9" y1="28.5" x2="9.2" y2="24.6" stroke="#6B6B6B" stroke-width=".6"/>
      <circle cx="7.6" cy="22.6" r="3.1" fill="#C7C7C7" stroke="#0C0C0C" stroke-width=".35"/>
      <circle class="snare-head" cx="7.6" cy="22.6" r="2.1" fill="#F0F0EE"/>
      <!-- floor tom, front-right -->
      <circle cx="24.6" cy="25.4" r="3.3" fill="#5C3A21" stroke="#0C0C0C" stroke-width=".35"/>
      <circle cx="24.6" cy="25.4" r="2.3" fill="#F0F0EE"/>
      <!-- bass / kick drum, center -->
      <circle cx="17" cy="24.4" r="7.4" fill="#5C3A21" stroke="#0C0C0C" stroke-width=".4"/>
      <circle class="kick-head" cx="17" cy="24.4" r="5.5" fill="#F0F0EE" stroke="#0C0C0C" stroke-width=".3"/>
      <circle cx="17" cy="24.4" r="1" fill="#8B5A2B" opacity=".55"/>
      <!-- drummer, seated behind the kit -->
      <rect x="12.5" y="13.4" width="9" height="8.6" rx="2" fill="#4A4550"/>
      <rect x="14.3" y="6.6" width="6" height="5" rx="1.6" fill="#4B3222"/>
      <rect x="13.7" y="6.6" width="1" height="2" fill="#4B3222"/>
      <rect x="19.9" y="6.6" width="1" height="2" fill="#4B3222"/>
      <rect x="15.3" y="9.4" width="4" height="3" fill="#E3AC7E"/>
      <!-- arms + sticks, animated -->
      <g class="drum-arm-l2">
        <rect x="9.4" y="13.6" width="3" height="2.1" fill="#E3AC7E"/>
        <rect x="6.4" y="16.6" width="4.4" height="1.3" fill="#C9A227"/>
      </g>
      <g class="drum-arm-r2">
        <rect x="20.6" y="12.4" width="3" height="2.1" fill="#E3AC7E"/>
        <rect x="22.6" y="9.2" width="4.4" height="1.3" fill="#C9A227"/>
      </g>
    </svg>`;
    document.body.appendChild(drum);

    let audioCtx;
    function ctx(){
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      return audioCtx;
    }
    // Low sine sweep with a fast decay — reads as a kick drum, not a beep.
    function playKick(){
      try {
        const c = ctx(), t = c.currentTime;
        const osc = c.createOscillator(), gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(42, t + 0.15);
        gain.gain.setValueAtTime(0.55, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain).connect(c.destination);
        osc.start(t); osc.stop(t + 0.23);
      } catch (e) {}
    }
    // Filtered white noise burst — reads as a snare crack, not a tone.
    function playSnare(){
      try {
        const c = ctx(), t = c.currentTime;
        const len = c.sampleRate * 0.16;
        const buf = c.createBuffer(1, len, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const noise = c.createBufferSource();
        noise.buffer = buf;
        const bp = c.createBiquadFilter();
        bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.7;
        const gain = c.createGain();
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        noise.connect(bp).connect(gain).connect(c.destination);
        noise.start(t);
      } catch (e) {}
    }
    function playCymbal(){
      try {
        const c = ctx(), t = c.currentTime;
        const len = c.sampleRate * 0.5;
        const buf = c.createBuffer(1, len, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const noise = c.createBufferSource();
        noise.buffer = buf;
        const hp = c.createBiquadFilter();
        hp.type = 'highpass'; hp.frequency.value = 6000;
        const gain = c.createGain();
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        noise.connect(hp).connect(gain).connect(c.destination);
        noise.start(t);
      } catch (e) {}
    }

    let playing = false;
    // Kick–snare–kick–snare–kick–crash: an actual small pattern,
    // not the same hit repeated six times.
    const pattern = [playKick, playSnare, playKick, playSnare, playKick, playCymbal];
    function playFill(){
      if (playing) return;
      playing = true;
      drum.classList.add('drumming');
      let i = 0;
      pattern[0]();
      const iv = setInterval(() => {
        i++;
        if (i >= pattern.length) {
          clearInterval(iv);
          playing = false;
          drum.classList.remove('drumming');
          return;
        }
        pattern[i]();
      }, 240);
    }
    drum.addEventListener('click', playFill);
    drum.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playFill(); } });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }

  // Fade Drum-Ben out before actually navigating to another page.
  const leavingPages = ['about.html', 'contact.html', 'design-system.html'];
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || !leavingPages.includes(href)) return;
    if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;

    const drum = document.getElementById('drumBen');
    if (!drum) return;

    e.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { window.location.href = href; return; }
    drum.classList.add('corner-pixel-leaving');
    setTimeout(() => { window.location.href = href; }, 260);
  });
})();

/* Graceful image fallback — sitewide. If any <img> fails to load (a dead
   link, a renamed file, a third-party host that's gone down), it quietly
   becomes a labeled placeholder instead of the browser's broken-image icon
   with raw alt text spilling out of a tiny box. Caught at the document level
   because the `error` event on <img> doesn't bubble, so this needs the
   capture phase to see it without wiring a listener onto every image. */
(function(){
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!img || img.tagName !== 'IMG' || img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = '1';
    const box = document.createElement('div');
    box.className = 'img-fallback';
    box.setAttribute('role', 'img');
    const parentDesc = img.closest('[data-desc]');
    const label = (parentDesc && parentDesc.dataset.desc) || img.alt || 'Image unavailable';
    box.setAttribute('aria-label', label);
    box.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg><span>Image unavailable</span>';
    const cs = getComputedStyle(img);
    box.style.aspectRatio = cs.aspectRatio !== 'auto' ? cs.aspectRatio : (img.width && img.height ? `${img.width}/${img.height}` : '4/3');
    if (img.parentElement) img.replaceWith(box);
  }, true);
})();
