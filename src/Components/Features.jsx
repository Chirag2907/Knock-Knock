import React from "react";
import { useState } from "react";
import { playSound, tickSampler } from "../Sound";
import * as Tone from "tone";
import "../Styles/Features.css";
import { useRef, useEffect } from "react";
import { analyser } from "../Sound";
import { Howler } from "howler";
import { soundMap } from "../Sound";

const Features = ({ loops }) => {
  const [bpm, setBpm] = useState(120);
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const [beatFlash, setBeatFlash] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportAllLoopsAutomatically = (loops) => {
    if (loops.length === 0) return;

    setIsExporting(true);

    const ctx = Howler.ctx;
    const dest = ctx.createMediaStreamDestination();
    const recorder = new MediaRecorder(dest.stream);
    Howler.masterGain.connect(dest);

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "knock-knock-export.webm";
      a.click();
      console.log("✅ Exported and downloaded");
    };

    recorder.start();
    console.log("🎙 Recording all loops...");

    const allEvents = loops.flatMap((loop) =>
      loop.events.map((e) => ({ ...e }))
    );

    allEvents.sort((a, b) => a.time - b.time);

    allEvents.forEach(({ sound, time, volume }) => {
      setTimeout(() => {
        const sfx = soundMap[sound];
        if (sfx) {
          sfx.volume(volume ?? 1);
          sfx.play();
        }
      }, time + 50);
    });

    const duration = Math.max(...allEvents.map((e) => e.time)) + 500;

    setTimeout(() => {
      recorder.stop();
    }, duration);

    setTimeout(() => {
      recorder.stop();
      setIsExporting(false); // ✅ hide prompt after export
    }, duration);
  };

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
      {isExporting && (
        <div className="export-overlay">
          <div className="export-message">
            🎧 Exporting your beat...
            <div className="loader"></div>
          </div>
        </div>
      )}

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
        
        <div className="feature-default">
          <h3>Export</h3>
          <p>Export all loops as a single audio file.</p>
          <button
            className="loop-btn"
            onClick={() => exportAllLoopsAutomatically(loops)}
            disabled={loops.length === 0}
          >
            📦 Export All Loops
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="visualizer-canvas" />
    </div>
  );
};

export default Features;
