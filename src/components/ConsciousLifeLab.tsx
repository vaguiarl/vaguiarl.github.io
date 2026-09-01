import { useEffect, useRef, useState } from "react";
import initConsciousLife, { ConsciousLife } from "../wasm/conscious-life/conscious_life";

type ViewMode = "ecology" | "strategy" | "inner";

type LabMetrics = {
  generation: number;
  lifetime: number;
  epoch: number;
  seed: number;
  prey: number;
  predators: number;
  empty: number;
  preyCooperation: number;
  predatorCooperation: number;
  meanQ: number;
  maxQ: number;
  innerLife: number;
  differentiated: number;
  activity: number;
  preyBirths: number;
  captures: number;
  predatorDeaths: number;
  preyGood: number;
  preyEvil: number;
  predatorGood: number;
  predatorEvil: number;
  firstPreyGood: number | null;
  firstPreyEvil: number | null;
  firstPredatorGood: number | null;
  firstPredatorEvil: number | null;
  voiceCode: number;
  voiceText: string;
  voiceX: number;
  voiceY: number;
  voiceQ: number;
  voiceIsCooperator: boolean;
  voiceIsPredator: boolean;
};

const WORLD_WIDTH = 96;
const WORLD_HEIGHT = 54;
const INITIAL_SEED = 7;
const PREY_PALETTE = [
  "#795725",
  "#99702d",
  "#b98a36",
  "#cfa34b",
  "#dfb963",
  "#eccb82",
  "#f4dca4",
  "#fae9c3",
  "#fff3da",
];
const PREDATOR_PALETTE = [
  "#753321",
  "#8b3c27",
  "#a3482e",
  "#bb5738",
  "#ce6c4a",
  "#dc8666",
  "#eaa188",
  "#f3bfaa",
  "#f9dbce",
];

const emptyMetrics: LabMetrics = {
  generation: 0,
  lifetime: 0,
  epoch: 1,
  seed: INITIAL_SEED,
  prey: 0,
  predators: 0,
  empty: WORLD_WIDTH * WORLD_HEIGHT,
  preyCooperation: 0,
  predatorCooperation: 0,
  meanQ: 0,
  maxQ: 0,
  innerLife: 0,
  differentiated: 0,
  activity: 0,
  preyBirths: 0,
  captures: 0,
  predatorDeaths: 0,
  preyGood: 0,
  preyEvil: 0,
  predatorGood: 0,
  predatorEvil: 0,
  firstPreyGood: null,
  firstPreyEvil: null,
  firstPredatorGood: null,
  firstPredatorEvil: null,
  voiceCode: 0,
  voiceText: "The first social encounter has not happened yet.",
  voiceX: -1,
  voiceY: -1,
  voiceQ: -1,
  voiceIsCooperator: false,
  voiceIsPredator: false,
};

function optionalGeneration(value: number) {
  return value < 0 ? null : value;
}

function readMetrics(
  world: ConsciousLife,
  lifetimeBeforeEpoch: number,
  epoch: number,
): LabMetrics {
  const generation = world.generation();
  return {
    generation,
    lifetime: lifetimeBeforeEpoch + generation,
    epoch,
    seed: world.seed(),
    prey: world.prey(),
    predators: world.predators(),
    empty: world.empty(),
    preyCooperation: world.prey_cooperator_share(),
    predatorCooperation: world.predator_cooperator_share(),
    meanQ: world.mean_q(),
    maxQ: world.max_q(),
    innerLife: world.inner_life_share(),
    differentiated: world.differentiated_share(),
    activity: world.activity_share(),
    preyBirths: world.prey_births(),
    captures: world.captures(),
    predatorDeaths: world.predator_deaths(),
    preyGood: world.prey_good_reports(),
    preyEvil: world.prey_evil_reports(),
    predatorGood: world.predator_good_reports(),
    predatorEvil: world.predator_evil_reports(),
    firstPreyGood: optionalGeneration(world.first_prey_good_generation()),
    firstPreyEvil: optionalGeneration(world.first_prey_evil_generation()),
    firstPredatorGood: optionalGeneration(world.first_predator_good_generation()),
    firstPredatorEvil: optionalGeneration(world.first_predator_evil_generation()),
    voiceCode: world.voice_code(),
    voiceText: world.voice_text() || "The world is waiting for a report.",
    voiceX: world.voice_x(),
    voiceY: world.voice_y(),
    voiceQ: world.voice_q(),
    voiceIsCooperator: world.voice_is_cooperator(),
    voiceIsPredator: world.voice_is_predator(),
  };
}

