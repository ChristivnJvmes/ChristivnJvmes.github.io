/* Unfiltered interactions */
const root = document.documentElement;
const themeBtn = document.getElementById('themeBtn');
const iconMoon = document.getElementById('iconMoon');
const iconSun  = document.getElementById('iconSun');
const savedTheme = localStorage.getItem('theme');
const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;

// Theme
if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
  root.classList.add('light');
  if (iconMoon) iconMoon.style.display = 'none';
  if (iconSun)  iconSun.style.display  = 'block';
}
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    root.classList.toggle('light');
    const isLight = root.classList.contains('light');
    if (iconMoon) iconMoon.style.display = isLight ? 'none' : 'block';
    if (iconSun)  iconSun.style.display  = isLight ? 'block' : 'none';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Pricing toggle
const switchEl   = document.getElementById('priceSwitch');
const monthlyEls = document.querySelectorAll('.price-monthly');
const annualEls  = document.querySelectorAll('.price-annual');
const unitEls    = document.querySelectorAll('.unit');

function setAnnual(on){
  if (!switchEl) return;
  switchEl.classList.toggle('on', on);
  monthlyEls.forEach(el => el.style.display = on ? 'none' : 'inline');
  annualEls.forEach(el  => el.style.display = on ? 'inline' : 'none');
  unitEls.forEach(el    => el.textContent  = on ? 'yr' : 'mo');
}
if (switchEl){
  switchEl.addEventListener('click', () => setAnnual(!switchEl.classList.contains('on')));
  switchEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setAnnual(!switchEl.classList.contains('on'));
    }
  });
}

// Modal checkout (mock)
const modal        = document.getElementById('modal');
const closeModal   = document.getElementById('closeModal');
const planNameEl   = document.getElementById('planName');
const feedback     = document.getElementById('feedback');
const checkoutForm = document.getElementById('checkoutForm');

function openModal(plan){
  if (!modal || !planNameEl) return;
  planNameEl.textContent = plan[0].toUpperCase() + plan.slice(1);
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  setTimeout(() => document.getElementById('name')?.focus(), 50);
}
function hideModal(){
  if (!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  if (feedback){ feedback.style.display = 'none'; feedback.textContent = ''; }
  checkoutForm?.reset();
}
document.querySelectorAll('[data-checkout]').forEach(btn => {
  btn.addEventListener('click', () => openModal(btn.dataset.checkout));
});
closeModal?.addEventListener('click', hideModal);
modal?.addEventListener('click', e => { if (e.target === modal) hideModal(); });

// Mock checkout submit
checkoutForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name  = document.getElementById('name')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  if (!name || !email) return;

  feedback.style.display = 'block';
  feedback.style.color = 'var(--muted)';
  feedback.textContent = 'Processing...';

  try {
    // Replace with your backend call to create a Stripe Checkout session (returns { url })
    const url = '#'; // mock keeps you on the page
    feedback.style.color = 'var(--accent)';
    feedback.textContent = 'Success. Welcome to Unfiltered.';
    setTimeout(() => {
      if (url && url !== '#') window.location.href = url;
      hideModal();
    }, 900);
  } catch (err){
    console.error(err);
    feedback.style.color = 'tomato';
    feedback.textContent = 'Something went wrong. Try again.';
  }
});

// Discount code helper
const codeInput = document.getElementById('code');
codeInput?.addEventListener('input', e => {
  if (e.target.value.toUpperCase() === 'STUDENT'){
    feedback.style.display = 'block';
    feedback.style.color = 'var(--accent)';
    feedback.textContent = 'Student code applied. 20% off will show at checkout.';
  } else {
    feedback.style.display = 'none';
  }
});
