/**
 * PilgrimProductInfo — Self-contained vanilla JS controller.
 * Loaded as an external asset with `defer` for non-blocking page render.
 * Uses the Shopify Cart AJAX API (routes.cart_add_url) & Section Rendering API.
 * Auto-discovers all pilgrim-product-info sections via [data-section-type].
 *
 * Shopify Section Rendering API Features:
 *  - Requests updated section HTML in /cart/add.js via `sections: [...]` payload
 *  - Supports dynamic section re-rendering via `?variant={id}&section_id={id}`
 *  - Dispatches `cart:add` custom event containing returned section HTML for drawers
 */
(function () {
  'use strict';

  function formatMoney(cents, format) {
    if (typeof cents !== 'number') return '';
    var amount = (cents / 100).toFixed(2);
    return (format || '${{amount}}')
      .replace(/\{\{\s*amount\s*\}\}/, amount)
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, amount.replace('.', ','))
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, Math.floor(cents / 100))
      .replace(/\{\{\s*amount_no_decimals_with_comma_separator\s*\}\}/, Math.floor(cents / 100));
  }

  /**
   * Section Rendering API — Fetch server-rendered HTML for a section
   * @param {string} sectionId - The section ID to re-render
   * @param {number|string} variantId - Optional variant ID filter
   * @returns {Promise<string>} Clean HTML string of the re-rendered section
   */
  function fetchSectionHtml(sectionId, variantId) {
    var url = window.location.pathname + '?section_id=' + encodeURIComponent(sectionId);
    if (variantId) {
      url += '&variant=' + encodeURIComponent(variantId);
    }
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Section rendering API error: ' + res.status);
        return res.text();
      });
  }

  function initPilgrimProductInfo(sectionId) {
    var dataEl = document.getElementById('ppi-variant-data-' + sectionId);
    if (!dataEl) return;

    var data;
    try {
      data = JSON.parse(dataEl.textContent);
    } catch (e) {
      console.error('[PilgrimProductInfo] Failed to parse variant data:', e);
      return;
    }

    var cartAddUrl = data.cartAddUrl;
    var moneyFormat = data.moneyFormat;
    var variants = data.variants;

    var el = {
      section:        document.querySelector('[data-section-id="' + sectionId + '"]'),
      variantSelect:  document.getElementById('ppi-variant-select-' + sectionId),
      variantIdInput: document.getElementById('ppi-variant-id-' + sectionId),
      price:          document.getElementById('ppi-price-' + sectionId),
      comparePrice:   document.getElementById('ppi-compare-price-' + sectionId),
      savings:        document.getElementById('ppi-savings-' + sectionId),
      availability:   document.getElementById('ppi-availability-' + sectionId),
      atcBtn:         document.getElementById('ppi-atc-btn-' + sectionId),
      btnText:        document.querySelector('#ppi-atc-btn-' + sectionId + ' .pilgrim-product-info__btn-text'),
      feedback:       document.getElementById('ppi-feedback-' + sectionId),
      qtyInput:       document.getElementById('ppi-qty-input-' + sectionId),
      qtyMinus:       document.getElementById('ppi-qty-minus-' + sectionId),
      qtyPlus:        document.getElementById('ppi-qty-plus-' + sectionId),
      form:           document.getElementById('ppi-product-form-' + sectionId),
    };

    if (!el.form) return;

    var variantMap = {};
    (variants || []).forEach(function (v) {
      variantMap[String(v.id)] = v;
    });

    function getSelectedVariant() {
      if (!el.variantSelect) {
        return (variants && variants[0]) || null;
      }
      return variantMap[el.variantSelect.value] || null;
    }

    function updatePriceUI(variant) {
      if (!variant || !el.price) return;

      el.price.textContent = formatMoney(variant.price, moneyFormat);

      var hasCompare = variant.compareAtPrice && variant.compareAtPrice > variant.price;
      if (el.comparePrice) {
        el.comparePrice.textContent = hasCompare ? formatMoney(variant.compareAtPrice, moneyFormat) : '';
        el.comparePrice.hidden = !hasCompare;
      }
      if (el.savings) {
        if (hasCompare) {
          var pct = Math.round((variant.compareAtPrice - variant.price) / variant.compareAtPrice * 100);
          el.savings.textContent = pct + '% OFF';
          el.savings.hidden = false;
        } else {
          el.savings.textContent = '';
          el.savings.hidden = true;
        }
      }
    }

    function updateAvailabilityUI(variant) {
      if (!el.availability) return;
      var available = variant && variant.available;
      el.availability.className =
        'pilgrim-product-info__availability ' +
        (available
          ? 'pilgrim-product-info__availability--in-stock'
          : 'pilgrim-product-info__availability--out-of-stock');
      el.availability.innerHTML =
        '<span class="pilgrim-product-info__availability-dot" aria-hidden="true"></span>' +
        (available ? 'In stock' : 'Sold out');
    }

    function updateATCButton(variant) {
      if (!el.atcBtn || !el.btnText) return;
      var available = variant && variant.available;
      el.atcBtn.disabled = !available;
      el.atcBtn.setAttribute('aria-disabled', String(!available));
      el.atcBtn.classList.toggle('pilgrim-product-info__atc-btn--sold-out', !available);
      el.btnText.textContent = available ? 'Add to Cart' : 'Sold Out';
      el.atcBtn.setAttribute('aria-label', available ? 'Add to cart' : 'Sold out');
    }

    function onVariantChange() {
      var variant = getSelectedVariant();

      if (el.variantIdInput && variant) {
        el.variantIdInput.value = variant.id;
      }

      updatePriceUI(variant);
      updateAvailabilityUI(variant);
      updateATCButton(variant);
      clearFeedback();

      // Optional: Update URL query param without full page refresh (Shopify UX pattern)
      if (variant && history.replaceState) {
        var newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?variant=' + variant.id;
        window.history.replaceState({ path: newUrl }, '', newUrl);
      }
    }

    function getQty() {
      return parseInt(el.qtyInput.value, 10) || 1;
    }

    function setQty(val) {
      var min = parseInt(el.qtyInput.min, 10) || 1;
      var max = parseInt(el.qtyInput.max, 10) || 99;
      var clamped = Math.min(Math.max(val, min), max);
      el.qtyInput.value = clamped;

      if (el.qtyMinus) el.qtyMinus.disabled = clamped <= min;
      if (el.qtyPlus)  el.qtyPlus.disabled  = clamped >= max;
    }

    if (el.qtyMinus) {
      el.qtyMinus.addEventListener('click', function () {
        setQty(getQty() - 1);
      });
    }
    if (el.qtyPlus) {
      el.qtyPlus.addEventListener('click', function () {
        setQty(getQty() + 1);
      });
    }
    if (el.qtyInput) {
      el.qtyInput.addEventListener('change', function () {
        setQty(parseInt(this.value, 10) || 1);
      });
    }

    function showFeedback(type, message) {
      if (!el.feedback) return;
      el.feedback.setAttribute('data-type', type);
      el.feedback.textContent = message;
    }

    function clearFeedback() {
      if (!el.feedback) return;
      el.feedback.removeAttribute('data-type');
      el.feedback.textContent = '';
    }

    function setLoading(loading) {
      if (!el.atcBtn) return;
      el.atcBtn.setAttribute('data-loading', loading ? 'true' : 'false');
      el.atcBtn.disabled = loading;
    }

    function handleSubmit(event) {
      event.preventDefault();
      clearFeedback();

      var variant = getSelectedVariant();

      if (!variant) {
        showFeedback('error', 'Please select a variant to continue.');
        return;
      }

      if (!variant.available) {
        showFeedback('error', 'This variant is currently sold out.');
        return;
      }

      var qty = getQty();
      if (qty < 1) {
        showFeedback('error', 'Quantity must be at least 1.');
        return;
      }

      setLoading(true);

      // Request payload using Shopify Section Rendering API
      // Passing `sections` requests re-rendered section HTML in response
      var requestPayload = {
        id: variant.id,
        quantity: qty,
        sections: [sectionId],
        sections_url: window.location.pathname
      };

      fetch(cartAddUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(requestPayload),
      })
        .then(function (res) {
          if (!res.ok) {
            return res.json().then(function (body) {
              throw new Error(body.description || body.message || 'Failed to add to cart.');
            });
          }
          return res.json();
        })
        .then(function (response) {
          var itemTitle = response.title || (response.items && response.items[0] && response.items[0].title) || 'Item';
          showFeedback('success', '\u2713 ' + itemTitle + ' added to your cart!');

          // Dispatch CustomEvent with item and section HTML from Section Rendering API
          document.dispatchEvent(new CustomEvent('cart:add', {
            bubbles: true,
            detail: {
              item: response,
              sections: response.sections || {},
              sectionId: sectionId
            },
          }));
        })
        .catch(function (err) {
          showFeedback('error', err.message || 'Something went wrong. Please try again.');
        })
        .finally(function () {
          setLoading(false);
        });
    }

    if (el.variantSelect) {
      el.variantSelect.addEventListener('change', onVariantChange);
    }

    el.form.addEventListener('submit', handleSubmit);

    onVariantChange();
    setQty(1);

    // Attach helper method to section DOM element for external calls
    if (el.section) {
      el.section.fetchSectionHtml = function (vId) {
        return fetchSectionHtml(sectionId, vId);
      };
    }
  }

  /**
   * Auto-discover and initialise all pilgrim-product-info sections on the page.
   * Reads sectionId from data-section-id attribute.
   */
  function initAll() {
    var sections = document.querySelectorAll('[data-section-type="pilgrim-product-info"]');
    sections.forEach(function (section) {
      var sectionId = section.getAttribute('data-section-id');
      if (sectionId) {
        initPilgrimProductInfo(sectionId);
      }
    });
  }

  /* Initialise on page load (defer guarantees DOM is parsed) */
  initAll();

  /* Re-initialise after Theme Editor live-reload */
  document.addEventListener('shopify:section:load', function (event) {
    var target = event.target || (event.detail && event.detail.sectionId);
    if (target) {
      var el = typeof target === 'string'
        ? document.querySelector('[data-section-id="' + target + '"]')
        : target.querySelector('[data-section-type="pilgrim-product-info"]');
      if (el) {
        var sectionId = el.getAttribute('data-section-id');
        if (sectionId) initPilgrimProductInfo(sectionId);
      }
    }
  });

  // Expose global helper for Section Rendering API requests
  window.PilgrimProductInfo = {
    fetchSectionHtml: fetchSectionHtml,
    initAll: initAll
  };
})();
