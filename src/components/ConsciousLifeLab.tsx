import { useEffect, useRef, useState } from "react";
import initConsciousLife, { ConsciousLife } from "../wasm/conscious-life/conscious_life";

type ViewMode = "strategy" | "inner";

type LabMetrics = {
  generation: number;
  seed: number;
  alive: number;
  cooperation: number;
  meanQ: number;
  maxQ: number;
  innerLife: number;
  differentiated: number;
  good: number;
  evil: number;
  firstGood: number | null;
  firstEvil: number | null;
  voiceCode: number;
  voiceText: string;
  voiceX: number;
  voiceY: number;
  voiceQ: number;
  voiceIsCooperator: boolean;
};

const WORLD_WIDTH = 96;
const WORLD_HEIGHT = 54;
const INITIAL_SEED = 7;
const COOPERATOR_PALETTE = [
  "#715327",
  "#96702f",
  "#b98a36",
  "#cfa34b",
  "#dfb963",
  "#eccb82",
  "#f4dca4",
  "#fae9c3",
  "#fff3da",
];
const DEFECTOR_PALETTE = [
  "#65301f",
  "#7e3a27",
  "#98452d",
  "#b55437",
  "#c96747",
  "#db8263",
  "#e99f83",
  "#f3bea8",
  "#fadacc",
];

const emptyMetrics: LabMetrics = {
  generation: 0,
  seed: INITIAL_SEED,
  alive: 0,
  cooperation: 0,
  meanQ: 0,
  maxQ: 0,
  innerLife: 0,
  differentiated: 0,
  good: 0,
  evil: 0,
  firstGood: null,
  firstEvil: null,
  voiceCode: 0,
  voiceText: "The first social encounter has not happened yet.",
  voiceX: -1,
  voiceY: -1,
  voiceQ: -1,
  voiceIsCooperator: false,
};

function readMetrics(world: ConsciousLife): LabMetrics {
  const firstGood = world.first_good_generation();
  const firstEvil = world.first_evil_generation();
  return {
    generation: world.generation(),
    seed: world.seed(),
    alive: world.alive(),
    cooperation: world.cooperator_share(),
    meanQ: world.mean_q(),
    maxQ: world.max_q(),
    innerLife: world.inner_life_share(),
    differentiated: world.differentiated_share(),
    good: world.good_reports(),
    evil: world.evil_reports(),
    firstGood: firstGood < 0 ? null : firstGood,
    firstEvil: firstEvil < 0 ? null : firstEvil,
    voiceCode: world.voice_code(),
    voiceText: world.voice_text() || "The world is waiting for a report.",
    voiceX: world.voice_x(),
    voiceY: world.voice_y(),
    voiceQ: world.voice_q(),
    voiceIsCooperator: world.voice_is_cooperator(),
  };
}

function emergenceLabel(metrics: LabMetrics) {
  if (metrics.firstGood !== null && metrics.firstEvil !== null) {
    return `Operational good and evil have both emerged by generation ${Math.max(metrics.firstGood, metrics.firstEvil)}.`;
  }
  if (metrics.firstGood !== null) {
    return `The first operational Good report appeared at generation ${metrics.firstGood}. Evil has not yet been distinguished.`;
  }
  if (metrics.firstEvil !== null) {
    return `The first operational Evil report appeared at generation ${metrics.firstEvil}. Good has not yet been distinguished.`;
  }
  if (metrics.innerLife > 0) {
    return "A non-null inner vocabulary is present. Moral valence has not yet emerged.";
  }
  return "The world is silent: every living cell is still at q = 0.";
}

