// ===== Theme setup (accessible, persistent) =====
const themeToggle = document.getElementById('themeToggle');

(function initTheme(){
  const stored = localStorage.getItem('theme');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const startLight = stored ? stored === 'light' : prefersLight;
  document.body.classList.toggle('theme-light', startLight);
  themeToggle?.setAttribute('aria-pressed', String(startLight));
})();

function applyTheme(isLight) {
  document.body.classList.toggle('theme-light', isLight);
  themeToggle?.setAttribute('aria-pressed', String(isLight));
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

/**
 * Crossfade implementation
 */
function runModeCrossfade(nextIsLight) {
  const isCurrentlyLight = document.body.classList.contains('theme-light');

  // Hide the login card so it can re-appear smoothly
  const card = document.querySelector('.login-card');
  if (card) card.classList.add('card-hiding');

  // Build overlay container
  const overlay = document.createElement('div');
  overlay.className = 'mode-xfade';

  // from-layer
  const from = document.createElement('div');
  from.className = 'layer from-layer ' + (isCurrentlyLight ? 'is-light' : 'is-dark');

  // to-layer
  const to = document.createElement('div');
  to.className = 'layer to-layer ' + (nextIsLight ? 'is-light' : 'is-dark');

  overlay.append(from, to);
  document.body.classList.add('theme-transitioning');
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    to.classList.add('fade-in');
  });

  const onFadeInEnd = (e) => {
    if (e.animationName !== 'xfadeTo') return;
    to.removeEventListener('animationend', onFadeInEnd);

    // Swap theme under cover
    applyTheme(nextIsLight);

    // Reveal the login card slowly now that the theme has swapped
    if (card) {
      card.classList.add('card-reveal');
      card.addEventListener('animationend', () => {
        card.classList.remove('card-reveal', 'card-hiding');
      }, { once: true });
    }

    overlay.classList.add('fade-out');
    overlay.addEventListener('animationend', (ev) => {
      if (ev.animationName !== 'xfadeOut') return;
      overlay.remove();
      document.body.classList.remove('theme-transitioning');
    }, { once: true });
  };
  to.addEventListener('animationend', onFadeInEnd);
}

themeToggle?.addEventListener('click', () => {
  const nextIsLight = !document.body.classList.contains('theme-light');
  runModeCrossfade(nextIsLight);
});

// ===== Helpers =====
const rand  = (min, max) => Math.random() * (max - min) + min;
const randi = (min, max) => Math.floor(rand(min, max + 1));

// ===== Stars (dark mode only; layers are CSS-hidden in light mode) =====
const layerMain = document.querySelector('.diamond-layer');
const layerMini = document.querySelector('.diamond-mini-layer');

const STAR_COUNT = 110;
const SIZE_MIN = 2, SIZE_MAX = 5;
const MINI_COUNT = 120;
the MINI_SIZE_MIN = 1, MINI_SIZE_MAX = 2;

const TWINKLE_MIN = 2.0, TWINKLE_MAX = 6.0;
const RELOCATE_EVERY_MIN = 4, RELOCATE_EVERY_MAX = 8;

function placeRandom(el) {
  el.style.left = `${rand(-5, 105)}vw`;
  el.style.top  = `${rand(-5, 105)}vh`;
}
function retune(el, minSize, maxSize) {
  const size  = randi(minSize, maxSize);
  const dur   = rand(TWINKLE_MIN, TWINKLE_MAX).toFixed(2) + 's';
  const delay = (-rand(0, TWINKLE_MAX)).toFixed(2) + 's';
  el.style.setProperty('--size', size + 'px');
  el.style.setProperty('--twinkle', dur);
  el.style.animationDelay = delay;
}
function assignRelocationInterval(el) {
  el.dataset.relocateEvery = String(randi(RELOCATE_EVERY_MIN, RELOCATE_EVERY_MAX));
  el.dataset.iter = '0';
}
function spawnStar(container, className, sizeMin, sizeMax) {
  const d = document.createElement('div');
  d.className = className;
  placeRandom(d); retune(d, sizeMin, sizeMax); assignRelocationInterval(d);
  d.addEventListener('animationiteration', () => {
    const n = (parseInt(d.dataset.iter || '0', 10) + 1);
    d.dataset.iter = String(n);
    const threshold = parseInt(d.dataset.relocateEvery || '6', 10);
    if (n >= threshold) { placeRandom(d); retune(d, sizeMin, sizeMax); assignRelocationInterval(d); }
  });
  container?.appendChild(d);
}
(function initStars(){
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!layerMain || !layerMini) return;
  for (let i = 0; i < STAR_COUNT; i++) spawnStar(layerMain, 'diamond', 2, 5);
  for (let i = 0; i < MINI_COUNT; i++) spawnStar(layerMini, 'diamond-mini', 1, 2);
})();

