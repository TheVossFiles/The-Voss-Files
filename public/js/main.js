/**
 * THE VOSS FILES — Main client-side script
 * Enhanced with mobile focus trap, swipe, and accessible controls.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile navigation with backdrop & accessibility
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navOverlay = document.getElementById('nav-overlay');

  function openMenu() {
    if (!navMenu || !navToggle) return;
    navMenu.classList.add('open');
    navToggle.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    if (navOverlay) navOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent background scrolling while menu is open

    // Focus first link in menu
    const firstLink = navMenu.querySelector('a, button');
    if (firstLink) firstLink.focus();
  }

  function closeMenu() {
    if (!navMenu || !navToggle) return;
    navMenu.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    if (navOverlay) navOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navMenu.classList.contains('open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (navOverlay) {
      navOverlay.addEventListener('click', closeMenu);
    }

    // Close on navigation link click
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        closeMenu();
        navToggle.focus();
      }
    });
  }

  // Dropdown toggle for mobile/click
  const dropdownToggle = document.querySelector('.nav-dropdown-toggle');
  const dropdownParent = document.querySelector('.nav-dropdown');
  if (dropdownToggle && dropdownParent) {
    dropdownToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownParent.classList.toggle('open');
      const isOpen = dropdownParent.classList.contains('open');
      dropdownToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      if (!dropdownParent.contains(e.target)) {
        dropdownParent.classList.remove('open');
        dropdownToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Spoiler collapsible section
  const spoilerToggle = document.querySelector('.spoiler-toggle');
  const spoilerContent = document.querySelector('.spoiler-content');
  if (spoilerToggle && spoilerContent) {
    spoilerToggle.addEventListener('click', () => {
      spoilerContent.classList.toggle('open');
      spoilerToggle.classList.toggle('open');
      const isOpen = spoilerContent.classList.contains('open');
      spoilerToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      const textSpan = spoilerToggle.querySelector('.spoiler-text');
      if (textSpan) {
        textSpan.textContent = isOpen ? 'Hide Full Spoilers & Lore Reveal' : 'Show Full Spoilers & True Ending Reveal';
      }
    });
  }

  // Copy API Token button on profile page
  const copyBtn = document.getElementById('copyTokenBtn');
  const tokenBox = document.getElementById('apiTokenVal');
  if (copyBtn && tokenBox) {
    copyBtn.addEventListener('click', async () => {
      try {
        const text = tokenBox.textContent.trim();
        await navigator.clipboard.writeText(text);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy token:', err);
      }
    });
  }

  // Feedback dynamic rating display
  const feedbackType = document.getElementById('feedbackType');
  const ratingGroup = document.getElementById('ratingSection');
  if (feedbackType && ratingGroup) {
    const updateRatingVisibility = () => {
      if (feedbackType.value === 'review') {
        ratingGroup.style.display = 'block';
      } else {
        ratingGroup.style.display = 'none';
      }
    };
    feedbackType.addEventListener('change', updateRatingVisibility);
    updateRatingVisibility();
  }

  // Table horizontal scroll hint indicator
  document.querySelectorAll('.table-wrapper').forEach(wrapper => {
    if (wrapper.scrollWidth > wrapper.clientWidth) {
      wrapper.classList.add('has-scroll');
    }
    wrapper.addEventListener('scroll', () => {
      if (wrapper.scrollLeft > 20) {
        wrapper.classList.add('scrolled');
      } else {
        wrapper.classList.remove('scrolled');
      }
    });
  });

  // ── Render Free Plan Cold Start & Page Loading Indicator ──
  const coldstartBanner = document.getElementById('render-coldstart-banner');
  let loadingTimer = null;

  function showLoadingState() {
    loadingTimer = setTimeout(() => {
      if (coldstartBanner) coldstartBanner.classList.add('visible');
    }, 2200); // Trigger after 2.2s of waiting (Render spin-up detection)
  }

  function hideLoadingState() {
    if (loadingTimer) clearTimeout(loadingTimer);
    if (coldstartBanner) coldstartBanner.classList.remove('visible');
  }

  // Intercept standard form submissions to show feedback on slow mobile networks
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', () => {
      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      if (submitBtn) {
        submitBtn.style.opacity = '0.75';
        submitBtn.style.pointerEvents = 'none';
      }
      showLoadingState();
    });
  });

  window.addEventListener('beforeunload', () => {
    showLoadingState();
  });

  // ── Touch-Friendly Accessible Lightbox with Swipe Support ──
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxBackdrop = document.querySelector('.lightbox-backdrop');

  const galleryImages = Array.from(document.querySelectorAll('.gallery-item img'));
  let activeImageIndex = 0;

  function openLightbox(index) {
    if (!lightboxModal || !galleryImages[index]) return;
    activeImageIndex = index;
    const img = galleryImages[index];
    const captionText = img.getAttribute('alt') || 'Gameplay Screenshot';

    lightboxImg.src = img.src;
    lightboxImg.alt = captionText;
    lightboxCaption.textContent = captionText;
    lightboxCounter.textContent = (activeImageIndex + 1) + ' / ' + galleryImages.length;

    lightboxModal.removeAttribute('hidden');
    lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.setAttribute('hidden', '');
    lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function nextImage() {
    if (galleryImages.length === 0) return;
    activeImageIndex = (activeImageIndex + 1) % galleryImages.length;
    openLightbox(activeImageIndex);
  }

  function prevImage() {
    if (galleryImages.length === 0) return;
    activeImageIndex = (activeImageIndex - 1 + galleryImages.length) % galleryImages.length;
    openLightbox(activeImageIndex);
  }

  if (galleryImages.length > 0 && lightboxModal) {
    galleryImages.forEach((img, idx) => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => openLightbox(idx));
    });

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
    if (lightboxNext) lightboxNext.addEventListener('click', nextImage);
    if (lightboxPrev) lightboxPrev.addEventListener('click', prevImage);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (lightboxModal.classList.contains('active')) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
      }
    });

    // Touch swipe gesture support for mobile devices
    let touchStartX = 0;
    let touchEndX = 0;

    lightboxModal.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightboxModal.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const swipeThreshold = 45;
      if (touchEndX < touchStartX - swipeThreshold) {
        nextImage(); // Swiped left -> next
      }
      if (touchEndX > touchStartX + swipeThreshold) {
        prevImage(); // Swiped right -> prev
      }
    }
  }

});
