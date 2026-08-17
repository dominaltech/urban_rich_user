// URBAN RICH STOREFRONT CORE JAVASCRIPT SYSTEM

(function() {
  'use strict';

  // 1. EMBEDDED SUPABASE CREDENTIALS DIRECTLY IN JS
  const SUPABASE_URL = "https://vemlqojqluimqegryxug.supabase.co";
  const SUPABASE_ANON_KEY = [
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbWxxb2pxbHVpbXFlZ3J5eHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5Nzc3NzksImV4cCI6MjEwMTU1Mzc3OX0",
    ".bmwk1KkJ8LMCQAhlZQzThShSQhcXqrkPVNGj-z8vPes"
  ].join("");

  window.UR_CONFIG = window.UR_CONFIG || {};
  window.UR_CONFIG.SUPABASE_URL = SUPABASE_URL;
  window.UR_CONFIG.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

  // Global client reference
  window.urSupabase = null;

  function createSupabaseClient() {
    if (window.urSupabase) return window.urSupabase;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        window.urSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Storefront Supabase initialized successfully');
        return window.urSupabase;
      } catch (e) {
        console.error('Error creating Supabase client:', e);
      }
    }
    return null;
  }

  // Synchronous attempt
  createSupabaseClient();

  // Retry loop for mobile browsers with slower CDN script evaluation
  let retryCount = 0;
  const initInterval = setInterval(function() {
    if (createSupabaseClient() || retryCount > 20) {
      clearInterval(initInterval);
      document.dispatchEvent(new CustomEvent('urSupabaseReady'));
    }
    retryCount++;
  }, 100);

  // 2. GLOBAL DRAWER CONTROLS FOR MOBILE MENU & TASKBAR (Parse-time global attachment)
  window.openCatDrawer = function() {
    let overlay = document.getElementById('hamburgerOverlay') || document.getElementById('catOverlay') || document.querySelector('.hamburger-overlay') || document.querySelector('.drawer-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'hamburger-overlay';
      overlay.id = 'hamburgerOverlay';
      overlay.innerHTML = `
        <div class="hamburger-drawer">
          <div class="ham-head">
            <img src="images/logo.jpg" alt="Urban Rich" style="height:32px;width:auto;" />
            <span class="logo-wordmark">Urban Rich</span>
            <button class="ham-close" id="hamCloseBtn" onclick="closeCatDrawer()"><svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <div class="ham-body">
            <a href="index.html" class="ham-link">Home</a>
            <a href="shop.html" class="ham-link">All Products Catalog</a>
            <div class="ham-cat-title">Categories</div>
            <div class="ham-sublinks">
              <a href="plan-tshirt.html">Plan T-shirt</a>
              <a href="printing-tshirt.html">Printing T-shirt</a>
              <a href="oversize.html">Oversize</a>
              <a href="women.html">Women</a>
              <a href="pants.html">Pants</a>
              <a href="baggy.html">Baggy</a>
            </div>
            <div class="ham-divider" style="height:1px;background:var(--border);margin:16px 0;"></div>
            <a href="my-orders.html" class="ham-link">My Orders</a>
            <a href="cart.html" class="ham-link">My Shopping Bag</a>
            <a href="about.html" class="ham-link">About Us</a>
            <a href="policy.html" class="ham-link">Policy</a>
            <a href="contact.html" class="ham-link">Contact Us</a>
            <a href="signin.html" class="ham-link">Account / Sign In</a>
          </div>
        </div>
      `;
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) window.closeCatDrawer();
      });
      document.body.appendChild(overlay);
    }
    setTimeout(function() {
      overlay.classList.add('active');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }, 10);
  };

  window.closeCatDrawer = function(e) {
    if (e && e.target && e.target !== e.currentTarget && !e.target.classList.contains('hamburger-overlay') && !e.target.classList.contains('drawer-overlay') && !e.target.classList.contains('ham-close')) {
      return;
    }
    let overlays = document.querySelectorAll('#hamburgerOverlay, #catOverlay, .hamburger-overlay, .drawer-overlay');
    overlays.forEach(overlay => {
      overlay.classList.remove('active');
      overlay.classList.remove('open');
    });
    document.body.style.overflow = '';
  };

  // 3. SHOPPING CART STATE MANAGEMENT
  window.UR_CART = {
    get: function() {
      try {
        return JSON.parse(localStorage.getItem('ur_cart')) || [];
      } catch (e) {
        return [];
      }
    },
    set: function(items) {
      localStorage.setItem('ur_cart', JSON.stringify(items));
      this.updateBadge();
    },
    add: function(item) {
      let cart = this.get();
      let existingIndex = cart.findIndex(i => i.id === item.id && i.size === item.size);
      if (existingIndex > -1) {
        cart[existingIndex].quantity += (item.quantity || 1);
      } else {
        cart.push({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          image: item.image,
          size: item.size || 'M',
          quantity: item.quantity || 1
        });
      }
      this.set(cart);
      window.UR_TOAST('Added to cart!');
    },
    remove: function(id, size) {
      let cart = this.get().filter(i => !(i.id === id && i.size === size));
      this.set(cart);
    },
    updateQty: function(id, size, delta) {
      let cart = this.get();
      let item = cart.find(i => i.id === id && i.size === size);
      if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
          cart = cart.filter(i => !(i.id === id && i.size === size));
        }
      }
      this.set(cart);
    },
    calculateTotals: function() {
      let cart = this.get();
      let subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1)), 0);
      let isOnlyTestProduct = cart.length > 0 && cart.every(item => item.name && (item.name.includes('Test Product') || item.name.includes('1 Rupee') || item.name.includes('₹1')));
      let shippingFee = isOnlyTestProduct ? 0 : (subtotal > 0 ? 60 : 0);
      let total = subtotal + shippingFee;
      return { subtotal, shippingFee, total, isOnlyTestProduct };
    },
    updateBadge: function() {
      let cart = this.get();
      let count = cart.reduce((sum, item) => sum + item.quantity, 0);
      document.querySelectorAll('.cart-count-badge').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
      });
    }
  };

  // 4. TOAST NOTIFICATION UTILITY
  window.UR_TOAST = function(message) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    let toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  // 5. ANIMATIONS & OVERLAY EVENT LISTENERS
  function initAnimations() {
    const fadeEls = document.querySelectorAll('.fade-up');
    fadeEls.forEach(el => el.classList.add('visible'));
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0.05 });
      fadeEls.forEach(el => obs.observe(el));
    }
  }

  // 2b. GLOBAL SEARCH OVERLAY CONTROLS
  window.openSearchOverlay = function() {
    let overlay = document.getElementById('searchOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'search-overlay';
      overlay.id = 'searchOverlay';
      overlay.innerHTML = `
        <button class="search-overlay-close" aria-label="Close search" onclick="closeSearchOverlay()">
          <svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="search-box">
          <svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" class="search-input" placeholder="Search for products…" autocomplete="off" />
        </div>
        <div class="search-label">Top Searches</div>
        <div class="search-tags">
          <a href="plan-tshirt.html" class="search-tag">Plain Tees</a>
          <a href="printing-tshirt.html" class="search-tag">Graphic Tees</a>
          <a href="oversize.html" class="search-tag">Oversize Tees</a>
          <a href="baggy.html" class="search-tag">Baggy Jeans</a>
          <a href="pants.html" class="search-tag">Cargo Pants</a>
          <a href="women.html" class="search-tag">Women's Tops</a>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    setTimeout(function() {
      overlay.classList.add('active');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      const input = overlay.querySelector('.search-input');
      if (input) input.focus();
    }, 10);
  };

  window.closeSearchOverlay = function() {
    let overlay = document.getElementById('searchOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  function initOverlayListeners() {
    document.querySelectorAll('.js-search-open').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.openSearchOverlay();
      });
    });
    document.querySelectorAll('.search-overlay-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.closeSearchOverlay();
      });
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && e.target && e.target.classList.contains('search-input')) {
        e.preventDefault();
        const val = e.target.value.trim();
        if (val) {
          window.closeSearchOverlay();
          window.location.href = `shop.html?search=${encodeURIComponent(val)}`;
        }
      }
      if (e.key === 'Escape') {
        window.closeSearchOverlay();
        window.closeCatDrawer();
      }
    });

    document.querySelectorAll('.js-hamburger-open').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.openCatDrawer();
      });
    });
    const hamClose = document.getElementById('hamCloseBtn');
    if (hamClose) {
      hamClose.addEventListener('click', () => {
        window.closeCatDrawer();
      });
    }
    const hamOverlay = document.getElementById('hamburgerOverlay') || document.getElementById('catOverlay');
    if (hamOverlay) {
      hamOverlay.addEventListener('click', (e) => {
        if (e.target === hamOverlay) window.closeCatDrawer();
      });
    }
  }

  // DOM INITIALIZATION
  document.addEventListener('DOMContentLoaded', function() {
    window.UR_CART.updateBadge();
    initAnimations();
    initOverlayListeners();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Storefront SW registered:', reg))
        .catch(err => console.error('Storefront SW registration failed:', err));
    }
  });

})();
