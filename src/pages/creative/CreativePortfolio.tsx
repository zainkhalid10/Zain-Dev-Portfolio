/**
 * CreativePortfolio — Muhammad Zain's paintbrush-driven creative portfolio.
 *
 * Architecture:
 *  • Normal scroll flow — no fixed canvas backdrop.
 *  • PaintCanvas (position:fixed, z-index 50) overlays during transitions only.
 *  • Lenis smooth scroll → GSAP ScrollTrigger → PaintCanvas updates.
 *  • Zero React re-renders during scroll animation.
 *  • Phase 1: Hero → About transition only. Other sections scaffolded.
 */
import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './CreativePortfolio.css';

gsap.registerPlugin(ScrollTrigger);

// Lazy-load the canvas so it doesn't block initial paint
const PaintCanvas = lazy(() => import('./PaintCanvas'));
const HouseCanvas = lazy(() => import('./HouseCanvas'));

// ── Content ──────────────────────────────────────────────────────────────────
const profile = {
  name: 'Muhammad Zain',
  role: 'Designer & Art Director',
  tagline: 'I design things\nthat feel alive.',
  bio: 'Beyond the code, I create. Brand identities, campaigns, motion — I approach visual design with the same precision I bring to programming. Technical thinking meets artistic intuition.',
  email: 'of.mzain@gmail.com',
  instagram: 'https://instagram.com/onlyzainss',
  instagramCreative: 'https://instagram.com/c.art.___',
  linkedin: 'https://www.linkedin.com/in/muhammad-zain-a0313630b',
};

const works = [
  {
    id: 1,
    title: 'Flux Brand Identity',
    category: 'Brand Design',
    year: '2025',
    description: 'Full brand identity system for a digital-first startup — logo mark, color palette, typography system, and visual language guide.',
    tags: ['Branding', 'Figma', 'Identity'],
    accent: '#c8a0ff',
  },
  {
    id: 2,
    title: 'Nocturne UI Kit',
    category: 'UI Design',
    year: '2025',
    description: 'Dark-mode UI component library. 200+ components built in Figma with systematic token architecture and developer handoff.',
    tags: ['UI', 'Figma', 'Systems'],
    accent: '#7eb8ff',
  },
  {
    id: 3,
    title: 'Takhleeq — Campaign 2025',
    category: 'Social Media',
    year: '2025',
    description: "Led social media strategy and visual direction for Takhleeq FAST Islamabad's 2025 campaign series.",
    tags: ['Social', 'Photography', 'Direction'],
    accent: '#ffb0c8',
  },
  {
    id: 4,
    title: 'FAST Adventure — Annual Recap',
    category: 'Video Production',
    year: '2024',
    description: 'Cinematic year-in-review video capturing 12 months of adventure events — edited and motion-designed in Premiere Pro.',
    tags: ['Video', 'Motion', 'Editing'],
    accent: '#7eddcc',
  },
  {
    id: 5,
    title: 'Glyph — Poster Series',
    category: 'Print Design',
    year: '2024',
    description: 'Six-piece experimental typography poster series exploring the boundaries of letterform and negative space.',
    tags: ['Typography', 'Print', 'Concept'],
    accent: '#ffc870',
  },
  {
    id: 6,
    title: '3Musafir Visual Identity',
    category: 'Brand & Photography',
    year: '2025',
    description: 'Campus brand ambassador role — crafted visual templates, stories, and photography direction for travel campaigns.',
    tags: ['Photography', 'Brand', 'Campaigns'],
    accent: '#a8d88a',
  },
];

const process = [
  { step: '01', title: 'Discover', body: 'Deep-dive into the brief, the audience, and the competitive landscape before a single pixel is placed.' },
  { step: '02', title: 'Explore',  body: 'Rapid ideation through sketches, moodboards, and concept variants. Quantity enables quality.' },
  { step: '03', title: 'Craft',    body: 'Precision execution: every spacing choice, color relationship, and motion curve is intentional.' },
];

