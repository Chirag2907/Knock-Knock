import React, { useEffect, useRef } from 'react';

const WebcamFeed = ({ onDrumHit }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const COOLDOWN = 200;
  const lastPlayedRef = useRef({});

  useEffect(() => {
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
        if (allBent) return; // mute on full fist

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
  }, []);

  return (
    <div className="drum-wrapper">
      <video ref={videoRef} className="hidden" style={{ display: 'none' }}></video>
      <canvas ref={canvasRef} className="drum-canvas" width={640} height={480} />
    </div>
  );
};

export default WebcamFeed;
