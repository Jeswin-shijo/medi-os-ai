// Chime and spoken call-outs for the waiting-room display. Browsers play sound only
// after someone has clicked or pressed a key on the page, so `unlock` runs on the
// first interaction; until then calls are shown but not heard.

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** "A12" → "A 12", so a voice reads the letter and then the number. */
const spoken = (label: string) => label.replace(/^([A-Z-]+)(\d+)$/, '$1 $2');

export class Announcer {
  private audio: AudioContext | null = null;
  private queue: Promise<void> = Promise.resolve();

  get unlocked() {
    return this.audio?.state === 'running';
  }

  /** Call from a click or key handler. */
  async unlock() {
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    this.audio ??= new Context();
    await this.audio.resume().catch(() => undefined);
    // Some browsers also gate speech on a gesture; an empty utterance opens it.
    if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
  }

  /** Queued, so two calls a moment apart are announced one after the other. */
  announce(label: string, counter: string) {
    this.queue = this.queue
      .then(() => this.chime())
      .then(() => this.say(`Token number ${spoken(label)}, please go to ${counter}.`))
      .catch(() => undefined);
  }

  private chime(): Promise<void> {
    const ctx = this.audio;
    if (!ctx || ctx.state !== 'running') return Promise.resolve();
    const start = ctx.currentTime;
    // Two falling notes (E5, C5), each with a soft attack and a long decay.
    for (const [frequency, offset] of [
      [659.25, 0],
      [523.25, 0.42]
    ]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.35, start + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start + offset);
      osc.stop(start + offset + 0.95);
    }
    return wait(1400);
  }

  private say(text: string): Promise<void> {
    if (!this.unlocked || !('speechSynthesis' in window)) return Promise.resolve();
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((v) => v.lang === 'en-IN') ?? voices.find((v) => v.lang.startsWith('en'));
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang ?? 'en-IN';
      utterance.rate = 0.9;
      const done = () => resolve();
      utterance.onend = done;
      utterance.onerror = done;
      window.setTimeout(done, 9000); // a voice that never reports the end must not stall the queue
      window.speechSynthesis.speak(utterance);
    });
  }
}