const skills = [
  'Figma', 'Adobe Photoshop', 'Premiere Pro', 'After Effects',
  'Canva', 'CapCut', 'Photography', 'Art Direction',
  'Brand Identity', 'Social Media', 'Motion Graphics', 'Visual Storytelling',
];

const roles = [
  { title: 'Head of Media',       org: 'FAST Adventure Society',    period: '2024 – 2025' },
  { title: 'Head of Media',       org: 'Takhleeq FAST Islamabad',   period: '2024 – 2025' },
  { title: 'Campus Ambassador',   org: '3Musafir International',     period: '2025 – Present' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function CreativePortfolio() {
  const rootRef    = useRef<HTMLDivElement>(null);
  const stackRef   = useRef<HTMLDivElement>(null);
  const lenisRef   = useRef<Lenis | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMobile   = typeof window !== 'undefined' && window.innerWidth < 768;

  // ── Lenis smooth scroll + ScrollTrigger sync ────────────────────────────────
  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.90,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    } as ConstructorParameters<typeof Lenis>[0]);

    lenisRef.current = lenis;

    // Drive Lenis from GSAP ticker — keeps it frame-perfect with ScrollTrigger
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    lenis.on('scroll', ScrollTrigger.update);

    // Pause when tab hidden
    const onVisibility = () => {
      if (document.hidden) lenis.stop();
      else lenis.start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Scrolled state for nav
    const onScroll = ({ progress }: { progress: number }) => {
      setScrolled(progress > 0.02);
    };
    lenis.on('scroll', onScroll);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tick);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // ── GSAP text reveals ────────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero — cinematic entrance
      const heroTl = gsap.timeline({ delay: 0.15 });
      heroTl
        .fromTo('.cp2-hero-label',
          { opacity: 0, y: 20, rotationX: 22, transformPerspective: 900, filter: 'blur(6px)' },
          { opacity: 1, y: 0,  rotationX: 0,  transformPerspective: 900, filter: 'blur(0px)', duration: 0.95, ease: 'power3.out' }
        )
        .fromTo('.cp2-hero-line',
          { opacity: 0, y: 48, rotationX: 28, transformPerspective: 900, transformOrigin: 'center bottom' },
          { opacity: 1, y: 0,  rotationX: 0,  transformPerspective: 900, duration: 1.05, stagger: 0.12, ease: 'power4.out' },
          '-=0.60'
        )
        .fromTo('.cp2-hero-bio',
          { opacity: 0, y: 22, rotationX: 16, transformPerspective: 900, filter: 'blur(4px)' },
          { opacity: 1, y: 0,  rotationX: 0,  transformPerspective: 900, filter: 'blur(0px)', duration: 0.88, ease: 'power3.out' },
          '-=0.55'
        )
        .fromTo('.cp2-hero-ctas',
          { opacity: 0, y: 18, rotationX: 14, transformPerspective: 900 },
          { opacity: 1, y: 0,  rotationX: 0,  transformPerspective: 900, duration: 0.78, ease: 'power3.out' },
          '-=0.48'
        );

      // Generic scroll reveals — 3D unfold from behind screen
      gsap.utils.toArray<HTMLElement>('.cp2-reveal').forEach((el) => {
        gsap.fromTo(el,
          {
            opacity: 0,
            y: 48,
            rotationX: 22,
            transformPerspective: 900,
            transformOrigin: 'center bottom',
            filter: 'blur(5px)',
          },
          {
            opacity: 1,
            y: 0,
            rotationX: 0,
            transformPerspective: 900,
            filter: 'blur(0px)',
            duration: 0.92,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 90%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // Work cards — 3D unfold from behind + scale
      gsap.utils.toArray<HTMLElement>('.cp2-card').forEach((card, i) => {
        gsap.fromTo(card,
          {
            opacity: 0,
            y: 64,
            scale: 0.92,
            rotationX: 18,
            transformPerspective: 900,
            transformOrigin: 'center bottom',
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationX: 0,
            transformPerspective: 900,
            duration: 0.88,
            delay: (i % 3) * 0.065,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 92%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // Process steps — 3D unfold from side + behind
      gsap.fromTo('.cp2-process-step',
        {
          opacity: 0,
          y: 44,
          rotationX: 20,
          transformPerspective: 900,
          transformOrigin: 'center bottom',
        },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          transformPerspective: 900,
          duration: 0.88,
          stagger: 0.14,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.cp2-process-grid', start: 'top 85%' },
        }
      );

      // Skill chips pop in
      gsap.fromTo('.cp2-skill',
        { opacity: 0, scale: 0.78, y: 12 },
        {
          opacity: 1, scale: 1, y: 0,
          duration: 0.46,
          stagger: 0.038,
          ease: 'back.out(1.5)',
          scrollTrigger: { trigger: '.cp2-skills-wrap', start: 'top 85%' },
        }
      );

      // Role rows slide in
      gsap.fromTo('.cp2-role',
        { opacity: 0, x: 24 },
        {
          opacity: 1, x: 0,
          duration: 0.72,
          stagger: 0.14,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.cp2-roles', start: 'top 84%' },
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // ── Work split-panel stack ─────────────────────────────────────────────
  // Static two-column frame; LEFT text panels slide from top ↓
  // RIGHT art panels slide from bottom ↑ — opposite streams.
  useEffect(() => {
    const stack = stackRef.current;
    if (!stack) return;

    const leftPanels  = gsap.utils.toArray<HTMLElement>('.cp2-stext');
    const rightPanels = gsap.utils.toArray<HTMLElement>('.cp2-sart');
    const dots        = gsap.utils.toArray<HTMLElement>('.cp2-stack-dot');
    const total = works.length;

    if (leftPanels.length === 0) return;

    // Initial positions: first item visible, rest waiting off-screen
    // Left waits ABOVE  (negative Y), right waits BELOW (positive Y)
    leftPanels.forEach((el, i)  => gsap.set(el, { yPercent: i === 0 ? 0 : -100 }));
    rightPanels.forEach((el, i) => gsap.set(el, { yPercent: i === 0 ? 0 :  100 }));
    if (dots[0]) dots[0].classList.add('cp2-stack-dot--active');

    let lastActiveIdx = 0;

    const st = ScrollTrigger.create({
      trigger: stack,
      pin: true,
      start: 'top top',
      end: `+=${(total - 1) * window.innerHeight}`,
      scrub: 0.50,   // feels physically tethered but not laggy
      onUpdate(self) {
        const gp  = self.progress * (total - 1);          // 0 → N-1
        const idx = Math.min(Math.floor(gp), total - 2); // current exiting pair index
        const lp  = gp - idx;                            // 0–1 within this transition

        // ─ LEFT text panels (stream flows DOWNWARD) ──────────────
        leftPanels.forEach((el, i) => {
          if      (i < idx)      gsap.set(el, { yPercent:  100 });            // past — exited down
          else if (i === idx)    gsap.set(el, { yPercent:  lp * 100 });       // exiting ↓
          else if (i === idx+1)  gsap.set(el, { yPercent: -(1-lp) * 100 });  // entering from top ↓
          else                   gsap.set(el, { yPercent: -100 });            // waiting above
        });

        // ─ RIGHT art panels (stream flows UPWARD) ───────────────
        rightPanels.forEach((el, i) => {
          if      (i < idx)      gsap.set(el, { yPercent: -100 });           // past — exited up
          else if (i === idx)    gsap.set(el, { yPercent: -lp * 100 });      // exiting ↑
          else if (i === idx+1)  gsap.set(el, { yPercent:  (1-lp) * 100 }); // entering from bottom ↑
          else                   gsap.set(el, { yPercent:  100 });           // waiting below
        });

        // ─ Progress dots ─────────────────────────────────
        const activeIdx = lp > 0.5 ? idx + 1 : idx;
        if (activeIdx !== lastActiveIdx) {
          lastActiveIdx = activeIdx;
          dots.forEach((d, i) => d.classList.toggle('cp2-stack-dot--active', i === activeIdx));
        }
      },
    });

    return () => st.kill();
  }, []);

  // ── Body style cleanup ───────────────────────────────────────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    document.documentElement.style.scrollBehavior = 'auto';
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  // ── Custom cursor (desktop only) ─────────────────────────────────────────────
  useEffect(() => {
    if (isMobile) return;
    const dot   = document.createElement('div');
    const ring  = document.createElement('div');
    dot.className  = 'cp2-cursor-dot';
    ring.className = 'cp2-cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mx = 0, my = 0, dx = 0, dy = 0, rx = 0, ry = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    const tick = () => {
      dx += (mx - dx) * 0.20;
      dy += (my - dy) * 0.20;
      rx += (mx - rx) * 0.07;
      ry += (my - ry) * 0.07;
      dot.style.transform  = `translate(${dx - 5}px, ${dy - 5}px)`;
      ring.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`;
      raf = requestAnimationFrame(tick);
    };
    const enter = () => dot.classList.add('cp2-cursor-hover');
    const leave = () => dot.classList.remove('cp2-cursor-hover');

    document.addEventListener('mousemove', onMove);
    document.querySelectorAll('a,button').forEach(el => {
      el.addEventListener('mouseenter', enter);
      el.addEventListener('mouseleave', leave);
    });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMove);
      dot.remove();
      ring.remove();
    };
  }, [isMobile]);

  // ── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <div className="cp2-root" ref={rootRef}>

      {/* PaintCanvas — fixed overlay, only active during transitions */}
      <Suspense fallback={null}>
        <PaintCanvas
          triggerSelector=".cp2-about"
          isMobile={isMobile}
          start="top 86%"
          end="top 14%"
        />
      </Suspense>

      {/* HouseCanvas — fixed bg: pile in hero, builds through about→toolkit */}
      <Suspense fallback={null}>
        <HouseCanvas />
      </Suspense>

      {/* ── NAV ────────────────────────────────────────────────────────────── */}
      <header className={`cp2-nav${scrolled ? ' cp2-nav--scrolled' : ''}`}>
        <Link to="/" className="cp2-nav-back" aria-label="Back to home">
          <span>←</span>
          <span>Home</span>
        </Link>

        <span className="cp2-nav-brand" aria-hidden="true">Muhammad Zain</span>

        <nav className="cp2-nav-links" aria-label="Sections">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>

        <button
          type="button"
          className={`cp2-hamburger${menuOpen ? ' cp2-hamburger--open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span /><span />
        </button>

        {menuOpen && (
          <div className="cp2-mobile-nav" role="dialog" aria-label="Mobile navigation">
            <a href="#work"    onClick={() => setMenuOpen(false)}>Work</a>
            <a href="#about"   onClick={() => setMenuOpen(false)}>About</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
            <Link to="/" onClick={() => setMenuOpen(false)}>← Home</Link>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════ */}
      <section className="cp2-section cp2-hero" id="cp2-hero" aria-label="Hero">
        <div className="cp2-hero-inner">
          <span className="cp2-hero-label">
            Creative Portfolio · 2025
          </span>

          <h1 className="cp2-hero-title" aria-label={profile.tagline.replace('\n', ' ')}>
            {profile.tagline.split('\n').map((line, i) => (
              <span
                key={i}
                className={`cp2-hero-line${i === 1 ? ' cp2-hero-line--italic' : ''}`}
              >
                {line}
              </span>
            ))}
          </h1>

          <p className="cp2-hero-bio">{profile.bio}</p>

          <div className="cp2-hero-ctas">
            <a href="#work"                  className="cp2-btn-primary" id="hero-see-work">See Work ↓</a>
            <a href={`mailto:${profile.email}`} className="cp2-btn-ghost"   id="hero-contact">Get in Touch</a>
          </div>
        </div>

        {/* Floating discipline labels — give the empty right side visual interest */}
        <div className="cp2-hero-disciplines" aria-hidden="true">
          <span>Brand Identity</span>
          <span>Art Direction</span>
          <span>Motion Graphics</span>
          <span>Photography</span>
        </div>

        {/* Scroll cue */}
        <div className="cp2-scroll-cue" aria-hidden="true">
          <span className="cp2-scroll-label">Scroll</span>
          <div className="cp2-scroll-track">
            <div className="cp2-scroll-thumb" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ABOUT  ← brush paints into this
      ═══════════════════════════════════════════════════════════ */}
      <section className="cp2-section cp2-about" id="about" aria-label="About">
        <div className="cp2-section-inner">
          <div className="cp2-about-layout">

            <div className="cp2-about-text">
              <span className="cp2-eyebrow cp2-reveal">The Creative Side</span>
              <h2 className="cp2-section-title cp2-reveal">
                Where Code<br />Meets <em>Canvas</em>
              </h2>
              <p className="cp2-body cp2-reveal">
                I graduated with a BSc in Computer Science from FAST NUCES, but creativity
                has always been a parallel current. I spent years leading university media
                teams — directing content, managing campaigns across platforms, and
                mentoring students on design fundamentals.
              </p>
              <p className="cp2-body cp2-reveal">
                The CS mindset shapes how I design: systematic, intentional, scalable.
                Every visual project I take on is built like good software — with
                architecture, consistency, and purpose.
              </p>

              <div className="cp2-stats cp2-reveal">
                <div className="cp2-stat">
                  <span className="cp2-stat-n">4+</span>
                  <span className="cp2-stat-l">Years creating</span>
                </div>
                <div className="cp2-stat">
                  <span className="cp2-stat-n">20+</span>
                  <span className="cp2-stat-l">Projects delivered</span>
                </div>
                <div className="cp2-stat">
                  <span className="cp2-stat-n">2</span>
                  <span className="cp2-stat-l">Media teams led</span>
                </div>
              </div>
            </div>

            {/* No photo — replaced with editorial typographic element */}
            <div className="cp2-about-art cp2-reveal" aria-hidden="true">
              <div className="cp2-about-initials">
                <span>M</span>
                <span>Z</span>
              </div>
              <div className="cp2-about-art-label">
                <span>Designer</span>
                <span>Developer</span>
                <span>Director</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PROCESS + SKILLS
      ═══════════════════════════════════════════════════════════ */}
      <section className="cp2-section cp2-process" aria-label="Creative process">
        <div className="cp2-section-inner">
          <div className="cp2-section-head cp2-reveal">
            <span className="cp2-eyebrow">How I Work</span>
            <h2 className="cp2-section-title">The Creative<br /><em>Process</em></h2>
          </div>

          <div className="cp2-process-grid">
            {process.map(p => (
              <div key={p.step} className="cp2-process-step">
                <span className="cp2-step-n">{p.step}</span>
                <h3 className="cp2-step-title">{p.title}</h3>
                <p className="cp2-step-body">{p.body}</p>
              </div>
            ))}
          </div>

          <div className="cp2-section-head cp2-reveal" style={{ marginTop: '90px' }}>
            <span className="cp2-eyebrow">Tools &amp; Disciplines</span>
            <h2 className="cp2-section-title">Creative<br /><em>Toolkit</em></h2>
          </div>
          <div className="cp2-skills-wrap">
            {skills.map(s => (
              <span key={s} className="cp2-skill">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
          SELECTED WORK — split-panel stack
          Static 2-col frame; left text ↓, right art ↑
      ═════════════════════════════════════════════════════════ */}
      <section id="work" aria-label="Selected work" style={{ position: 'relative' }}>
        {/* cp2-stack is pinned by GSAP; 2-col frame never moves */}
        <div className="cp2-stack" ref={stackRef}>

          {/* LEFT column — clipping container; text panels stream ↓ */}
          <div className="cp2-stack-left">
            {works.map((w, i) => (
              <div key={w.id} className="cp2-stext">
                <div className="cp2-scard-meta">
                  <span className="cp2-scard-idx">
                    {String(i + 1).padStart(2, '0')}&nbsp;/&nbsp;{String(works.length).padStart(2, '0')}
                  </span>
                  <span className="cp2-scard-cat">{w.category}&nbsp;·&nbsp;{w.year}</span>
                </div>
                <h3 className="cp2-scard-title">{w.title}</h3>
                <p className="cp2-scard-desc">{w.description}</p>
                <div className="cp2-scard-tags">
                  {w.tags.map(t => <span key={t} className="cp2-tag">{t}</span>)}
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT column — clipping container; art panels stream ↑ */}
          <div className="cp2-stack-right">
            {works.map((w, i) => (
              <div
                key={w.id}
                className="cp2-sart"
                style={{ '--accent': w.accent } as React.CSSProperties}
              >
                <div className="cp2-scard-glow" />
                <span className="cp2-scard-glyph" aria-hidden="true">✦</span>
              </div>
            ))}
          </div>

          {/* Vertical divider */}
          <div className="cp2-stack-divider" aria-hidden="true" />

          {/* Progress dots */}
          <div className="cp2-stack-dots" aria-hidden="true">
            {works.map((_, i) => <span key={i} className="cp2-stack-dot" />)}
          </div>

          {/* Scroll hint */}
          <div className="cp2-stack-hint" aria-hidden="true">
            <span>scroll</span>
            <div className="cp2-stack-hint-bar"><div className="cp2-stack-hint-fill" /></div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          EXPERIENCE / JOURNEY
      ═══════════════════════════════════════════════════════════ */}
      <section className="cp2-section cp2-experience" aria-label="Experience">
        <div className="cp2-section-inner">
          <div className="cp2-experience-inner">
            <span className="cp2-eyebrow cp2-reveal">The Journey</span>
            <h2 className="cp2-section-title cp2-reveal">
              Every pixel<br />has a <em>story.</em>
            </h2>
            <p className="cp2-body cp2-reveal" style={{ maxWidth: 500 }}>
              Four years of media leadership, brand campaigns, video direction, and digital
              design — each project a step further into the intersection of logic and art.
            </p>

            <div className="cp2-roles">
              {roles.map((r, i) => (
                <div key={i} className="cp2-role">
                  <div className="cp2-role-left">
                    <span className="cp2-role-title">{r.title}</span>
                    <span className="cp2-role-org">{r.org}</span>
                  </div>
                  <span className="cp2-role-period">{r.period}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CONTACT
      ═══════════════════════════════════════════════════════════ */}
      <section className="cp2-section cp2-contact" id="contact" aria-label="Contact">
        <div className="cp2-section-inner cp2-contact-inner">
          <span className="cp2-eyebrow cp2-reveal">Let's Collaborate</span>
          <h2 className="cp2-contact-title cp2-reveal">
            Got a vision?<br />
            Let's <em>make it real.</em>
          </h2>
          <p className="cp2-body cp2-reveal">
            Whether it's a brand, campaign, or creative direction —<br />
            I'm open to projects that push boundaries.
          </p>

          <div className="cp2-contact-cta cp2-reveal">
            <a
              href={`mailto:${profile.email}`}
              className="cp2-btn-primary cp2-btn--large"
              id="contact-email"
            >
              {profile.email} →
            </a>
          </div>

          <div className="cp2-socials cp2-reveal">
            <a href={profile.instagram}         target="_blank" rel="noopener noreferrer">Instagram</a>
            <span aria-hidden="true">·</span>
            <a href={profile.instagramCreative} target="_blank" rel="noopener noreferrer">Art Page</a>
            <span aria-hidden="true">·</span>
            <a href={profile.linkedin}          target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
        </div>

        <footer className="cp2-footer">
          <Link to="/"    className="cp2-footer-link">← Gateway</Link>
          <p className="cp2-footer-copy">© {new Date().getFullYear()} Muhammad Zain · Designed with intent.</p>
          <Link to="/dev" className="cp2-footer-link">Dev Portfolio →</Link>
        </footer>
      </section>

    </div>
  );
}
