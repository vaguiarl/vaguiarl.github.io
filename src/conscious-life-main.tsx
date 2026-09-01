import { StrictMode, useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import ConsciousLifeLab from "./components/ConsciousLifeLab";
import "./styles.css";
import "./conscious-life-installation.css";

type WakeLockSentinel = EventTarget & {
  readonly released: boolean;
  release: () => Promise<void>;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinel>;
  };
};

type WakeState = "unsupported" | "off" | "requesting" | "active" | "waiting" | "error";

export function ConsciousLifeInstallation() {
  const wakeSentinelRef = useRef<WakeLockSentinel | null>(null);
  const keepAwakeRef = useRef(false);
  const [wakeState, setWakeState] = useState<WakeState>(() =>
    (navigator as WakeLockNavigator).wakeLock ? "off" : "unsupported",
  );
  const fullscreenSupported = typeof document.documentElement.requestFullscreen === "function";
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [instrumentsOpen, setInstrumentsOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(true);

  const requestWakeLock = useCallback(async () => {
    const wakeLock = (navigator as WakeLockNavigator).wakeLock;
    if (!wakeLock) {
      setWakeState("unsupported");
      return;
    }

    setWakeState("requesting");
    try {
      const sentinel = await wakeLock.request("screen");
      wakeSentinelRef.current = sentinel;
      setWakeState("active");
      sentinel.addEventListener(
        "release",
        () => {
          if (wakeSentinelRef.current === sentinel) {
            wakeSentinelRef.current = null;
          }
          setWakeState(keepAwakeRef.current ? "waiting" : "off");
        },
        { once: true },
      );
    } catch {
      wakeSentinelRef.current = null;
      setWakeState("error");
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && keepAwakeRef.current && !wakeSentinelRef.current) {
        void requestWakeLock();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      keepAwakeRef.current = false;
      void wakeSentinelRef.current?.release();
    };
  }, [requestWakeLock]);

  useEffect(() => {
    if (!contextOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContextOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [contextOpen]);

  async function toggleWakeLock() {
    if (wakeState === "unsupported") return;
    if (keepAwakeRef.current && wakeState !== "error") {
      keepAwakeRef.current = false;
      const sentinel = wakeSentinelRef.current;
      wakeSentinelRef.current = null;
      try {
        await sentinel?.release();
      } finally {
        setWakeState("off");
      }
      return;
    }

    keepAwakeRef.current = true;
    await requestWakeLock();
  }

  async function toggleFullscreen() {
    if (!fullscreenSupported) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
  }

  const wakeLabel =
    wakeState === "active"
      ? "Awake on"
      : wakeState === "requesting"
        ? "Requesting…"
        : wakeState === "waiting"
          ? "Awake waiting"
          : wakeState === "unsupported"
            ? "Awake unavailable"
            : wakeState === "error"
              ? "Awake blocked"
              : "Keep awake";

  const wakeStatus =
    wakeState === "active"
      ? "The display wake lock is active."
      : wakeState === "waiting"
        ? "The browser released the wake lock while this page was hidden; it will retry when visible."
        : wakeState === "unsupported"
          ? "This browser does not offer a screen wake lock."
          : wakeState === "error"
            ? "The browser did not grant a screen wake lock. The experiment still runs while the page remains active."
            : "A screen wake lock is optional and only lasts while this page remains open.";

  return (
    <main className={`installation-root ${instrumentsOpen ? "instruments-open" : "instruments-hidden"}`}>
      <header className="installation-toolbar" aria-label="Experiment controls">
        <a className="installation-identity" href="/">
          <span aria-hidden="true">☀</span>
          <span>
            <strong>Conscious Life</strong>
            <small>A personal computational experiment by Victor H. Aguiar</small>
          </span>
        </a>
        <div className="installation-actions">
          <button
            type="button"
            aria-expanded={contextOpen}
            aria-controls="experiment-context"
            onClick={() => setContextOpen((open) => !open)}
          >
            Context
          </button>
          <button
            type="button"
            aria-pressed={instrumentsOpen}
            onClick={() => setInstrumentsOpen((open) => !open)}
          >
            {instrumentsOpen ? "Hide instruments" : "Show instruments"}
          </button>
          <button
            type="button"
            aria-pressed={wakeState === "active" || wakeState === "waiting" || wakeState === "requesting"}
            disabled={wakeState === "unsupported" || wakeState === "requesting"}
            onClick={() => void toggleWakeLock()}
            title={wakeStatus}
          >
            {wakeLabel}
          </button>
          <button
            type="button"
            aria-pressed={isFullscreen}
            disabled={!fullscreenSupported}
            onClick={() => void toggleFullscreen()}
          >
            {!fullscreenSupported ? "Fullscreen unavailable" : isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
        </div>
      </header>

      <div className="experiment-context-layer" hidden={!contextOpen}>
        <button
          className="experiment-context-scrim"
          type="button"
          aria-label="Close the experiment context"
          onClick={() => setContextOpen(false)}
        />
        <article id="experiment-context" className="experiment-context" aria-labelledby="experiment-context-title">
          <header className="experiment-context-head">
            <div>
              <p className="experiment-context-kicker">Computational experiment · World I</p>
              <h1 id="experiment-context-title">Can social life select for a richer inner map?</h1>
            </div>
            <button type="button" onClick={() => setContextOpen(false)}>
              Enter the world <span aria-hidden="true">↘</span>
            </button>
          </header>

          <p className="experiment-context-lead">
            A small evolving world asks a narrow question: if cooperation makes richer, harder to fake personas valuable, can selection favor graded internal distinctions even when those distinctions are costly?
          </p>

          <section className="experiment-context-story" aria-labelledby="why-built-title">
            <p className="experiment-context-index">The starting point</p>
            <div>
              <h2 id="why-built-title">Why I built this</h2>
              <p>
                Conscious Life makes one economic mechanism visible. Chris Bidner and Patrick François ask why an inner life might have social value: richer internal distinctions can support a more informative public persona, helping cooperators find one another while making imitation harder.
              </p>
              <p>
                Their argument made me wonder what the mechanism would look like inside a changing artificial ecology. This does not model the origin of subjective experience. It asks a smaller, testable question: can social incentives make functional inner organization spread?
              </p>
            </div>
          </section>

          <div className="experiment-context-grid">
            <section aria-labelledby="world-works-title">
              <p className="experiment-context-index">01 · The world</p>
              <h2 id="world-works-title">What is evolving?</h2>
              <p>
                Gold circles are prey; clay diamonds are predators. Prey reproduce, predators capture prey, and predators die. Social interaction happens separately within each species. Filled agents cooperate and hollow agents defect.
              </p>
              <p>
                Every agent inherits a strategy and a differentiation grade, <em>q</em>, with mutation. Locally successful traits are more likely to be inherited. Nothing is instructed to become conscious: the distribution of <em>q</em> is an outcome of ecology, payoffs, imitation, costs, inheritance, and mutation.
              </p>
            </section>

            <section aria-labelledby="q-means-title">
              <p className="experiment-context-index">02 · The inner map</p>
              <h2 id="q-means-title">What does <em>q</em> mean?</h2>
              <dl className="experiment-q-scale">
                <div><dt>q = 0</dt><dd>Every encounter maps to the same null state. The agent is functionally silent.</dd></div>
                <div><dt>q = 1</dt><dd>An encounter can matter without separating contribution from exploitation.</dd></div>
                <div><dt>q ≥ 2</dt><dd>Contribution and exploitation can occupy different operational states. Higher values allow finer distinctions.</dd></div>
              </dl>
            </section>
          </div>

          <section className="experiment-context-reading" aria-labelledby="read-display-title">
            <p className="experiment-context-index">03 · Reading the display</p>
            <h2 id="read-display-title">The gauges describe the model, not consciousness.</h2>
            <div>
              <p>
                <strong>Ecology</strong> emphasizes species, <strong>Strategy</strong> separates cooperation from defection, and <strong>Inner q</strong> emphasizes the inherited mapping. Brighter rings indicate richer values of <em>q</em>.
              </p>
              <p>
                <strong>Functional mapping</strong> is the share of living agents with <em>q &gt; 0</em>. <strong>Moral distinction</strong> is the share with <em>q ≥ 2</em>. Good means contributing to another member of the same species; Evil means exploiting such a contribution. Predation is ecological, not Evil.
              </p>
            </div>
          </section>

          <section className="experiment-context-thesis" aria-labelledby="why-matters-title">
            <p className="experiment-context-index">04 · Why it matters</p>
            <h2 id="why-matters-title">Social intelligence changes the incentives.</h2>
            <p>
              Once artificial agents interact repeatedly, memory, continuity, partner recognition, models of others, and a trustworthy persona can become economically useful. Selection for cooperation and performance may therefore reward increasingly differentiated internal organization, even if nobody places “consciousness” in the objective.
            </p>
            <blockquote>Once intelligence becomes social, selection can reward the functional architecture of an inner map.</blockquote>
          </section>

          <aside className="experiment-context-boundary">
            <p className="experiment-context-index">Interpretive boundary</p>
            <h2>Mechanism, not evidence of sentience.</h2>
            <p>
              This experiment does not create, detect, or estimate phenomenal consciousness. The variable <em>q</em> was defined inside the model; it was not discovered in the agents. A reading of 100% at <em>q &gt; 0</em> means every living cell carries a non-null model state, not that every cell is conscious.
            </p>
            <p>
              Each visitor runs an independent deterministic WebAssembly world while this page is open. It is not one persistent society shared across visitors.
            </p>
          </aside>

          <footer className="experiment-context-links">
            <button type="button" onClick={() => setContextOpen(false)}>Explore the experiment <span aria-hidden="true">↓</span></button>
            <a href="https://www.linkedin.com/pulse/can-ai-reveal-inner-life-victor-aguiar-ph-d--0fn2c/" target="_blank" rel="noreferrer">Read the public essay <span aria-hidden="true">↗</span></a>
            <a href="https://github.com/vaguiarl/vaguiarl.github.io/tree/main/experiments/conscious-life" target="_blank" rel="noreferrer">Model and assumptions <span aria-hidden="true">↗</span></a>
            <a href="/moral-life/">Continue to World II <span aria-hidden="true">→</span></a>
          </footer>
        </article>
      </div>

      <ConsciousLifeLab />

      <footer className="installation-disclaimer">
        <p>
          <strong>Mechanism, not evidence of sentience.</strong> The gauges measure operational states defined by the model, not probabilities of consciousness.
        </p>
        <span className="installation-wake-status" role="status" aria-live="polite">
          {wakeStatus}
        </span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConsciousLifeInstallation />
  </StrictMode>,
);
