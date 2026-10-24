// Small synthesized effects keep the game self-contained and respect mute preferences.
export function createAudio() {
  let context = null,
    enabled = false,
    last = 0;
  return {
    enable(value) {
      enabled = value;
      if (enabled) {
        try {
          context ??= new (window.AudioContext || window.webkitAudioContext)();
          context.resume();
        } catch {}
      }
    },
    play(type = "click") {
      if (
        !enabled ||
        !context ||
        context.state !== "running" ||
        context.currentTime - last < 0.045
      )
        return;
      last = context.currentTime;
      const time = context.currentTime;
      const tones = {
        arrow: [460, 200, 0.06, "triangle"],
        cannon: [110, 40, 0.2, "sawtooth"],
        frost: [920, 500, 0.15, "sine"],
        storm: [230, 80, 0.16, "sawtooth"],
        kill: [740, 1100, 0.09, "sine"],
        click: [500, 700, 0.07, "sine"],
        meteor: [140, 35, 0.4, "sawtooth"],
        heal: [450, 900, 0.3, "sine"],
      };
      const [from, to, duration, wave] = tones[type] || tones.click;
      const osc = context.createOscillator(),
        gain = context.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(from, time);
      osc.frequency.exponentialRampToValueAtTime(to, time + duration);
      gain.gain.setValueAtTime(type === "cannon" ? 0.025 : 0.018, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(time);
      osc.stop(time + duration);
    },
    dispose() {
      context?.close();
      context = null;
    },
  };
}
