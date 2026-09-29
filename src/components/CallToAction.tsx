import { Link } from "react-router-dom";
import { config } from "../config";
import "./styles/CallToAction.css";

const CallToAction = () => {
  return (
    <section className="cta-section" aria-label="Call to action">
      <div className="cta-inner reveal">
        <span className="section-eyebrow">Beyond the portfolio</span>
        <p className="cta-lead">Let&apos;s build something intelligent together.</p>
        <div className="cta-buttons">
          <Link to="/play" className="cta-btn cta-btn-play" data-cursor="disable">
            <span>Play With Me</span>
            <span className="cta-btn-arrow" aria-hidden="true">
              →
            </span>
          </Link>
          <a
            href={config.contact.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-btn cta-btn-hire"
            data-cursor="disable"
          >
            <span>Hire Me</span>
            <span className="cta-btn-arrow" aria-hidden="true">
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
