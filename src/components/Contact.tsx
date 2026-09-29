import { MdArrowOutward, MdCopyright } from "react-icons/md";
import "./styles/Contact.css";
import { config } from "../config";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import { shouldAnimate } from "./utils/motion";

gsap.registerPlugin(ScrollTrigger);

const Contact = () => {
  useEffect(() => {
    if (!shouldAnimate()) return;

    const contactTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".contact-section",
        start: "top 78%",
        end: "bottom center",
        toggleActions: "play none none none",
      },
    });

    contactTimeline
      .fromTo(
        ".contact-eyebrow",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }
      )
      .fromTo(
        ".contact-section h3",
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 0.75, ease: "power3.out" },
        "-=0.3"
      )
      .fromTo(
        ".contact-box",
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: "power3.out",
        },
        "-=0.45"
      );

    return () => {
      contactTimeline.kill();
    };
  }, []);

  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <span className="section-eyebrow contact-eyebrow">Get in touch</span>
        <h3>{config.developer.fullName}</h3>
        <div className="contact-flex reveal-stagger">
          <div className="contact-box reveal-item">
            <h4>Email</h4>
            <p>
              <a href={`mailto:${config.contact.email}`} data-cursor="disable">
                {config.contact.email}
              </a>
            </p>
            <h4>Location</h4>
            <p>
              <span>{config.social.location}</span>
            </p>
          </div>
          <div className="contact-box reveal-item">
            <h4>Social</h4>
            <a
              href={config.contact.github}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              Github <MdArrowOutward aria-hidden="true" />
            </a>
            <a
              href={config.contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              Linkedin <MdArrowOutward aria-hidden="true" />
            </a>
            <a
              href={config.contact.twitter}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              Twitter <MdArrowOutward aria-hidden="true" />
            </a>
            <a
              href={config.contact.facebook}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              Facebook <MdArrowOutward aria-hidden="true" />
            </a>
            <a
              href={config.contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              Instagram <MdArrowOutward aria-hidden="true" />
            </a>
          </div>
          <div className="contact-box reveal-item contact-box-closing">
            <h2>
              Designed and Developed <br /> by <span>{config.developer.fullName}</span>
            </h2>
            <h5>
              <MdCopyright aria-hidden="true" /> {new Date().getFullYear()}
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
