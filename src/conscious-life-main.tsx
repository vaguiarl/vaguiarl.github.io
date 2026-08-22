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
      <header className="installation-toolbar" aria-label="Installation controls">
        <a className="installation-identity" href="/">
          <span aria-hidden="true">☀</span>
          <span>
            <strong>Conscious Life</strong>
            <small>A living experiment by Victor H. Aguiar</small>
          </span>
        </a>
        <div className="installation-actions">
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

      <ConsciousLifeLab />

      <footer className="installation-disclaimer">
        <p>
          <strong>Functional model, not a sentience test.</strong> Its “inner life” measures operational distinctions, not phenomenal consciousness. This local world evolves while the page remains open.
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
