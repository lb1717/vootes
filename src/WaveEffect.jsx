import React, { useRef, useState, forwardRef, useImperativeHandle } from "react";

const WAVE_COUNT = 1; // Only one ripple
const WAVE_DURATION = 420; // Shorter, more instant
const WAVE_DELAY = 0; // No delay needed
const RIPPLE_COLOR = '#4be04b'; // Match NEON_GREEN

const WaveEffect = forwardRef((props, ref) => {
  const [waves, setWaves] = useState([]);
  const waveId = useRef(0);

  useImperativeHandle(ref, () => ({
    triggerWave(x, y) {
      const newWaves = [
        {
          id: waveId.current++,
          x,
          y,
          delay: 0,
        },
      ];
      setWaves((prev) => [...prev, ...newWaves]);
    },
  }));

  // Remove wave after animation
  React.useEffect(() => {
    if (waves.length === 0) return;
    const timeout = setTimeout(() => {
      setWaves([]);
    }, WAVE_DURATION + 40);
    return () => clearTimeout(timeout);
  }, [waves]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      {waves.map((wave) => (
        <span
          key={wave.id}
          style={{
            position: "fixed",
            left: wave.x,
            top: wave.y,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 2,
            animation: `wave-expand-fade ${WAVE_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1) ${wave.delay}ms both`,
          }}
          className="wave-effect-circle"
        />
      ))}
      <style>{`
        @keyframes wave-expand-fade {
          0% {
            opacity: 0.85;
            width: 0px;
            height: 0px;
            background: ${RIPPLE_COLOR};
          }
          60% {
            opacity: 0.5;
            background: ${RIPPLE_COLOR};
          }
          100% {
            opacity: 0;
            width: 120px;
            height: 120px;
            background: ${RIPPLE_COLOR}00;
          }
        }
        .wave-effect-circle {
          border-radius: 50%;
          background: ${RIPPLE_COLOR};
          width: 0px;
          height: 0px;
          position: absolute;
          will-change: width, height, opacity;
        }
      `}</style>
    </div>
  );
});

export default WaveEffect; 