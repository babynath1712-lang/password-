/* ============================================
   NEXORA PASSWORD RESET — JAVASCRIPT
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Step navigation helper ---
  function showStep(stepId) {
    document.querySelectorAll('.pwd-card').forEach(card => {
      card.classList.remove('active');
    });
    const step = document.getElementById(stepId);
    if (step) {
      step.classList.add('active');
    }
  }

  // --- Forgot password form (Step 1 → Step 2) ---
  const forgotForm = document.getElementById('forgot-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('forgot-email');
      const email = emailInput.value.trim();

      if (!email) {
        showError(forgotForm, 'Please enter your email address.');
        return;
      }
      if (!validateEmail(email)) {
        showError(forgotForm, 'Please enter a valid email address.');
        emailInput.classList.add('error');
        return;
      }

      emailInput.classList.remove('error');

      const submitBtn = document.getElementById('forgot-submit');
      simulateLoading(submitBtn, () => {
        // Show the sent email in the confirmation step
        const emailDisplay = document.getElementById('sent-email-display');
        if (emailDisplay) {
          emailDisplay.textContent = email;
        }
        showStep('step-check-email');
        startResendTimer();
      });
    });
  }

  // --- Back to email step ---
  const backToEmail = document.getElementById('back-to-email');
  if (backToEmail) {
    backToEmail.addEventListener('click', (e) => {
      e.preventDefault();
      showStep('step-email');
    });
  }

  // --- Resend email with cooldown timer ---
  let resendInterval = null;

  function startResendTimer() {
    const resendBtn = document.getElementById('resend-btn');
    const timerEl = document.getElementById('resend-timer');
    const timerCount = document.getElementById('timer-count');

    if (!resendBtn || !timerEl || !timerCount) return;

    resendBtn.disabled = true;
    timerEl.style.display = 'block';
    let seconds = 60;
    timerCount.textContent = seconds;

    if (resendInterval) clearInterval(resendInterval);

    resendInterval = setInterval(() => {
      seconds--;
      timerCount.textContent = seconds;

      if (seconds <= 0) {
        clearInterval(resendInterval);
        resendBtn.disabled = false;
        timerEl.style.display = 'none';
      }
    }, 1000);
  }

  const resendBtn = document.getElementById('resend-btn');
  if (resendBtn) {
    resendBtn.addEventListener('click', () => {
      simulateLoading(resendBtn, () => {
        showToast('Reset link sent again!');
        startResendTimer();
      });
    });
  }

  // --- Reset password form ---
  const resetForm = document.getElementById('reset-form');
  if (resetForm) {
    resetForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const newPwd = document.getElementById('new-password').value;
      const confirmPwd = document.getElementById('confirm-password').value;

      if (!newPwd || !confirmPwd) {
        showError(resetForm, 'Please fill in both password fields.');
        return;
      }
      if (newPwd.length < 8) {
        showError(resetForm, 'Password must be at least 8 characters.');
        return;
      }
      if (newPwd !== confirmPwd) {
        showError(resetForm, 'Passwords do not match.');
        document.getElementById('confirm-password').classList.add('error');
        return;
      }

      document.querySelectorAll('.pwd-input-wrap input').forEach(i => i.classList.remove('error'));

      const submitBtn = document.getElementById('reset-submit');
      simulateLoading(submitBtn, () => {
        showStep('step-success');
      });
    });
  }

  // --- Password visibility toggle ---
  document.querySelectorAll('.pwd-toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      const eyeOpen = btn.querySelector('.eye-open');
      const eyeClosed = btn.querySelector('.eye-closed');
      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = isPassword ? 'none' : 'block';
        eyeClosed.style.display = isPassword ? 'block' : 'none';
      }
    });
  });

  // --- Password strength meter + requirements checklist ---
  const newPassword = document.getElementById('new-password');
  const strengthMeter = document.getElementById('pwd-strength');
  const strengthLabel = document.getElementById('pwd-strength-label');
  const requirements = document.getElementById('pwd-requirements');

  if (newPassword) {
    newPassword.addEventListener('input', () => {
      const val = newPassword.value;
      const bars = strengthMeter ? strengthMeter.querySelectorAll('.pwd-strength-bar') : [];

      // Show/hide meter and requirements
      if (val.length === 0) {
        if (strengthMeter) strengthMeter.classList.remove('visible');
        if (requirements) requirements.classList.remove('visible');
        bars.forEach(b => { b.className = 'pwd-strength-bar'; });
        if (strengthLabel) {
          strengthLabel.textContent = '';
          strengthLabel.className = 'pwd-strength-label';
        }
        updateRequirements('', '', '', '');
        updateMatchStatus();
        return;
      }

      if (strengthMeter) strengthMeter.classList.add('visible');
      if (requirements) requirements.classList.add('visible');

      // Calculate strength
      const hasLength = val.length >= 8;
      const hasUpper = /[A-Z]/.test(val);
      const hasNumber = /[0-9]/.test(val);
      const hasSpecial = /[^A-Za-z0-9]/.test(val);

      let score = 0;
      if (hasLength) score++;
      if (hasUpper) score++;
      if (hasNumber) score++;
      if (hasSpecial) score++;

      const levels = ['weak', 'fair', 'good', 'strong'];
      const labels = ['Weak', 'Fair', 'Good', 'Strong'];
      const levelIndex = Math.max(0, score - 1);
      const level = levels[levelIndex];

      bars.forEach((bar, i) => {
        bar.className = 'pwd-strength-bar';
        if (i <= levelIndex) {
          bar.classList.add(level);
        }
      });

      if (strengthLabel) {
        strengthLabel.textContent = labels[levelIndex];
        strengthLabel.className = `pwd-strength-label ${level}`;
      }

      // Update requirements checklist
      updateRequirements(hasLength, hasUpper, hasNumber, hasSpecial);

      // Re-check match
      updateMatchStatus();
    });
  }

  function updateRequirements(hasLength, hasUpper, hasNumber, hasSpecial) {
    const reqs = [
      { id: 'req-length', met: hasLength },
      { id: 'req-upper', met: hasUpper },
      { id: 'req-number', met: hasNumber },
      { id: 'req-special', met: hasSpecial }
    ];

    reqs.forEach(({ id, met }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const icon = el.querySelector('.pwd-req-icon');

      if (met) {
        el.classList.add('met');
        if (icon) icon.textContent = '✓';
      } else {
        el.classList.remove('met');
        if (icon) icon.textContent = '○';
      }
    });
  }

  // --- Password match indicator ---
  const confirmPassword = document.getElementById('confirm-password');
  const matchStatus = document.getElementById('pwd-match-status');

  if (confirmPassword) {
    confirmPassword.addEventListener('input', updateMatchStatus);
  }

  function updateMatchStatus() {
    if (!confirmPassword || !matchStatus || !newPassword) return;

    const newVal = newPassword.value;
    const confirmVal = confirmPassword.value;

    if (!confirmVal) {
      matchStatus.style.display = 'none';
      confirmPassword.classList.remove('error', 'success');
      return;
    }

    matchStatus.style.display = 'flex';

    const matchIcon = matchStatus.querySelector('.pwd-match-icon');
    const matchText = matchStatus.querySelector('.pwd-match-text');

    if (newVal === confirmVal) {
      matchStatus.className = 'pwd-match-status match';
      if (matchIcon) matchIcon.textContent = '✓';
      if (matchText) matchText.textContent = 'Passwords match';
      confirmPassword.classList.remove('error');
      confirmPassword.classList.add('success');
    } else {
      matchStatus.className = 'pwd-match-status no-match';
      if (matchIcon) matchIcon.textContent = '✗';
      if (matchText) matchText.textContent = 'Passwords do not match';
      confirmPassword.classList.remove('success');
      confirmPassword.classList.add('error');
    }
  }

  // --- Utility: validate email ---
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // --- Utility: show error ---
  function showError(formEl, message) {
    let errorEl = formEl.parentElement.querySelector('.pwd-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'pwd-error';
      errorEl.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="16" r="1" fill="currentColor"/>
        </svg>
        <span></span>
      `;
      formEl.parentElement.insertBefore(errorEl, formEl);
    }
    errorEl.querySelector('span').textContent = message;
    errorEl.classList.add('visible');

    setTimeout(() => {
      errorEl.classList.remove('visible');
    }, 5000);
  }

  // --- Utility: show toast ---
  function showToast(message) {
    let toast = document.querySelector('.pwd-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'pwd-toast';
      toast.style.cssText = `
        position: fixed;
        top: 28px;
        right: 28px;
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 22px;
        background: rgba(17, 17, 24, 0.9);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(52, 211, 153, 0.25);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        font-size: 0.88rem;
        color: #34d399;
        font-weight: 500;
        font-family: 'Inter', sans-serif;
        transform: translateX(calc(100% + 40px));
        transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      `;
      toast.innerHTML = `
        <div style="width:24px;height:24px;border-radius:50%;background:rgba(52,211,153,0.15);display:flex;align-items:center;justify-content:center;font-size:0.85rem;flex-shrink:0;">✓</div>
        <span></span>
      `;
      document.body.appendChild(toast);
    }
    toast.querySelector('span').textContent = message;
    toast.style.transform = 'translateX(0)';

    setTimeout(() => {
      toast.style.transform = 'translateX(calc(100% + 40px))';
    }, 3500);
  }

  // --- Utility: simulate loading ---
  function simulateLoading(btn, callback) {
    const textEl = btn.querySelector('.pwd-btn-text');
    const loaderEl = btn.querySelector('.pwd-btn-loader');

    btn.disabled = true;
    if (textEl) textEl.style.display = 'none';
    if (loaderEl) loaderEl.style.display = 'flex';

    setTimeout(() => {
      btn.disabled = false;
      if (textEl) textEl.style.display = '';
      if (loaderEl) loaderEl.style.display = 'none';
      if (callback) callback();
    }, 1800);
  }

  // --- Clear error styling on input focus ---
  document.querySelectorAll('.pwd-input-wrap input').forEach(input => {
    input.addEventListener('focus', () => {
      input.classList.remove('error');
    });
  });

  // --- Parallax effect on orbs ---
  const orbs = document.querySelectorAll('.orb');
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;

    orbs.forEach((orb, i) => {
      const speed = (i + 1) * 12;
      orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
  }, { passive: true });

  console.log('🔑 Nexora Password Reset Page Loaded');
});
