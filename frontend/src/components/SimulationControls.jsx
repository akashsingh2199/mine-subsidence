import { Pause, Play, RotateCcw } from "lucide-react";

const speeds = [1, 5, 10, 30];

const quickJumps = [
  { label: "Start", index: 0 },
  { label: "Day 8", day: 8 },
  { label: "Day 13", day: 13 },
  { label: "Day 16", day: 16 },
  { label: "Day 18", day: 18 },
  { label: "End", end: true },
];

export default function SimulationControls({
  currentIndex,
  frameCount,
  isPlaying,
  speed,
  timestamp,
  metadata,
  controls,
}) {
  const progress =
    frameCount > 1
      ? (currentIndex / (frameCount - 1)) * 100
      : 0;

  const seek = (index) => {
    if (!frameCount) return;

    const nextIndex = Math.max(
      0,
      Math.min(Number(index), frameCount - 1)
    );
    console.log("SEEK:", nextIndex);

    // If simulation is running, pause while seeking
    if (isPlaying) {
      controls.pause();
    }

    controls.setCurrentIndex(nextIndex);
  };

  const handleTimelineChange = (event) => {
    seek(Number(event.target.value));
  };

  const handleKeyDown = (event) => {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        seek(currentIndex - 1);
        break;

      case "ArrowRight":
        event.preventDefault();
        seek(currentIndex + 1);
        break;

      case "Home":
        event.preventDefault();
        seek(0);
        break;

      case "End":
        event.preventDefault();
        seek(frameCount - 1);
        break;

      default:
        break;
    }
  };

  return (
    <section
      className="panel simulation-panel"
      aria-label="Dataset simulation controls"
    >
      {/* HEADER */}
      <div className="simulation-main">
        <div>
          <p className="eyebrow">
            Dataset Replay Simulator
          </p>

          <h2>
            {timestamp
              ? new Date(timestamp).toLocaleString()
              : "Waiting for CSV data"}
          </h2>

          <span className="sim-meta">
            {metadata
              ? `${metadata.panelId} | ${metadata.nodeCount} nodes | ${metadata.frameCount} timestamps | ${metadata.readingCount} readings`
              : "Load source: public/data/synthetic_mine_subsidence_mesh.csv"}
          </span>
        </div>

        {/* CONTROLS */}
        <div className="sim-actions">

          <button
            type="button"
            onClick={controls.start}
            disabled={isPlaying || !frameCount}
            title="Start simulation"
          >
            <Play size={16} />
            Start
          </button>

          <button
            type="button"
            onClick={controls.pause}
            disabled={!isPlaying}
            title="Pause simulation"
          >
            <Pause size={16} />
            Pause
          </button>

          <button
            type="button"
            onClick={controls.reset}
            disabled={!frameCount}
            title="Reset simulation"
          >
            <RotateCcw size={16} />
            Reset
          </button>

        </div>
      </div>

      {/* TIMELINE */}
      <div className="timeline-row">

        <input
          type="range"
          min={0}
          max={Math.max(frameCount - 1, 0)}
          value={currentIndex}
          step={1}
          disabled={!frameCount}
          onChange={handleTimelineChange}
          onKeyDown={handleKeyDown}
          aria-label="Simulation timeline"
          title="Drag to seek through simulation"
        />

        <strong>
          {frameCount
            ? `${currentIndex + 1} / ${frameCount}`
            : "0 / 0"}
        </strong>

      </div>

      {/* PROGRESS */}
      <div className="speed-row">

        <span>Speed</span>

        <div className="speed-options">

          {speeds.map((value) => (
            <button
              type="button"
              className={speed === value ? "active" : ""}
              key={value}
              onClick={() => controls.setSpeed(value)}
            >
              {value}x
            </button>
          ))}

        </div>

        <span className="progress-value">
          {Math.round(progress)}%
        </span>

      </div>

      {/* QUICK JUMPS */}
      <div
        className="quick-jumps"
        aria-label="Quick timeline jumps"
      >

        {quickJumps.map((jump) => (

          <button
            type="button"
            key={jump.label}
            onClick={() => {

              if (jump.day !== undefined) {
                controls.jumpToDay(jump.day);
              } else if (jump.end) {
                seek(frameCount - 1);
              } else {
                seek(jump.index);
              }

            }}
            disabled={!frameCount}
          >
            {jump.label}
          </button>

        ))}

      </div>

    </section>
  );
}