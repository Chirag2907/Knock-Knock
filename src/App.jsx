import React from "react";
import WebcamFeed from "./Components/WebcamFeed";
import "./App.css";
import { useState, useRef } from "react";
import { playSound } from "./Sound";
import Features from "./Components/Features";
import LeftPanel from "./Components/LeftPanel";
import RightPanel from "./Components/RightPanel";

function App() {
  const [currentRecording, setCurrentRecording] = useState([]);
  const [loops, setLoops] = useState([]);
  const loopStart = useRef(0);
  const isRecordingRef = useRef(false);
  const [volumes, setVolumes] = useState({
    snare: 0.5,
    kick: 0.5,
    hihat: 0.5,
    cymbal: 0.5,
    percussion: 0.5,
  });

  const handleDrumHit = (sound) => {
    playSound(sound);

    if (isRecordingRef.current) {
      const now = Date.now();
      const entry = {
        sound,
        time: now - loopStart.current,
        volume: volumes[sound], // 🎯 save snapshot of volume
      };
      setCurrentRecording((prev) => [...prev, entry]);
    }
  };

  return (
    <div className="app-root">
      <nav className="navbar">
        <div className="logo">🥁 Knock Knock</div>
      </nav>

      <div className="main-content">
        <div className="left-panel">
          <LeftPanel volumes={volumes} setVolumes={setVolumes} />
        </div>

        <div className="center-panel">
          <WebcamFeed onDrumHit={handleDrumHit} />
          <Features loops={loops} />
        </div>

        <RightPanel
          loops={loops}
          setLoops={setLoops}
          isRecordingRef={isRecordingRef}
          loopStart={loopStart}
          setCurrentRecording={setCurrentRecording}
          currentRecording={currentRecording}
        />
      </div>
    </div>
  );
}

export default App;
