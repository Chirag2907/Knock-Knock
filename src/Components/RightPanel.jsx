import React from "react";
import { useState, useRef } from "react";
import { soundMap } from "../Sound";
import "../Styles/RightPanel.css";

const RightPanel = ({
  loops,
  setLoops,
  isRecordingRef,
  loopStart,
  setCurrentRecording,
  currentRecording,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const nextLoopId = useRef(1);
  const anyLoopPlaying = loops.some((loop) => loop.isPlaying);
  const loopIntervals = useRef({});
  const loopTimeouts = useRef({});

  const getLoopDuration = (events) => {
    if (events.length === 0) return 1000;
    return Math.max(...events.map((e) => e.time)) + 500;
  };

  const playLoopNow = (loop) => {
    loopTimeouts.current[loop.id] = [];

    loop.events.forEach(({ sound, time, volume }) => {
      const timeoutId = setTimeout(() => {
        const howl = soundMap[sound];
        if (howl) {
          const prevVol = howl.volume();
          howl.volume(volume || 1);
          howl.play();
          howl.volume(prevVol);
        }
      }, time + 50);

      loopTimeouts.current[loop.id].push(timeoutId);
    });
  };

  const toggleLoopPlayback = (loopId) => {
    const loopToPlay = loops.find((loop) => loop.id === loopId);
    if (!loopToPlay) return;

    if (!loopToPlay.isPlaying) {
      playLoopNow(loopToPlay);

      const intervalId = setInterval(() => {
        playLoopNow(loopToPlay);
      }, getLoopDuration(loopToPlay.events));

      loopIntervals.current[loopId] = intervalId;

      setLoops((prev) =>
        prev.map((loop) =>
          loop.id === loopId ? { ...loop, isPlaying: true } : loop
        )
      );
    } else {
      clearInterval(loopIntervals.current[loopId]);
      delete loopIntervals.current[loopId];

      if (loopTimeouts.current[loopId]) {
        loopTimeouts.current[loopId].forEach(clearTimeout);
        delete loopTimeouts.current[loopId];
      }

      setLoops((prev) =>
        prev.map((loop) =>
          loop.id === loopId ? { ...loop, isPlaying: false } : loop
        )
      );
    }
  };

  const toggleAllLoops = () => {
    if (anyLoopPlaying) {
      loops.forEach((loop) => {
        if (loop.isPlaying) toggleLoopPlayback(loop.id);
      });
    } else {
      loops.forEach((loop) => {
        if (!loop.isPlaying) toggleLoopPlayback(loop.id);
      });
    }
  };

  const updateLoopName = (id, newName) => {
    setLoops((prev) =>
      prev.map((loop) => (loop.id === id ? { ...loop, name: newName } : loop))
    );
  };

  const deleteLoop = (id) => {
    if (loopIntervals.current[id]) {
      clearInterval(loopIntervals.current[id]);
      delete loopIntervals.current[id];
    }
    setLoops((prev) => prev.filter((loop) => loop.id !== id));
  };

  const toggleRecording = () => {
    if (!isRecordingRef.current) {
      loopStart.current = Date.now();
      setCurrentRecording([]);
    } else {
      const newLoop = {
        id: nextLoopId.current++,
        name: `Recording #${nextLoopId.current - 1}`,
        events: currentRecording,
        isPlaying: false,
      };
      setLoops((prev) => [...prev, newLoop]);
    }

    isRecordingRef.current = !isRecordingRef.current;
    setIsRecording(isRecordingRef.current);
  };

  return (
      <div className="right-panel">
        <h2 className="loop-heading"> Recorder</h2>
        <button className="loop-btn" onClick={toggleRecording}>
          {isRecording ? "⏹ Stop" : "⏺ Record"}
        </button>

        <button
          className="loop-btn"
          onClick={toggleAllLoops}
          disabled={loops.length === 0}
        >
          {anyLoopPlaying ? "⏹ Stop All" : "▶ Play All"}
        </button>

        {loops.map((loop) => (
          <div key={loop.id} className="loop-card">
            <input
              value={loop.name}
              onChange={(e) => updateLoopName(loop.id, e.target.value)}
              className="loop-name"
            />
            <button
              onClick={() => toggleLoopPlayback(loop.id)}
              className="loop-btn"
            >
              {loop.isPlaying ? "⏹ Stop Loop" : "▶️ Loop"}
            </button>
            <button
              onClick={() => deleteLoop(loop.id)}
              className="loop-btn danger"
            >
              ❌ Delete
            </button>
          </div>
        ))}
        {loops.length === 0 && (
          <div className="empty-placeholder">
            No recordings yet. Start recording to create a loop!
          </div>
        )}
      </div>
  );
};

export default RightPanel;