function emergenceLabel(metrics: LabMetrics) {
  const preyHasBoth = metrics.firstPreyGood !== null && metrics.firstPreyEvil !== null;
  const predatorsHaveBoth =
    metrics.firstPredatorGood !== null && metrics.firstPredatorEvil !== null;
  if (preyHasBoth && predatorsHaveBoth) {
    return "Both societies now distinguish help from exploitation.";
  }
  if (preyHasBoth) {
    return "Prey society distinguishes help from exploitation; predators are still learning.";
  }
  if (predatorsHaveBoth) {
    return "Predator society distinguishes help from exploitation; prey are still learning.";
  }
  if (metrics.innerLife > 0) {
    return "A non-null inner vocabulary is present. Moral distinctions are still emerging.";
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

function drawPredator(
  context: CanvasRenderingContext2D,
  radius: number,
  fill: boolean,
) {
  context.beginPath();
  context.moveTo(0, -radius * 1.08);
  context.lineTo(radius * 0.98, 0);
  context.lineTo(0, radius * 1.08);
  context.lineTo(-radius * 0.98, 0);
  context.closePath();
  if (fill) context.fill();
  context.stroke();
}

function drawPrey(
  context: CanvasRenderingContext2D,
  radius: number,
  fill: boolean,
) {
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  if (fill) context.fill();
  context.stroke();
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
  const events = world.events();
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
  context.strokeStyle = "rgba(247, 224, 184, 0.04)";
  context.lineWidth = 1;
  context.stroke();

  for (let index = 0; index < cells.length; index += 1) {
    const packed = cells[index];
    const event = events[index] ?? 0;
    const occupied = (packed & 0b1000_0000) !== 0;
    const x = index % width;
    const y = Math.floor(index / width);
    const centerX = (x + 0.5) * cellWidth;
    const centerY = (y + 0.5) * cellHeight;

    if (!occupied) {
      if (event === 3 && cellSize >= 3) {
        const spark = Math.max(0.8, cellSize * 0.22);
        context.beginPath();
        context.moveTo(centerX - spark, centerY - spark);
        context.lineTo(centerX + spark, centerY + spark);
        context.moveTo(centerX + spark, centerY - spark);
        context.lineTo(centerX - spark, centerY + spark);
        context.strokeStyle = "rgba(224, 132, 91, 0.42)";
        context.lineWidth = Math.max(0.6, cellSize * 0.045);
        context.stroke();
      }
      continue;
    }

    const isDefector = (packed & 0b0100_0000) !== 0;
    const isPredator = (packed & 0b0010_0000) !== 0;
    const q = packed & 0b0000_1111;
    const palette =
      viewMode === "strategy"
        ? isDefector
          ? PREDATOR_PALETTE
          : PREY_PALETTE
        : isPredator
          ? PREDATOR_PALETTE
          : PREY_PALETTE;
    const colorIndex =
      viewMode === "inner"
        ? Math.min(q, palette.length - 1)
        : Math.min(3 + Math.floor(q / 3), palette.length - 1);
    const radius = Math.max(
      0.8,
      cellSize * (viewMode === "inner" ? 0.31 + Math.min(q, 8) * 0.013 : 0.34),
    );

    if (event === 1 || event === 2) {
      context.beginPath();
      context.arc(centerX, centerY, radius + cellSize * 0.22, 0, Math.PI * 2);
      context.strokeStyle =
        event === 1 ? "rgba(244, 211, 133, 0.48)" : "rgba(225, 121, 83, 0.56)";
      context.lineWidth = Math.max(0.7, cellSize * 0.06);
      context.stroke();
    }

    context.save();
    context.translate(centerX, centerY);
    context.globalAlpha =
      viewMode === "inner" ? 0.48 + Math.min(q, 8) * 0.062 : isDefector ? 0.78 : 0.94;
    context.fillStyle = palette[colorIndex];
    context.strokeStyle = palette[Math.min(colorIndex + 2, palette.length - 1)];
    context.lineWidth = Math.max(isDefector ? 0.85 : 0.45, cellSize * 0.055);
    const fill = !isDefector;
    if (isPredator) {
      drawPredator(context, radius, fill);
    } else {
      drawPrey(context, radius, fill);
    }
    if (isDefector && cellSize >= 5) {
      context.beginPath();
      context.moveTo(-radius * 0.55, radius * 0.55);
      context.lineTo(radius * 0.55, -radius * 0.55);
      context.stroke();
    }
    context.restore();

    if (q > 0 && cellSize >= 4) {
      context.beginPath();
      context.arc(centerX, centerY, radius + Math.max(0.75, cellSize * 0.1), 0, Math.PI * 2);
      context.strokeStyle = `rgba(255, 239, 205, ${0.16 + Math.min(q, 8) * 0.05})`;
      context.lineWidth = Math.max(0.65, cellSize * 0.04);
      context.stroke();
    }
  }
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function nextEpochSeed(seed: number, epoch: number) {
  let value = (seed + Math.imul(epoch + 1, 0x9e3779b9)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x21f0aaad) >>> 0;
  value ^= value >>> 15;
  return value || 1;
}

export default function ConsciousLifeLab() {
  const reduceMotionAtMount =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<ConsciousLife | null>(null);
  const reducedMotionRef = useRef(reduceMotionAtMount);
  const runningRef = useRef(!reduceMotionAtMount);
  const speedRef = useRef(3);
  const viewModeRef = useRef<ViewMode>("ecology");
  const inViewRef = useRef(false);
  const epochRef = useRef(1);
  const lifetimeBeforeEpochRef = useRef(0);
  const lowActivityGenerationsRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(!reduceMotionAtMount);
  const [speed, setSpeed] = useState(3);
  const [viewMode, setViewMode] = useState<ViewMode>("ecology");
  const [metrics, setMetrics] = useState<LabMetrics>(emptyMetrics);
  const [renewalNotice, setRenewalNotice] = useState("");
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
        setMetrics(readMetrics(world, 0, 1));
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
    const redraw = () => {
      resizeCanvas(canvas);
      const world = worldRef.current;
      if (world) drawWorld(canvas, world, viewModeRef.current);
    };
    redraw();
    const resizeObserver = new ResizeObserver(redraw);
    resizeObserver.observe(canvas);
    window.addEventListener("resize", redraw);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", redraw);
    };
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

    const renewEpoch = (world: ConsciousLife, reason: string) => {
      lifetimeBeforeEpochRef.current += world.generation();
      epochRef.current += 1;
      const seed = nextEpochSeed(world.seed(), epochRef.current);
      world.restart(seed);
      lowActivityGenerationsRef.current = 0;
      setRenewalNotice(`Epoch ${epochRef.current} began: ${reason}.`);
    };

    const animate = (time: number) => {
      const world = worldRef.current;
      if (!world) return;
      const elapsed = Math.min(time - previousTime, 1000);
      previousTime = time;
      let advanced = false;

      if (runningRef.current) {
        accumulator += (elapsed * speedRef.current) / 1000;
        const steps = Math.min(Math.floor(accumulator), 8);
        if (steps > 0) {
          world.step_many(steps);
          accumulator -= steps;
          advanced = true;
          lowActivityGenerationsRef.current =
            world.activity_share() < 0.005
              ? lowActivityGenerationsRef.current + steps
              : 0;
          if (world.prey() === 0 || world.predators() === 0) {
            renewEpoch(world, "one species disappeared");
          } else if (lowActivityGenerationsRef.current >= 180) {
            renewEpoch(world, "the ecology settled below the activity floor");
          }
        }
      }

      if (inViewRef.current && (advanced || time - lastDraw > 300)) {
        drawWorld(canvas, world, viewModeRef.current);
        lastDraw = time;
      }
      if (advanced && time - lastMetricsUpdate > 180) {
        setMetrics(
          readMetrics(world, lifetimeBeforeEpochRef.current, epochRef.current),
        );
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

  function resetContinuity() {
    epochRef.current = 1;
    lifetimeBeforeEpochRef.current = 0;
    lowActivityGenerationsRef.current = 0;
    setRenewalNotice("");
  }

  function stepOnce() {
    const world = worldRef.current;
    const canvas = canvasRef.current;
    if (!world || !canvas) return;
    setPlayback(false);
    world.step_many(1);
    setMetrics(readMetrics(world, lifetimeBeforeEpochRef.current, epochRef.current));
    drawWorld(canvas, world, viewModeRef.current);
  }

  function restart(seed: number) {
    const world = worldRef.current;
    const canvas = canvasRef.current;
    if (!world || !canvas) return;
    resetContinuity();
    world.restart(seed >>> 0);
    setMetrics(readMetrics(world, 0, 1));
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
    if (world && canvas) drawWorld(canvas, world, next);
  }

  const emergence = emergenceLabel(metrics);
  const voiceKind = metrics.voiceCode > 0 ? "Good" : metrics.voiceCode < 0 ? "Evil" : "Listening";
  const voiceSpecies = metrics.voiceIsPredator ? "predator" : "prey";

  return (
    <section ref={sectionRef} id="conscious-life" className="section conscious-life-section" aria-labelledby="conscious-life-title">
      <div className="inca-divider" aria-hidden="true"><i /><span /><i /></div>
      <div className="lab-orbit" aria-hidden="true" />
      <div className="page-shell">
        <div className="section-intro light-intro">
          <p className="section-number">03</p>
          <div>
            <p className="eyebrow"><span /> Computational experiment · World I</p>
            <h2 id="conscious-life-title">Can social life grow<br /><em>a point of view?</em></h2>
          </div>
          <p className="section-summary">
            Prey and predators move in ecological waves. Within each society, cooperation, defection, and a graded inner vocabulary evolve under social incentives.
          </p>
        </div>

        <div className="lab-stage">
          <div className="lab-world-frame">
            <div className="lab-world-head">
              <div>
                <span className="lab-live-dot" aria-hidden="true" />
                {running ? "Autonomous ecology running" : "Ecology paused"}
              </div>
              <span>Epoch {metrics.epoch} · seed {metrics.seed} · 96 × 54 torus</span>
            </div>
            <div className="lab-canvas-wrap">
              {!ready && !error && <p className="lab-loading" role="status">Waking the world…</p>}
              {error && <p className="lab-error" role="alert">{error}</p>}
              <canvas
                ref={canvasRef}
                className="lab-canvas"
                role="img"
                aria-describedby="lab-canvas-description"
                aria-label="An animated predator and prey ecology with cooperation, defection, and graded inner mappings in both species"
              />
            </div>
            <p id="lab-canvas-description" className="sr-only">
              Round gold cells are prey and angular clay cells are predators. Filled cells cooperate within their species; hollow notched cells defect. Brighter rings represent a higher q. Birth, capture, and death events animate continuously. All statistics are repeated as text beside the canvas.
            </p>
            <div className="lab-legend" aria-label="Simulation legend">
              <span><i className="legend-cell legend-prey" aria-hidden="true" /> Prey</span>
              <span><i className="legend-cell legend-predator" aria-hidden="true" /> Predator</span>
              <span><i className="legend-cell legend-cooperator" aria-hidden="true" /> Cooperation · filled</span>
              <span><i className="legend-cell legend-defector" aria-hidden="true" /> Defection · hollow</span>
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
                {[1, 3, 8].map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={speed === value ? "active" : ""}
                    aria-pressed={speed === value}
                    onClick={() => changeSpeed(value)}
                  >
                    {value === 1 ? "Study" : value === 3 ? "Flow" : "Fast"}
                  </button>
                ))}
              </fieldset>
              <fieldset>
                <legend>View</legend>
                <button type="button" className={viewMode === "ecology" ? "active" : ""} aria-pressed={viewMode === "ecology"} onClick={() => changeView("ecology")}>Ecology</button>
                <button type="button" className={viewMode === "strategy" ? "active" : ""} aria-pressed={viewMode === "strategy"} onClick={() => changeView("strategy")}>Strategy</button>
                <button type="button" className={viewMode === "inner" ? "active" : ""} aria-pressed={viewMode === "inner"} onClick={() => changeView("inner")}>Inner q</button>
              </fieldset>
            </div>

            <div className="lab-metrics" aria-label="Live model metrics">
              <article><span>Lifetime generation</span><strong>{metrics.lifetime.toLocaleString()}</strong><small>epoch {metrics.epoch} · local {metrics.generation}</small></article>
              <article><span>Activity</span><strong>{percent(metrics.activity)}</strong><small>sites changing now</small></article>
              <article><span>Prey</span><strong>{metrics.prey.toLocaleString()}</strong><small>{percent(metrics.preyCooperation)} cooperate</small></article>
              <article><span>Predators</span><strong>{metrics.predators.toLocaleString()}</strong><small>{percent(metrics.predatorCooperation)} cooperate</small></article>
              <article className="metric-inner-life">
                <span>Functional mapping · q &gt; 0</span>
                <strong>{percent(metrics.innerLife)}</strong>
                <small>share of living agents</small>
              </article>
              <article>
                <span>Moral distinction · q ≥ 2</span>
                <strong>{percent(metrics.differentiated)}</strong>
                <small>share of living agents · peak {metrics.maxQ}</small>
              </article>
              <article><span>Births / captures</span><strong>{metrics.preyBirths} / {metrics.captures}</strong><small>latest transition</small></article>
              <article><span>Predator deaths</span><strong>{metrics.predatorDeaths}</strong><small>{metrics.empty.toLocaleString()} empty sites</small></article>
            </div>

            <div className="lab-emergence">
              <p>Emergence monitor</p>
              <strong aria-live="polite">
                {renewalNotice && metrics.generation < 18 ? renewalNotice : emergence}
              </strong>
              <div>
                <span className="emergence-prey">Prey G {metrics.preyGood} · E {metrics.preyEvil}</span>
                <span className="emergence-predator">Predator G {metrics.predatorGood} · E {metrics.predatorEvil}</span>
              </div>
            </div>

            <blockquote className={`lab-voice ${metrics.voiceCode > 0 ? "voice-good" : metrics.voiceCode < 0 ? "voice-evil" : ""}`}>
              <p>{voiceKind} · latest {voiceSpecies} encounter</p>
              <q>{metrics.voiceText}</q>
              {metrics.voiceX >= 0 && (
                <footer>
                  Generation {metrics.generation} · {voiceSpecies} {metrics.voiceX},{metrics.voiceY} · {metrics.voiceIsCooperator ? "cooperator" : "defector"} · q = {metrics.voiceQ}
                </footer>
              )}
            </blockquote>
          </aside>
        </div>

        <div className="lab-explainer">
          <article><span>Ecology</span><strong>Birth · capture · death</strong><p>Local contact creates moving fronts. Prey reproduce, predators capture prey, and predators face mortality.</p></article>
          <article><span>Social selection</span><strong>Two societies</strong><p>Prey share warnings. Predators coordinate packs. Cooperation and defection evolve only within each species.</p></article>
          <article><span>q ≥ 2</span><strong>Moral distinction</strong><p>Helping and exploitation can occupy different internal states. Predation itself is ecological, not Evil.</p></article>
          <p className="lab-caveat">
            Functional mapping and moral distinction are model-defined population shares, not probabilities of phenomenal sentience. Good and Evil are operational, role-relative reports about treatment within a species. If either species disappears or activity remains below 0.5% for 180 generations, the experiment transparently begins a new deterministic epoch.
          </p>
        </div>

        <div className="lab-links">
          <a href="/moral-life/">Enter Moral Life · World II <span aria-hidden="true">↗</span></a>
          <a href="/conscious-life/">Open this experiment <span aria-hidden="true">↗</span></a>
          <a href="https://www.linkedin.com/pulse/can-ai-reveal-inner-life-victor-aguiar-ph-d--0fn2c/" target="_blank" rel="noreferrer">Read the public essay <span aria-hidden="true">↗</span></a>
          <a href="https://github.com/vaguiarl/vaguiarl.github.io/tree/main/experiments/conscious-life" target="_blank" rel="noreferrer">Inspect the Rust model <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>
  );
}
