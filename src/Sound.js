import { Howl } from 'howler';
import { Sampler } from 'tone';

const soundMap = {
  snare: new Howl({ src: ['/sounds/snare.wav'], volume: 1 }),
  kick: new Howl({ src: ['/sounds/kick.wav'], volume: 1 }),
  hihat: new Howl({ src: ['/sounds/hihat.wav'], volume: 1 }),
  percussion: new Howl({ src: ['/sounds/percussion.wav'], volume: 1 }),
  cymbal: new Howl({ src: ['/sounds/cymbal.mp3'], volume: 0.5 }),
};

export const playSound = (type) => {
  soundMap[type]?.play();
};

export const tickSampler = new Sampler({
    urls: { C3: '/sounds/tick.mp3' },
    volume: -10, // ✅ here!
  }).toDestination();