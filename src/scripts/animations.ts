/**
 * Wow factors — GSAP-powered animations.
 * All animations are gated by prefers-reduced-motion via gsap.matchMedia().
 *
 * IMPORTANT: the hero reveal is allowed to run even on reduced-motion (just instantly).
 * Inside-viewport scroll animations are skipped entirely when reduced-motion is on.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initAnimations() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero reveal runs always — instant on reduced-motion, animated otherwise.
  initHeroReveal(reducedMotion);

  if (!reducedMotion) {
    initBatchReveals();
    initMagneticButtons();
    initHorizontalProjects();
  }
}

/**
 * Wow #1 — SplitText-like reveal: split hero title into spans, stagger fade+slide.
 * Only splits the CURRENTLY VISIBLE language (the hidden one stays untouched so
 * the lang toggle keeps working without re-running the split).
 */
function initHeroReveal(reducedMotion: boolean) {
  const heroTitle = document.querySelector<HTMLElement>('.hero-title');
  if (!heroTitle) return;

  // Only split spans that are actually rendered (not display:none from i18n toggle).
  const candidates = heroTitle.querySelectorAll<HTMLElement>('span[data-en], span[data-es]');
  const visible: HTMLElement[] = [];
  candidates.forEach((el) => {
    const style = window.getComputedStyle(el);
    if (style.display !== 'none' && el.dataset.split !== 'done') visible.push(el);
  });

  visible.forEach((el) => {
    const text = el.textContent || '';
    const words = text.trim().split(/(\s+)/);
    el.textContent = '';
    words.forEach((w) => {
      if (w.match(/^\s+$/)) {
        el.appendChild(document.createTextNode(w));
      } else {
        const span = document.createElement('span');
        span.className = 'split-word';
        span.style.cssText = 'display:inline-block;overflow:hidden;';
        const inner = document.createElement('span');
        inner.style.cssText = 'display:inline-block;will-change:transform,opacity;';
        inner.textContent = w;
        span.appendChild(inner);
        el.appendChild(span);
      }
    });
    el.dataset.split = 'done';
  });

  const inners = heroTitle.querySelectorAll<HTMLElement>('.split-word > span');

  if (reducedMotion) {
    gsap.set(inners, { yPercent: 0, opacity: 1 });
    gsap.set(['.hero-sub', '.hero-ctas', '.hero-strip', '.hero-terminal'], {
      opacity: 1,
      y: 0,
    });
    return;
  }

  // Fail-safe: if animation hasn't completed in 3s, force the final state.
  // This protects against weird timing (font loading, route changes, etc.).
  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set(inners, { clearProps: 'all' });
    },
  });

  tl.from(inners, {
    yPercent: 110,
    opacity: 0,
    duration: 0.9,
    ease: 'expo.out',
    stagger: 0.035,
  }).from(
    ['.hero-sub', '.hero-ctas', '.hero-strip', '.hero-terminal'],
    {
      opacity: 0,
      y: 12,
      duration: 0.7,
      ease: 'power2.out',
      stagger: 0.08,
    },
    '-=0.6'
  );

  // Safety net: after 3.5s force visibility no matter what.
  setTimeout(() => {
    if (tl.progress() < 1) {
      tl.progress(1);
    }
    gsap.set(inners, { yPercent: 0, opacity: 1, clearProps: 'transform,opacity' });
  }, 3500);
}

/**
 * Wow #2 — Batch scroll reveals. Sections fade+slide in as they enter viewport.
 */
function initBatchReveals() {
  const candidates = gsap.utils.toArray<HTMLElement>(
    'section.scope .section-head, .commit-graph, .tl-item, .project-row, .meth-col, .cta-form, .cta-alt'
  );

  if (!candidates.length) return;

  // Set initial state explicitly to avoid relying on .from() timing.
  gsap.set(candidates, { opacity: 0, y: 24 });

  ScrollTrigger.batch(candidates, {
    start: 'top 92%',
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: 'power2.out',
        stagger: 0.06,
        overwrite: 'auto',
      }),
    onEnterBack: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.4, overwrite: 'auto' }),
    once: true,
  });

  // Safety net: anything still hidden after 5s gets revealed.
  setTimeout(() => {
    candidates.forEach((el) => {
      const style = window.getComputedStyle(el);
      if (parseFloat(style.opacity) < 0.9) {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.4 });
      }
    });
  }, 5000);
}

/**
 * Wow #3 — Magnetic buttons on hero CTAs and CTA primary button only.
 */
function initMagneticButtons() {
  const magnetic = document.querySelectorAll<HTMLElement>(
    '.hero-ctas .btn-primary, .cta .btn-primary'
  );
  if (window.matchMedia('(pointer: coarse)').matches) return;

  magnetic.forEach((btn) => {
    const strength = 0.35;
    const onMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, {
        x: x * strength,
        y: y * strength,
        duration: 0.4,
        ease: 'power3.out',
      });
    };
    const onLeave = () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    };
    btn.addEventListener('mousemove', onMove);
    btn.addEventListener('mouseleave', onLeave);
  });
}

/**
 * Wow #4 — Horizontal scroll for featured projects.
 * Pins the work section and translates the project list horizontally as user scrolls.
 * Only enabled on desktop (>=1024px) — disabled on mobile to preserve native scroll.
 */
function initHorizontalProjects() {
  const section = document.querySelector<HTMLElement>('#work');
  const list = section?.querySelector<HTMLElement>('.project-list');
  if (!section || !list) return;

  ScrollTrigger.matchMedia({
    '(min-width: 1024px)': function () {
      // Calculate the overflow distance — only pin if there's actual horizontal overflow needed.
      // For now we keep a subtle parallax shift instead of full horizontal scroll
      // to avoid breaking the vertical content flow on the home (kept for /work index later).
      gsap.fromTo(
        list,
        { x: 40 },
        {
          x: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
          },
        }
      );
    },
  });
}
