// ====== Unfiltered — main.js (working) ======

// --- Issues data (newest first). Update this list weekly. ---
const ISSUES = [
  { no: 43, title: "Boss Design 101",    slug: "043-boss-design-101",    date: "2025-09-12" },
  { no: 42, title: "Soulslikes, Again",  slug: "042-soulslikes-again",   date: "2025-09-05" },
  { no: 41, title: "Cozy Horror",        slug: "041-cozy-horror",        date: "2025-08-29" },
  { no: 40, title: "JRPG Towns",         slug: "040-jrpg-towns",         date: "2025-08-22" },
  { no: 39, title: "Deckbuild Tactics",  slug: "039-deckbuild-tactics",  date: "2025-08-15" },
  { no: 38, title: "Anime OSTs",         slug: "038-anime-osts",         date: "2025-08-08" },
  { no: 37, title: "Modding 101",        slug: "037-modding-101",        date: "2025-08-01" }
];

// --- Render latest 6 cards into the grid ---
function renderIssues(){
  const grid = document.getElementById('issueGrid');
  if (!grid) {
    console.warn('[Unfiltered] #issueGrid not found on this page.');
    return;
  }

  const items = [...ISSUES]
    .sort((a,b)=> (b.date||'').localeCompare(a.date||''))
    .slice(0,6);

 grid.innerHTML = items.map(it => {
  const label = `#${String(it.no).padStart(3,'0')} • ${it.title}`;
  const href  = `posts/${it.slug}.html`;
  const base  = `covers/${it.slug}`;  // we'll try jpeg -> jpg -> png, then hide

  return `
    <a class="issue" href="${href}" aria-label="${label}">
      <img class="cover" src="${base}.jpeg" alt=""
        onerror="
          if(!this._try){ this._try=1; this.src='${base}.jpg'; }
          else if(this._try===1){ this._try=2; this.src='${base}.png'; }
          else { this.remove(); }
        ">
      <span>${label}</span>
    </a>`;
}).join('');

document.addEventListener('DOMContentLoaded', renderIssues);


// ====== Theme toggle ======
const root = document.documentElement;
const themeBtn = document.getElementById('themeBtn');
const iconMoon = document.getElementById('iconMoon');
const iconSun  = document.getElementById('iconSun');
const savedTheme = localStorage.getItem('theme');
const prefersLight = window.matchMedia && window.matchMedia('(perspective: 1px)').matches
  ? false
  : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);

// Set initial theme
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

// ====== Footer year ======
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ====== Pricing toggle ======
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

// ====== Modal checkout (mock) ======
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



