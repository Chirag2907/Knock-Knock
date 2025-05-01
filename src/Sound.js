import { Howl, Howler } from 'howler';
import { Sampler } from 'tone';

export let analyser = null;

export const soundMap = {
  snare: new Howl({ src: ['/sounds/snare.wav'], volume: 1 }),
  kick: new Howl({ src: ['/sounds/kick.wav'], volume: 1 }),
  hihat: new Howl({ src: ['/sounds/hihat.wav'], volume: 1 }),
  percussion: new Howl({ src: ['/sounds/percussion.wav'], volume: 1 }),
  cymbal: new Howl({ src: ['/sounds/cymbal.mp3'], volume: 1 }),
};

export const playSound = (type) => {
  const sound = soundMap[type];
  if (sound) {
    sound.play();
    if (!analyser && Howler.ctx) {
      analyser = Howler.ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      Howler.masterGain.connect(analyser);
    }
  }
};

export const tickSampler = new Sampler({
  urls: { C3: '/sounds/tick.mp3' },
  volume: -10,
}).toDestination();
