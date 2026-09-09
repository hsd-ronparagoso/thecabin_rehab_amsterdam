document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('open');
      });
    });
  }

  /* ---------- Hero description show more/less ---------- */
  const heroShowMore = document.getElementById('heroShowMore');
  const heroDesc = document.getElementById('heroDesc');
  if (heroShowMore && heroDesc) {
    heroShowMore.addEventListener('click', () => {
      const isExpanded = heroDesc.classList.toggle('collapsed') === false;
      heroShowMore.classList.toggle('expanded', isExpanded);
      heroShowMore.setAttribute('aria-expanded', String(isExpanded));
      heroShowMore.childNodes[0].textContent = isExpanded ? 'Toon minder ' : 'Toon meer ';
    });
  }

  /* ---------- Accordion (practical info) — smooth, height-aware ---------- */
  document.querySelectorAll('.accordion-item').forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');
    if (!trigger || !panel) return;

    const setHeight = (open) => {
      panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
    };
    setHeight(item.getAttribute('data-open') === 'true');

    trigger.addEventListener('click', () => {
      const isOpen = item.getAttribute('data-open') === 'true';
      item.setAttribute('data-open', String(!isOpen));
      trigger.setAttribute('aria-expanded', String(!isOpen));
      setHeight(!isOpen);
    });

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (item.getAttribute('data-open') === 'true') setHeight(true);
      }, 150);
    });
  });

  /* ---------- Answer cards (FAQ show more/less) ---------- */
  document.querySelectorAll('.answer-card').forEach(card => {
    const preview = card.querySelector('.answer-preview');
    const toggle = card.querySelector('.answer-toggle');
    const label = card.querySelector('.answer-toggle-label');
    if (!preview || !toggle || !label) return;

    const collapsedHeight = preview.getBoundingClientRect().height;
    const fullHeight = preview.scrollHeight;

    if (fullHeight <= collapsedHeight + 24) {
      card.setAttribute('data-no-clamp', 'true');
      return;
    }

    toggle.addEventListener('click', () => {
      const expanded = card.getAttribute('data-expanded') === 'true';
      card.setAttribute('data-expanded', String(!expanded));
      toggle.setAttribute('aria-expanded', String(!expanded));
      preview.style.maxHeight = expanded ? '' : preview.scrollHeight + 'px';
      label.textContent = expanded ? 'Lees meer' : 'Lees minder';
    });

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (card.getAttribute('data-expanded') === 'true') {
          preview.style.maxHeight = preview.scrollHeight + 'px';
        }
      }, 150);
    });
  });

  /* ---------- Lead form (client-side acknowledgement, no backend wired) ---------- */
  const leadForm = document.getElementById('leadForm');
  if (leadForm) {
    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = leadForm.querySelector('button[type="submit"]');
      if (btn) {
        btn.textContent = 'Aanvraag verzonden';
        btn.disabled = true;
      }
    });
  }

  /* ---------- Rehab carousel ---------- */
  const track = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsContainer = document.getElementById('paginationDots');

  if (track) {
    const placeholderCards = Array.from(track.children);
    while (track.children.length < 6 && placeholderCards.length) {
      track.appendChild(placeholderCards[(track.children.length - placeholderCards.length) % placeholderCards.length].cloneNode(true));
    }

    const cards = Array.from(track.children);
    let currentIndex = 0;
    let cardsPerView = getCardsPerView();
    let maxIndex = Math.max(0, cards.length - cardsPerView);

    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationId = 0;
    const dragThreshold = 40;

    track.setAttribute('tabindex', '0');
    track.setAttribute('role', 'region');
    track.setAttribute('aria-label', 'Revalidatiecentra carousel');

    function getCardsPerView() {
      const width = window.innerWidth;
      if (width <= 640) return 1;
      if (width <= 1024) return 2;
      return 3;
    }

    function renderDots() {
      dotsContainer.innerHTML = '';
      const totalPages = maxIndex + 1;
      for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('button');
        dot.classList.add('dot');
        if (i === currentIndex) dot.classList.add('active');
        dot.setAttribute('aria-label', `Ga naar slide ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
      }
    }

    function getTranslateOffset(index) {
      if (cards.length === 0) return 0;
      const cardWidth = cards[0].offsetWidth;
      const gap = parseFloat(window.getComputedStyle(track).gap) || 28;
      return index * (cardWidth + gap);
    }

    function goToSlide(index) {
      currentIndex = Math.min(Math.max(0, index), maxIndex);
      updateCarouselPosition();
      updateUI();
    }

    function updateCarouselPosition() {
      const offset = getTranslateOffset(currentIndex);
      currentTranslate = -offset;
      prevTranslate = currentTranslate;
      track.style.transform = `translateX(${currentTranslate}px)`;
    }

    function updateUI() {
      if (prevBtn) prevBtn.disabled = currentIndex === 0;
      if (nextBtn) nextBtn.disabled = currentIndex >= maxIndex;
      const dots = Array.from(dotsContainer.children);
      dots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentIndex));
    }

    if (prevBtn) prevBtn.addEventListener('click', () => { if (currentIndex > 0) goToSlide(currentIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', () => { if (currentIndex < maxIndex) goToSlide(currentIndex + 1); });

    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' && currentIndex < maxIndex) { e.preventDefault(); goToSlide(currentIndex + 1); }
      if (e.key === 'ArrowLeft' && currentIndex > 0) { e.preventDefault(); goToSlide(currentIndex - 1); }
    });

    track.addEventListener('mousedown', dragStart);
    track.addEventListener('touchstart', dragStart, { passive: true });
    track.addEventListener('mousemove', dragMove);
    track.addEventListener('touchmove', dragMove, { passive: true });
    track.addEventListener('mouseup', dragEnd);
    track.addEventListener('mouseleave', dragEnd);
    track.addEventListener('touchend', dragEnd);

    function dragStart(e) {
      isDragging = true;
      startX = getPositionX(e);
      animationId = requestAnimationFrame(animation);
      track.classList.add('dragging');
    }

    function dragMove(e) {
      if (!isDragging) return;
      const currentPosition = getPositionX(e);
      const diff = currentPosition - startX;
      currentTranslate = prevTranslate + diff;
    }

    function dragEnd() {
      if (!isDragging) return;
      isDragging = false;
      cancelAnimationFrame(animationId);
      track.classList.remove('dragging');

      const movedBy = currentTranslate - prevTranslate;
      if (movedBy < -dragThreshold && currentIndex < maxIndex) {
        currentIndex += 1;
      } else if (movedBy > dragThreshold && currentIndex > 0) {
        currentIndex -= 1;
      }
      goToSlide(currentIndex);
    }

    function getPositionX(e) {
      return e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    }

    function animation() {
      if (isDragging) {
        track.style.transform = `translateX(${currentTranslate}px)`;
        requestAnimationFrame(animation);
      }
    }

    let resizeTimeout2;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout2);
      resizeTimeout2 = setTimeout(() => {
        cardsPerView = getCardsPerView();
        maxIndex = Math.max(0, cards.length - cardsPerView);
        renderDots();
        goToSlide(Math.min(currentIndex, maxIndex));
      }, 150);
    });

    renderDots();
    goToSlide(0);
  }

  /* ---------- Active nav state (scroll-spy) ---------- */
  if (navLinks) {
    const spyLinks = Array.from(navLinks.querySelectorAll('.nav-link[href^="#"]'));
    const spySections = spyLinks
      .map(link => document.getElementById(link.getAttribute('href').slice(1)))
      .filter(Boolean);
    if (spySections.length && 'IntersectionObserver' in window) {
      const setActive = (id) => {
        spyLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
      };
      const spy = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
      spySections.forEach(section => spy.observe(section));
    }
  }

  /* ---------- Scroll reveal (fade + rise groups; see CSS "Scroll-reveal system") ---------- */
  const revealSelectors = [
    '.editorial-inner', '.trust-band-inner', '.answer-block-inner', '.detail-inner', '.cta-band-inner',
    '.card-grid', '.timeline-list', '.checklist-grid', '.accordion-inner', '.cost-grid',
    '.rehab-carousel-section'
  ];
  const revealEls = document.querySelectorAll(revealSelectors.join(','));
  if (prefersReduced) {
    revealEls.forEach(el => el.classList.add('in-view'));
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  /* ---------- Animated stat figures (counts up to the exact original text) ---------- */
  if (!prefersReduced && 'IntersectionObserver' in window) {
    document.querySelectorAll('.stat-pull .figure').forEach(el => {
      const original = el.textContent.trim();
      const match = original.match(/^(\d+)(,(\d+))?/);
      if (!match) return;
      const target = parseInt(match[1], 10);
      const decimals = match[3] || null;
      const suffix = original.slice(match[0].length);

      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          const duration = 1000;
          const start = performance.now();
          function tick(now) {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            const current = Math.round(target * eased);
            el.textContent = (decimals !== null ? `${current},${decimals}` : `${current}`) + suffix;
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = original;
          }
          requestAnimationFrame(tick);
        });
      }, { threshold: 0.5 });
      io.observe(el);
    });
  }

});

/* ---------- Carousel card thumbnail image switcher ---------- */
function switchCardImage(btn, newSrc) {
  const card = btn.closest('.rehab-card');
  if (!card) return;
  const mainImg = card.querySelector('.card-main-img');
  if (mainImg && newSrc) mainImg.src = newSrc;
  card.querySelectorAll('.thumb-btn').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}
