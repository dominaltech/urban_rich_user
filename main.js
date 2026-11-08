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

  // Global Store Delivery & Shipping Defaults (Hydrated from cache or Supabase)
  const cachedSettings = localStorage.getItem('ur_store_settings');
  if (cachedSettings) {
    try {
      const parsed = JSON.parse(cachedSettings);
      window.UR_CONFIG.DELIVERY_FEE = parsed.delivery_fee !== undefined ? parseFloat(parsed.delivery_fee) : 60;
      window.UR_CONFIG.FREE_SHIPPING_ABOVE = parsed.free_shipping_above !== undefined ? parseFloat(parsed.free_shipping_above) : 999;
    } catch(e) {
      window.UR_CONFIG.DELIVERY_FEE = 60;
      window.UR_CONFIG.FREE_SHIPPING_ABOVE = 999;
    }
  } else {
    window.UR_CONFIG.DELIVERY_FEE = 60;
    window.UR_CONFIG.FREE_SHIPPING_ABOVE = 999;
  }

  // Global client reference
  window.urSupabase = null;

  async function fetchStoreSettings() {
    const client = window.urSupabase || createSupabaseClient();
    if (!client) return;
    try {
      const { data, error } = await client
        .from('store_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (data) {
        if (data.delivery_fee !== undefined) window.UR_CONFIG.DELIVERY_FEE = parseFloat(data.delivery_fee);
        if (data.free_shipping_above !== undefined) window.UR_CONFIG.FREE_SHIPPING_ABOVE = parseFloat(data.free_shipping_above);
        localStorage.setItem('ur_store_settings', JSON.stringify(data));
      }
    } catch(e) {
      console.log('Store settings fetch bypass:', e);
    }
  }

  function createSupabaseClient() {
    if (window.urSupabase) return window.urSupabase;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        window.urSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Storefront Supabase initialized successfully');
        fetchStoreSettings();
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
      fetchStoreSettings();
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
              <a href="hoodies.html">Hoodies</a>
              <a href="pants.html">Pants</a>
              <a href="baggy.html">Baggy</a>
              <!-- <a href="women.html">Women</a> -->
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
      
      let deliveryFee = (window.UR_CONFIG && window.UR_CONFIG.DELIVERY_FEE !== undefined) ? window.UR_CONFIG.DELIVERY_FEE : 60;
      let freeThreshold = (window.UR_CONFIG && window.UR_CONFIG.FREE_SHIPPING_ABOVE !== undefined) ? window.UR_CONFIG.FREE_SHIPPING_ABOVE : 999;

      let isFreeShipping = isOnlyTestProduct || (freeThreshold > 0 && subtotal >= freeThreshold);
      let shippingFee = isFreeShipping ? 0 : (subtotal > 0 ? deliveryFee : 0);

      // Dynamic Coupon discount calculation
      let coupon = window.UR_COUPON ? window.UR_COUPON.get() : null;
      let discount = 0;
      let discountType = null;
      let discountValue = 0;
      let couponCode = null;

      if (coupon && subtotal > 0) {
        const minOrder = parseFloat(coupon.min_order_value || 0);
        if (subtotal >= minOrder) {
          couponCode = coupon.code;
          const rawType = (coupon.discount_type || 'PERCENTAGE').toUpperCase();
          discountType = rawType.includes('PERCENT') ? 'PERCENTAGE' : 'FIXED';
          discountValue = parseFloat(coupon.discount_value || 0);

          if (discountType === 'PERCENTAGE') {
            discount = (subtotal * (discountValue / 100));
            if (coupon.max_discount && discount > parseFloat(coupon.max_discount)) {
              discount = parseFloat(coupon.max_discount);
            }
          } else {
            // Flat amount discount
            discount = Math.min(subtotal, discountValue);
          }
          discount = Math.round(discount * 100) / 100;
        }
      }

      let total = Math.max(0, subtotal - discount + shippingFee);
      return { 
        subtotal, 
        discount, 
        discountType,
        discountValue, 
        couponCode, 
        coupon, 
        shippingFee, 
        total, 
        isOnlyTestProduct, 
        deliveryFee, 
        freeThreshold, 
        isFreeShipping 
      };
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

  // 3.5 DYNAMIC STORE COUPON & EVENT BANNER ENGINE
  window.UR_COUPON = {
    get: function() {
      try {
        const raw = localStorage.getItem('ur_applied_coupon');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    set: function(couponObj) {
      if (couponObj) {
        localStorage.setItem('ur_applied_coupon', JSON.stringify(couponObj));
      } else {
        localStorage.removeItem('ur_applied_coupon');
      }
    },
    fetchActiveCoupons: async function() {
      const client = window.urSupabase || (window.supabase && typeof window.supabase.createClient === 'function' ? window.supabase.createClient(window.UR_CONFIG.SUPABASE_URL, window.UR_CONFIG.SUPABASE_ANON_KEY) : null);
      if (!client) return [];
      try {
        const { data, error } = await client
          .from('coupons')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        return data || [];
      } catch (err) {
        return [];
      }
    },
    fetchHomeBannerCoupon: async function() {
      const client = window.urSupabase || (window.supabase && typeof window.supabase.createClient === 'function' ? window.supabase.createClient(window.UR_CONFIG.SUPABASE_URL, window.UR_CONFIG.SUPABASE_ANON_KEY) : null);
      if (!client) return null;
      try {
        const { data, error } = await client
          .from('coupons')
          .select('*')
          .eq('is_active', true)
          .eq('show_home_banner', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        return data || null;
      } catch (err) {
        return null;
      }
    },
    fetchProductBannerCoupon: async function() {
      const client = window.urSupabase || (window.supabase && typeof window.supabase.createClient === 'function' ? window.supabase.createClient(window.UR_CONFIG.SUPABASE_URL, window.UR_CONFIG.SUPABASE_ANON_KEY) : null);
      if (!client) return null;
      try {
        const { data, error } = await client
          .from('coupons')
          .select('*')
          .eq('is_active', true)
          .eq('show_product_banner', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        return data || null;
      } catch (err) {
        return null;
      }
    },
    apply: async function(code) {
      const clean = (code || '').trim().toUpperCase();
      if (!clean) {
        if (typeof window.UR_TOAST === 'function') window.UR_TOAST('Please enter a coupon code');
        return { success: false, message: 'Please enter a coupon code' };
      }

      const client = window.urSupabase || (window.supabase && typeof window.supabase.createClient === 'function' ? window.supabase.createClient(window.UR_CONFIG.SUPABASE_URL, window.UR_CONFIG.SUPABASE_ANON_KEY) : null);
      
      let couponData = null;
      if (client) {
        try {
          const { data, error } = await client
            .from('coupons')
            .select('*')
            .eq('code', clean)
            .eq('is_active', true)
            .maybeSingle();
          if (data) couponData = data;
        } catch (e) {}
      }

      // Fallback defaults
      if (!couponData && (clean === 'URBAN5' || clean === 'RAKHI5')) {
        couponData = {
          code: clean,
          title: 'Special Discount',
          discount_type: 'PERCENTAGE',
          discount_value: 5,
          min_order_value: 0
        };
      }

      if (couponData) {
        const rawType = (couponData.discount_type || 'PERCENTAGE').toUpperCase();
        const stdType = rawType.includes('PERCENT') ? 'PERCENTAGE' : 'FIXED';
        const couponObj = {
          code: couponData.code.toUpperCase(),
          title: couponData.title,
          discount_type: stdType,
          discount_value: parseFloat(couponData.discount_value || 0),
          min_order_value: parseFloat(couponData.min_order_value || 0),
          max_discount: couponData.max_discount ? parseFloat(couponData.max_discount) : null
        };
        this.set(couponObj);
        const desc = stdType === 'PERCENTAGE' ? `${couponObj.discount_value}% OFF` : `₹${couponObj.discount_value} OFF`;
        if (typeof window.UR_TOAST === 'function') {
          window.UR_TOAST(`🎉 Coupon ${couponObj.code} applied! (${desc})`);
        }
        return { success: true, coupon: couponObj };
      } else {
        if (typeof window.UR_TOAST === 'function') {
          window.UR_TOAST('Invalid or expired coupon code.');
        }
        return { success: false, message: 'Invalid or expired coupon code' };
      }
    },
    autoApplyIfAvailable: async function() {
      if (this.get()) return this.get();
      try {
        const client = window.urSupabase || (window.supabase && typeof window.supabase.createClient === 'function' ? window.supabase.createClient(window.UR_CONFIG.SUPABASE_URL, window.UR_CONFIG.SUPABASE_ANON_KEY) : null);
        if (!client) return null;
        const { data } = await client
          .from('coupons')
          .select('*')
          .eq('is_active', true)
          .or('show_product_banner.eq.true,show_home_banner.eq.true')
          .order('discount_value', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) {
          const rawType = (data.discount_type || 'PERCENTAGE').toUpperCase();
          const stdType = rawType.includes('PERCENT') ? 'PERCENTAGE' : 'FIXED';
          const couponObj = {
            code: data.code.toUpperCase(),
            title: data.title,
            discount_type: stdType,
            discount_value: parseFloat(data.discount_value || 0),
            min_order_value: parseFloat(data.min_order_value || 0),
            max_discount: data.max_discount ? parseFloat(data.max_discount) : null
          };
          this.set(couponObj);
          return couponObj;
        }
      } catch(e) {}
      return null;
    },
    toggle: async function(code) {
      const current = this.get();
      if (current && current.code === (code || '').toUpperCase()) {
        this.remove();
        return false;
      } else {
        const res = await this.apply(code);
        return res.success;
      }
    },
    remove: function() {
      this.set(null);
      if (typeof window.UR_TOAST === 'function') {
        window.UR_TOAST('Coupon removed.');
      }
    },
    isApplied: function(code) {
      const current = this.get();
      return !!(current && current.code === (code || '').toUpperCase());
    }
  };

  // 3.6 DYNAMIC FESTIVE OFFER BANNER ENGINE (COMBO DEALS & CONTACT)
  window.UR_OFFER_BANNER = {
    fetchActive: async function() {
      const client = window.urSupabase || (window.supabase && typeof window.supabase.createClient === 'function' ? window.supabase.createClient(window.UR_CONFIG.SUPABASE_URL, window.UR_CONFIG.SUPABASE_ANON_KEY) : null);
      if (!client) return null;
      try {
        const { data, error } = await client
          .from('offer_banners')
          .select('*')
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) {
          console.warn('offer_banners fetch notice:', error.message || error);
          return null;
        }
        return data || null;
      } catch (err) {
        console.error('fetchActive offer_banners error:', err);
        return null;
      }
    }
  };

  // 3.7 UNIFIED PROMOTIONAL ROUTER (MAIN & SHOPPING PAGES)
  window.UR_PROMOS = {
    escapeHtml: function(str) {
      if (!str) return '';
      return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
      });
    },

    fetchPromoCoupon: async function() {
      const client = window.urSbClient || window.urSupabase || (window.supabase && typeof window.supabase.createClient === 'function' ? window.supabase.createClient(window.UR_CONFIG.SUPABASE_URL, window.UR_CONFIG.SUPABASE_ANON_KEY) : null);
      if (!client) return null;
      try {
        const { data } = await client
          .from('coupons')
          .select('*')
          .eq('is_active', true)
          .eq('show_home_banner', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) return data;

        const fallback = await client
          .from('coupons')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        return fallback.data || null;
      } catch (err) {
        return null;
      }
    },

    determineDisplay: function(page, coupon, offer) {
      const isOfferActive = !!(offer && offer.is_active);
      const isCouponActive = !!(coupon && coupon.is_active);

      if (isOfferActive && isCouponActive) {
        // Both chosen: Main page shows Offer Banner; Shopping page shows Coupon Banner on top
        return page === 'home' ? 'offer' : 'coupon';
      } else if (isOfferActive && !isCouponActive) {
        // Only Offer chosen: Both Main and Shopping show Offer Banner
        return 'offer';
      } else if (!isOfferActive && isCouponActive) {
        // Only Coupon chosen: Both Main and Shopping show Coupon Banner
        return 'coupon';
      }
      return null;
    },

    render: async function(options) {
      const page = (options && options.page) || 'home';
      const couponStripId = (options && options.couponStripId) || (page === 'home' ? 'homeEventStrip' : 'shopEventStrip');
      const offerStripId = (options && options.offerStripId) || (page === 'home' ? 'homeOfferStrip' : 'shopOfferStrip');

      const couponStrip = document.getElementById(couponStripId);
      const offerStrip = document.getElementById(offerStripId);

      const [coupon, offer] = await Promise.all([
        this.fetchPromoCoupon(),
        (window.UR_OFFER_BANNER ? window.UR_OFFER_BANNER.fetchActive() : Promise.resolve(null))
      ]);

      const displayType = this.determineDisplay(page, coupon, offer);

      if (displayType === 'offer' && offer && offerStrip) {
        if (couponStrip) {
          couponStrip.style.display = 'none';
          couponStrip.innerHTML = '';
        }
        this.renderOffer(offer, offerStrip);
      } else if (displayType === 'coupon' && coupon && couponStrip) {
        if (offerStrip) {
          offerStrip.style.display = 'none';
          offerStrip.innerHTML = '';
        }
        this.renderCoupon(coupon, couponStrip, page);
      } else {
        if (couponStrip) {
          couponStrip.style.display = 'none';
          couponStrip.innerHTML = '';
        }
        if (offerStrip) {
          offerStrip.style.display = 'none';
          offerStrip.innerHTML = '';
        }
      }
    },

    renderOffer: function(banner, container) {
      if (!container || !banner) return;
      const items = Array.isArray(banner.items) ? banner.items : [];
      const theme = banner.theme || 'diwali';

      container.className = `offer-banner-section theme-${theme}`;
      container.style.display = 'block';

      const itemsHtml = items.map(function(item) {
        const name = item.name || '';
        const price = item.price || '';
        const qty = item.qty || '';
        return `
          <div class="offer-combo-chip">
            <div class="offer-combo-icon">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            </div>
            <div class="offer-combo-details">
              <span class="offer-combo-name">${window.UR_PROMOS.escapeHtml(name)}</span>
              <div class="offer-combo-price-line">
                <span class="offer-combo-price">₹${window.UR_PROMOS.escapeHtml(price)}</span>
                <span class="offer-combo-qty">/ ${window.UR_PROMOS.escapeHtml(qty)}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      let contactHtml = '';
      if (banner.show_contact && banner.contact_number) {
        const phone = window.UR_PROMOS.escapeHtml(banner.contact_number);
        const cleanPhone = phone.replace(/[^0-9+]/g, '');
        contactHtml = `
          <div class="offer-contact-wrap">
            <a href="tel:${cleanPhone}" class="offer-call-action" title="Call ${phone} to order">
              <div class="offer-call-icon-bubble">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div class="offer-call-text">
                <span class="offer-call-sub">ORDER BY CALL</span>
                <span class="offer-call-num">${phone}</span>
              </div>
            </a>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="container">
          <div class="offer-banner-box">
            <div class="offer-banner-header">
              <div class="offer-badge-pill">
                <svg class="offer-sparkle-icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                  <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/>
                </svg>
                <span>${window.UR_PROMOS.escapeHtml(banner.badge_tag || '✨ FESTIVE OFFER')}</span>
              </div>
              <h3 class="offer-banner-title">${window.UR_PROMOS.escapeHtml(banner.title || 'Special Offer')}</h3>
            </div>
            <div class="offer-items-scroll">
              ${itemsHtml}
            </div>
            ${contactHtml}
          </div>
        </div>
      `;
    },

    renderCoupon: function(coupon, container, page) {
      if (!container || !coupon) return;
      const isPct = (coupon.discount_type || '').toUpperCase().includes('PERCENT');
      const discountStr = isPct ? `${parseFloat(coupon.discount_value)}% OFF` : `₹${parseFloat(coupon.discount_value).toFixed(0)} OFF`;
      const isApplied = window.UR_COUPON ? window.UR_COUPON.isApplied(coupon.code) : false;

      container.className = `rakhi-home-strip ${isApplied ? 'applied' : ''}`;
      container.style.display = 'block';

      container.innerHTML = `
        <div class="container">
          <div class="rakhi-strip-inner">
            <div class="rakhi-strip-left">
              <div class="rakhi-badge-pill">${window.UR_PROMOS.escapeHtml(coupon.banner_tag || '✨ SPECIAL EVENT OFFER')}</div>
              <div class="rakhi-strip-text">
                <span class="rakhi-strip-title">${window.UR_PROMOS.escapeHtml(coupon.banner_message || 'FLAT ' + discountStr + ' ON ALL ORDERS')}</span>
                <span class="rakhi-strip-sub">Use coupon code <strong class="rakhi-strip-code">${window.UR_PROMOS.escapeHtml(coupon.code)}</strong> at checkout</span>
              </div>
            </div>
            <div class="rakhi-strip-right">
              <button class="rakhi-strip-btn" onclick="window.UR_PROMOS.toggleCoupon('${window.UR_PROMOS.escapeHtml(coupon.code)}', '${page}')">
                <span>${isApplied ? `✓ ${discountStr} APPLIED (${coupon.code})` : `⚡ APPLY ${discountStr}`}</span>
              </button>
            </div>
          </div>
        </div>
      `;
    },

    toggleCoupon: async function(code, page) {
      if (!window.UR_COUPON) return;
      const isApplied = window.UR_COUPON.isApplied(code);
      if (isApplied) {
        window.UR_COUPON.remove();
      } else {
        await window.UR_COUPON.apply(code);
      }
      this.render({ page: page || 'home' });
    }
  };

  // 3.8 ULTRA-LOW EGRESS & INCREMENTAL SYNC CATALOG ENGINE
  window.UR_CATALOG = {
    PAGE_SIZE: 10,
    getCache: function() {
      try {
        const raw = localStorage.getItem('ur_catalog_cache');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    setCache: function(products, syncTime) {
      try {
        localStorage.setItem('ur_catalog_cache', JSON.stringify(products));
        if (syncTime) localStorage.setItem('ur_catalog_sync_time', syncTime);
      } catch (e) {}
    },
    // Micro 50-byte ping to check if catalog was modified
    checkNeedsRefresh: async function() {
      const client = window.urSupabase || (window.supabase && typeof window.supabase.createClient === 'function' ? window.supabase.createClient(window.UR_CONFIG.SUPABASE_URL, window.UR_CONFIG.SUPABASE_ANON_KEY) : null);
      if (!client) return false;
      try {
        const { data, error } = await client
          .from('products')
          .select('updated_at')
          .eq('status', 'published')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error || !data) return false;
        const lastLocalSync = localStorage.getItem('ur_catalog_sync_time');
        return !lastLocalSync || new Date(data.updated_at) > new Date(lastLocalSync);
      } catch (e) {
        return false;
      }
    },
    // Range query (fetches only 10 items at a time)
    fetchBatch: async function(options = {}) {
      const { start = 0, limit = 10, categoryId = null, categorySlug = null } = options;
      const client = window.urSupabase || (window.supabase && typeof window.supabase.createClient === 'function' ? window.supabase.createClient(window.UR_CONFIG.SUPABASE_URL, window.UR_CONFIG.SUPABASE_ANON_KEY) : null);
      if (!client) return { products: [], hasMore: false };

      try {
        let query = client
          .from('products')
          .select('id, name, price, mrp, main_image, is_new_arrival, category_id, updated_at, categories(id, slug, name)')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .range(start, start + limit - 1);

        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query;
        if (error) throw error;
        const products = data || [];
        return {
          products,
          hasMore: products.length === limit
        };
      } catch (err) {
        console.error('UR_CATALOG fetchBatch error:', err);
        return { products: [], hasMore: false };
      }
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
          <a href="pants.html" class="search-tag">Linen Pants</a>
          <a href="hoodies.html" class="search-tag">Hoodies</a>
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

    // 7. DYNAMIC CATEGORY NAVIGATION LOADER WITH SMART SESSION CACHING
    window.fetchStoreCategories = async function(forceRefresh = false) {
      const cacheKey = 'ur_cached_categories';
      const cacheTimeKey = 'ur_cached_categories_time';
      const now = Date.now();

      if (!forceRefresh) {
        const cached = sessionStorage.getItem(cacheKey);
        const cachedTime = sessionStorage.getItem(cacheTimeKey);
        if (cached && cachedTime && (now - parseInt(cachedTime, 10)) < 300000) {
          try {
            return JSON.parse(cached);
          } catch(e) {}
        }
      }

      const client = window.urSupabase || createSupabaseClient();
      if (!client) return [];
      try {
        const { data, error } = await client
          .from('categories')
          .select('id, name, slug, display_order, banner_url, image_url, is_active')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (data && data.length > 0) {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
            sessionStorage.setItem(cacheTimeKey, now.toString());
          } catch(e) {}
        }
        return data || [];
      } catch (err) {
        console.error('fetchStoreCategories error:', err);
        return [];
      }
    };

    async function initDynamicCategoriesNav() {
      const categories = await window.fetchStoreCategories();
      if (!categories || categories.length === 0) return;

      // Update Desktop Nav Links
      const navLinksContainer = document.querySelector('.site-header .nav-links');
      if (navLinksContainer) {
        let html = '<div class="nav-item"><a href="shop.html" class="nav-link">Shop All</a></div>';
        categories.forEach(cat => {
          // Omit Women & Test categories from top bar & menu
          if (cat.slug === 'women' || (cat.name && cat.name.toLowerCase() === 'women')) {
            html += `\n          <!-- <div class="nav-item"><a href="women.html" class="nav-link">Women</a></div> -->`;
            return;
          }
          if (cat.slug === 'test-items' || (cat.name && cat.name.toLowerCase().includes('test'))) {
            return;
          }

          // Map known slugs to specific static files or shop.html?category=slug
          let targetUrl = `shop.html?category=${encodeURIComponent(cat.slug || cat.id)}`;
          if (cat.slug === 'oversize' || cat.slug === 'oversized') targetUrl = 'oversize.html';
          else if (cat.slug === 'baggy') targetUrl = 'baggy.html';
          else if (cat.slug === 'hoodies') targetUrl = 'hoodies.html';
          else if (cat.slug === 'pants' || cat.slug === 'linen-pants') targetUrl = 'pants.html';
          else if (cat.slug === 'plan-tshirt' || cat.slug === 'plain-t-shirts') targetUrl = 'plan-tshirt.html';
          else if (cat.slug === 'printing-tshirt' || cat.slug === 'printed-t-shirts') targetUrl = 'printing-tshirt.html';

          html += `<div class="nav-item"><a href="${targetUrl}" class="nav-link">${cat.name}</a></div>`;
        });
        navLinksContainer.innerHTML = html;
      }

      // Update Mobile Drawer Sublinks
      const hamSublinks = document.querySelector('.hamburger-drawer .ham-sublinks');
      if (hamSublinks) {
        let subHtml = '';
        categories.forEach(cat => {
          // Omit Women & Test categories from drawer
          if (cat.slug === 'women' || (cat.name && cat.name.toLowerCase() === 'women')) {
            subHtml += `\n              <!-- <a href="women.html">Women</a> -->`;
            return;
          }
          if (cat.slug === 'test-items' || (cat.name && cat.name.toLowerCase().includes('test'))) {
            return;
          }

          let targetUrl = `shop.html?category=${encodeURIComponent(cat.slug || cat.id)}`;
          if (cat.slug === 'oversize' || cat.slug === 'oversized') targetUrl = 'oversize.html';
          else if (cat.slug === 'baggy') targetUrl = 'baggy.html';
          else if (cat.slug === 'hoodies') targetUrl = 'hoodies.html';
          else if (cat.slug === 'pants' || cat.slug === 'linen-pants') targetUrl = 'pants.html';
          else if (cat.slug === 'plan-tshirt' || cat.slug === 'plain-t-shirts') targetUrl = 'plan-tshirt.html';
          else if (cat.slug === 'printing-tshirt' || cat.slug === 'printed-t-shirts') targetUrl = 'printing-tshirt.html';

          subHtml += `<a href="${targetUrl}">${cat.name}</a>`;
        });
        hamSublinks.innerHTML = subHtml;
      }
    }

    // DOM INITIALIZATION
    document.addEventListener('DOMContentLoaded', function() {
      window.UR_CART.updateBadge();
      initAnimations();
      initOverlayListeners();
      initDynamicCategoriesNav();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
          .then(reg => console.log('Storefront SW registered:', reg))
          .catch(err => console.error('Storefront SW registration failed:', err));
      }
    });

    document.addEventListener('urSupabaseReady', function() {
      initDynamicCategoriesNav();
    });

  })();

