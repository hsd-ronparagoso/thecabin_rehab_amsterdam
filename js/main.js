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

  /* ---------- Lead modal (popup) ---------- */
  const modalOverlay = document.getElementById('leadModalOverlay');
  const modalClose = document.getElementById('leadModalClose');
  let lastFocused = null;

  function openLeadModal() {
    if (!modalOverlay) return;
    lastFocused = document.activeElement;
    modalOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    const firstField = modalOverlay.querySelector('input');
    if (firstField) firstField.focus();
  }

  function closeLeadModal() {
    if (!modalOverlay) return;
    modalOverlay.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('[data-open-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openLeadModal();
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeLeadModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeLeadModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay && !modalOverlay.hidden) closeLeadModal();
  });

  const popupLeadForm = document.getElementById('popupLeadForm');
  if (popupLeadForm) {
    popupLeadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = popupLeadForm.querySelector('button[type="submit"]');
      if (btn) {
        btn.textContent = 'Aanvraag verzonden';
        btn.disabled = true;
      }
      setTimeout(closeLeadModal, 1200);
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

  /* ---------- Lead forms (client-side acknowledgement, no backend wired) ---------- */
  ['leadForm', 'heroLeadForm'].forEach((formId) => {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.textContent = 'Aanvraag verzonden';
        btn.disabled = true;
      }
    });
  });

  /* ---------- Generic carousel (drag + arrows + dots) ---------- */
  function initCarousel({ trackId, prevBtnId, nextBtnId, dotsId, ariaLabel, perView }) {
    const track = document.getElementById(trackId);
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    const dotsContainer = document.getElementById(dotsId);
    if (!track) return;

    const cards = Array.from(track.children);
    let currentIndex = 0;
    let cardsPerView = getCardsPerView();
    let maxIndex = Math.max(0, cards.length - cardsPerView);

    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationId = 0;
    let dragMoved = false;
    const dragThreshold = 40;

    track.setAttribute('tabindex', '0');
    track.setAttribute('role', 'region');
    if (ariaLabel) track.setAttribute('aria-label', ariaLabel);

    function getCardsPerView() {
      const width = window.innerWidth;
      const cfg = perView || { mobile: 1, tablet: 2, desktop: 3 };
      if (width <= 640) return cfg.mobile;
      if (width <= 1024) return cfg.tablet;
      return cfg.desktop;
    }

    function renderDots() {
      if (!dotsContainer) return;
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
      const gap = parseFloat(window.getComputedStyle(track).gap) || 20;
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
      if (dotsContainer) {
        const dots = Array.from(dotsContainer.children);
        dots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentIndex));
      }
      cards.forEach((card, idx) => card.classList.toggle('is-current', idx === currentIndex));
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
      dragMoved = false;
      startX = getPositionX(e);
      animationId = requestAnimationFrame(animation);
      track.classList.add('dragging');
    }

    function dragMove(e) {
      if (!isDragging) return;
      const currentPosition = getPositionX(e);
      const diff = currentPosition - startX;
      if (Math.abs(diff) > 6) dragMoved = true;
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

    /* Prevent a card link from navigating when the user was actually dragging the track */
    track.addEventListener('click', (e) => {
      if (dragMoved) { e.preventDefault(); e.stopPropagation(); }
    }, true);

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

  initCarousel({
    trackId: 'checklistTrack', prevBtnId: 'checklistPrev', nextBtnId: 'checklistNext', dotsId: 'checklistDots',
    ariaLabel: 'Keuzefactoren carousel', perView: { mobile: 1, tablet: 1, desktop: 2 }
  });

  initCarousel({
    trackId: 'locationsTrack', prevBtnId: 'locationsPrev', nextBtnId: 'locationsNext', dotsId: 'locationsDots',
    ariaLabel: 'Locaties carousel', perView: { mobile: 1, tablet: 2, desktop: 3 }
  });

  /* ---------- Process stepper (Het proces) ---------- */
  const processTrack = document.getElementById('processTrack');
  const processPanel = document.getElementById('processPanel');
  const processProgressFill = document.getElementById('processProgressFill');
  if (processTrack && processPanel) {
    const steps = Array.from(processTrack.querySelectorAll('.process-step'));
    const panelNum = document.getElementById('processPanelNum');
    const panelEyebrow = document.getElementById('processPanelEyebrow');
    const panelTitle = document.getElementById('processPanelTitle');
    const panelDesc = document.getElementById('processPanelDesc');

    function selectStep(index, { instant } = {}) {
      const step = steps[index];
      if (!step) return;

      steps.forEach((s, i) => {
        const isActive = i === index;
        s.classList.toggle('active', isActive);
        s.setAttribute('aria-selected', String(isActive));
        if (isActive) s.setAttribute('aria-current', 'true');
        else s.removeAttribute('aria-current');
      });

      if (processProgressFill) {
        const pct = steps.length > 1 ? (index / (steps.length - 1)) * 100 : 100;
        processProgressFill.style.width = pct + '%';
      }

      const applyContent = () => {
        const num = String(index + 1).padStart(2, '0');
        panelNum.textContent = num;
        if (panelEyebrow) panelEyebrow.textContent = `Stap ${num} van ${steps.length}`;
        panelTitle.textContent = step.dataset.title;
        panelDesc.textContent = step.dataset.desc;
      };

      if (instant || prefersReduced) {
        applyContent();
      } else {
        processPanel.classList.add('transitioning');
        setTimeout(() => {
          applyContent();
          processPanel.classList.remove('transitioning');
        }, 180);
      }

      step.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
    }

    steps.forEach((step, index) => {
      step.addEventListener('click', () => {
        if (!step.classList.contains('active')) selectStep(index);
      });
    });

    processTrack.addEventListener('keydown', (e) => {
      const currentIndex = steps.findIndex(s => s.classList.contains('active'));
      if (e.key === 'ArrowRight' && currentIndex < steps.length - 1) { e.preventDefault(); selectStep(currentIndex + 1); }
      if (e.key === 'ArrowLeft' && currentIndex > 0) { e.preventDefault(); selectStep(currentIndex - 1); }
    });

    selectStep(0, { instant: true });
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
    '.editorial-inner', '.trust-band-inner', '.answer-block-inner', '.detail-inner', '.cta-band-inner', '.timeline-inner',
    '.card-grid', '.checklist-grid', '.accordion-inner', '.cost-grid',
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
