import { useEffect, useMemo, useRef, useState } from "react";
import initMoralLife, { MoralLife } from "../wasm/moral-life/moral_life";

type ViewMode = "acts" | "norms" | "inner";
type EnvironmentCode = 0 | 1 | 2;

type MoralMetrics = {
  generation: number;
  lifetime: number;
  epoch: number;
  seed: number;
  environment: EnvironmentCode;
  alive: number;
  empty: number;
  cooperation: number;
  exploitation: number;
  exploitationEwma: number;
  refusal: number;
  exploiterShare: number;
  conditionalShare: number;
  enforcerShare: number;
  institutionShare: number;
  capacityShare: number;
  badReputationShare: number;
  meanQ: number;
  meanReputation: number;
  welfare: number;
  exploitAdvantage: number;
  sanctionCoverage: number;
  observationAccuracy: number;
  observations: number;
  trueSanctions: number;
  falseSanctions: number;
  forgiveness: number;
  matches: number;
  births: number;
  deaths: number;
  activity: number;
  peakExploitation: number;
  peakGeneration: number | null;
  firstExploitation: number | null;
  firstMoralResponse: number | null;
  firstSanction: number | null;
  firstRecovery: number | null;
};

type HistoryPoint = {
  lifetime: number;
  cooperation: number;
  exploitation: number;
  institutions: number;
  badReputation: number;
};

type TimelineMarker = {
  lifetime: number;
  label: string;
};

type MoralPhase = {
  key: "trust" | "evil" | "response" | "order" | "fear" | "collapse" | "contested";
  title: string;
  sentence: string;
};

const WORLD_WIDTH = 96;
const WORLD_HEIGHT = 54;
const INITIAL_SEED = 19;
const GOLD = "#ddb45c";
const GOLD_LIGHT = "#f2d692";
const CLAY = "#cf6a49";
const CLAY_LIGHT = "#efad91";
const IVORY = "#f7e7c7";
const PLUM = "#aa6a7c";
const OBSIDIAN = "#160c0a";

const environmentNames: Record<EnvironmentCode, string> = {
  0: "Anonymous",
  1: "Direct record",
  2: "Public reputation",
};

const environmentDescriptions: Record<EnvironmentCode, string> = {
  0: "No durable record. Every encounter begins as if nothing happened before.",
  1: "A record created in direct encounters travels with an agent. There is no third party observation or sanction.",
  2: "Reputation travels. Capable observers classify acts; enforcers may sanction what they perceive.",
};

const emptyMetrics: MoralMetrics = {
  generation: 0,
  lifetime: 0,
  epoch: 1,
  seed: INITIAL_SEED,
  environment: 2,
  alive: 0,
  empty: WORLD_WIDTH * WORLD_HEIGHT,
  cooperation: 0,
  exploitation: 0,
  exploitationEwma: 0,
  refusal: 0,
  exploiterShare: 0,
  conditionalShare: 0,
  enforcerShare: 0,
  institutionShare: 0,
  capacityShare: 0,
  badReputationShare: 0,
  meanQ: 0,
  meanReputation: 0,
  welfare: 0,
  exploitAdvantage: 0,
  sanctionCoverage: 0,
  observationAccuracy: 0,
  observations: 0,
  trueSanctions: 0,
  falseSanctions: 0,
  forgiveness: 0,
  matches: 0,
  births: 0,
  deaths: 0,
  activity: 0,
  peakExploitation: 0,
  peakGeneration: null,
  firstExploitation: null,
  firstMoralResponse: null,
  firstSanction: null,
  firstRecovery: null,
};

function optionalGeneration(value: number) {
  return value < 0 ? null : value;
}

