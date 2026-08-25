import { StrictMode, useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import MoralLifeLab from "./components/MoralLifeLab";
import "./styles.css";
import "./moral-life-installation.css";

type WakeLockSentinel = EventTarget & {
  readonly released: boolean;
  release: () => Promise<void>;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
};

type WakeState = "unsupported" | "off" | "requesting" | "active" | "waiting" | "error";

export function MoralLifeInstallation() {
  const wakeSentinelRef = useRef<WakeLockSentinel | null>(null);
  const keepAwakeRef = useRef(false);
  const [wakeState, setWakeState] = useState<WakeState>(() =>
    (navigator as WakeLockNavigator).wakeLock ? "off" : "unsupported",
  );
  const fullscreenSupported = typeof document.documentElement.requestFullscreen === "function";
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [instrumentsOpen, setInstrumentsOpen] = useState(true);

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
      sentinel.addEventListener("release", () => {
        if (wakeSentinelRef.current === sentinel) wakeSentinelRef.current = null;
        setWakeState(keepAwakeRef.current ? "waiting" : "off");
      }, { once: true });
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
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
  }

  const wakeLabel = wakeState === "active" ? "Awake on"
    : wakeState === "requesting" ? "Requesting…"
      : wakeState === "waiting" ? "Awake waiting"
        : wakeState === "unsupported" ? "Awake unavailable"
          : wakeState === "error" ? "Awake blocked" : "Keep awake";

  const wakeStatus = wakeState === "active" ? "The display wake lock is active."
    : wakeState === "waiting" ? "The browser released the wake lock while hidden and will retry when visible."
      : wakeState === "unsupported" ? "This browser does not offer a screen wake lock."
        : wakeState === "error" ? "The browser did not grant a wake lock. The society still evolves while the page remains active."
          : "A wake lock is optional and lasts only while this page remains open.";

  return (
    <main className={`moral-installation-root ${instrumentsOpen ? "instruments-open" : "instruments-hidden"}`}>
      <header className="moral-toolbar" aria-label="Installation controls">
        <a className="moral-identity" href="/">
          <span aria-hidden="true">☀</span>
          <span>
            <strong>Conscious Life II · Moral Life</strong>
            <small>How rare exploitation spreads. Why morality may evolve.</small>
          </span>
        </a>
        <div className="moral-toolbar-actions">
          <a href="/conscious-life/">World I</a>
          <a href="https://github.com/vaguiarl/vaguiarl.github.io/tree/main/experiments/moral-life" target="_blank" rel="noreferrer">Model notes</a>
          <button type="button" aria-pressed={instrumentsOpen} onClick={() => setInstrumentsOpen((open) => !open)}>
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
          <button type="button" aria-pressed={isFullscreen} disabled={!fullscreenSupported} onClick={() => void toggleFullscreen()}>
            {!fullscreenSupported ? "Fullscreen unavailable" : isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
        </div>
      </header>

      <MoralLifeLab />

      <footer className="moral-disclaimer">
        <p>
          <strong>Acts, capacities, and institutions—not sentience.</strong> Evil is unilateral exploitation; q is discriminatory capacity; morality is the costly social response. Traits begin as standing variation, so the experiment studies selection rather than creation from nothing.
        </p>
        <span role="status">{wakeStatus}</span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MoralLifeInstallation />
  </StrictMode>,
);
