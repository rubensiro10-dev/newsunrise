'use strict';

/**
 * Sunrise Restaurant — client-side application
 * Handles navigation, form validation, order storage, and UI interactions.
 */
const SunriseApp = (function () {
  const STORAGE_KEY = 'orders';

  const MENU_ITEMS = [
    { value: 'Grilled Chicken', label: 'Grilled Chicken — KSh 850' },
    { value: 'Beef Burger', label: 'Beef Burger — KSh 700' },
    { value: 'Vegetable Salad', label: 'Vegetable Salad — KSh 500' },
    { value: 'Spaghetti Pasta', label: 'Spaghetti Pasta — KSh 650' },
    { value: 'Fish and Chips', label: 'Fish and Chips — KSh 750' },
    { value: 'Chapati', label: 'Chapati — KSh 80' },
    { value: 'Smokies', label: 'Smokies — KSh 120' },
    { value: 'Ugali with Sukuma Wiki', label: 'Ugali with Sukuma Wiki — KSh 400' },
    { value: 'Rice and Beans', label: 'Rice and Beans — KSh 350' },
    { value: 'Fish', label: 'Fish — KSh 750' },
    { value: 'Beef Stew', label: 'Beef Stew — KSh 450' },
    { value: 'Chicken Stew', label: 'Chicken Stew — KSh 500' },
  ];

  /* ── Utilities ── */

  function $(selector, context) {
    return (context || document).querySelector(selector);
  }

  function $$(selector, context) {
    return Array.from((context || document).querySelectorAll(selector));
  }

  function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatDisplayDate(isoDate) {
    if (!isoDate) return '';
    const date = new Date(isoDate + 'T00:00:00');
    return date.toLocaleDateString('en-KE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function sanitizePhone(value) {
    return value.replace(/\D/g, '').slice(0, 10);
  }

  /* ── Notifications ── */

  const Notify = {
    show(elementId, message, type) {
      const el = document.getElementById(elementId);
      if (!el) return;
      el.textContent = message;
      el.className = `notification show notification-${type}`;
      el.setAttribute('aria-live', 'polite');

      if (type === 'success') {
        window.setTimeout(() => Notify.hide(elementId), 6000);
      }
    },

    hide(elementId) {
      const el = document.getElementById(elementId);
      if (!el) return;
      el.className = 'notification';
      el.textContent = '';
    },
  };

  /* ── Modal ── */

  const Modal = {
    overlay: null,

    init() {
      if (this.overlay) return;

      this.overlay = document.createElement('div');
      this.overlay.className = 'modal-overlay';
      this.overlay.hidden = true;
      this.overlay.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
          <h3 id="modalTitle" class="modal-title"></h3>
          <p class="modal-message"></p>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
            <button type="button" class="btn btn-danger modal-confirm">Confirm</button>
          </div>
        </div>`;
      document.body.appendChild(this.overlay);

      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close(false);
      });

      $('.modal-cancel', this.overlay).addEventListener('click', () => this.close(false));
    },

    confirm(title, message) {
      this.init();
      return new Promise((resolve) => {
        this._resolve = resolve;
        $('.modal-title', this.overlay).textContent = title;
        $('.modal-message', this.overlay).textContent = message;
        this.overlay.hidden = false;
        document.body.classList.add('modal-open');

        const confirmBtn = $('.modal-confirm', this.overlay);
        confirmBtn.onclick = () => this.close(true);
        confirmBtn.focus();
      });
    },

    close(result) {
      if (!this.overlay) return;
      this.overlay.hidden = true;
      document.body.classList.remove('modal-open');
      if (this._resolve) {
        this._resolve(result);
        this._resolve = null;
      }
    },
  };

  /* ── Order storage ── */

  const OrderStore = {
    getAll() {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    },

    save(order) {
      const orders = this.getAll();
      orders.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        name: order.name,
        phone: order.phone,
        date: order.date,
        dish: order.dish,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
      return orders;
    },

    clear() {
      localStorage.removeItem(STORAGE_KEY);
    },
  };

  /* ── Navigation ── */

  function initNavigation() {
    const header = $('.site-header');
    const nav = $('.site-nav');
    if (!header || !nav) return;

    if (!nav.id) nav.id = 'siteNav';

    let toggle = $('.nav-toggle', header);
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'nav-toggle';
      toggle.setAttribute('aria-label', 'Toggle navigation menu');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', nav.id);
      toggle.innerHTML = '<span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span>';
      header.querySelector('.header-inner').appendChild(toggle);
    }

    highlightCurrentPage(nav);

    toggle.addEventListener('click', () => {
      const isOpen = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    });

    $$('.site-nav a', header).forEach((link) => {
      link.addEventListener('click', () => {
        header.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (e) => {
      if (!header.contains(e.target)) {
        header.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  function highlightCurrentPage(nav) {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    $$('a', nav).forEach((link) => {
      const href = link.getAttribute('href');
      const isActive =
        href === current ||
        (current === '' && href === 'index.html') ||
        (current === 'index.html' && href === './');
      link.classList.toggle('active', isActive);
    });
  }

  /* ── Scroll animations ── */

  function initScrollAnimations() {
    const targets = $$('.section, .info-card, .testimonial, .gallery-item, .meal-card, .page-header');
    if (!targets.length || !('IntersectionObserver' in window)) return;

    targets.forEach((el) => el.classList.add('reveal'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /* ── Image handling ── */

  function initImages() {
    $$('.brand-logo').forEach((img) => {
      img.addEventListener('error', () => { img.style.display = 'none'; });
    });

    $$('.gallery-item img, .meal-card-image img').forEach((img) => {
      img.addEventListener('error', function () {
        const galleryItem = this.closest('.gallery-item');
        if (galleryItem) galleryItem.classList.add('gallery-item--fallback');
      });
    });
  }

  /* ── Order form ── */

  const FormValidator = {
    rules: {
      name(value) {
        const words = value.trim().split(/\s+/).filter(Boolean);
        if (words.length < 2) return 'Please enter your full name (first and last).';
        if (value.trim().length < 3) return 'Name is too short.';
        return '';
      },
      phone(value) {
        const digits = sanitizePhone(value);
        if (digits.length !== 10) return 'Phone number must be exactly 10 digits.';
        if (!/^0[17]\d{8}$/.test(digits)) return 'Enter a valid Kenyan mobile number (e.g. 0712345678).';
        return '';
      },
      date(value) {
        if (!value) return 'Please select a preferred date.';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(value + 'T00:00:00');
        if (selected < today) return 'Please select today\'s date or a future date.';
        return '';
      },
      dish(value) {
        if (!value) return 'Please select a dish from the menu.';
        return '';
      },
    },

    validateField(name, value) {
      return this.rules[name] ? this.rules[name](value) : '';
    },

    setFieldError(form, fieldName, message) {
      const input = form.elements[fieldName];
      const group = input?.closest('.form-group');
      if (!group) return;

      let errorEl = $(`[data-error-for="${fieldName}"]`, group);
      if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'field-error';
        errorEl.dataset.errorFor = fieldName;
        errorEl.setAttribute('role', 'alert');
        group.appendChild(errorEl);
      }

      if (message) {
        input.classList.add('input-invalid');
        input.setAttribute('aria-invalid', 'true');
        errorEl.textContent = message;
      } else {
        input.classList.remove('input-invalid');
        input.removeAttribute('aria-invalid');
        errorEl.textContent = '';
      }
    },

    validateForm(form) {
      let isValid = true;
      ['name', 'phone', 'date', 'dish'].forEach((field) => {
        const message = this.validateField(field, form.elements[field].value);
        this.setFieldError(form, field, message);
        if (message) isValid = false;
      });
      return isValid;
    },
  };

  function initOrderForm() {
    const form = document.forms.orderForm;
    if (!form) return;

    const dateInput = form.elements.date;
    if (dateInput) {
      dateInput.min = formatDateISO(new Date());
    }

    const phoneInput = form.elements.phone;
    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        phoneInput.value = sanitizePhone(phoneInput.value);
      });
    }

    ['name', 'phone', 'date', 'dish'].forEach((fieldName) => {
      const field = form.elements[fieldName];
      if (!field) return;
      field.addEventListener('blur', () => {
        const message = FormValidator.validateField(fieldName, field.value);
        FormValidator.setFieldError(form, fieldName, message);
      });
      field.addEventListener('input', () => {
        if (field.classList.contains('input-invalid')) {
          const message = FormValidator.validateField(fieldName, field.value);
          if (!message) FormValidator.setFieldError(form, fieldName, '');
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      Notify.hide('formNotification');

      if (!FormValidator.validateForm(form)) {
        Notify.show('formNotification', 'Please correct the highlighted fields before submitting.', 'error');
        const firstInvalid = $('.input-invalid', form);
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const order = {
        name: form.elements.name.value.trim(),
        phone: sanitizePhone(form.elements.phone.value),
        date: form.elements.date.value,
        dish: form.elements.dish.value,
      };

      OrderStore.save(order);
      form.reset();
      if (dateInput) dateInput.min = formatDateISO(new Date());

      Notify.show(
        'formNotification',
        `Thank you, ${order.name.split(' ')[0]}. Your order for ${order.dish} on ${formatDisplayDate(order.date)} has been reserved.`,
        'success'
      );

      const submitBtn = $('button[type="submit"]', form);
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Order Reserved';
        window.setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Reserve Order';
        }, 3000);
      }
    });
  }

  /* ── Reservations table ── */

  function renderOrdersTable() {
    const table = document.getElementById('reservedTable');
    if (!table) return;

    const tbody = table.querySelector('tbody') || table;
    const orders = OrderStore.getAll();

    while (tbody.rows.length > 0) {
      tbody.deleteRow(0);
    }

    const emptyState = document.getElementById('emptyOrders');
    if (emptyState) emptyState.hidden = orders.length > 0;

    if (orders.length === 0) {
      const row = tbody.insertRow();
      const cell = row.insertCell(0);
      cell.colSpan = 4;
      cell.className = 'empty-row';
      cell.textContent = 'No reservations yet. Orders placed online will appear here.';
      return;
    }

    orders.forEach((order) => {
      const row = tbody.insertRow();
      row.insertCell(0).textContent = order.name;
      row.insertCell(1).textContent = order.phone;
      row.insertCell(2).textContent = formatDisplayDate(order.date);
      row.insertCell(3).textContent = order.dish;
    });
  }

  function initReservations() {
    if (!document.getElementById('reservedTable')) return;

    renderOrdersTable();

    const clearBtn = document.getElementById('clearOrdersBtn');
    if (!clearBtn) return;

    clearBtn.addEventListener('click', async () => {
      const orders = OrderStore.getAll();
      if (orders.length === 0) {
        Notify.show('reservationNotification', 'There are no orders to clear.', 'error');
        return;
      }

      const confirmed = await Modal.confirm(
        'Clear All Orders',
        `This will permanently remove ${orders.length} reserved order${orders.length === 1 ? '' : 's'}. This action cannot be undone.`
      );

      if (!confirmed) return;

      OrderStore.clear();
      renderOrdersTable();
      Notify.show('reservationNotification', 'All orders have been cleared successfully.', 'success');
    });
  }

  /* ── Menu page interactions ── */

  function initMenuPage() {
    const menuTable = $('.menu-table-wrapper table');
    if (!menuTable) return;

    $$('tbody tr', menuTable).forEach((row, index) => {
      row.style.animationDelay = `${index * 0.06}s`;
      row.classList.add('menu-row-animate');
    });
  }

  /* ── Footer year ── */

  function initFooter() {
    $$('.footer-copy').forEach((el) => {
      el.innerHTML = el.innerHTML.replace(/\d{4}/, String(new Date().getFullYear()));
    });
  }

  /* ── Bootstrap ── */

  function init() {
    initNavigation();
    initScrollAnimations();
    initImages();
    initOrderForm();
    initReservations();
    initMenuPage();
    initFooter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { OrderStore, Notify, FormValidator };
})();
