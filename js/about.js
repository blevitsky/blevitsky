/* ═══════════════════════════════════════
   ABOUT PAGE — timeline expand/filter,
   shelf tabs, sidebar scroll-spy
═══════════════════════════════════════ */
(function(){

  // Timeline card expand/collapse
  document.querySelectorAll('.ab2-tl-card').forEach(card => {
    card.addEventListener('click', () => {
      const open = card.getAttribute('aria-expanded') === 'true';
      card.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });

  // Timeline filters
  const filters = document.querySelectorAll('.ab2-tl-filter');
  const tlItems = document.querySelectorAll('.ab2-tl-item');
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      tlItems.forEach(item => {
        const show = f === 'all' || item.dataset.cat === f;
        item.classList.toggle('ab2-hidden', !show);
      });
    });
  });

  // Shelf tabs
  const shelfTabs = document.querySelectorAll('.ab2-shelf-tab');
  const shelfPanels = document.querySelectorAll('.ab2-shelf-panel');
  shelfTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      shelfTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const key = tab.dataset.shelf;
      shelfPanels.forEach(p => p.classList.toggle('active', p.dataset.shelfPanel === key));
    });
  });

  // Sidebar scroll-spy
  const sideLinks = document.querySelectorAll('.ab2-side-link');
  const sections = Array.from(sideLinks).map(l => document.querySelector(l.getAttribute('href')));
  if (sideLinks.length && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = '#' + entry.target.id;
          sideLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === id));
        }
      });
    }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
    sections.forEach(s => { if (s) spy.observe(s); });
  }

})();

/* Spotify preview toggle — uses Spotify's own official embed iframe,
   nothing self-hosted. Closes any other open preview first so only
   one plays at a time. */
function togglePreview(btn) {
  const wrap = btn.closest('.ab2-pl-wrap');
  const embed = wrap.querySelector('.ab2-pl-embed');
  const alreadyOpen = embed.classList.contains('open');

  document.querySelectorAll('.ab2-pl-embed.open').forEach(el => {
    el.classList.remove('open');
    el.innerHTML = '';
  });

  if (alreadyOpen) return;

  const trackId = btn.dataset.track;
  embed.innerHTML = `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/${trackId}?utm_source=generator" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
  embed.classList.add('open');
}

/* Click-to-enlarge lightbox for every photo on the About page.
   Reuses the shared .img-lb CSS already defined for case studies. */
function openAboutLb(imgEl) {
  const lb = document.getElementById('imgLb');
  const lbImg = document.getElementById('imgLbImg');
  lbImg.src = imgEl.currentSrc || imgEl.src;
  lbImg.alt = imgEl.alt;
  lb.classList.add('open');
}
function closeAboutLb() {
  document.getElementById('imgLb').classList.remove('open');
}

/* Headshot tilt — a small parallax response to the cursor, only on
   devices with a real pointer. Resets smoothly on mouseleave via the
   CSS transition already set on .ab2-polaroid img. */
(function(){
  const wrap = document.querySelector('.ab2-polaroid');
  if (!wrap || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const img = wrap.querySelector('img');
  const MAX_DEG = 8;
  wrap.addEventListener('mousemove', (e) => {
    const r = wrap.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    img.style.setProperty('--tilt-y', (px * MAX_DEG * 2) + 'deg');
    img.style.setProperty('--tilt-x', (-py * MAX_DEG * 2) + 'deg');
    img.style.setProperty('--tilt-s', '1.03');
  });
  wrap.addEventListener('mouseleave', () => {
    img.style.setProperty('--tilt-y', '0deg');
    img.style.setProperty('--tilt-x', '0deg');
    img.style.setProperty('--tilt-s', '1');
  });
})();
