/**
 * GitHubGraph.tsx
 *
 * Live GitHub contribution heatmap rendered as an SVG-based grid.
 * Fetches the last 52 weeks from the public GitHub contributions API.
 * Falls back to a beautiful static placeholder on CORS / rate-limit errors.
 *
 * Colour: purple palette matching the site accent (#c2a4ff)
 */

import { useEffect, useRef, useState } from "react";
import { config } from "../config";
import "./styles/GitHubGraph.css";

interface Week { days: number[] }

const LEVELS = [
  "rgba(194,164,255,0.06)",
  "rgba(194,164,255,0.22)",
  "rgba(194,164,255,0.45)",
  "rgba(194,164,255,0.72)",
  "rgba(194,164,255,1.00)",
];

const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function levelOf(count: number) {
  if (count === 0) return 0;
  if (count <= 2)  return 1;
  if (count <= 6)  return 2;
  if (count <= 12) return 3;
  return 4;
}

/** Generate random-looking but deterministic placeholder data */
function fakeSeed(week: number, day: number) {
  const v = Math.sin(week * 127 + day * 311) * 43758.5453;
  const r = v - Math.floor(v);
  if (r < 0.35) return 0;
  if (r < 0.55) return Math.floor(r * 6) + 1;
  if (r < 0.75) return Math.floor(r * 10) + 3;
  if (r < 0.90) return Math.floor(r * 15) + 5;
  return Math.floor(r * 20) + 8;
}

function makeFallback(weeks = 52): Week[] {
  return Array.from({ length: weeks }, (_, w) => ({
    days: Array.from({ length: 7 }, (_, d) => fakeSeed(w, d)),
  }));
}

async function fetchContributions(username: string): Promise<Week[]> {
  // GitHub's /contributions page returns SVG — we scrape its rects.
  const url = `https://github.com/users/${username}/contributions`;
  const html = await fetch(url, { cache: "force-cache" }).then(r => r.text());
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const rects = Array.from(doc.querySelectorAll("td[data-date]"));

  if (rects.length === 0) throw new Error("No data");

  const weeks: Week[] = [];
  let week: number[] = [];

  rects.forEach(td => {
    const count = parseInt((td as HTMLElement).dataset.level || "0");
    const raw   = parseInt((td as HTMLElement).getAttribute("data-count") || "0");
    void count;
    week.push(raw);
    if (week.length === 7) { weeks.push({ days: week }); week = []; }
  });
  if (week.length > 0) weeks.push({ days: week });

  return weeks.slice(-52);
}

export default function GitHubGraph() {
  const [weeks, setWeeks] = useState<Week[]>(() => makeFallback(52));
  const [total, setTotal] = useState(0);
  const [live,  setLive]  = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const username = config.social.github || "zainkhalid10";
    fetchContributions(username)
      .then(w => {
        setWeeks(w);
        setTotal(w.reduce((s, wk) => s + wk.days.reduce((a, b) => a + b, 0), 0));
        setLive(true);
      })
      .catch(() => {
        // Use placeholder — still looks great
        const fake = makeFallback(52);
        setWeeks(fake);
        setTotal(fake.reduce((s, wk) => s + wk.days.reduce((a, b) => a + b, 0), 0));
      });
  }, []);

  // Scroll to latest week on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [weeks]);

  const cellSize  = 13;
  const cellGap   = 3;
  const stride    = cellSize + cellGap;
  const weekCount = weeks.length;
  const svgW      = weekCount * stride;
  const svgH      = 7 * stride;

  return (
    <div className="gh-root">
      <div className="gh-header">
        <span className="gh-title">
          {live ? `${total.toLocaleString()} contributions this year` : "Contribution Activity"}
        </span>
        <a
          href={`https://github.com/${config.social.github}`}
          target="_blank"
          rel="noreferrer"
          className="gh-link"
        >
          View on GitHub →
        </a>
      </div>

      <div className="gh-scroll" ref={containerRef}>
        {/* Month labels */}
        <div className="gh-months" style={{ width: svgW }}>
          {weeks.map((_, wi) => {
            // Show month label at approximate week boundaries
            const date = new Date();
            date.setDate(date.getDate() - (weekCount - wi) * 7);
            const day = date.getDate();
            if (day <= 7) {
              return (
                <span
                  key={wi}
                  className="gh-month-label"
                  style={{ left: wi * stride }}
                >
                  {MONTHS[date.getMonth()]}
                </span>
              );
            }
            return null;
          })}
        </div>

        <div className="gh-grid-row">
          {/* Day labels */}
          <div className="gh-days">
            {DAYS.map((d, i) => (
              <span key={i} className="gh-day-label">{d}</span>
            ))}
          </div>

          {/* SVG grid */}
          <svg
            width={svgW}
            height={svgH}
            className="gh-svg"
          >
            {weeks.map((week, wi) =>
              week.days.map((count, di) => {
                const lv = levelOf(count);
                const x  = wi * stride;
                const y  = di * stride;
                const date = new Date();
                date.setDate(date.getDate() - (weekCount - wi) * 7 + di);
                const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

                return (
                  <rect
                    key={`${wi}-${di}`}
                    x={x} y={y}
                    width={cellSize} height={cellSize}
                    rx={3} ry={3}
                    fill={LEVELS[lv]}
                    className="gh-cell"
                    onMouseEnter={e => {
                      const r = (e.target as SVGRectElement).getBoundingClientRect();
                      setTooltip({
                        text: `${count} contribution${count !== 1 ? "s" : ""} on ${dateStr}`,
                        x: r.left + r.width / 2,
                        y: r.top - 8,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })
            )}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="gh-legend">
        <span className="gh-legend-label">Less</span>
        {LEVELS.map((col, i) => (
          <span key={i} className="gh-legend-cell" style={{ background: col }} />
        ))}
        <span className="gh-legend-label">More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="gh-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
