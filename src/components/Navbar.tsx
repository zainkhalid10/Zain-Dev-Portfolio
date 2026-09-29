import { config } from "../config";
import { useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HoverLinks from "./HoverLinks";
import { gsap } from "gsap";
import Lenis from "lenis";
import "./styles/Navbar.css";

gsap.registerPlugin(ScrollTrigger);
export let lenis: Lenis | null = null;

const NAV_SECTIONS = [
  { id: "about", label: "ABOUT" },
  { id: "work", label: "WORK" },
  { id: "contact", label: "CONTACT" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToSection = (selector: string) => {
    const target = document.querySelector(selector) as HTMLElement;
    if (target && lenis) {
      lenis.scrollTo(target, { offset: 0, duration: 1.35 });
    } else if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  useEffect(() => {
    lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.5,
      touchMultiplier: 1.8,
      infinite: false,
    });

    lenis.stop();

    function raf(time: number) {
      lenis?.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const onScroll = ({ scroll, limit }: { scroll: number; limit: number }) => {
      setScrolled(scroll > 48);
      setScrollProgress(limit > 0 ? (scroll / limit) * 100 : 0);
    };

    lenis.on("scroll", onScroll);

    const sectionTriggers = NAV_SECTIONS.map(({ id }) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: "top 45%",
        end: "bottom 45%",
        onEnter: () => setActiveSection(id),
        onEnterBack: () => setActiveSection(id),
      })
    );

    window.addEventListener("resize", () => lenis?.resize());

    return () => {
      lenis?.destroy();
      lenis = null;
      sectionTriggers.forEach((t) => t.kill());
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("nav-menu-open", menuOpen);
    return () => document.body.classList.remove("nav-menu-open");
  }, [menuOpen]);

  return (
    <>
      <div
        className="scroll-progress"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />
      <header className={`header ${scrolled ? "header-scrolled" : ""}`}>
        <a href="/" className="navbar-title" data-cursor="disable" title="Back to gateway">
          {config.developer.name}
        </a>
        <a
          href={`mailto:${config.contact.email}`}
          className="navbar-connect"
          data-cursor="disable"
        >
          {config.contact.email}
        </a>

        <button
          type="button"
          className={`nav-toggle ${menuOpen ? "nav-toggle-open" : ""}`}
          aria-expanded={menuOpen}
          aria-controls="site-nav"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
          data-cursor="disable"
        >
          <span />
          <span />
        </button>

        <nav id="site-nav" className={menuOpen ? "nav-open" : ""} aria-label="Primary">
          <ul>
            {NAV_SECTIONS.map(({ id, label }) => (
              <li key={id} className={activeSection === id ? "nav-active" : ""}>
                <a
                  href={`#${id}`}
                  data-cursor="disable"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(`#${id}`);
                  }}
                >
                  <HoverLinks text={label} />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="landing-circle1" aria-hidden="true" />
      <div className="landing-circle2" aria-hidden="true" />
      <div
        className={`nav-fade ${scrolled ? "nav-fade-visible" : ""}`}
        aria-hidden="true"
      />
      {menuOpen && (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          data-cursor="disable"
        />
      )}
    </>
  );
};

export default Navbar;
