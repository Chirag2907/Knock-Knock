import React, { useEffect, useRef, useState } from 'react';
import ReactSwitch from 'react-switch';

const WebcamFeed = ({ onDrumHit }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const COOLDOWN = 200;
  const lastPlayedRef = useRef({});
  const cameraRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const startCamera = () => {
    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (!results.multiHandLandmarks) {
        ctx.restore();
        return;
      }

      const now = Date.now();

      results.multiHandLandmarks.forEach((landmarks, index) => {
        window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, { color: '#0f0', lineWidth: 2 });
        window.drawLandmarks(ctx, landmarks, { color: '#f00', lineWidth: 1 });

        const handedness = results.multiHandedness?.[index]?.label?.toLowerCase() || `hand${index}`;
        const isBent = (tip, pip) => landmarks[tip].y > landmarks[pip].y;

        const fingerStates = {
          index: isBent(8, 6),
          middle: isBent(12, 10),
          ring: isBent(16, 14),
          pinky: isBent(20, 18),
          thumb: landmarks[4].y > landmarks[2].y,
        };

        const allBent = Object.values(fingerStates).every(Boolean);
        if (allBent) return;

        const fingers = {
          snare: fingerStates.index,
          kick: fingerStates.middle,
          hihat: fingerStates.ring,
          cymbal: fingerStates.pinky,
        };

        Object.entries(fingers).forEach(([sound, active]) => {
          const key = `${handedness}_${sound}`;
          if (active && (!lastPlayedRef.current[key] || now - lastPlayedRef.current[key] > COOLDOWN)) {
            onDrumHit(sound);
            lastPlayedRef.current[key] = now;
          }
        });

        const thumbTip = landmarks[4];
        const middleBase = landmarks[9];
        const dist = Math.hypot(thumbTip.x - middleBase.x, thumbTip.y - middleBase.y);
        const percussionKey = `${handedness}_percussion`;

        if (dist < 0.07 && (!lastPlayedRef.current[percussionKey] || now - lastPlayedRef.current[percussionKey] > COOLDOWN)) {
          onDrumHit('percussion');
          lastPlayedRef.current[percussionKey] = now;
        }
      });

      ctx.restore();
    });

    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start();
    cameraRef.current = camera;
  };

  const stopCamera = () => {
    cameraRef.current?.stop();
    setIsCameraOn(false);
  };

  const resumeCamera = () => {
    startCamera();
    setIsCameraOn(true);
  };

  useEffect(() => {
    startCamera();
    return () => {
      cameraRef.current?.stop();
    };
  }, []);

  return (
    <div className="drum-wrapper">
      <video ref={videoRef} className="hidden" style={{ display: 'none' }}></video>

      <div style={{ position: 'relative' }}>
      {isCameraOn ? (
        <canvas ref={canvasRef} className="drum-canvas" width={640} height={480} />
      ) : (
        <div
          style={{
            width: 640,
            height: 480,
            backgroundColor: '#111',
            color: '#aaa',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontStyle: 'italic',
            border: '5px #555',
          }}
        >
          Camera is off
        </div>
      )}


<div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: '6px',
        gap: '8px',
        }}>
        <label style={{ color: '#fff', fontSize: '0.9rem' }}>Camera</label>
        <ReactSwitch
            onChange={isCameraOn ? stopCamera : resumeCamera}
            checked={isCameraOn}
            onColor="#00ff99"
            offColor="#888"
            uncheckedIcon={false}
            checkedIcon={false}
            height={20}
            width={36}
            handleDiameter={20}
        />
        </div>

</div>

      

    </div>
  );
};

export default WebcamFeed;
