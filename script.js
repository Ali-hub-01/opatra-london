/* ============================================================
   OPATRA London — «Linea Aurea»
   Vanilla JS: без библиотек. Анимации на rAF + IntersectionObserver.
   ============================================================ */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA_PHONE = '77772441614';

  /* ----------------------------------------------------------
     1. HERO: золотые частицы на Canvas («взвесь золота в воздухе»)
     ---------------------------------------------------------- */
  (function heroParticles() {
    var canvas = document.getElementById('heroCanvas');
    if (!canvas || reducedMotion) return;

    var ctx = canvas.getContext('2d');
    var particles = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var running = true;

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn() {
      // Количество частиц зависит от площади экрана (щадяще для мобильных)
      var count = Math.round(Math.min(70, Math.max(28, (w * h) / 22000)));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.6 + Math.random() * 1.8,
          vx: (Math.random() - 0.5) * 0.18,
          vy: -0.06 - Math.random() * 0.22,          // медленно всплывают
          phase: Math.random() * Math.PI * 2,        // мерцание
          speed: 0.004 + Math.random() * 0.008
        });
      }
    }

    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.phase += p.speed * 16;

        // Возврат в поле
        if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; }
        if (p.x < -6) p.x = w + 6;
        if (p.x > w + 6) p.x = -6;

        var alpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(p.phase));
        var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.2);
        grad.addColorStop(0, 'rgba(244, 227, 178, ' + alpha.toFixed(3) + ')');
        grad.addColorStop(0.4, 'rgba(201, 162, 75, ' + (alpha * 0.5).toFixed(3) + ')');
        grad.addColorStop(1, 'rgba(201, 162, 75, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }

    resize();
    spawn();
    requestAnimationFrame(tick);

    // Останавливаем отрисовку, когда hero не на экране (экономия батареи)
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var wasRunning = running;
        running = entries[0].isIntersecting;
        if (running && !wasRunning) requestAnimationFrame(tick);
      }).observe(canvas);
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { resize(); spawn(); }, 200);
    });
  })();

  /* ----------------------------------------------------------
     2. Золотая нить: прогресс чтения страницы
     ---------------------------------------------------------- */
  (function thread() {
    var fill = document.getElementById('threadFill');
    if (!fill) return;
    var ticking = false;
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      fill.style.transform = 'scaleX(' + progress.toFixed(4) + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ----------------------------------------------------------
     3. Липкий хедер: фон при прокрутке
     ---------------------------------------------------------- */
  (function header() {
    var el = document.getElementById('header');
    if (!el) return;
    var ticking = false;
    function update() {
      el.classList.toggle('is-scrolled', window.scrollY > 40);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ----------------------------------------------------------
     4. Мобильное меню (бургер)
     ---------------------------------------------------------- */
  (function menu() {
    var burger = document.getElementById('burger');
    var nav = document.getElementById('nav');
    if (!burger || !nav) return;

    function close() {
      nav.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Открыть меню');
    }
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    });
    // Закрываем меню по клику на пункт
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  })();

  /* ----------------------------------------------------------
     5. Reveal-анимации при скролле
     ---------------------------------------------------------- */
  (function reveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ----------------------------------------------------------
     6. Счётчики цифр (о центре)
     ---------------------------------------------------------- */
  (function counters() {
    var nums = document.querySelectorAll('.js-count');
    if (!nums.length) return;

    function animate(el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      if (reducedMotion) { el.textContent = String(target); return; }
      var duration = 1600;
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var t = Math.min(1, (ts - start) / duration);
        var eased = 1 - Math.pow(1 - t, 4); // easeOutQuart
        el.textContent = String(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      nums.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  })();

  /* ----------------------------------------------------------
     7. Слайдер «до/после» (range + drag, один механизм)
     ---------------------------------------------------------- */
  (function beforeAfter() {
    var slider = document.getElementById('baSlider');
    var after = document.getElementById('baAfter');
    var handle = document.getElementById('baHandle');
    var range = document.getElementById('baRange');
    if (!slider || !after || !handle || !range) return;

    function set(value) {
      var v = Math.max(0, Math.min(100, value));
      after.style.clipPath = 'inset(0 0 0 ' + v + '%)';
      handle.style.left = v + '%';
      range.value = v;
    }

    // Управление: невидимый range растянут на весь блок —
    // работает и пальцем (input по драгу), и стрелками с клавиатуры
    range.addEventListener('input', function () { set(parseFloat(range.value)); });

    // Прямой drag для плавности на touch (без «шагов» range)
    function fromEvent(e) {
      var rect = slider.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      set((x / rect.width) * 100);
    }
    slider.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return; // touch обрабатывает range/touchmove
      fromEvent(e);
      function move(ev) { fromEvent(ev); }
      function up() {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      }
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
    slider.addEventListener('touchmove', function (e) { fromEvent(e); }, { passive: true });

    set(50);
  })();

  /* ----------------------------------------------------------
     8. Форма записи → WhatsApp (без бэкенда)
     ---------------------------------------------------------- */
  (function bookingForm() {
    var form = document.getElementById('bookingForm');
    if (!form) return;

    var nameInput = document.getElementById('fName');
    var phoneInput = document.getElementById('fPhone');
    var serviceInput = document.getElementById('fService');

    function setError(input, hasError) {
      input.closest('.form__field').classList.toggle('has-error', hasError);
    }

    // Снимаем ошибку при вводе
    [nameInput, phoneInput, serviceInput].forEach(function (input) {
      input.addEventListener('input', function () { setError(input, false); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = nameInput.value.trim();
      var phone = phoneInput.value.trim();
      var service = serviceInput.value;

      // Базовая валидация
      var phoneDigits = phone.replace(/\D/g, '');
      var okName = name.length >= 2;
      var okPhone = phoneDigits.length >= 10 && phoneDigits.length <= 15;
      var okService = !!service;

      setError(nameInput, !okName);
      setError(phoneInput, !okPhone);
      setError(serviceInput, !okService);
      if (!okName || !okPhone || !okService) {
        var firstError = form.querySelector('.has-error .form__input');
        if (firstError) firstError.focus();
        return;
      }

      var text =
        'Здравствуйте! Хочу записаться в OPATRA London.\n' +
        'Имя: ' + name + '\n' +
        'Телефон: ' + phone + '\n' +
        'Услуга: ' + service;

      window.open('https://wa.me/' + WA_PHONE + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
  })();

  /* ----------------------------------------------------------
     9. Свечение за курсором (десктоп)
     ---------------------------------------------------------- */
  (function cursorGlow() {
    var glow = document.getElementById('cursorGlow');
    if (!glow || reducedMotion) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var x = 0, y = 0, cx = 0, cy = 0, active = false;

    window.addEventListener('mousemove', function (e) {
      x = e.clientX; y = e.clientY;
      if (!active) {
        active = true;
        glow.classList.add('is-on');
        cx = x; cy = y;
        requestAnimationFrame(tick);
      }
    }, { passive: true });

    function tick() {
      // Плавное «догоняющее» движение
      cx += (x - cx) * 0.12;
      cy += (y - cy) * 0.12;
      glow.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
      requestAnimationFrame(tick);
    }
  })();

  /* ----------------------------------------------------------
     10. Подсветка карточки услуги по тапу (мобильные)
     ---------------------------------------------------------- */
  (function tapGlow() {
    if (window.matchMedia('(pointer: fine)').matches) return;
    var cards = document.querySelectorAll('.protocol');
    cards.forEach(function (card) {
      card.addEventListener('touchstart', function () {
        cards.forEach(function (c) { if (c !== card) c.classList.remove('is-lit'); });
        card.classList.add('is-lit');
      }, { passive: true });
    });
  })();

  /* ----------------------------------------------------------
     11. Смус-скролл к якорям (фолбэк + учёт хедера в CSS)
     scroll-behavior: smooth задан в CSS; здесь — закрытие
     адресной строки от лишних прыжков не требуется.
     ---------------------------------------------------------- */
})();
