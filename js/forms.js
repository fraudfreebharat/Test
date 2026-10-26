/**
 * ==========================================================================
 * MAYRA DENTAL CARE — FORM LOGIC & VALIDATION (JS/FORMS.JS)
 * Accessible Form Validation, Error Handling, Draft Recovery & Confirmation State
 * ==========================================================================
 */

(function () {
  'use strict';

  // --- 1. UTILITY HELPERS ---
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  const PHONE_REGEX = /^[+0-9\s()-]{10,16}$/;

  function setFieldError(field, errorMessage) {
    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');
    
    const parent = field.closest('.form-group');
    if (parent) {
      parent.classList.add('has-error');
      let errorSpan = parent.querySelector('.field-error-message');
      if (!errorSpan) {
        errorSpan = document.createElement('span');
        errorSpan.className = 'field-error-message';
        errorSpan.setAttribute('role', 'alert');
        parent.appendChild(errorSpan);
      }
      errorSpan.textContent = errorMessage;
    }
  }

  function clearFieldError(field) {
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');

    const parent = field.closest('.form-group');
    if (parent) {
      parent.classList.remove('has-error');
      const errorSpan = parent.querySelector('.field-error-message');
      if (errorSpan) {
        errorSpan.textContent = '';
      }
    }
  }

  // --- 2. LOCALSTORAGE DRAFT AUTO-SAVE ---
  const DRAFT_KEY = 'mayra_appointment_draft_v1';

  function saveFormDraft(form) {
    if (!form) return;
    const formData = {
      fullName: form.querySelector('#full-name')?.value || '',
      phone: form.querySelector('#phone')?.value || '',
      email: form.querySelector('#email')?.value || '',
      service: form.querySelector('#service-select')?.value || '',
      date: form.querySelector('#preferred-date')?.value || '',
      slot: form.querySelector('#preferred-slot')?.value || '',
      notes: form.querySelector('#notes')?.value || '',
      anxiety: form.querySelector('#anxiety-check')?.checked || false
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    } catch (e) {
      // LocalStorage access might be blocked in private mode
    }
  }

  function restoreFormDraft(form) {
    if (!form) return;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);

      if (data.fullName && form.querySelector('#full-name')) form.querySelector('#full-name').value = data.fullName;
      if (data.phone && form.querySelector('#phone')) form.querySelector('#phone').value = data.phone;
      if (data.email && form.querySelector('#email')) form.querySelector('#email').value = data.email;
      if (data.service && form.querySelector('#service-select')) form.querySelector('#service-select').value = data.service;
      if (data.date && form.querySelector('#preferred-date')) form.querySelector('#preferred-date').value = data.date;
      if (data.slot && form.querySelector('#preferred-slot')) form.querySelector('#preferred-slot').value = data.slot;
      if (data.notes && form.querySelector('#notes')) form.querySelector('#notes').value = data.notes;
      if (data.anxiety && form.querySelector('#anxiety-check')) form.querySelector('#anxiety-check').checked = data.anxiety;
    } catch (e) {
      // Ignore parse errors
    }
  }

  function clearFormDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {}
  }

  // --- 3. APPOINTMENT FORM VALIDATION & CONFIRMATION ---
  function initAppointmentForm() {
    const form = document.getElementById('appointment-form');
    if (!form) return;

    restoreFormDraft(form);

    // Read URL query parameters (e.g. ?plan=essential from pricing page)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const planParam = urlParams.get('plan');
      if (planParam) {
        const serviceSelect = form.querySelector('#service-select');
        const notes = form.querySelector('#notes');
        const planMapping = {
          'essential': { value: 'essential-plan', name: 'Essential Preventive Annual Membership (₹3,999)' },
          'family': { value: 'family-plan', name: 'Comprehensive Family Annual Membership (₹9,499)' },
          'executive': { value: 'executive-plan', name: 'Executive Complete Smile Annual Membership (₹18,500)' }
        };

        if (planMapping[planParam]) {
          if (serviceSelect) {
            // Check if option exists, otherwise select consultation and note it
            const matchingOpt = serviceSelect.querySelector(`option[value="${planMapping[planParam].value}"]`);
            if (matchingOpt) {
              serviceSelect.value = planMapping[planParam].value;
            }
          }
          if (notes && !notes.value) {
            notes.value = `Patient enrolled for: ${planMapping[planParam].name}. Requesting slot confirmation and member kit.`;
          }
        }
      }
    } catch (e) {
      // URLSearchParams fallback
    }

    // Save draft as user types
    form.addEventListener('input', () => saveFormDraft(form));
    form.addEventListener('change', () => saveFormDraft(form));

    // Clear inline errors on change
    form.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('focus', () => clearFieldError(input));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let isValid = true;

      const fullName = form.querySelector('#full-name');
      const phone = form.querySelector('#phone');
      const email = form.querySelector('#email');
      const service = form.querySelector('#service-select');
      const preferredDate = form.querySelector('#preferred-date');
      const preferredSlot = form.querySelector('#preferred-slot');
      const submitBtn = form.querySelector('#submit-booking-btn');

      // Validate Full Name
      if (!fullName.value.trim() || fullName.value.trim().length < 2) {
        setFieldError(fullName, 'Please enter your full patient name.');
        isValid = false;
      } else {
        clearFieldError(fullName);
      }

      // Validate Phone Number
      if (!phone.value.trim() || !PHONE_REGEX.test(phone.value.trim())) {
        setFieldError(phone, 'Please enter a valid 10-digit mobile number for appointment SMS confirmation.');
        isValid = false;
      } else {
        clearFieldError(phone);
      }

      // Validate Email
      if (!email.value.trim() || !EMAIL_REGEX.test(email.value.trim())) {
        setFieldError(email, 'Please provide a valid email address for digital medical receipts.');
        isValid = false;
      } else {
        clearFieldError(email);
      }

      // Validate Service
      if (!service.value) {
        setFieldError(service, 'Please select the clinical department or reason for visit.');
        isValid = false;
      } else {
        clearFieldError(service);
      }

      // Validate Date (if present)
      if (preferredDate && !preferredDate.value) {
        setFieldError(preferredDate, 'Please choose a preferred consultation date.');
        isValid = false;
      } else if (preferredDate) {
        clearFieldError(preferredDate);
      }

      if (!isValid) {
        const firstError = form.querySelector('.is-invalid');
        if (firstError) firstError.focus();
        return;
      }

      // Submission UI state
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="spinner-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 800ms linear infinite; margin-right: 8px;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
        </svg>
        <span>Securing Clinic Slot...</span>
      `;

      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 850));

      // Generate Reference Code
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const bookingRef = `MYR-${new Date().getFullYear()}-${randomCode}`;

      // Show confirmation state
      const formContainer = document.getElementById('booking-form-wrapper');
      const confirmationContainer = document.getElementById('booking-confirmation-wrapper');

      if (formContainer && confirmationContainer) {
        formContainer.style.display = 'none';
        confirmationContainer.style.display = 'block';

        // Fill confirmation fields
        const refElem = document.getElementById('confirm-ref-number');
        const nameElem = document.getElementById('confirm-patient-name');
        const serviceElem = document.getElementById('confirm-service-name');
        const slotElem = document.getElementById('confirm-time-slot');

        if (refElem) refElem.textContent = bookingRef;
        if (nameElem) nameElem.textContent = fullName.value.trim();
        if (serviceElem) serviceElem.textContent = service.options[service.selectedIndex].text;
        if (slotElem) {
          const dateStr = preferredDate ? preferredDate.value : 'Immediate Triage';
          const timeSlot = preferredSlot ? preferredSlot.value : 'Morning Slot';
          slotElem.textContent = `${dateStr} (${timeSlot})`;
        }

        confirmationContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      clearFormDraft();

      if (window.showToast) {
        window.showToast('Appointment Reserved', `Booking reference ${bookingRef} generated. Desk coordinator will call shortly.`, 'success');
      }

      // Allow reset
      const resetBtn = document.getElementById('book-another-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          form.reset();
          if (formContainer && confirmationContainer) {
            confirmationContainer.style.display = 'none';
            formContainer.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }
    });
  }

  // --- 4. FOOTER NEWSLETTER SUBSCRIPTION ---
  function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('newsletter-email');
      const feedback = document.getElementById('newsletter-feedback');

      if (!input || !feedback) return;

      if (!input.value || !EMAIL_REGEX.test(input.value.trim())) {
        feedback.style.display = 'block';
        feedback.style.color = '#F87171';
        feedback.textContent = 'Please enter a valid email address.';
        input.focus();
        return;
      }

      // Success
      input.value = '';
      feedback.style.display = 'block';
      feedback.style.color = '#34D399';
      feedback.textContent = 'Enrolled for 6-month checkup reminders and oral care insights.';

      if (window.showToast) {
        window.showToast('Subscribed', 'Your email has been added to our preventive dental recall list.', 'success');
      }

      setTimeout(() => {
        feedback.style.display = 'none';
      }, 5000);
    });
  }

  // --- 5. INITIALIZE ON DOM READY ---
  document.addEventListener('DOMContentLoaded', () => {
    initAppointmentForm();
    initNewsletterForm();
  });

})();
