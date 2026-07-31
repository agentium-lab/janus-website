/* ============================================================
   Janus — Ultra Effects Layer (vanilla JS, zero dependencies)
   canvas particle network · 3D tilt · scroll reveal ·
   typewriter rotator · code line reveal · parallax · to-top
   ============================================================ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var supportsIO = 'IntersectionObserver' in window;

  /* ---------- 0. safety: never leave content hidden ---------- */
  // If anything goes wrong, force-reveal everything after a timeout.
  var SAFETY_MS = 2600;
  var revealTargets = '.problem-card, .feature, .scenario, .code-window, .eco-pill, .framework-card, .step, .concept-card, .sdk-tab, .endpoint, .method-item, .section-head, .cta-card, .doc-hero, .flow-node, .tilt-card';

  /* ============================================================
     1. CANVAS PARTICLE NETWORK  (full-screen background)
     ============================================================ */
  function initParticles() {
    var canvas = doc.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, DPR = 1;
    var particles = [];
    var mouse = { x: -9999, y: -9999, active: false };
    var rafId = null;
    var running = false;
    var isMobile = window.innerWidth < 768;

    var COLORS = [
      '99, 102, 241',
      '168, 85, 247',
      '139, 92, 246',
      '96, 165, 250',
      '34, 211, 238'
    ];

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      seed();
    }

    function seed() {
      var count = isMobile
        ? Math.min(46, Math.floor((W * H) / 32000))
        : Math.min(120, Math.floor((W * H) / 16000));
      count = Math.max(24, count);
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.6 + 0.8,
          c: COLORS[(Math.random() * COLORS.length) | 0],
          tw: Math.random() * Math.PI * 2
        });
      }
    }

    function linkDist() { return isMobile ? 105 : 140; }
    function mouseRadius() { return isMobile ? 110 : 190; }

    function step() {
      var ld = linkDist();
      var mr = mouseRadius();
      var i, j, p, q, dx, dy, d2, d, alpha, t;

      // physics
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.tw += 0.02;

        // gentle mouse repulsion
        if (mouse.active) {
          dx = p.x - mouse.x;
          dy = p.y - mouse.y;
          d2 = dx * dx + dy * dy;
          if (d2 < mr * mr && d2 > 0.01) {
            d = Math.sqrt(d2);
            var f = ((mr - d) / mr) * 0.6;
            p.x += (dx / d) * f;
            p.y += (dy / d) * f;
          }
        }

        // wrap
        if (p.x < -20) p.x = W + 20;
        else if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20;
        else if (p.y > H + 20) p.y = -20;
      }

      ctx.clearRect(0, 0, W, H);

      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        for (j = i + 1; j < particles.length; j++) {
          q = particles[j];
          dx = p.x - q.x;
          dy = p.y - q.y;
          d2 = dx * dx + dy * dy;
          if (d2 > ld * ld) continue;
          d = Math.sqrt(d2);
          alpha = (1 - d / ld) * 0.16;
          ctx.strokeStyle = 'rgba(' + p.c + ', ' + alpha.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }

      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        var pulse = 0.5 + Math.sin(p.tw) * 0.5;
        ctx.fillStyle = 'rgba(' + p.c + ', ' + (0.55 + pulse * 0.45).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // mouse glow + links from cursor
      if (mouse.active) {
        var mg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, mr);
        mg.addColorStop(0, 'rgba(129, 140, 248, 0.10)');
        mg.addColorStop(1, 'rgba(129, 140, 248, 0)');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mr, 0, Math.PI * 2);
        ctx.fill();

        for (i = 0; i < particles.length; i++) {
          p = particles[i];
          dx = p.x - mouse.x;
          dy = p.y - mouse.y;
          d2 = dx * dx + dy * dy;
          if (d2 > ld * ld) continue;
          d = Math.sqrt(d2);
          alpha = (1 - d / ld) * 0.35;
          ctx.strokeStyle = 'rgba(165, 180, 252, ' + alpha.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }

      rafId = window.requestAnimationFrame(step);
    }

    function start() {
      if (running) return;
      running = true;
      rafId = window.requestAnimationFrame(step);
    }
    function stop() {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = null;
    }

    // visibility: pause when hidden
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) stop();
      else if (!reduceMotion) start();
    });

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    });
    doc.addEventListener('mouseleave', function () { mouse.active = false; });
    window.addEventListener('touchstart', function (e) {
      var t = e.touches[0];
      mouse.x = t.clientX;
      mouse.y = t.clientY;
      mouse.active = true;
    }, { passive: true });
    window.addEventListener('touchend', function () { mouse.active = false; });

    resize();
    if (!reduceMotion) start();
    else {
      // static frame so the page still has depth
      ctx.clearRect(0, 0, W, H);
      var ld2 = linkDist();
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var d2 = dx * dx + dy * dy;
          if (d2 > ld2 * ld2) continue;
          var d = Math.sqrt(d2);
          ctx.strokeStyle = 'rgba(' + particles[i].c + ', ' + ((1 - d / ld2) * 0.10).toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  /* ============================================================
     2. SCROLL REVEAL  (IntersectionObserver + staggered)
     ============================================================ */
  function initReveal() {
    if (!supportsIO) {
      revealAll();
      return;
    }
    var els = doc.querySelectorAll(revealTargets);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        reveal(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el, idx) {
      // group stagger by sibling position
      var grp = el.parentElement;
      var order = 0;
      if (grp) {
        var kids = Array.prototype.slice.call(grp.children).filter(function (c) {
          return c.classList && c.classList.contains(el.classList[0]);
        });
        order = kids.indexOf(el);
      }
      el.style.setProperty('--rd', Math.min(order, 6) * 70 + 'ms');
      el.classList.add('reveal-init');
      io.observe(el);
    });
  }

  function reveal(el) {
    el.classList.add('revealed');
  }

  function revealAll() {
    var els = doc.querySelectorAll(revealTargets);
    for (var i = 0; i < els.length; i++) els[i].classList.add('revealed');
  }

  // safety net: force-reveal anything still hidden AND inside the viewport
  setTimeout(function () {
    var els = doc.querySelectorAll('.reveal-init:not(.revealed)');
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) reveal(els[i]);
    }
  }, SAFETY_MS);

  /* ============================================================
     3. 3D TILT + GLARE  (cards)
     ============================================================ */
  function initTilt() {
    if (!finePointer || reduceMotion) return;
    var sel = '.problem-card, .feature, .scenario, .code-window, .framework-card, .step, .concept-card, .sdk-tab, .endpoint, .cta-card, .scenario-card, .method-item';
    var cards = doc.querySelectorAll(sel);
    Array.prototype.forEach.call(cards, function (card) {
      if (card.classList.contains('no-tilt')) return;
      card.classList.add('tilt-card');

      var glare = doc.createElement('span');
      glare.className = 'glare';
      glare.setAttribute('aria-hidden', 'true');
      card.appendChild(glare);

      var maxTilt = 7;

      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var rx = (0.5 - py) * maxTilt;
        var ry = (px - 0.5) * maxTilt;
        card.style.transform =
          'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-3px)';
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        card.classList.add('glare-on');
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
        card.classList.remove('glare-on');
      });
    });
  }

  /* ============================================================
     4. TYPEWRITER ROTATOR  (hero headline span)
     ============================================================ */
  function initRotator() {
    if (reduceMotion) return;
    var els = doc.querySelectorAll('.rotator');
    Array.prototype.forEach.call(els, function (el) {
      var words = (el.getAttribute('data-words') || '').split('|').filter(Boolean);
      if (words.length < 2) return;
      var base = el.textContent;
      if (words[0] === '') words[0] = base;
      var wi = 0, ci = words[0].length, deleting = false;
      var caret = doc.createElement('span');
      caret.className = 'rotator-caret';
      caret.setAttribute('aria-hidden', 'true');
      el.parentNode.insertBefore(caret, el.nextSibling);

      function tick() {
        var word = words[wi];
        if (!deleting) {
          ci++;
          if (ci > word.length) {
            ci = word.length;
            deleting = true;
            return setTimeout(tick, 1900);
          }
        } else {
          ci--;
          if (ci < 0) {
            ci = 0;
            deleting = false;
            wi = (wi + 1) % words.length;
            return setTimeout(tick, 320);
          }
        }
        el.textContent = word.slice(0, ci);
        setTimeout(tick, deleting ? 34 : 62);
      }
      setTimeout(tick, 1400);
    });
  }

  /* ============================================================
     5. CODE LINE REVEAL  (homepage showcase blocks)
     ============================================================ */
  function initCodeReveal() {
    if (reduceMotion) return;
    if (!supportsIO) return;
    var blocks = doc.querySelectorAll('.code-window pre code');
    if (!blocks.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        var code = entry.target;
        code.classList.add('code-typed');
      });
    }, { threshold: 0.15 });

    Array.prototype.forEach.call(blocks, function (code) {
      var html = code.innerHTML;
      var lines = html.split('\n');
      code.innerHTML = lines
        .map(function (l, i) { return '<span class="cline" style="--li:' + i + '">' + l + '</span>'; })
        .join('\n');
      io.observe(code);
    });
  }

  /* ============================================================
     6. HERO PARALLAX
     ============================================================ */
  function initParallax() {
    if (reduceMotion) return;
    var hero = doc.querySelector('.hero');
    if (!hero) return;
    var container = hero.querySelector('.container');
    var glow = hero.querySelector('.hero-glow');
    if (!container) return;

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          var y = window.scrollY;
          if (y < window.innerHeight * 1.4) {
            container.style.transform = 'translateY(' + (y * 0.18) + 'px)';
            if (glow) glow.style.transform = 'translateX(-50%) translateY(' + (y * 0.32) + 'px) scale(' + (1 + y / 3000) + ')';
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ============================================================
     7. NAVBAR SCROLL STATE
     ============================================================ */
  function initNavbar() {
    var nav = doc.querySelector('.navbar');
    if (!nav) return;
    function onScroll() {
      nav.classList.toggle('scrolled', window.scrollY > 12);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ============================================================
     8. BACK-TO-TOP BUTTON
     ============================================================ */
  function initToTop() {
    var btn = doc.createElement('button');
    btn.className = 'to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.textContent = '↑';
    doc.body.appendChild(btn);
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          btn.classList.toggle('show', window.scrollY > 520);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ---------- sidebar TOC scroll-spy ---------- */
  function initTocSpy() {
    var toc = doc.getElementById('doc-toc');
    if (!toc) return;
    var map = [];
    var links = toc.querySelectorAll('a[href^="#"]');
    Array.prototype.forEach.call(links, function (a) {
      var id = a.getAttribute('href').slice(1);
      var target = doc.getElementById(id);
      if (target) map.push({ a: a, el: target });
    });
    if (!map.length) return;
    function setActive() {
      var marker = 0;
      var pos = window.scrollY + 140;
      for (var i = 0; i < map.length; i++) {
        if (map[i].el.offsetTop <= pos) marker = i;
      }
      for (var j = 0; j < map.length; j++) {
        map[j].a.classList.toggle('active', j === marker);
      }
    }
    window.addEventListener('scroll', setActive, { passive: true });
    setActive();
  }

  /* ---------- boot ---------- */
  // defer script: DOM is fully parsed by now, init immediately to avoid FOUC
  initParticles();
  initReveal();
  initTilt();
  initRotator();
  initCodeReveal();
  initParallax();
  initNavbar();
  initToTop();
  initTocSpy();
})();
