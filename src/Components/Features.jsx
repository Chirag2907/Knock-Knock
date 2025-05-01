import React from "react";
import { useState } from "react";
import { playSound, tickSampler } from "../Sound";
import * as Tone from "tone";
import "./Features.css";
import { useRef, useEffect } from "react";
import { analyser } from "../Sound";

const Features = () => {
  const [bpm, setBpm] = useState(120);
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const [beatFlash, setBeatFlash] = useState(false);

  const scheduleMetronome = () => {
    Tone.Transport.cancel(); // clear previous ticks
    Tone.Transport.scheduleRepeat((time) => {
      tickSampler.triggerAttackRelease("C3", "8n", time);
      setBeatFlash(true);
      setTimeout(() => setBeatFlash(false), 100);
    }, "4n");
  };

  const startMetronome = async () => {
    await Tone.start();
    Tone.Transport.bpm.value = bpm;
    scheduleMetronome();
    Tone.Transport.start();
    setIsMetronomeOn(true);
  };

  const stopMetronome = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel(); // clears all scheduled events
    setBeatFlash(false);
    setIsMetronomeOn(false);
  };

  const canvasRef = useRef(null);

  useEffect(() => {
    if (!analyser) {
      console.warn("analyser not ready");
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        ctx.fillStyle = `rgb(0, 255, ${100 + barHeight})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    draw();
  }, [analyser]); // 🔁 depend on analyser

  useEffect(() => {
    playSound("kick");
  }, []);

  return (
    <div className="features">
      <div className="drum-controls">
        <div className="feature-default metronome-controls">
          <h3>Metronome</h3>
          <input
            type="range"
            min="60"
            max="180"
            value={bpm}
            onChange={(e) => {
              const newBpm = parseInt(e.target.value);
              setBpm(newBpm);
              Tone.Transport.bpm.value = newBpm;
              if (isMetronomeOn) {
                scheduleMetronome(); // re-sync on the fly
              }
            }}
          />
          <div className="bpm-label">{bpm} BPM</div>

          {!isMetronomeOn ? (
            <button className="loop-btn" onClick={startMetronome}>
              ▶ Start Metronome
            </button>
          ) : (
            <button className="loop-btn danger" onClick={stopMetronome}>
              ⏹ Stop Metronome
            </button>
          )}

          <div
            className={`metronome-indicator ${beatFlash ? "flash" : ""}`}
          ></div>
        </div>
        <div className="feature-default"></div>
        <div className="feature-default"></div>
      </div>
      <canvas ref={canvasRef} className="visualizer-canvas" />
    </div>
  );
};

export default Features;
