import React from 'react'
import { soundMap } from '../Sound'
import "../App.css";


const Drums = ({volumes, setVolumes}) => {

      const handleVolumeChange = (type, newVal) => {
        const floatVal = parseFloat(newVal);
        soundMap[type].volume(floatVal); // update actual volume
        setVolumes((prev) => ({
          ...prev,
          [type]: floatVal, // ✅ update state so slider reflects
        }));
      };
  return (
    <>
        <h2>Drums</h2>
          {[
            { name: "Snare", key: "snare", finger: "index" },
            { name: "Kick", key: "kick", finger: "middle" },
            { name: "Hi-hat", key: "hihat", finger: "ring" },
            { name: "Cymbal", key: "cymbal", finger: "pinky" },
            { name: "Percussion", key: "percussion", finger: "thumb" },
          ].map(({ name, key, finger }) => (
            <div className="instruction-card" key={key}>
              <div className="instruction-left">
                <img
                  src={`/fingers/${finger}.png`}
                  className="finger-img"
                  alt={name}
                />
              </div>
              <div className="name-volume">
                <div>
                  {finger.charAt(0).toUpperCase() + finger.slice(1)} → {name}
                </div>
                <div className="volume-percent">
                  Volume: {Math.round(volumes[key] * 200)}%
                </div>
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
    </>
  )
}

export default Drums