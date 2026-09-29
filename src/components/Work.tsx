import "./styles/Work.css";
import WorkImage from "./WorkImage";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import { config } from "../config";
import { Link } from "react-router-dom";
import { shouldAnimate } from "./utils/motion";

gsap.registerPlugin(ScrollTrigger);

const Work = () => {
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add("(min-width: 769px)", () => {
      let translateX = 0;

      function setTranslateX() {
        const box = document.getElementsByClassName("work-box");
        if (box.length === 0) return;
        const rectLeft = document
          .querySelector(".work-container")!
          .getBoundingClientRect().left;
        const rect = box[0].getBoundingClientRect();
        const parentWidth = box[0].parentElement!.getBoundingClientRect().width;
        const padding = parseInt(window.getComputedStyle(box[0]).padding) / 2;
        translateX = rect.width * box.length - (rectLeft + parentWidth) + padding;
      }

      setTranslateX();

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: ".work-section",
          start: "top top",
          end: () => `+=${translateX}`,
          scrub: shouldAnimate() ? 1 : false,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          id: "work",
          invalidateOnRefresh: true,
        },
      });

      if (shouldAnimate()) {
        timeline.to(".work-flex", { x: -translateX, ease: "none" });
      }

      gsap.fromTo(
        ".work-heading-label, .work-heading h2",
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.08,
          scrollTrigger: {
            trigger: ".work-section",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      ScrollTrigger.refresh();

      return () => {
        timeline.kill();
        ScrollTrigger.getById("work")?.kill();
      };
    });

    mm.add("(max-width: 768px)", () => {
      if (!shouldAnimate()) return;

      gsap.fromTo(
        ".work-box",
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".work-flex",
            start: "top 85%",
          },
        }
      );
    });

    return () => mm.revert();
  }, []);

  return (
    <div className="work-section" id="work">
      <div className="work-container section-container">
        <div className="work-heading reveal">
          <span className="section-eyebrow work-heading-label">Selected Projects</span>
          <h2>
            My <span>Work</span>
          </h2>
        </div>
        <div className="work-flex">
          {config.projects.slice(0, 5).map((project, index) => (
            <article className="work-box" key={project.id}>
              <div className="work-info">
                <div className="work-title">
                  <h3 aria-hidden="true">0{index + 1}</h3>
                  <div>
                    <h4>{project.title}</h4>
                    <p className="work-category">{project.category}</p>
                  </div>
                </div>
                <p className="work-description">{project.description}</p>
                <div className="work-meta">
                  <h4>Tools and features</h4>
                  <p>{project.technologies}</p>
                </div>
              </div>
              <WorkImage image={project.image} alt={project.title} />
            </article>
          ))}
          <div className="work-box work-box-cta">
            <div className="see-all-works">
              <span className="section-eyebrow work-cta-label">Archive</span>
              <h3>Want to see more?</h3>
              <p>Explore all of my projects and creations</p>
              <Link to="/myworks" className="see-all-btn" data-cursor="disable">
                See All Works
                <span className="see-all-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Work;
