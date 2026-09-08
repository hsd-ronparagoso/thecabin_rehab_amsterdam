document.addEventListener('DOMContentLoaded', () => {

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

  /* ---------- Accordion (practical info) ---------- */
  document.querySelectorAll('.accordion-item').forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', () => {
      const isOpen = item.getAttribute('data-open') === 'true';
      item.setAttribute('data-open', String(!isOpen));
      trigger.setAttribute('aria-expanded', String(!isOpen));
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
      const gap = parseFloat(window.getComputedStyle(track).gap) || 24;
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

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        cardsPerView = getCardsPerView();
        maxIndex = Math.max(0, cards.length - cardsPerView);
        renderDots();
        goToSlide(Math.min(currentIndex, maxIndex));
      }, 150);
    });

    renderDots();
    goToSlide(0);
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
