import React, { useRef, useState, useEffect } from "react";
import "./Posts.css"; // already contains the video styles

export const VideoPlayer = ({ src, onNext = () => {}, onClose = () => {}, onShowComments = () => {} }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [overlay, setOverlay] = useState(null);
  const tapState = useRef({ count: 0, timer: null, side: null });

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const updateProgress = () => {
      setProgress((v.currentTime / v.duration) * 100 || 0);
    };

    v.addEventListener("timeupdate", updateProgress);
    return () => v.removeEventListener("timeupdate", updateProgress);
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
    setPlaying(!v.paused);
  };

  const seekBy = (s) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + s));
    setOverlay(s > 0 ? `+${s}s` : `${s}s`);
    setTimeout(() => setOverlay(null), 600);
  };

  const handleTap = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const third = width / 3;

    const side = x < third ? "left" : x > 2 * third ? "right" : "center";
    tapState.current.count++;
    tapState.current.side = side;
    clearTimeout(tapState.current.timer);

    tapState.current.timer = setTimeout(() => {
      const { count, side } = tapState.current;

      if (count === 1 && side === "center") togglePlay();
      else if (count === 2 && side === "right") seekBy(10);
      else if (count === 2 && side === "left") seekBy(-10);
      else if (count === 3 && side === "center") onNext();

      tapState.current.count = 0;
    }, 300);
  };

  return (
    <div className="customVideoContainer" ref={containerRef} onPointerDown={handleTap}>
      <video
        ref={videoRef}
        className="customVideo"
        src={src}
        playsInline
        preload="metadata"
      />

      {!playing && <div className="bigPlayBtn" onClick={togglePlay}>▶</div>}
      {overlay && <div className="seekOverlay">{overlay}</div>}

      <div className="videoControls">
        <button onClick={() => seekBy(-10)}>⟲ 10s</button>
        <button onClick={togglePlay}>{playing ? "Pause" : "Play"}</button>
        <button onClick={() => seekBy(10)}>10s ⟳</button>

        <div className="progress" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          videoRef.current.currentTime = pct * videoRef.current.duration;
        }}>
          <div className="progressBar" style={{ width: `${progress}%` }} />
        </div>

        <button onClick={() => containerRef.current.requestFullscreen()}>⛶</button>
      </div>
    </div>
  );
};

export default VideoPlayer;
