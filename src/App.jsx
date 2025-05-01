import React from 'react';
import WebcamFeed from './Components/WebcamFeed';
import './App.css';
import { useState, useRef } from 'react';
import { playSound } from './Sound';
import { soundMap } from './Sound';
import Features from './Components/Features';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecording, setCurrentRecording] = useState([]);
  const [loops, setLoops] = useState([]);
  const loopStart = useRef(0);
  const isRecordingRef = useRef(false);
  const nextLoopId = useRef(1);
  const loopIntervals = useRef({});


  const anyLoopPlaying = loops.some(loop => loop.isPlaying);
  const loopTimeouts = useRef({});

  const [volumes, setVolumes] = useState({
    snare: 0.5,
    kick: 0.5,
    hihat: 0.5,
    cymbal: 0.5,
    percussion: 0.5,
  });
  const handleVolumeChange = (type, newVal) => {
    const floatVal = parseFloat(newVal);
    soundMap[type].volume(floatVal); // update actual volume
    setVolumes((prev) => ({
      ...prev,
      [type]: floatVal, // ✅ update state so slider reflects
    }));
  };
  
  
  
  const toggleAllLoops = () => {
    if (anyLoopPlaying) {
      // Stop all
      loops.forEach((loop) => {
        if (loop.isPlaying) toggleLoopPlayback(loop.id);
      });
    } else {
      // Play all
      loops.forEach((loop) => {
        if (!loop.isPlaying) toggleLoopPlayback(loop.id);
      });
    }
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
  
      loopTimeouts.current[loop.id].push(timeoutId); // ⏺️ store it
    });
  };
  

  const toggleLoopPlayback = (loopId) => {
    const loopToPlay = loops.find((loop) => loop.id === loopId);
    if (!loopToPlay) return;
  
    if (!loopToPlay.isPlaying) {
      // ✅ Start playback
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
      // ✅ Stop playback
      clearInterval(loopIntervals.current[loopId]);
      delete loopIntervals.current[loopId];
  
      // ✅ Cancel any scheduled timeouts
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
        <h2>Drums</h2>
        {[
          { name: 'Snare', key: 'snare', finger: 'index' },
          { name: 'Kick', key: 'kick', finger: 'middle' },
          { name: 'Hi-hat', key: 'hihat', finger: 'ring' },
          { name: 'Cymbal', key: 'cymbal', finger: 'pinky' },
          { name: 'Percussion', key: 'percussion', finger: 'thumb' },
        ].map(({ name, key, finger }) => (
          <div className="instruction-card" key={key}>
            <div className="instruction-left">
              <img src={`/fingers/${finger}.png`} className="finger-img" alt={name} />
            </div>
            <div className='name-volume'>
              <div>{finger.charAt(0).toUpperCase() + finger.slice(1)} → {name}</div>
              <div className="volume-percent">Volume: {Math.round(volumes[key] * 200)}%</div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volumes[key]}
                onChange={(e) => handleVolumeChange(key, e.target.value)}
                className="volume-slider"
              />
            </div>
            
          </div>
        ))}
      </div>

        <div className="center-panel">
          <WebcamFeed onDrumHit={handleDrumHit} />
          
          <Features loops={loops} />
       

        </div>


        <div className="right-panel">
          <h2 className='loop-heading'> Recorder</h2>
          <button className="loop-btn" onClick={toggleRecording}>
            {isRecording ? '⏹ Stop' : '⏺ Record'}
          </button>

          <button
            className="loop-btn"
            onClick={toggleAllLoops}
            disabled={loops.length === 0}
          >
            {anyLoopPlaying ? '⏹ Stop All' : '▶ Play All'}
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
          {loops.length === 0 && (
            <div className="empty-placeholder">
              No recordings yet. Start recording to create a loop!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
