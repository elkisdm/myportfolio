/**
 * Wow factors — GSAP-powered animations.
 * All animations are gated by prefers-reduced-motion via gsap.matchMedia().
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initAnimations() {
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    initHeroReveal();
    initBatchReveals();
    initMagneticButtons();
    initHorizontalProjects();
  });
}

/**
 * Wow #1 — SplitText-like reveal: split hero title into spans, stagger fade+slide.
 * (Manual split to avoid SplitText plugin dependency.)
 */
function initHeroReveal() {
  const heroTitle = document.querySelector<HTMLElement>('.hero-title');
  if (!heroTitle) return;

  // Split each direct text container into word spans.
  const visible = heroTitle.querySelectorAll<HTMLElement>(
    'span[data-en], span[data-es], .l2 > span[data-en], .l2 > span[data-es]'
  );

  visible.forEach((el) => {
    if (el.dataset.split === 'done') return;
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
  gsap.from(inners, {
    yPercent: 110,
    opacity: 0,
    duration: 1.0,
    ease: 'expo.out',
    stagger: 0.04,
    delay: 0.15,
  });

  // Subtle entrance for hero sub, ctas, strip, terminal.
  gsap.from(['.hero-sub', '.hero-ctas', '.hero-strip', '.hero-terminal'], {
    opacity: 0,
    y: 12,
    duration: 0.8,
    ease: 'power2.out',
    stagger: 0.08,
    delay: 0.5,
  });
}

/**
 * Wow #2 — Batch scroll reveals. Sections fade+slide in as they enter viewport.
 */
function initBatchReveals() {
  const candidates = gsap.utils.toArray<HTMLElement>(
    'section.scope .section-head, .commit-graph, .tl-item, .project-row, .meth-col, .cta-form, .cta-alt'
  );

  ScrollTrigger.batch(candidates, {
    start: 'top 88%',
    onEnter: (batch) =>
      gsap.from(batch, {
        opacity: 0,
        y: 24,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.08,
        overwrite: 'auto',
      }),
    once: true,
  });
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
