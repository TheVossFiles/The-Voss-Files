/**
 * THE VOSS FILES — Main client-side script
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile navigation toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const expanded = navMenu.classList.contains('open');
      navToggle.setAttribute('aria-expanded', expanded);
    });
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
});


  // Dropdown toggle for mobile/click
  const dropdownToggle = document.querySelector('.nav-dropdown-toggle');
  const dropdownParent = document.querySelector('.nav-dropdown');
  if (dropdownToggle && dropdownParent) {
    dropdownToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownParent.classList.toggle('open');
      const isOpen = dropdownParent.classList.contains('open');
      dropdownToggle.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!dropdownParent.contains(e.target)) {
        dropdownParent.classList.remove('open');
        dropdownToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
