import './style.css';
import { content } from './content.js';
import { initScene } from './scene.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = window.innerWidth < 900;
const useScene = supportsWebGL() && (!mobile || !navigator.hardwareConcurrency || navigator.hardwareConcurrency >= 4);

const sceneRoot = document.getElementById('scene-root');
const poster = document.createElement('div');
poster.id = 'poster-fallback';
poster.setAttribute('aria-hidden', 'true');

function addFallback() {
  poster.innerHTML = `<img src="${import.meta.env.BASE_URL}img/mizuki-poster.png" alt="" draggable="false">`;
  sceneRoot.appendChild(poster);
  const vy = mobile ? 20 : 60;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    poster.style.transform = `translate3d(0, ${Math.min(140, y * 0.15 + vy)}px, 0)`;
  }, { passive: true });
}

let sceneApi = null;
if (useScene) {
  try {
    sceneApi = initScene(sceneRoot);
  } catch (e) {
    console.warn('Scene init failed, using poster fallback:', e);
    addFallback();
  }
} else {
  addFallback();
}

// ---- Smooth scroll (Lenis) + ScrollTrigger sync ----
const lenis = new Lenis({ lerp: 0.1 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// ---- Populate content ----
const heroJp = document.querySelector('.hero-title .jp');
if (heroJp) heroJp.innerHTML = content.hero.jp;

const statGrid = document.getElementById('statGrid');
statGrid.innerHTML = content.profile.stats.map(s =>
  `<div class="stat"><dt>${s.label}</dt><dd>${s.value}</dd>${s.jp ? `<span class="jp">${s.jp}</span>` : ''}</div>`
).join('');

const statBars = document.getElementById('statBars');
statBars.innerHTML = content.profile.bars.map(b =>
  `<div class="bar-row"><span class="bar-label">${b.label}</span><div class="bar"><span class="bar-fill" data-val="${b.value}"></span></div><span class="bar-val">${b.value}</span></div>`
).join('');

const loreCols = document.getElementById('loreCols');
loreCols.innerHTML = `
  <div class="lore lore-jp"><p>${content.story.loreJp}</p></div>
  <div class="lore lore-en"><p>${content.story.loreEn}</p></div>
`;

const trackList = document.getElementById('trackList');
const first = content.tracks[0];
trackList.innerHTML = `<button class="track" type="button" data-src="${first.src}">
  <span class="track-cover">♪</span>
  <span class="track-meta"><em class="track-jp">${first.jp}</em><strong class="track-title">${first.title}</strong></span>
  <span class="track-arrow">&#9654;</span>
</button>`;

// ---- Music player ----
const player = document.getElementById('player');
const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const seek = document.getElementById('seek');
const timeEl = document.getElementById('time');
const trackTitle = document.getElementById('playerTrack');

trackList.addEventListener('click', (e) => {
  const btn = e.target.closest('.track');
  if (!btn) return;
  audio.src = btn.dataset.src;
  trackTitle.textContent = btn.querySelector('.track-title').textContent;
  player.hidden = false;
  audio.play().catch(() => {});
  playBtn.innerHTML = '&#10073;&#10073;';
});

playBtn.addEventListener('click', () => {
  if (!audio.src) return;
  if (audio.paused) { audio.play(); playBtn.innerHTML = '&#10073;&#10073;'; }
  else { audio.pause(); playBtn.innerHTML = '&#9658;'; }
});

audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    seek.value = (audio.currentTime / audio.duration) * 100;
    timeEl.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
  }
});
audio.addEventListener('ended', () => { playBtn.innerHTML = '&#9658;'; });
seek.addEventListener('input', () => {
  if (audio.duration) audio.currentTime = (seek.value / 100) * audio.duration;
});
function fmt(s) {
  s = Math.floor(s || 0);
  const m = Math.floor(s / 60), sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}

// ---- Quotes cycle ----
const quoteText = document.getElementById('quoteText');
const quoteNext = document.getElementById('quoteNext');
let q = 0;
quoteText.textContent = content.quotes[q];
quoteNext.addEventListener('click', () => {
  q = (q + 1) % content.quotes.length;
  gsap.fromTo(quoteText, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4 });
  quoteText.textContent = content.quotes[q];
});

// ---- Reveals ----
gsap.utils.toArray('[data-reveal], .stat, .bar-row, .track, .quote-card').forEach((el) => {
  gsap.from(el, {
    opacity: 0,
    y: 24,
    duration: 0.7,
    ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
  });
});

// ---- Set stat bar fill heights ----
requestAnimationFrame(() => {
  document.querySelectorAll('.bar-fill').forEach((b) => {
    b.style.height = (b.dataset.val || 0) + '%';
  });
});

// ---- Nav language chip (visual only) ----
document.querySelector('.lang').addEventListener('click', (e) => {
  e.currentTarget.classList.toggle('on');
  e.currentTarget.textContent = e.currentTarget.classList.contains('on') ? '日本語' : 'EN / JP';
});

// ---- Loader ----
const loader = document.getElementById('loader');
window.addEventListener('load', () => {
  setTimeout(() => {
    gsap.to(loader, { opacity: 0, duration: 0.6, onComplete: () => loader.remove() });
  }, 350);
});
// safety in case load already fired
document.fonts && document.fonts.ready.then(() => {});