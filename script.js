/* ============================================================
   OPATRA London — «AURUM LUMEN»
   Vanilla JS, без библиотек. rAF + IntersectionObserver.
   Уважает prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  /* ============ КОНВЕРСИИ Google Ads (AW-18374440906) ============
     Базовый тег gtag загружается в <head>. Здесь конверсии привязаны к РЕАЛЬНЫМ
     действиям (НЕ к загрузке страницы, иначе каждый визит = конверсия):
       "Контакт"        — клик по любой кнопке WhatsApp (услуги, акции, шапка, липкая).
       "Отправка формы" — сабмит формы записи (см. обработчик формы ниже).
       "Интерактивные номера" — на клик tel:/звонок, через gtag_report_conversion() (в <head>);
                                сейчас на сайте нет tel:-ссылок, поэтому не срабатывает. */
  var CONV_CONTACT = 'AW-18374440906/begrCI7Ukt0cEMrvzrlE'; // Контакт (клик WhatsApp)
  var CONV_LEAD    = 'AW-18374440906/8fYTCPjVkt0cEMrvzrlE'; // Отправка формы

  function fireConversion(sendTo) {
    if (typeof window.gtag === 'function') {
      gtag('event', 'conversion', { send_to: sendTo, value: 1.0, currency: 'USD' });
    }
  }

  /* Любой клик по ссылке wa.me = конверсия "Контакт" */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href*="wa.me"]') : null;
    if (a) fireConversion(CONV_CONTACT);
  });

  /* На мобильных браузер «запоминает» позицию скролла и открывает страницу
     не сверху. Отключаем восстановление и стартуем с верха — КРОМЕ случая,
     когда зашли по прямому якорю (напр. реклама ведёт на #massage). */
  if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
  if (!window.location.hash) {
    window.scrollTo(0, 0);
    window.addEventListener('load', function () {
      if (!window.location.hash) window.scrollTo(0, 0);
    });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Шапка: состояние при скролле ---------- */
  var header = document.getElementById('header');
  var waFloat = document.getElementById('waFloat');
  var heroEl = document.getElementById('hero');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-scrolled', y > 30);
    // Липкий WhatsApp прячем, пока виден hero с кнопками
    if (waFloat && heroEl) {
      waFloat.classList.toggle('is-hidden', y < heroEl.offsetHeight * 0.55);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Мобильное меню ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  function closeMenu() {
    burger.classList.remove('is-open');
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', function () {
    var open = !nav.classList.contains('is-open');
    burger.classList.toggle('is-open', open);
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.style.overflow = open ? 'hidden' : '';
  });

  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) closeMenu();
  });

  /* ---------- Scroll-reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Счётчики ---------- */
  var counters = document.querySelectorAll('.stat__num[data-count]');
  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var dur = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var counterIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { counterIO.observe(el); });
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------- Hero: золотые частицы (Canvas) ---------- */
  var canvas = document.getElementById('heroCanvas');
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext('2d');
    var particles = [];
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var running = true;

    function sizeCanvas() {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeParticle(initial) {
      return {
        x: Math.random() * W,
        y: initial ? Math.random() * H : H + 10,
        r: 0.6 + Math.random() * 1.9,
        vy: 0.12 + Math.random() * 0.4,
        vx: (Math.random() - 0.5) * 0.14,
        a: 0.1 + Math.random() * 0.5,
        tw: Math.random() * Math.PI * 2,
        tws: 0.004 + Math.random() * 0.012
      };
    }

    function initParticles() {
      sizeCanvas();
      var count = Math.min(90, Math.floor(W * H / 16000));
      particles = [];
      for (var i = 0; i < count; i++) particles.push(makeParticle(true));
    }

    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.y -= p.vy;
        p.x += p.vx;
        p.tw += p.tws;
        if (p.y < -12 || p.x < -12 || p.x > W + 12) particles[i] = makeParticle(false);
        var alpha = p.a * (0.55 + 0.45 * Math.sin(p.tw));
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, 'rgba(244, 227, 178, ' + alpha + ')');
        g.addColorStop(0.4, 'rgba(201, 162, 75, ' + alpha * 0.5 + ')');
        g.addColorStop(1, 'rgba(201, 162, 75, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }

    initParticles();
    requestAnimationFrame(tick);

    var resizeT;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(initParticles, 200);
    });

    // Пауза, когда hero вне экрана — бережём батарею
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var visible = entries[0].isIntersecting;
        if (visible && !running) { running = true; requestAnimationFrame(tick); }
        running = visible;
      }, { threshold: 0 }).observe(canvas);
    }
  }

  /* ---------- Cursor glow (десктоп) ---------- */
  var glow = document.querySelector('.cursor-glow');
  if (glow && finePointer && !reduceMotion) {
    var gx = -600, gy = -600, tx = gx, ty = gy, glowRaf = null;
    document.body.classList.add('has-cursor-glow');
    function glowTick() {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.transform = 'translate(' + (gx - 260) + 'px,' + (gy - 260) + 'px)';
      if (Math.abs(tx - gx) > 0.3 || Math.abs(ty - gy) > 0.3) {
        glowRaf = requestAnimationFrame(glowTick);
      } else {
        glowRaf = null;
      }
    }
    window.addEventListener('mousemove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
      if (!glowRaf) glowRaf = requestAnimationFrame(glowTick);
    }, { passive: true });
  }

  /* ---------- Золотой спотлайт на карточках услуг ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.service').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      }, { passive: true });
    });
  }

  /* ---------- Слайдер «До / После» ---------- */
  var ba = document.getElementById('baSlider');
  var baAfter = document.getElementById('baAfter');
  var baHandle = document.getElementById('baHandle');
  if (ba && baAfter && baHandle) {
    var baPos = 50;
    var dragging = false;

    function setBA(pos) {
      baPos = Math.max(0, Math.min(100, pos));
      baAfter.style.clipPath = 'inset(0 0 0 ' + baPos + '%)';
      baHandle.style.left = baPos + '%';
      ba.setAttribute('aria-valuenow', String(Math.round(baPos)));
    }

    function posFromEvent(e) {
      var rect = ba.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      return (x / rect.width) * 100;
    }

    ba.addEventListener('pointerdown', function (e) {
      dragging = true;
      ba.setPointerCapture && ba.setPointerCapture(e.pointerId);
      setBA(posFromEvent(e));
    });
    ba.addEventListener('pointermove', function (e) {
      if (dragging) setBA(posFromEvent(e));
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (evt) {
      ba.addEventListener(evt, function () { dragging = false; });
    });

    ba.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 10 : 3;
      if (e.key === 'ArrowLeft') { setBA(baPos - step); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setBA(baPos + step); e.preventDefault(); }
      if (e.key === 'Home') { setBA(0); e.preventDefault(); }
      if (e.key === 'End') { setBA(100); e.preventDefault(); }
    });

    /* Переключение процедур до/после */
    var baBefore = document.getElementById('baBefore');
    var baCaption = document.getElementById('baCaption');
    var baTabs = Array.prototype.slice.call(document.querySelectorAll('.ba__tab'));
    var procs = [
      { before: 'assets/ba-bukal-before.jpg', after: 'assets/ba-bukal-after.jpg', caption: 'Моделирующий буккальный массаж лица · 1 процедура' },
      { before: 'assets/ba-smas-before.jpg',  after: 'assets/ba-smas-after.jpg',  caption: 'СМАС-лифтинг + Плазмолифтинг' },
      { before: 'assets/ba-co2-before.jpg',   after: 'assets/ba-co2-after.jpg',   caption: 'Лазерная шлифовка CO₂' }
    ];
    function setProc(i) {
      var p = procs[i];
      if (!p) return;
      if (baBefore) baBefore.style.backgroundImage = 'url("' + p.before + '")';
      baAfter.style.backgroundImage = 'url("' + p.after + '")';
      if (baCaption) baCaption.textContent = p.caption;
      baTabs.forEach(function (t, ti) {
        var on = ti === i;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      setBA(50);
    }
    baTabs.forEach(function (t, ti) {
      t.addEventListener('click', function () { setProc(ti); });
    });
    if (baTabs.length) { setProc(0); } else { setBA(50); }
  }

  /* ---------- Форма записи → WhatsApp ---------- */
  var form = document.getElementById('bookingForm');
  if (form) {
    var nameInput = document.getElementById('fName');
    var phoneInput = document.getElementById('fPhone');
    var serviceInput = document.getElementById('fService');

    function setError(input, on) {
      input.closest('.form__field').classList.toggle('has-error', on);
    }

    [nameInput, phoneInput, serviceInput].forEach(function (input) {
      input.addEventListener('input', function () { setError(input, false); });
      input.addEventListener('change', function () { setError(input, false); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = nameInput.value.trim();
      var phone = phoneInput.value.trim();
      var service = serviceInput.value;

      var phoneDigits = phone.replace(/\D/g, '');
      var okName = name.length >= 2;
      var okPhone = phoneDigits.length >= 10 && phoneDigits.length <= 15;
      var okService = !!service;

      setError(nameInput, !okName);
      setError(phoneInput, !okPhone);
      setError(serviceInput, !okService);

      if (!okName || !okPhone || !okService) {
        var firstBad = !okName ? nameInput : (!okPhone ? phoneInput : serviceInput);
        firstBad.focus();
        return;
      }

      var msg = 'Здравствуйте! Хочу записаться в OPATRA London.\n' +
        'Имя: ' + name + '\n' +
        'Телефон: ' + phone + '\n' +
        'Услуга: ' + service;

      fireConversion(CONV_LEAD);
      window.open('https://wa.me/77772441614?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    });
  }
})();
