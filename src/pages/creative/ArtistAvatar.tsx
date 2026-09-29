import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./ArtistAvatar.css";

/**
 * ArtistAvatar — an interactive SVG character for the creative portfolio.
 * Features:
 *  - Eyes that follow the user's cursor in real-time (RAF loop)
 *  - Random blinking via GSAP
 *  - Smiles when hovered
 *  - Eyebrows raise on hover
 *  - Floating / ambient CSS animations
 *  - Rotating decorative rings
 *  - Floating particle dots
 *  - Paint brush + palette accessories
 */
const ArtistAvatar = () => {
  const svgRef      = useRef<SVGSVGElement>(null);
  const leftGaze    = useRef<SVGGElement>(null);
  const rightGaze   = useRef<SVGGElement>(null);
  const leftLid     = useRef<SVGEllipseElement>(null);
  const rightLid    = useRef<SVGEllipseElement>(null);
  const [happy, setHappy] = useState(false);

  /* ── Eye tracking via RAF ──────────────────────────── */
  useEffect(() => {
    // SVG coordinate space: viewBox "0 0 300 400"
    const LEFT  = { x: 110, y: 158 };
    const RIGHT = { x: 192, y: 158 };
    const MAX_MOVE = 6.5;

    let tx = 150, ty = 200;   // target (in SVG coords)
    let cx = 150, cy = 200;   // current (lerped)
    let raf: number;

    const onMove = (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width)  * 300;
      ty = ((e.clientY - r.top)  / r.height) * 400;
    };

    const applyGaze = (el: SVGGElement | null, eye: { x: number; y: number }) => {
      if (!el) return;
      const dx    = cx - eye.x;
      const dy    = cy - eye.y;
      const angle = Math.atan2(dy, dx);
      const dist  = Math.min(Math.hypot(dx, dy) / 85, 1);
      const ox    = Math.cos(angle) * dist * MAX_MOVE;
      const oy    = Math.sin(angle) * dist * MAX_MOVE;
      el.setAttribute("transform", `translate(${ox.toFixed(2)},${oy.toFixed(2)})`);
    };

    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      applyGaze(leftGaze.current,  LEFT);
      applyGaze(rightGaze.current, RIGHT);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* ── Randomized blinking via GSAP ─────────────────── */
  useEffect(() => {
    const executeBlink = () => {
      const targets = [leftLid.current, rightLid.current].filter(Boolean);
      gsap.to(targets, {
        scaleY: 1,
        duration: 0.07,
        ease: "power2.in",
        onComplete: () => {
          gsap.to(targets, { scaleY: 0, duration: 0.1, ease: "power2.out" });
        },
      });
    };

    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        executeBlink();
        // double-blink sometimes
        if (Math.random() > 0.7) {
          setTimeout(executeBlink, 200);
        }
        schedule();
      }, 3000 + Math.random() * 4000);
    };

    schedule();
    return () => clearTimeout(timer);
  }, []);

  /* ── JSX ───────────────────────────────────────────── */
  return (
    <div className="aa-wrap">
      <svg
        ref={svgRef}
        viewBox="0 0 300 400"
        xmlns="http://www.w3.org/2000/svg"
        className="aa-svg"
        onMouseEnter={() => setHappy(true)}
        onMouseLeave={() => setHappy(false)}
        aria-label="Interactive artist avatar"
        role="img"
      >
        {/* ── Definitions ──────────────────────────────── */}
        <defs>
          {/* Skin gradient — warm amber-ochre */}
          <radialGradient id="aaSkGr" cx="42%" cy="30%" r="65%">
            <stop offset="0%"   stopColor="#f7ddb2" />
            <stop offset="55%"  stopColor="#e8b070" />
            <stop offset="100%" stopColor="#d08848" />
          </radialGradient>

          {/* Cheek blush — amber glow */}
          <radialGradient id="aaBlush" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#f0a500" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#f0a500" stopOpacity="0"    />
          </radialGradient>

          {/* Eye white — porcelain */}
          <radialGradient id="aaEyeW" cx="36%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#ffffff"  />
            <stop offset="100%" stopColor="#f0ece6"  />
          </radialGradient>

          {/* Shirt gradient */}
          <linearGradient id="aaShirt" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#1c1610" />
            <stop offset="100%" stopColor="#0e0c09" />
          </linearGradient>

          {/* Clip paths — lock iris inside eye socket */}
          <clipPath id="aaLC">
            <ellipse cx="110" cy="158" rx="22" ry="19" />
          </clipPath>
          <clipPath id="aaRC">
            <ellipse cx="192" cy="158" rx="22" ry="19" />
          </clipPath>

          {/* Soft drop shadow for face */}
          <filter id="aaFS" x="-18%" y="-10%" width="136%" height="130%">
            <feDropShadow dx="0" dy="16" stdDeviation="20"
              floodColor="#0d0a06" floodOpacity="0.6" />
          </filter>

          {/* Amber ambient glow */}
          <filter id="aaGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Ambient decorative rings ──────────────────── */}
        <circle cx="150" cy="185" r="130"
          fill="none" stroke="#f0a500" strokeWidth="1"
          strokeDasharray="5 20" opacity="0.13"
          className="aa-ring aa-ring-cw"
        />
        <circle cx="150" cy="185" r="144"
          fill="none" stroke="#c2a4ff" strokeWidth="0.5"
          strokeDasharray="2 26" opacity="0.08"
          className="aa-ring aa-ring-ccw"
        />
        <circle cx="150" cy="185" r="116"
          fill="none" stroke="#f0a500" strokeWidth="0.5"
          strokeDasharray="1 12" opacity="0.06"
          className="aa-ring aa-ring-cw"
          style={{ animationDuration: "50s" }}
        />

        {/* ── Floating ambient particles ────────────────── */}
        <circle cx="28"  cy="108" r="3"   fill="#f0a500" opacity="0.50" className="aa-p aa-p1" />
        <circle cx="272" cy="86"  r="2.5" fill="#f0a500" opacity="0.40" className="aa-p aa-p2" />
        <circle cx="20"  cy="272" r="2"   fill="#c2a4ff" opacity="0.45" className="aa-p aa-p3" />
        <circle cx="278" cy="250" r="3"   fill="#c2a4ff" opacity="0.30" className="aa-p aa-p4" />
        <circle cx="50"  cy="350" r="2"   fill="#f0a500" opacity="0.28" className="aa-p aa-p5" />
        <circle cx="250" cy="340" r="1.5" fill="#4ecdc4" opacity="0.38" className="aa-p aa-p6" />
        <circle cx="148" cy="22"  r="2"   fill="#f0a500" opacity="0.35" className="aa-p aa-p7" />

        {/* ── Shirt / body ─────────────────────────────── */}
        <path
          d="M 82 328
             Q 56 304 50 400
             L 250 400
             Q 244 304 218 328
             Q 198 376 150 376
             Q 102 376 82 328 Z"
          fill="url(#aaShirt)"
        />
        {/* V-neck collar */}
        <path
          d="M 132 338 Q 150 364 168 338 L 162 324 L 150 348 L 138 324 Z"
          fill="#242018"
        />
        {/* Subtle shirt seam lines */}
        <path d="M 88 340 Q 108 352 126 344" stroke="#262018" strokeWidth="1.5"
          fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M 174 344 Q 192 352 212 340" stroke="#262018" strokeWidth="1.5"
          fill="none" strokeLinecap="round" opacity="0.7" />

        {/* ── Neck ─────────────────────────────────────── */}
        <rect x="133" y="294" width="34" height="44" rx="12" fill="url(#aaSkGr)" />

        {/* ── Face base ────────────────────────────────── */}
        <ellipse cx="150" cy="183" rx="94" ry="116"
          fill="url(#aaSkGr)" filter="url(#aaFS)" />

        {/* ── Hair — back volume ───────────────────────── */}
        <ellipse cx="150" cy="92" rx="101" ry="72" fill="#180c07" />

        {/* ── Hair — front sculpted shape ──────────────── */}
        <path
          d="M 56 138
             Q 46 60 150 42
             Q 254 60 244 138
             Q 214 90 150 82
             Q 86 90 56 138 Z"
          fill="#1f0d07"
        />
        {/* Hair wisps */}
        <path d="M 154 44 Q 162 16 176 36"
          stroke="#180c07" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M 147 44 Q 137 14 144 30"
          stroke="#180c07" strokeWidth="8"  fill="none" strokeLinecap="round" />
        <path d="M 163 42 Q 174 22 180 42"
          stroke="#180c07" strokeWidth="6"  fill="none" strokeLinecap="round" />

        {/* ── Beret ────────────────────────────────────── */}
        <ellipse cx="163" cy="72" rx="76" ry="27"
          fill="#f0a500" transform="rotate(-9 163 72)" />
        {/* Beret button */}
        <circle cx="177" cy="54" r="16"
          fill="#d08800" transform="rotate(-9 177 54)" />
        <circle cx="177" cy="54" r="8"
          fill="#f5b630" transform="rotate(-9 177 54)" />
        <circle cx="177" cy="54" r="3.5"
          fill="#d09000" transform="rotate(-9 177 54)" />
        {/* Beret band */}
        <path d="M 88 90 Q 164 104 232 86"
          stroke="#be7800" strokeWidth="6" fill="none" strokeLinecap="round" />

        {/* ── Ears ─────────────────────────────────────── */}
        <ellipse cx="58"  cy="184" rx="14" ry="22" fill="url(#aaSkGr)" />
        <path d="M 62 171 Q 58 184 62 197"
          stroke="#c89060" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <ellipse cx="242" cy="184" rx="14" ry="22" fill="url(#aaSkGr)" />
        <path d="M 238 171 Q 242 184 238 197"
          stroke="#c89060" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* ── Cheek blush ──────────────────────────────── */}
        <ellipse cx="82"  cy="204" rx="28" ry="21" fill="url(#aaBlush)" />
        <ellipse cx="218" cy="204" rx="28" ry="21" fill="url(#aaBlush)" />

        {/* ── Eye whites ───────────────────────────────── */}
        <ellipse cx="110" cy="158" rx="26" ry="22" fill="url(#aaEyeW)" />
        <ellipse cx="192" cy="158" rx="26" ry="22" fill="url(#aaEyeW)" />
        {/* Inner eye shadow at top */}
        <ellipse cx="110" cy="142" rx="22" ry="12" fill="rgba(0,0,0,0.05)" />
        <ellipse cx="192" cy="142" rx="22" ry="12" fill="rgba(0,0,0,0.05)" />

        {/* ── Left iris group — gaze-tracked ───────────── */}
        <g clipPath="url(#aaLC)">
          <g ref={leftGaze}>
            {/* Iris layers */}
            <circle cx="110" cy="158" r="14.5" fill="#3a2000" />
            <circle cx="110" cy="158" r="10.5" fill="#5e3600" />
            <circle cx="110" cy="158" r="6.5"  fill="#0e0905" />
            {/* Highlights */}
            <circle cx="116" cy="151" r="3.5"  fill="white"  opacity="0.92" />
            <circle cx="106" cy="164" r="1.8"  fill="white"  opacity="0.30" />
            <circle cx="114" cy="163" r="1"    fill="white"  opacity="0.20" />
          </g>
        </g>

        {/* ── Right iris group — gaze-tracked ──────────── */}
        <g clipPath="url(#aaRC)">
          <g ref={rightGaze}>
            <circle cx="192" cy="158" r="14.5" fill="#3a2000" />
            <circle cx="192" cy="158" r="10.5" fill="#5e3600" />
            <circle cx="192" cy="158" r="6.5"  fill="#0e0905" />
            <circle cx="198" cy="151" r="3.5"  fill="white"  opacity="0.92" />
            <circle cx="188" cy="164" r="1.8"  fill="white"  opacity="0.30" />
            <circle cx="196" cy="163" r="1"    fill="white"  opacity="0.20" />
          </g>
        </g>

        {/* ── Eyelids — animated by GSAP on blink ──────── */}
        <ellipse
          ref={leftLid}
          cx="110" cy="158" rx="26" ry="22"
          fill="url(#aaSkGr)"
          style={{ transformBox: "fill-box", transformOrigin: "center", transform: "scaleY(0)" }}
        />
        <ellipse
          ref={rightLid}
          cx="192" cy="158" rx="26" ry="22"
          fill="url(#aaSkGr)"
          style={{ transformBox: "fill-box", transformOrigin: "center", transform: "scaleY(0)" }}
        />

        {/* ── Upper lash line ───────────────────────────── */}
        <path d="M 86 142 Q 110 135 134 142"
          stroke="#1c0c08" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M 168 142 Q 192 135 216 142"
          stroke="#1c0c08" strokeWidth="4.5" fill="none" strokeLinecap="round" />

        {/* ── Eyebrows — react to happy state ──────────── */}
        <path
          d={happy ? "M 84 130 Q 110 118 134 129" : "M 84 135 Q 110 126 134 133"}
          stroke="#200e07" strokeWidth="6" fill="none" strokeLinecap="round"
          style={{ transition: "d 0.35s ease" }}
        />
        <path
          d={happy ? "M 168 129 Q 192 118 216 130" : "M 168 133 Q 192 126 216 135"}
          stroke="#200e07" strokeWidth="6" fill="none" strokeLinecap="round"
          style={{ transition: "d 0.35s ease" }}
        />

        {/* ── Nose ─────────────────────────────────────── */}
        <path
          d="M 144 192 Q 139 215 147 222 Q 151 226 159 222 Q 167 218 162 216 Q 157 204 154 192"
          stroke="#c08858" strokeWidth="2.2" fill="none" strokeLinecap="round"
        />

        {/* ── Mouth — switches on hover ─────────────────── */}
        {happy ? (
          <>
            <path
              d="M 114 242 Q 150 270 186 242"
              stroke="#b06848" strokeWidth="4.2" fill="none" strokeLinecap="round"
            />
            {/* Teeth */}
            <path
              d="M 120 245 Q 150 268 180 245 Q 179 258 150 262 Q 121 258 120 245 Z"
              fill="#fdf6ee" opacity="0.88"
            />
          </>
        ) : (
          <path
            d="M 118 244 Q 150 258 182 244"
            stroke="#b06848" strokeWidth="4" fill="none" strokeLinecap="round"
          />
        )}

        {/* ── Paint brush (held) ───────────────────────── */}
        <g className="aa-brush">
          <g transform="translate(234 294) rotate(-24)">
            {/* Wooden handle */}
            <rect x="-5"  y="-70" width="10" height="74" rx="5"    fill="#7a3f1a" />
            {/* Wood grain */}
            <line x1="-2" y1="-60" x2="-2" y2="0" stroke="#6a3010" strokeWidth="0.8" opacity="0.6" />
            {/* Ferrule */}
            <rect x="-6"  y="-76" width="12" height="11" rx="2.5"  fill="#a0a0a0" />
            <line x1="-4" y1="-71" x2="4"   y2="-71"    stroke="#c0c0c0" strokeWidth="0.8" />
            {/* Bristles */}
            <path d="M -6 -76 Q 0 -108 6 -76 Z" fill="#f0a500" />
            <path d="M -3 -78 Q 0 -104 3 -78 Z" fill="#ffc840" />
            <path d="M -1 -80 Q 0 -102 1 -80 Z" fill="#ffe080" opacity="0.6" />
          </g>
        </g>

        {/* ── Paint palette ─────────────────────────────── */}
        <g className="aa-palette">
          <g transform="translate(60 292) rotate(14)">
            {/* Palette body */}
            <ellipse cx="0" cy="0" rx="34" ry="24" fill="#281806" />
            {/* Thumb hole */}
            <ellipse cx="-10" cy="9" rx="9" ry="7" fill="#140e04" />
            {/* Paint blobs */}
            <circle cx="14"  cy="-8"  r="7"   fill="#f0a500" />
            <circle cx="22"  cy="6"   r="6"   fill="#c2a4ff" />
            <circle cx="6"   cy="14"  r="6.5" fill="#ff6b6b" />
            <circle cx="-5"  cy="-11" r="5.5" fill="#4ecdc4" />
            <circle cx="-18" cy="2"   r="5"   fill="#a8e063" />
            {/* Slight gloss on blobs */}
            <circle cx="16"  cy="-10" r="2.5" fill="white" opacity="0.3" />
            <circle cx="24"  cy="4"   r="2"   fill="white" opacity="0.25" />
          </g>
        </g>

        {/* ── Amber glow accent on face ─────────────────── */}
        <ellipse cx="150" cy="183" rx="94" ry="116"
          fill="none"
          stroke="#f0a500"
          strokeWidth="1"
          opacity="0.08"
        />
      </svg>

      {/* ── Status tag ──────────────────────────────────── */}
      <div className="aa-status">
        <span className="aa-status-dot" />
        Available for creative work
      </div>

      {/* ── Hover hint ──────────────────────────────────── */}
      <p className={`aa-hint ${happy ? "aa-hint-hide" : ""}`}>
        Hover to say hi ✦
      </p>
    </div>
  );
};

export default ArtistAvatar;
