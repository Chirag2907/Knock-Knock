import React from 'react';
import WebcamFeed from './Components/WebcamFeed';
import './App.css';
import { useState, useRef } from 'react';
import { playSound } from './Sound';
import * as Tone from 'tone';
import { tickSampler } from './Sound';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecording, setCurrentRecording] = useState([]);
  const [loops, setLoops] = useState([]);
  const loopStart = useRef(0);
  const isRecordingRef = useRef(false);
  const nextLoopId = useRef(1);
  const loopIntervals = useRef({});

  const [bpm, setBpm] = useState(120);
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const [beatFlash, setBeatFlash] = useState(false);
  
  const scheduleMetronome = () => {
    Tone.Transport.cancel(); // clear previous ticks
    Tone.Transport.scheduleRepeat((time) => {
      tickSampler.triggerAttackRelease('C3', '8n', time);
      setBeatFlash(true);
      setTimeout(() => setBeatFlash(false), 100);
    }, '4n');
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

  const toggleRecording = () => {
    if (!isRecordingRef.current) {
      loopStart.current = Date.now();
      setCurrentRecording([]);
    } else {
      const newLoop = {
        id: nextLoopId.current++,
        name: `Loop ${nextLoopId.current - 1}`,
        events: currentRecording,
        isPlaying: false,
      };
      setLoops((prev) => [...prev, newLoop]);
    }

    isRecordingRef.current = !isRecordingRef.current;
    setIsRecording(isRecordingRef.current);
  };

  const handleDrumHit = (sound) => {
    playSound(sound);

    if (isRecordingRef.current) {
      const now = Date.now();
      const entry = { sound, time: now - loopStart.current };
      setCurrentRecording((prev) => [...prev, entry]);
    }
  };

  const getLoopDuration = (events) => {
    if (events.length === 0) return 1000;
    return Math.max(...events.map((e) => e.time)) + 500;
  };

  const playLoopNow = (loop) => {
    loop.events.forEach(({ sound, time }) => {
      setTimeout(() => playSound(sound), time + 50); // 50ms latency fix
    });
  };

  const toggleLoopPlayback = (loopId) => {
    const loopToPlay = loops.find((loop) => loop.id === loopId);
    if (!loopToPlay) return;

    if (!loopToPlay.isPlaying) {
      playLoopNow(loopToPlay); // 🔥 play immediately

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

      setLoops((prev) =>
        prev.map((loop) =>
          loop.id === loopId ? { ...loop, isPlaying: false } : loop
        )
      );
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

  return (
    <div className="app-root">
      <nav className="navbar">
        <div className="logo">🥁 Knock Knock</div>
      </nav>

      <div className="main-content">
        <div className="left-panel">
          <h2>Instructions</h2>
          {['Index → Snare', 'Middle → Kick', 'Ring → Hi-hat', 'Pinky → Cymbal', 'Thumb → Percussion'].map((txt, i) => (
            <div className="instruction-card" key={i}>
              <img src={`/fingers/${txt.split(' ')[0].toLowerCase()}.png`} className="finger-img" alt={txt} />
              <div>{txt}</div>
            </div>
          ))}
        </div>

        <div className="center-panel">
          <WebcamFeed onDrumHit={handleDrumHit} />
          <div className="metronome-controls">
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
              <button className="loop-btn" onClick={startMetronome}>▶ Start Metronome</button>
            ) : (
              <button className="loop-btn danger" onClick={stopMetronome}>⏹ Stop Metronome</button>
            )}

            <div className={`metronome-indicator ${beatFlash ? 'flash' : ''}`}></div>
          </div>

        </div>


        <div className="right-panel">
          <h2>Loop Recorder</h2>
          <button className="loop-btn" onClick={toggleRecording}>
            {isRecording ? '⏹ Stop' : '⏺ Record'}
          </button>

          {loops.map((loop) => (
            <div key={loop.id} className="loop-card">
              <input
                value={loop.name}
                onChange={(e) => updateLoopName(loop.id, e.target.value)}
                className="loop-name"
              />
              <button onClick={() => toggleLoopPlayback(loop.id)} className="loop-btn">
                {loop.isPlaying ? '⏹ Stop Loop' : '▶️ Loop'}
              </button>
              <button onClick={() => deleteLoop(loop.id)} className="loop-btn danger">❌ Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