function readMetrics(
  world: MoralLife,
  lifetimeBeforeEpoch: number,
  epoch: number,
): MoralMetrics {
  const generation = world.generation();
  return {
    generation,
    lifetime: lifetimeBeforeEpoch + generation,
    epoch,
    seed: world.seed(),
    environment: world.environment() as EnvironmentCode,
    alive: world.alive(),
    empty: world.empty(),
    cooperation: world.cooperation_rate(),
    exploitation: world.exploitation_rate(),
    exploitationEwma: world.exploitation_ewma(),
    refusal: world.refusal_rate(),
    exploiterShare: world.exploiter_share(),
    conditionalShare: world.conditional_share(),
    enforcerShare: world.enforcer_share(),
    institutionShare: world.institution_share(),
    capacityShare: world.capacity_share(),
    badReputationShare: world.bad_reputation_share(),
    meanQ: world.mean_q(),
    meanReputation: world.mean_reputation(),
    welfare: world.mean_welfare(),
    exploitAdvantage: world.net_exploit_advantage(),
    sanctionCoverage: world.sanction_coverage(),
    observationAccuracy: world.observation_accuracy(),
    observations: world.observations(),
    trueSanctions: world.true_sanctions(),
    falseSanctions: world.false_sanctions(),
    forgiveness: world.forgiveness_events(),
    matches: world.matches(),
    births: world.births(),
    deaths: world.deaths(),
    activity: world.activity_share(),
    peakExploitation: world.peak_exploitation(),
    peakGeneration: optionalGeneration(world.peak_generation()),
    firstExploitation: optionalGeneration(world.first_exploitation_generation()),
    firstMoralResponse: optionalGeneration(world.first_moral_response_generation()),
    firstSanction: optionalGeneration(world.first_sanction_generation()),
    firstRecovery: optionalGeneration(world.first_recovery_generation()),
  };
}