// Rescatter subset on resize
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const stars = layerMain?.querySelectorAll('.diamond') || [];
    const minis = layerMini?.querySelectorAll('.diamond-mini') || [];
    stars.forEach((el, idx) => { if (idx % 4 === 0) placeRandom(el); });
    minis.forEach((el, idx) => { if (idx % 5 === 0) placeRandom(el); });
  }, 180);
});

// ===== Auth UI logic =====
const loginForm    = document.getElementById('loginForm');
const createForm   = document.getElementById('createForm');
const toCreateBtn  = document.getElementById('toCreate');
const backToLogin  = document.getElementById('backToLogin');
const orRow        = document.getElementById('orRow');
const statusEl     = document.getElementById('status');
const titleEl      = document.getElementById('loginTitle');

/* Start on Login */
loginForm?.classList.remove('hidden');
createForm?.classList.add('hidden');
if (titleEl) titleEl.textContent = 'Welcome back';
orRow?.classList.remove('hidden');
toCreateBtn?.classList.remove('hidden');

function setStatus(msg, ok=false) {
  if (!statusEl) return;
  statusEl.textContent = msg || "";
  const isLight = document.body.classList.contains('theme-light');
  statusEl.style.color = isLight ? "#0b0b0b" : (ok ? "#d6ffb6" : "#ffe7a6");
}

/* Switchers */
toCreateBtn?.addEventListener('click', () => {
  loginForm?.classList.add('hidden');
  createForm?.classList.remove('hidden');
  if (titleEl) titleEl.textContent = 'Create account';
  orRow?.classList.add('hidden');
  toCreateBtn?.classList.add('hidden');
  setStatus("");
});

backToLogin?.addEventListener('click', () => {
  createForm?.classList.add('hidden');
  loginForm?.classList.remove('hidden');
  if (titleEl) titleEl.textContent = 'Welcome back';
  orRow?.classList.remove('hidden');
  toCreateBtn?.classList.remove('hidden');
  setStatus("");
});

/* Login */
loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = (document.getElementById('loginUsername')?.value || "").trim();
  const password = (document.getElementById('loginPassword')?.value || "");
  if (!username || !password) return setStatus("Enter username and password.");

  const key = `user:${username}`;
  const saved = localStorage.getItem(key);
  if (!saved) return setStatus("Account not found. Try 'Create account'.");

  try {
    const { hash } = JSON.parse(saved);
    const ok = hash === simpleHash(password);
    if (!ok) return setStatus("Incorrect password.");
  } catch { return setStatus("Corrupt account data."); }

  ssetStatus("Logged in! Redirecting…", true);
   setTimeout(() => { window.location.href = "/landing"; }, 600);


});

/* Create account rules */
const PW_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_\-=\[\]{};:'",.<>/?\\|`~+]).{8,}$/;

createForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = (document.getElementById('createUsername')?.value || "").trim();
  const password = (document.getElementById('createPassword')?.value || "");

  if (!username || !password) return setStatus("Choose a username and password.");
  if (!PW_RULE.test(password)) {
    return setStatus("Sign-up failed. Please try a different password.");
  }

  const key = `user:${username}`;
  if (localStorage.getItem(key)) return setStatus("That username is taken.");

  localStorage.setItem(key, JSON.stringify({ hash: simpleHash(password) }));

  setStatus("Account successfully created. Please go to the login page and sign in.", true);
});

/* simple demo hash */
function simpleHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}
