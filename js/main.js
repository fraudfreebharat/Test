/**
 * ==========================================================================
 * MAYRA DENTAL CARE — GLOBAL SCRIPT (JS/MAIN.JS)
 * Component Loader, Navigation Drawer, Scroll State, Accordions & Tabs
 * ==========================================================================
 */

(function () {
  'use strict';

  // --- 1. DYNAMIC COMPONENT LOADER WITH RESILIENT FALLBACK ---
  async function loadComponent(selector, filePath) {
    const container = document.querySelector(selector);
    if (!container) return;

    // If container already contains content (e.g. pre-rendered for instant no-CORS file:// viewing), mark loaded and skip fetch
    if (container.children.length > 0) {
      container.setAttribute('data-loaded', 'true');
      return;
    }

    try {
      const response = await fetch(filePath);
      if (response.ok) {
        const html = await response.text();
        container.innerHTML = html;
        container.setAttribute('data-loaded', 'true');
      }
    } catch (err) {
      // In local file:// protocol or offline contexts, pre-rendered markup is used
      console.warn(`[Mayra Dental] Component fetch for ${filePath} bypassed or pre-rendered.`);
    }
  }

  // --- 2. ACTIVE NAVIGATION INDICATOR ---
  function highlightActiveNavigation() {
    const bodyPage = document.body.getAttribute('data-page') || '';
    const currentPath = window.location.pathname.toLowerCase();

    const navLinks = document.querySelectorAll('.desktop-nav .nav-link, .drawer-nav-link');
    navLinks.forEach(link => {
      const linkPage = link.getAttribute('data-nav');
      const href = link.getAttribute('href');

      const isMatch = (bodyPage && linkPage === bodyPage) ||
                      (href && currentPath.endsWith(href.toLowerCase())) ||
                      (bodyPage === 'home' && (href === 'index.html' || currentPath.endsWith('/')));

      if (isMatch) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  // --- 3. STICKY HEADER SCROLL LISTENER ---
  function initHeaderScroll() {
    const header = document.getElementById('site-header');
    if (!header) return;

    const handleScroll = () => {
      if (window.scrollY > 25) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // run once on load
  }

  // --- 4. MOBILE NAVIGATION DRAWER CONTROLLER ---
  function initMobileDrawer() {
    const toggleBtn = document.getElementById('mobile-nav-toggle');
    const drawer = document.getElementById('mobile-drawer');
    const closeBtn = document.getElementById('drawer-close-btn');

    if (!toggleBtn || !drawer) return;

    function openDrawer() {
      drawer.classList.add('is-active');
      drawer.setAttribute('aria-hidden', 'false');
      toggleBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function closeDrawer() {
      drawer.classList.remove('is-active');
      drawer.setAttribute('aria-hidden', 'true');
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      toggleBtn.focus();
    }

    toggleBtn.addEventListener('click', () => {
      const isOpen = drawer.classList.contains('is-active');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeDrawer);
    }

    // Close when clicking dark backdrop outside panel
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) {
        closeDrawer();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-active')) {
        closeDrawer();
      }
    });

    // Close on clicking any drawer nav link
    const drawerLinks = drawer.querySelectorAll('.drawer-nav-link');
    drawerLinks.forEach(link => {
      link.addEventListener('click', closeDrawer);
    });
  }

  // --- 5. ACCORDION SYSTEM (FAQs, Deliverables, Clinical Details) ---
  function initAccordions() {
    const accordions = document.querySelectorAll('.accordion');
    
    accordions.forEach(accordion => {
      const items = accordion.querySelectorAll('.accordion-item');

      items.forEach(item => {
        const trigger = item.querySelector('.accordion-trigger');
        if (!trigger) return;

        trigger.addEventListener('click', () => {
          const isExpanded = item.classList.contains('is-expanded');
          
          // If parent has data-single="true", collapse siblings
          if (accordion.getAttribute('data-single') === 'true') {
            items.forEach(sibling => {
              sibling.classList.remove('is-expanded');
              const siblingTrigger = sibling.querySelector('.accordion-trigger');
              if (siblingTrigger) siblingTrigger.setAttribute('aria-expanded', 'false');
            });
          }

          if (!isExpanded) {
            item.classList.add('is-expanded');
            trigger.setAttribute('aria-expanded', 'true');
          } else {
            item.classList.remove('is-expanded');
            trigger.setAttribute('aria-expanded', 'false');
          }
        });
      });
    });
  }

  // --- 6. TABBED COMPONENT SYSTEM ---
  function initTabs() {
    const tabGroups = document.querySelectorAll('[data-tabs]');

    tabGroups.forEach(group => {
      const tabButtons = group.querySelectorAll('[data-tab-target]');
      const tabPanels = document.querySelectorAll(`[data-tab-group="${group.getAttribute('data-tabs')}"]`);

      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.getAttribute('data-tab-target');

          // Update active button state
          tabButtons.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');

          // Update active panel
          tabPanels.forEach(panel => {
            if (panel.getAttribute('data-tab-panel') === target) {
              panel.style.display = 'block';
              panel.classList.add('is-active');
            } else {
              panel.style.display = 'none';
              panel.classList.remove('is-active');
            }
          });
        });
      });
    });

    // Hash-based deep link handler (e.g. activating #rate-card on pricing.html)
    function checkHashForTabs() {
      const hash = window.location.hash;
      if (!hash) return;
      const targetId = hash.substring(1);
      const targetElement = document.getElementById(targetId);
      if (!targetElement) return;

      const panel = targetElement.closest('[data-tab-panel]');
      if (!panel) return;

      const panelName = panel.getAttribute('data-tab-panel');
      const groupName = panel.getAttribute('data-tab-group');
      const tabGroup = document.querySelector(`[data-tabs="${groupName}"]`);
      if (!tabGroup) return;

      const matchingBtn = tabGroup.querySelector(`[data-tab-target="${panelName}"]`);
      if (matchingBtn) {
        matchingBtn.click();
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    }

    checkHashForTabs();
    window.addEventListener('hashchange', checkHashForTabs);
  }

  // --- 7. TOAST NOTIFICATION ENGINE ---
  window.showToast = function (title, message, type = 'success', duration = 4500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    const iconSvg = type === 'success'
      ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#198054" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
      : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#BA3333" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    toast.innerHTML = `
      <div style="flex-shrink: 0; padding-top: 2px;">${iconSvg}</div>
      <div class="toast-content" style="flex: 1;">
        <h5>${title}</h5>
        <p>${message}</p>
      </div>
      <button type="button" aria-label="Close notification" style="color: var(--color-text-subtle); cursor: pointer; padding: 2px;">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => {
      toast.remove();
    });

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 200ms ease';
        setTimeout(() => toast.remove(), 200);
      }
    }, duration);
  };

  // --- 8. INITIALIZATION ON DOM READY ---
  document.addEventListener('DOMContentLoaded', async () => {
    // Attempt dynamic component loading if container placeholders exist without children
    await loadComponent('[data-component="header"]', 'components/header.html');
    await loadComponent('[data-component="footer"]', 'components/footer.html');

    // Initialize all global behaviors
    highlightActiveNavigation();
    initHeaderScroll();
    initMobileDrawer();
    initAccordions();
    initTabs();
  });

})();