function resizeCanvas(canvas: HTMLCanvasElement) {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(bounds.width * pixelRatio));
  const height = Math.max(1, Math.round(bounds.height * pixelRatio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function drawWorld(
  canvas: HTMLCanvasElement,
  world: ConsciousLife,
  viewMode: ViewMode,
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const width = world.width();
  const height = world.height();
  const cells = world.cells();
  const cellWidth = canvas.width / width;
  const cellHeight = canvas.height / height;
  const cellSize = Math.min(cellWidth, cellHeight);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#180e0c";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const gridEvery = cellSize >= 6 ? 1 : 4;
  context.beginPath();
  for (let x = 0; x <= width; x += gridEvery) {
    const position = Math.round(x * cellWidth) + 0.5;
    context.moveTo(position, 0);
    context.lineTo(position, canvas.height);
  }
  for (let y = 0; y <= height; y += gridEvery) {
    const position = Math.round(y * cellHeight) + 0.5;
    context.moveTo(0, position);
    context.lineTo(canvas.width, position);
  }
  context.strokeStyle = "rgba(247, 224, 184, 0.045)";
  context.lineWidth = 1;
  context.stroke();

  for (let index = 0; index < cells.length; index += 1) {
    const packed = cells[index];
    if ((packed & 0b1000_0000) === 0) continue;
    const isDefector = (packed & 0b0100_0000) !== 0;
    const q = packed & 0b0000_1111;
    const x = index % width;
    const y = Math.floor(index / width);
    const centerX = (x + 0.5) * cellWidth;
    const centerY = (y + 0.5) * cellHeight;
    const radius = Math.max(0.8, cellSize * (viewMode === "inner" ? 0.34 + Math.min(q, 8) * 0.012 : 0.34));
    const palette = isDefector ? DEFECTOR_PALETTE : COOPERATOR_PALETTE;
    const colorIndex = viewMode === "inner" ? Math.min(q, palette.length - 1) : Math.min(2 + Math.floor(q / 2), palette.length - 1);

    context.save();
    context.translate(centerX, centerY);
    context.globalAlpha = viewMode === "inner" ? 0.5 + Math.min(q, 8) * 0.06 : 0.88;
    context.fillStyle = palette[colorIndex];
    if (isDefector) {
      context.rotate(Math.PI / 4);
      context.fillRect(-radius * 0.72, -radius * 0.72, radius * 1.44, radius * 1.44);
    } else {
      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();

    if (q > 0 && cellSize >= 4) {
      context.beginPath();
      context.arc(centerX, centerY, radius + Math.max(0.7, cellSize * 0.09), 0, Math.PI * 2);
      context.strokeStyle = `rgba(255, 239, 205, ${0.2 + Math.min(q, 8) * 0.055})`;
      context.lineWidth = Math.max(0.7, cellSize * 0.045);
      context.stroke();
    }
  }

}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default function ConsciousLifeLab() {
  const reduceMotionAtMount =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<ConsciousLife | null>(null);
  const reducedMotionRef = useRef(reduceMotionAtMount);
  const runningRef = useRef(!reduceMotionAtMount);
  const speedRef = useRef(12);
  const viewModeRef = useRef<ViewMode>("inner");
  const inViewRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(!reduceMotionAtMount);
  const [speed, setSpeed] = useState(12);
  const [viewMode, setViewMode] = useState<ViewMode>("inner");
  const [metrics, setMetrics] = useState<LabMetrics>(emptyMetrics);
  const [error, setError] = useState("");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
      if (event.matches) {
        runningRef.current = false;
        setRunning(false);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function wakeWorld() {
      try {
        await initConsciousLife();
        if (cancelled) return;
        const world = new ConsciousLife(WORLD_WIDTH, WORLD_HEIGHT, INITIAL_SEED);
        worldRef.current = world;
        setMetrics(readMetrics(world));
        setReady(true);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "The living model could not start.");
        }
      }
    }
    void wakeWorld();
    return () => {
      cancelled = true;
      worldRef.current?.free();
      worldRef.current = null;
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
      },
      { rootMargin: "180px 0px", threshold: 0.01 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      resizeCanvas(canvas);
      const world = worldRef.current;
      if (world) drawWorld(canvas, world, viewModeRef.current);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    let previousTime = performance.now();
    let accumulator = 0;
    let lastMetricsUpdate = 0;
    let lastDraw = 0;

    const animate = (time: number) => {
      const world = worldRef.current;
      if (!world) return;
      const elapsed = Math.min(time - previousTime, 1000);
      previousTime = time;
      let advanced = false;

      if (runningRef.current) {
        accumulator += (elapsed * speedRef.current) / 1000;
        const steps = Math.min(Math.floor(accumulator), 12);
        if (steps > 0) {
          world.step_many(steps);
          accumulator -= steps;
          advanced = true;
          if (world.alive() === 0) {
            world.restart((world.seed() + 1) >>> 0);
          }
        }
      }

      if (inViewRef.current && (advanced || time - lastDraw > 300)) {
        drawWorld(canvas, world, viewModeRef.current);
        lastDraw = time;
      }
      if (advanced && time - lastMetricsUpdate > 180) {
        setMetrics(readMetrics(world));
        lastMetricsUpdate = time;
      }
      frame = window.requestAnimationFrame(animate);
    };

    resizeCanvas(canvas);
    drawWorld(canvas, worldRef.current!, viewModeRef.current);
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [ready]);

  function setPlayback(next: boolean) {
    runningRef.current = next;
    setRunning(next);
  }

  function stepOnce() {
    const world = worldRef.current;
    const canvas = canvasRef.current;
    if (!world || !canvas) return;
    setPlayback(false);
    world.step_many(1);
    setMetrics(readMetrics(world));
    drawWorld(canvas, world, viewModeRef.current);
  }

  function restart(seed: number) {
    const world = worldRef.current;
    const canvas = canvasRef.current;
    if (!world || !canvas) return;
    world.restart(seed >>> 0);
    setMetrics(readMetrics(world));
    drawWorld(canvas, world, viewModeRef.current);
  }

  function newWorld() {
    const random = new Uint32Array(1);
    window.crypto.getRandomValues(random);
    restart(random[0] || 1);
  }

  function changeSpeed(next: number) {
    speedRef.current = next;
    setSpeed(next);
  }

  function changeView(next: ViewMode) {
    viewModeRef.current = next;
    setViewMode(next);
    const world = worldRef.current;
    const canvas = canvasRef.current;
    if (world && canvas) {
      drawWorld(canvas, world, next);
    }
  }

  const emergence = emergenceLabel(metrics);
  const voiceKind = metrics.voiceCode > 0 ? "Good" : metrics.voiceCode < 0 ? "Evil" : "Listening";

  return (
    <section ref={sectionRef} id="conscious-life" className="section conscious-life-section" aria-labelledby="conscious-life-title">
      <div className="inca-divider" aria-hidden="true"><i /><span /><i /></div>
      <div className="lab-orbit" aria-hidden="true" />
      <div className="page-shell">
        <div className="section-intro light-intro">
          <p className="section-number">03</p>
          <div>
            <p className="eyebrow"><span /> Live laboratory · Conscious Life</p>
            <h2 id="conscious-life-title">Can cooperation grow<br /><em>a point of view?</em></h2>
          </div>
          <p className="section-summary">
            This world begins when you arrive and evolves on its own. Conway governs survival. Social incentives govern which traits newborn cells inherit.
          </p>
        </div>

        <div className="lab-stage">
          <div className="lab-world-frame">
            <div className="lab-world-head">
              <div>
                <span className="lab-live-dot" aria-hidden="true" />
                {running ? "Autonomous world live" : "World paused"}
              </div>
              <span>Seed {metrics.seed} · 96 × 54 torus</span>
            </div>
            <div className="lab-canvas-wrap">
              {!ready && !error && <p className="lab-loading" role="status">Waking the world…</p>}
              {error && <p className="lab-error" role="alert">{error}</p>}
              <canvas
                ref={canvasRef}
                className="lab-canvas"
                role="img"
                aria-describedby="lab-canvas-description"
                aria-label="An animated cellular world of cooperating and defecting prey, with brightness representing a graded inner vocabulary"
              />
            </div>
            <p id="lab-canvas-description" className="sr-only">
              Round gold cells cooperate. Diamond shaped clay cells defect. A brighter cell with a stronger ring has a higher q. All population statistics and the latest moral report are repeated as text beside the canvas.
            </p>
            <div className="lab-legend" aria-label="Simulation legend">
              <span><i className="legend-cell legend-cooperator" aria-hidden="true" /> Cooperator</span>
              <span><i className="legend-cell legend-defector" aria-hidden="true" /> Defector</span>
              <span><i className="legend-ring" aria-hidden="true" /> Richer q</span>
            </div>
          </div>

          <aside className="lab-console" aria-label="Conscious Life controls and metrics">
            <div className="lab-controls">
              <button className="lab-control-primary" type="button" disabled={!ready} onClick={() => setPlayback(!running)}>
                {running ? "Pause" : "Play"}
              </button>
              <button type="button" disabled={!ready} onClick={stepOnce}>Step</button>
              <button type="button" disabled={!ready} onClick={() => restart(metrics.seed)}>Restart</button>
              <button type="button" disabled={!ready} onClick={newWorld}>New world</button>
            </div>

            <div className="lab-switches">
              <fieldset>
                <legend>Speed</legend>
                {[4, 12, 30].map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={speed === value ? "active" : ""}
                    aria-pressed={speed === value}
                    onClick={() => changeSpeed(value)}
                  >
                    {value === 4 ? "Slow" : value === 12 ? "Flow" : "Fast"}
                  </button>
                ))}
              </fieldset>
              <fieldset>
                <legend>View</legend>
                <button type="button" className={viewMode === "inner" ? "active" : ""} aria-pressed={viewMode === "inner"} onClick={() => changeView("inner")}>Inner life</button>
                <button type="button" className={viewMode === "strategy" ? "active" : ""} aria-pressed={viewMode === "strategy"} onClick={() => changeView("strategy")}>Strategies</button>
              </fieldset>
            </div>

            <div className="lab-metrics" aria-label="Live model metrics">
              <article><span>Generation</span><strong>{metrics.generation.toLocaleString()}</strong></article>
              <article><span>Living cells</span><strong>{metrics.alive.toLocaleString()}</strong></article>
              <article><span>Cooperation</span><strong>{percent(metrics.cooperation)}</strong></article>
              <article><span>Mean q</span><strong>{metrics.meanQ.toFixed(2)}</strong><small>peak {metrics.maxQ}</small></article>
              <article className="metric-inner-life">
                <span>Inner life likelihood · model</span>
                <strong>{percent(metrics.innerLife)}</strong>
                <small>P(q &gt; 0 | alive)</small>
              </article>
              <article>
                <span>Good / evil capable</span>
                <strong>{percent(metrics.differentiated)}</strong>
                <small>P(q ≥ 2 | alive)</small>
              </article>
            </div>

            <div className="lab-emergence">
              <p>Emergence monitor</p>
              <strong>{emergence}</strong>
              <div>
                <span className="emergence-good">Good last encounter <b>{metrics.good}</b></span>
                <span className="emergence-evil">Evil last encounter <b>{metrics.evil}</b></span>
              </div>
            </div>

            <blockquote className={`lab-voice ${metrics.voiceCode > 0 ? "voice-good" : metrics.voiceCode < 0 ? "voice-evil" : ""}`}>
              <p>{voiceKind} · latest encounter</p>
              <q>{metrics.voiceText}</q>
              {metrics.voiceX >= 0 && (
                <footer>
                  Transition to generation {metrics.generation} · Cell {metrics.voiceX},{metrics.voiceY} · {metrics.voiceIsCooperator ? "cooperator" : "defector"} · q = {metrics.voiceQ}
                </footer>
              )}
            </blockquote>
          </aside>
        </div>

        <div className="lab-explainer">
          <article><span>q = 0</span><strong>Silence</strong><p>Every cognitive state maps to null.</p></article>
          <article><span>q = 1</span><strong>Salience</strong><p>Something mattered, without positive or negative valence.</p></article>
          <article><span>q ≥ 2</span><strong>Distinction</strong><p>Helping and exploitation can occupy different internal states.</p></article>
          <p className="lab-caveat">
            The inner life likelihood is the model&apos;s share of cells with a non-null subjective mapping. It is not a probability of phenomenal sentience. The experiment asks whether social selection can make richer internal distinctions useful. If a population goes extinct, a new seeded world begins automatically.
          </p>
        </div>

        <div className="lab-links">
          <a href="https://www.linkedin.com/pulse/can-ai-reveal-inner-life-victor-aguiar-ph-d--0fn2c/" target="_blank" rel="noreferrer">Read the public essay <span aria-hidden="true">↗</span></a>
          <a href="https://github.com/vaguiarl/vaguiarl.github.io/tree/main/experiments/conscious-life" target="_blank" rel="noreferrer">Inspect the Rust model <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>
  );
}
