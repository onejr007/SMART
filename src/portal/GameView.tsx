import React, { useEffect, useRef, useState, useCallback } from "react";
import { Game } from "./App";
import { GameFacade } from "./GameFacade";
import { useStore } from "./store";
import { LeaderboardEntry } from "../engine/LeaderboardManager";
import { useOverlay } from "./ui/OverlayProvider";
import "./GameView.css";

interface GameViewProps {
  game: Game;
  onExit: () => void;
}

const GameView: React.FC<GameViewProps> = ({ game, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const facadeRef = useRef<GameFacade | null>(null);
  const { user } = useStore();
  const overlay = useOverlay();
  const [score, setScore] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    [],
  );
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !user) return;
    const facade = new GameFacade(canvasRef.current, game, user);
    facadeRef.current = facade;
    const eb = facade.getEventBus();
    const onScore = (n: number) => setScore((p) => p + n);
    eb.on("scoreUpdated", onScore);
    facade
      .start()
      .catch((e) => console.warn("Engine start error:", e))
      .finally(() => setIsLoading(false));
    const t = setTimeout(() => setIsLoading(false), 2000);
    const onLock = () =>
      setIsLocked(document.pointerLockElement === canvasRef.current);
    document.addEventListener("pointerlockchange", onLock);
    return () => {
      facade.stop();
      eb.off("scoreUpdated", onScore);
      document.removeEventListener("pointerlockchange", onLock);
      clearTimeout(t);
      facadeRef.current = null;
    };
  }, [game, user]);

  const handleCanvasClick = useCallback(() => {
    if (canvasRef.current && !isLocked) canvasRef.current.requestPointerLock();
  }, [isLocked]);

  const handleLeaderboard = async () => {
    const next = !showLeaderboard;
    if (next && facadeRef.current) {
      const data = await facadeRef.current.toggleLeaderboard(true, game.id);
      setLeaderboardData(data);
    }
    setShowLeaderboard(next);
  };

  const handleSubmit = async () => {
    if (facadeRef.current && user) {
      await facadeRef.current.submitScore(game.id, user.uid, score);
      overlay.toast(`Score ${score} submitted!`, { variant: "success" });
    }
  };

  const handleRecord = () => {
    if (facadeRef.current) {
      const rec = facadeRef.current.toggleRecording(isRecording);
      setIsRecording(rec);
      overlay.toast(rec ? "Recording..." : "Replay saved", {
        variant: rec ? "info" : "success",
      });
    }
  };

  return (
    <div className="gv-root">
      <canvas
        ref={canvasRef}
        className="gv-canvas"
        onClick={handleCanvasClick}
      />

      {isLoading && (
        <div className="gv-overlay gv-loading">
          <div className="gv-spinner" />
          <p className="gv-load-title">{game.title}</p>
          <p className="gv-load-sub">Loading world…</p>
        </div>
      )}

      {!isLoading && !isLocked && (
        <div className="gv-overlay gv-click-play" onClick={handleCanvasClick}>
          <div className="gv-play-card">
            <div className="gv-play-icon">▶</div>
            <p className="gv-play-title">Click to Play</p>
            <p className="gv-play-sub">Lock mouse to start · ESC to release</p>
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="gv-hud-tl">
            <button className="gv-btn gv-btn-exit" onClick={onExit}>
              ← Exit
            </button>
            <div className="gv-score">
              <span className="gv-score-lbl">SCORE</span>
              <span className="gv-score-val">{score}</span>
            </div>
            {isRecording && <div className="gv-rec-badge">⏺ REC</div>}
          </div>

          <div className="gv-hud-tr">
            <button
              className={`gv-btn ${showLeaderboard ? "gv-btn-on" : ""}`}
              onClick={handleLeaderboard}
            >
              🏆
            </button>
            <button className="gv-btn" onClick={handleSubmit}>
              Submit
            </button>
            <button
              className={`gv-btn ${isRecording ? "gv-btn-rec" : ""}`}
              onClick={handleRecord}
            >
              {isRecording ? "⏹" : "⏺"}
            </button>
          </div>

          <div className="gv-controls">
            <kbd>WASD</kbd> Move
            <span className="gv-dot">·</span>
            <kbd>SPACE</kbd> Jump
            <span className="gv-dot">·</span>
            <kbd>E</kbd> Interact
            <span className="gv-dot">·</span>
            <kbd>Q</kbd> Throw
            {isLocked && (
              <>
                <span className="gv-dot">·</span>
                <kbd>ESC</kbd> Unlock
              </>
            )}
          </div>
        </>
      )}

      {showLeaderboard && (
        <div className="gv-modal-bg" onClick={() => setShowLeaderboard(false)}>
          <div className="gv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gv-modal-hd">
              <span>🏆 Leaderboard — {game.title}</span>
              <button
                className="gv-modal-x"
                onClick={() => setShowLeaderboard(false)}
              >
                ✕
              </button>
            </div>
            <div className="gv-modal-bd">
              {leaderboardData.length === 0 ? (
                <div className="gv-lb-empty">No scores yet. Be the first!</div>
              ) : (
                leaderboardData.map((e, i) => (
                  <div
                    key={i}
                    className={`gv-lb-row ${e.userId === user?.uid ? "gv-lb-me" : ""}`}
                  >
                    <span className="gv-lb-rank">#{i + 1}</span>
                    <span className="gv-lb-user">
                      {e.userId === user?.uid
                        ? "You"
                        : e.userId.slice(0, 8) + "…"}
                    </span>
                    <span className="gv-lb-score">{e.score}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameView;