function percent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function signed(value: number) {
  if (!Number.isFinite(value)) return "0.00";
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}`;
}

function milestone(value: number | null) {
  return value === null ? "—" : `g ${value.toLocaleString()}`;
}

function nextEpochSeed(seed: number, epoch: number) {
  let value = (seed + Math.imul(epoch + 1, 0x9e3779b9)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x21f0aaad) >>> 0;
  value ^= value >>> 15;
  return value || 1;
}

function moralPhase(metrics: MoralMetrics): MoralPhase {
  const sanctions = metrics.trueSanctions + metrics.falseSanctions;
  if (metrics.alive < 80) {
    return {
      key: "collapse",
      title: "Society is collapsing",
      sentence: "Social rules no longer matter if ecological turnover leaves almost nobody to meet.",
    };
  }
  if (sanctions >= 4 && metrics.falseSanctions > metrics.trueSanctions) {
    return {
      key: "fear",
      title: "A fear regime",
      sentence: "Unjust sanctions now outnumber correct ones. Enforcement has become its own social harm.",
    };
  }
  if (
    metrics.firstRecovery !== null &&
    metrics.cooperation >= 0.5 &&
    metrics.exploitationEwma <= 0.12
  ) {
    return {
      key: "order",
      title: "A fragile moral order",
      sentence: "Cooperation has recovered, but the machinery that protects it remains costly and reversible.",
    };
  }
  if (
    metrics.environment === 2 &&
    sanctions > 0 &&
    metrics.exploitAdvantage <= 0
  ) {
    return {
      key: "response",
      title: "The moral response",
      sentence: `Reputation and sanctions have pushed exploitation ${signed(metrics.exploitAdvantage)} fitness behind prosocial policies.`,
    };
  }
  if (metrics.exploitationEwma >= 0.07 && metrics.exploitAdvantage > 0.04) {
    return {
      key: "evil",
      title: "Evil has an opening",
      sentence: `One sided exploitation is earning ${signed(metrics.exploitAdvantage)} more fitness than prosocial conduct.`,
    };
  }
  if (metrics.generation < 18 || (metrics.cooperation >= 0.82 && metrics.exploitationEwma < 0.05)) {
    return {
      key: "trust",
      title: "A society of prevailing trust",
      sentence: "Open hands dominate, while rare exploiters and moral traits remain as standing variation on which selection can act.",
    };
  }
  if (metrics.cooperation < 0.06 && metrics.exploiterShare > 0.8) {
    return {
      key: "collapse",
      title: "Norm collapse",
      sentence: "Exploitation has consumed the trust it needed. Most encounters now yield the low payoff of mutual defection.",
    };
  }
  return {
    key: "contested",
    title: "Norms are contested",
    sentence: metrics.exploitAdvantage > 0
      ? "Exploitation still pays at the margin; moral machinery has not yet closed the opening."
      : "Exploitation no longer pays at the margin, but cooperation has not yet rebuilt social trust.",
  };
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

function drawAgentShape(
  context: CanvasRenderingContext2D,
  policy: number,
  radius: number,
  fillColor: string,
  strokeColor: string,
) {
  context.fillStyle = fillColor;
  context.strokeStyle = strokeColor;
  context.lineWidth = Math.max(0.7, radius * 0.16);
  if (policy === 1) {
    context.beginPath();
    context.arc(0, 0, radius, 0.2 * Math.PI, 1.8 * Math.PI);
    context.lineTo(radius * 0.18, 0);
    context.closePath();
    context.stroke();
    return;
  }
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  if (policy === 0) {
    context.fill();
    context.stroke();
    return;
  }
  context.save();
  context.clip();
  context.fillRect(-radius, 0, radius * 2, radius);
  context.restore();
  context.stroke();
  context.beginPath();
  context.moveTo(-radius, 0);
  context.lineTo(radius, 0);
  context.stroke();
}

function drawWorld(canvas: HTMLCanvasElement, world: MoralLife, viewMode: ViewMode) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const width = world.width();
  const height = world.height();
  const cells = world.cells();
  const reputations = world.reputations();
  const acts = world.acts();
  const socialEvents = world.social_events();
  const ecologyEvents = world.ecology_events();
  const edges = world.edges();
  const cellWidth = canvas.width / width;
  const cellHeight = canvas.height / height;
  const cellSize = Math.min(cellWidth, cellHeight);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = OBSIDIAN;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.beginPath();
  for (let x = 0; x <= width; x += 4) {
    const position = Math.round(x * cellWidth) + 0.5;
    context.moveTo(position, 0);
    context.lineTo(position, canvas.height);
  }
  for (let y = 0; y <= height; y += 4) {
    const position = Math.round(y * cellHeight) + 0.5;
    context.moveTo(0, position);
    context.lineTo(canvas.width, position);
  }
  context.strokeStyle = "rgba(247, 231, 199, 0.035)";
  context.lineWidth = 1;
  context.stroke();

  if (viewMode === "acts") {
    context.save();
    for (let offset = 0; offset + 2 < edges.length; offset += 3) {
      const left = edges[offset];
      const right = edges[offset + 1];
      const kind = edges[offset + 2];
      const leftX = left % width;
      const leftY = Math.floor(left / width);
      const rightX = right % width;
      const rightY = Math.floor(right / width);
      if (Math.abs(leftX - rightX) > 3 || Math.abs(leftY - rightY) > 3) continue;
      context.beginPath();
      context.moveTo((leftX + 0.5) * cellWidth, (leftY + 0.5) * cellHeight);
      context.lineTo((rightX + 0.5) * cellWidth, (rightY + 0.5) * cellHeight);
      context.strokeStyle = kind === 1
        ? "rgba(221, 180, 92, 0.24)"
        : kind === 4
          ? "rgba(247, 231, 199, 0.2)"
          : "rgba(207, 106, 73, 0.28)";
      context.lineWidth = Math.max(0.55, cellSize * 0.055);
      context.setLineDash(kind === 1 ? [] : kind === 4 ? [1, 2] : [3, 2]);
      context.stroke();
    }
    context.restore();
  }

  for (let index = 0; index < cells.length; index += 1) {
    const packed = cells[index];
    const occupied = (packed & 0b1000_0000) !== 0;
    const x = index % width;
    const y = Math.floor(index / width);
    const centerX = (x + 0.5) * cellWidth;
    const centerY = (y + 0.5) * cellHeight;
    const ecology = ecologyEvents[index] ?? 0;

    if (!occupied) {
      if (ecology === 2 && cellSize >= 3) {
        const spark = Math.max(0.8, cellSize * 0.24);
        context.beginPath();
        context.moveTo(centerX - spark, centerY - spark);
        context.lineTo(centerX + spark, centerY + spark);
        context.moveTo(centerX + spark, centerY - spark);
        context.lineTo(centerX - spark, centerY + spark);
        context.strokeStyle = "rgba(207, 106, 73, 0.38)";
        context.lineWidth = Math.max(0.6, cellSize * 0.05);
        context.stroke();
      }
      continue;
    }

    const policy = (packed >> 5) & 0b11;
    const enforcer = (packed & 0b0001_0000) !== 0;
    const q = packed & 0b0000_1111;
    const reputation = reputations[index] ?? 0;
    const act = acts[index] ?? 0;
    const social = socialEvents[index] ?? 0;
    const radius = Math.max(0.95, cellSize * 0.31);
    let fill = GOLD;
    let stroke = GOLD_LIGHT;

    if (viewMode === "acts") {
      if (act === 2 || act === 4) {
        fill = CLAY;
        stroke = CLAY_LIGHT;
      } else if (act === 3) {
        fill = "rgba(247, 231, 199, 0.24)";
        stroke = IVORY;
      } else if (act === 0) {
        fill = "rgba(221, 180, 92, 0.44)";
        stroke = "rgba(242, 214, 146, 0.64)";
      }
    } else if (viewMode === "norms") {
      if (reputation < 0) {
        fill = `rgba(207, 106, 73, ${0.38 + Math.abs(reputation) * 0.1})`;
        stroke = CLAY_LIGHT;
      } else if (reputation > 0) {
        fill = `rgba(221, 180, 92, ${0.4 + reputation * 0.1})`;
        stroke = GOLD_LIGHT;
      } else {
        fill = "rgba(247, 231, 199, 0.22)";
        stroke = "rgba(247, 231, 199, 0.64)";
      }
    } else {
      const intensity = 0.18 + Math.min(q, 8) * 0.095;
      fill = q === 0 ? "rgba(123, 86, 61, 0.42)" : `rgba(242, 214, 146, ${intensity})`;
      stroke = q < 2 ? "rgba(203, 160, 83, 0.58)" : IVORY;
    }

    if (ecology === 1) {
      context.beginPath();
      context.arc(centerX, centerY, radius + cellSize * 0.25, 0, Math.PI * 2);
      context.strokeStyle = "rgba(242, 214, 146, 0.5)";
      context.lineWidth = Math.max(0.7, cellSize * 0.06);
      context.stroke();
    }

    context.save();
    context.translate(centerX, centerY);
    drawAgentShape(context, policy, radius, fill, stroke);

    if (enforcer) {
      const frame = radius * 1.45;
      const corner = frame * 0.38;
      context.beginPath();
      context.moveTo(-frame, -frame + corner);
      context.lineTo(-frame, -frame);
      context.lineTo(-frame + corner, -frame);
      context.moveTo(frame - corner, -frame);
      context.lineTo(frame, -frame);
      context.lineTo(frame, -frame + corner);
      context.moveTo(frame, frame - corner);
      context.lineTo(frame, frame);
      context.lineTo(frame - corner, frame);
      context.moveTo(-frame + corner, frame);
      context.lineTo(-frame, frame);
      context.lineTo(-frame, frame - corner);
      context.strokeStyle = "rgba(247, 231, 199, 0.72)";
      context.lineWidth = Math.max(0.6, cellSize * 0.04);
      context.stroke();
    }
    context.restore();

    if (viewMode === "norms" && reputation !== 0) {
      context.beginPath();
      const start = -Math.PI / 2;
      const span = (Math.PI * 2 * Math.min(Math.abs(reputation), 4)) / 4;
      context.arc(centerX, centerY, radius + cellSize * 0.18, start, start + span);
      context.strokeStyle = reputation > 0 ? GOLD_LIGHT : CLAY_LIGHT;
      context.lineWidth = Math.max(0.7, cellSize * 0.055);
      context.setLineDash(reputation > 0 ? [] : [1.5, 1.5]);
      context.stroke();
      context.setLineDash([]);
    }

    if ((social & (1 << 3)) !== 0) {
      const bracket = radius + cellSize * 0.28;
      context.beginPath();
      context.moveTo(centerX - bracket, centerY - bracket * 0.35);
      context.lineTo(centerX - bracket, centerY - bracket);
      context.lineTo(centerX - bracket * 0.35, centerY - bracket);
      context.moveTo(centerX + bracket * 0.35, centerY + bracket);
      context.lineTo(centerX + bracket, centerY + bracket);
      context.lineTo(centerX + bracket, centerY + bracket * 0.35);
      context.strokeStyle = (social & (1 << 4)) !== 0 ? PLUM : IVORY;
      context.lineWidth = Math.max(0.8, cellSize * 0.065);
      context.stroke();
    }

    if ((social & (1 << 5)) !== 0) {
      context.beginPath();
      context.arc(centerX, centerY, radius + cellSize * 0.32, -0.8 * Math.PI, 0.65 * Math.PI);
      context.strokeStyle = "rgba(247, 231, 199, 0.58)";
      context.lineWidth = Math.max(0.65, cellSize * 0.05);
      context.stroke();
    }
  }
}

function drawTrend(
  canvas: HTMLCanvasElement,
  history: HistoryPoint[],
  markers: TimelineMarker[],
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(18, 9, 7, 0.92)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const padX = 12;
  const padY = 8;
  const plotWidth = Math.max(1, canvas.width - padX * 2);
  const plotHeight = Math.max(1, canvas.height - padY * 2);

  context.beginPath();
  for (let row = 0; row <= 2; row += 1) {
    const y = padY + (plotHeight * row) / 2;
    context.moveTo(padX, y);
    context.lineTo(canvas.width - padX, y);
  }
  context.strokeStyle = "rgba(247, 231, 199, 0.07)";
  context.lineWidth = 1;
  context.stroke();

  if (history.length < 2) return;
  const firstLifetime = history[0].lifetime;
  const lastLifetime = history[history.length - 1].lifetime;
  const lifetimeSpan = Math.max(1, lastLifetime - firstLifetime);
  const xFor = (lifetime: number) =>
    padX + ((lifetime - firstLifetime) / lifetimeSpan) * plotWidth;

  for (const marker of markers) {
    if (marker.lifetime < firstLifetime || marker.lifetime > lastLifetime) continue;
    const x = xFor(marker.lifetime);
    context.beginPath();
    context.moveTo(x, padY);
    context.lineTo(x, canvas.height - padY);
    context.strokeStyle = "rgba(247, 231, 199, 0.22)";
    context.setLineDash([2, 3]);
    context.stroke();
    context.setLineDash([]);
  }

  const series: Array<[keyof Omit<HistoryPoint, "lifetime">, string, number[]]> = [
    ["cooperation", GOLD, []],
    ["exploitation", CLAY, [4, 3]],
    ["institutions", IVORY, [1.5, 2.5]],
    ["badReputation", PLUM, [7, 3]],
  ];
  for (const [key, color, dash] of series) {
    context.beginPath();
    history.forEach((point, index) => {
      const x = xFor(point.lifetime);
      const y = padY + (1 - Math.max(0, Math.min(1, point[key]))) * plotHeight;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.strokeStyle = color;
    context.lineWidth = Math.max(1.1, canvas.height * 0.018);
    context.setLineDash(dash);
    context.stroke();
  }
  context.setLineDash([]);
}

export default function MoralLifeLab() {
  const reduceMotionAtMount =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trendRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<MoralLife | null>(null);
  const runningRef = useRef(!reduceMotionAtMount);
  const speedRef = useRef(4);
  const viewModeRef = useRef<ViewMode>("acts");
  const epochRef = useRef(1);
  const lifetimeBeforeEpochRef = useRef(0);
  const lowPopulationGenerationsRef = useRef(0);
  const lastHistoryGenerationRef = useRef(-1);
  const historyRef = useRef<HistoryPoint[]>([]);
  const markersRef = useRef<TimelineMarker[]>([]);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(!reduceMotionAtMount);
  const [speed, setSpeed] = useState(4);
  const [viewMode, setViewMode] = useState<ViewMode>("acts");
  const [environment, setEnvironment] = useState<EnvironmentCode>(2);
  const [metrics, setMetrics] = useState<MoralMetrics>(emptyMetrics);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [markers, setMarkers] = useState<TimelineMarker[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const phase = useMemo(() => moralPhase(metrics), [metrics]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event: MediaQueryListEvent) => {
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
    async function wakeSociety() {
      try {
        await initMoralLife();
        if (cancelled) return;
        const world = new MoralLife(WORLD_WIDTH, WORLD_HEIGHT, INITIAL_SEED);
        worldRef.current = world;
        const initial = readMetrics(world, 0, 1);
        setMetrics(initial);
        setHistory([{ lifetime: 0, cooperation: 0, exploitation: 0, institutions: initial.institutionShare, badReputation: 0 }]);
        setReady(true);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "The moral society could not start.");
        }
      }
    }
    void wakeSociety();
    return () => {
      cancelled = true;
      worldRef.current?.free();
      worldRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const worldCanvas = canvasRef.current;
    const trendCanvas = trendRef.current;
    if (!worldCanvas || !trendCanvas) return;
    const redraw = () => {
      resizeCanvas(worldCanvas);
      resizeCanvas(trendCanvas);
      const world = worldRef.current;
      if (world) drawWorld(worldCanvas, world, viewModeRef.current);
      drawTrend(trendCanvas, historyRef.current, markersRef.current);
    };
    redraw();
    const observer = new ResizeObserver(redraw);
    observer.observe(worldCanvas);
    observer.observe(trendCanvas);
    window.addEventListener("resize", redraw);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", redraw);
    };
  }, [ready]);

  useEffect(() => {
    historyRef.current = history;
    markersRef.current = markers;
    if (!ready) return;
    const canvas = trendRef.current;
    if (!canvas) return;
    resizeCanvas(canvas);
    drawTrend(canvas, history, markers);
  }, [ready, history, markers]);

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    let previousTime = performance.now();
    let accumulator = 0;
    let lastMetricsUpdate = 0;
    let lastDraw = 0;

    const renewEpoch = (world: MoralLife, reason: string) => {
      lifetimeBeforeEpochRef.current += world.generation();
      epochRef.current += 1;
      lastHistoryGenerationRef.current = -1;
      const seed = nextEpochSeed(world.seed(), epochRef.current);
      world.restart(seed);
      lowPopulationGenerationsRef.current = 0;
      const lifetime = lifetimeBeforeEpochRef.current;
      setMarkers((current) => [...current, { lifetime, label: `Epoch ${epochRef.current}` }].slice(-20));
      setNotice(`Epoch ${epochRef.current} began because ${reason}.`);
    };

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
          lowPopulationGenerationsRef.current = world.alive() < 220
            ? lowPopulationGenerationsRef.current + steps
            : 0;
          if (world.alive() === 0) {
            renewEpoch(world, "the society disappeared");
          } else if (lowPopulationGenerationsRef.current >= 90) {
            renewEpoch(world, "the population remained below the viability floor");
          }
        }
      }
      if (advanced || time - lastDraw > 360) {
        drawWorld(canvas, world, viewModeRef.current);
        lastDraw = time;
      }
      if (advanced && time - lastMetricsUpdate > 170) {
        const next = readMetrics(world, lifetimeBeforeEpochRef.current, epochRef.current);
        setMetrics(next);
        if (next.generation - lastHistoryGenerationRef.current >= 3) {
          lastHistoryGenerationRef.current = next.generation;
          setHistory((current) => [
            ...current,
            {
              lifetime: next.lifetime,
              cooperation: next.cooperation,
              exploitation: next.exploitationEwma,
              institutions: next.institutionShare,
              badReputation: next.badReputationShare,
            },
          ].slice(-240));
        }
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

  function clearContinuity() {
    epochRef.current = 1;
    lifetimeBeforeEpochRef.current = 0;
    lowPopulationGenerationsRef.current = 0;
    lastHistoryGenerationRef.current = -1;
    setHistory([]);
    setMarkers([]);
    setNotice("");
  }

  function refresh(world: MoralLife) {
    const next = readMetrics(world, lifetimeBeforeEpochRef.current, epochRef.current);
    setMetrics(next);
    const canvas = canvasRef.current;
    if (canvas) drawWorld(canvas, world, viewModeRef.current);
  }

  function stepOnce() {
    const world = worldRef.current;
    if (!world) return;
    setPlayback(false);
    world.step_many(1);
    refresh(world);
  }

  function restart(seed: number) {
    const world = worldRef.current;
    if (!world) return;
    clearContinuity();
    world.restart(seed >>> 0);
    refresh(world);
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

  function changeEnvironment(next: EnvironmentCode) {
    const world = worldRef.current;
    if (!world || next === environment) return;
    world.set_environment(next);
    setEnvironment(next);
    const lifetime = lifetimeBeforeEpochRef.current + world.generation();
    setMarkers((current) => [...current, { lifetime, label: environmentNames[next] }].slice(-20));
    setNotice(`${environmentNames[next]} environment began at generation ${world.generation()}.`);
    refresh(world);
  }

  function introduceExploiters() {
    const world = worldRef.current;
    if (!world) return;
    const introduced = world.introduce_exploiters(0.02);
    const lifetime = lifetimeBeforeEpochRef.current + world.generation();
    setMarkers((current) => [...current, { lifetime, label: "+2% exploiters" }].slice(-20));
    setNotice(`${introduced} agents became exploiters at generation ${world.generation()}.`);
    refresh(world);
  }

  const payoffClass = metrics.exploitAdvantage > 0.03
    ? "moral-payoff-positive"
    : metrics.exploitAdvantage < -0.03
      ? "moral-payoff-negative"
      : "moral-payoff-even";

  return (
    <section className="moral-life-lab" aria-labelledby="moral-life-title">
      <h1 id="moral-life-title" className="sr-only">
        Moral Life: how rare exploitation spreads and why morality may evolve
      </h1>
      <div className="moral-stage">
        <div className="moral-world-frame">
          <div className="moral-world-head">
            <div>
              <span className="moral-live-dot" aria-hidden="true" />
              {running ? "Society evolving live" : "Society paused"}
            </div>
            <span>Epoch {metrics.epoch} · seed {metrics.seed} · 96 × 54 torus</span>
          </div>

          <div className="moral-canvas-wrap">
            {!ready && !error && <p className="moral-loading" role="status">Forming a society…</p>}
            {error && <p className="moral-error" role="alert">{error}</p>}
            <canvas
              ref={canvasRef}
              className="moral-canvas"
              role="img"
              aria-describedby="moral-canvas-description"
              aria-label="An animated society where open hands, exploiters, conditional cooperators, enforcers, reputation, and moral capacity evolve"
            />
          </div>
          <p id="moral-canvas-description" className="sr-only">
            Filled gold circles are open-hand cooperators. Notched clay circles are exploiters. Half-filled circles are conditional cooperators. Ivory corner frames mark enforcers. Arcs show reputation, brackets show sanctions, and closing halos show forgiveness. Every live metric is also available as text in the instruments panel.
          </p>

          <div className="moral-trend" aria-label="Recent social history">
            <canvas ref={trendRef} role="img" aria-label="Timeline of cooperation, exploitation, institutions, and bad reputation" />
            <div className="moral-trend-legend" aria-hidden="true">
              <span className="trend-cooperation">Cooperation</span>
              <span className="trend-exploitation">Exploitation</span>
              <span className="trend-institutions">Institutions</span>
              <span className="trend-reputation">Bad reputation</span>
            </div>
          </div>

          <div className="moral-legend" aria-label="Society legend">
            <span><i className="moral-glyph glyph-open" aria-hidden="true" /> Open hand</span>
            <span><i className="moral-glyph glyph-exploit" aria-hidden="true" /> Exploiter</span>
            <span><i className="moral-glyph glyph-conditional" aria-hidden="true" /> Conditional</span>
            <span><i className="moral-glyph glyph-enforcer" aria-hidden="true" /> Enforcer</span>
            <span><i className="moral-glyph glyph-forgiven" aria-hidden="true" /> Forgiveness</span>
          </div>
        </div>

        <aside className="moral-console" aria-label="Moral Life controls and metrics">
          <div className="moral-controls">
            <button className="moral-control-primary" type="button" disabled={!ready} onClick={() => setPlayback(!running)}>
              {running ? "Pause" : "Play"}
            </button>
            <button type="button" disabled={!ready} onClick={stepOnce}>Step</button>
            <button type="button" disabled={!ready} onClick={() => restart(metrics.seed)}>Replay seed</button>
            <button type="button" disabled={!ready} onClick={newWorld}>New world</button>
          </div>

          <div className="moral-switches">
            <fieldset>
              <legend>Speed</legend>
              {[1, 4, 12].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={speed === value ? "active" : ""}
                  aria-pressed={speed === value}
                  onClick={() => changeSpeed(value)}
                >
                  {value === 1 ? "Study" : value === 4 ? "Flow" : "Fast"}
                </button>
              ))}
            </fieldset>
            <fieldset>
              <legend>View</legend>
              {(["acts", "norms", "inner"] as ViewMode[]).map((value) => (
                <button
                  type="button"
                  key={value}
                  className={viewMode === value ? "active" : ""}
                  aria-pressed={viewMode === value}
                  onClick={() => changeView(value)}
                >
                  {value === "inner" ? "Inner q" : value[0].toUpperCase() + value.slice(1)}
                </button>
              ))}
            </fieldset>
          </div>

          <fieldset className="moral-environments">
            <legend>Social environment</legend>
            <div>
              {([0, 1, 2] as EnvironmentCode[]).map((value) => (
                <button
                  type="button"
                  key={value}
                  className={environment === value ? "active" : ""}
                  aria-pressed={environment === value}
                  onClick={() => changeEnvironment(value)}
                >
                  {environmentNames[value]}
                </button>
              ))}
            </div>
            <p>{environmentDescriptions[environment]}</p>
          </fieldset>

          <div className="moral-primary-metrics" aria-label="Primary social metrics">
            <article>
              <span>Cooperation</span>
              <strong>{percent(metrics.cooperation)}</strong>
              <small>helping actions now</small>
            </article>
            <article className="metric-exploitation">
              <span>Exploitation</span>
              <strong>{percent(metrics.exploitation)}</strong>
              <small>one sided defection</small>
            </article>
            <article className="metric-institutions">
              <span>Institutions</span>
              <strong>{percent(metrics.institutionShare)}</strong>
              <small>response traits active here</small>
            </article>
            <article>
              <span>Social welfare</span>
              <strong>{metrics.welfare.toFixed(2)}</strong>
              <small>mean net fitness</small>
            </article>
          </div>

          <div className={`moral-payoff ${payoffClass}`}>
            <div>
              <span>Net exploit advantage</span>
              <strong>{signed(metrics.exploitAdvantage)}</strong>
            </div>
            <p>
              {metrics.exploitAdvantage > 0.03
                ? "Evil currently pays. Selection gives exploiters room to spread."
                : metrics.exploitAdvantage < -0.03
                  ? "The response is biting. Exploitation is less fit than prosocial conduct."
                  : "The contest is close. Small institutional changes can reverse selection."}
            </p>
            <small>T = 5 · R = 3 · sanction coverage {percent(metrics.sanctionCoverage, 0)}</small>
          </div>

          <div className={`moral-phase moral-phase-${phase.key}`}>
            <p>Current social phase</p>
            <strong aria-live="polite">{phase.title}</strong>
            <span>{phase.sentence}</span>
            {notice && <small>{notice}</small>}
          </div>

          <button className="moral-intervention" type="button" disabled={!ready} onClick={introduceExploiters}>
            Introduce 2% exploiters
            <span>Marked intervention · inherited trust begins at zero reputation</span>
          </button>

          <details className="moral-ledger">
            <summary>Open the norm ledger</summary>
            <dl>
              <div><dt>Moral capacity q ≥ 2</dt><dd>{percent(metrics.capacityShare)}</dd></div>
              <div><dt>Conditional policy</dt><dd>{percent(metrics.conditionalShare)}</dd></div>
              <div><dt>Enforcer trait</dt><dd>{percent(metrics.enforcerShare)}</dd></div>
              <div><dt>Exploiter population</dt><dd>{percent(metrics.exploiterShare)}</dd></div>
              <div><dt>Bad reputation</dt><dd>{percent(metrics.badReputationShare)}</dd></div>
              <div><dt>Public observer accuracy</dt><dd>{metrics.observations === 0 ? "—" : percent(metrics.observationAccuracy)}</dd></div>
              <div><dt>Correct sanctions</dt><dd>{metrics.trueSanctions}</dd></div>
              <div><dt>Unjust sanctions</dt><dd>{metrics.falseSanctions}</dd></div>
              <div><dt>Forgiveness</dt><dd>{metrics.forgiveness}</dd></div>
              <div><dt>Refusal</dt><dd>{percent(metrics.refusal)}</dd></div>
              <div><dt>Births / deaths</dt><dd>{metrics.births} / {metrics.deaths}</dd></div>
              <div><dt>Mean q / reputation</dt><dd>{metrics.meanQ.toFixed(2)} / {metrics.meanReputation.toFixed(2)}</dd></div>
            </dl>
          </details>

          <div className="moral-milestones" aria-label="Evolutionary milestones">
            <span>First exploit <b>{milestone(metrics.firstExploitation)}</b></span>
            <span>First response <b>{milestone(metrics.firstMoralResponse)}</b></span>
            <span>First sanction <b>{milestone(metrics.firstSanction)}</b></span>
            <span>Recovery <b>{milestone(metrics.firstRecovery)}</b></span>
            <span>Peak evil <b>{percent(metrics.peakExploitation, 0)}{metrics.peakGeneration === null ? "" : ` · g ${metrics.peakGeneration}`}</b></span>
            <span>Lifetime <b>{metrics.lifetime.toLocaleString()}</b></span>
          </div>
        </aside>
      </div>
    </section>
  );
}
