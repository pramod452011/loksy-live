/**
 * LOKSY Web Audio & Ambient Soundtrack Engine
 * Provides authentic, rich procedural audio and melodic background soundtracks
 * for Reels, Stories, and Video Posts when sound is enabled.
 * Fully compliant with browser Autoplay policies (lazy-initialized on user interaction).
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private currentTrackType: string = 'lofi';
  private gainNode: GainNode | null = null;
  private intervalId: number | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.gainNode && this.ctx) {
      const now = this.ctx.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setTargetAtTime(muted ? 0 : 0.15, now, 0.05);
    }
  }

  public playSoundtrack(title: string = 'Lofi Chill', mood: 'lofi' | 'folk' | 'dance' | 'ambient' = 'lofi') {
    this.initContext();
    if (!this.ctx) return;

    this.stopSoundtrack();
    this.isRunning = true;
    this.currentTrackType = mood;

    // Master gain
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : 0.15, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    // Warm Low-pass filter for smooth vinyl/desi chill warmth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.connect(this.gainNode);

    // Musical scale notes (Pentatonic / Raga Bhupali / Desi Folk frequencies)
    // C4, D4, E4, G4, A4, C5, D5, E5
    const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
    let noteIndex = 0;

    const playChime = () => {
      if (!this.ctx || !this.isRunning || !this.gainNode) return;

      try {
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        // Warm triangle or sine waveform
        osc.type = mood === 'folk' ? 'triangle' : mood === 'ambient' ? 'sine' : 'triangle';
        
        // Melodic pattern based on title hash + sequential progression
        const freq = notes[noteIndex % notes.length];
        noteIndex = (noteIndex + (title.length % 3) + 1) % notes.length;

        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        const now = this.ctx.currentTime;
        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(0.08, now + 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(noteGain);
        noteGain.connect(filter);

        osc.start(now);
        osc.stop(now + 1.3);

        this.activeOscillators.push(osc);
        osc.onended = () => {
          this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
        };
      } catch (err) {
        // quiet fallback
      }
    };

    // Play first note immediately
    playChime();

    // Loop rhythmically (approx 60-80 BPM chill tempo)
    const stepDuration = mood === 'dance' ? 450 : mood === 'folk' ? 650 : 800;
    this.intervalId = window.setInterval(playChime, stepDuration);
  }

  public stopSoundtrack() {
    this.isRunning = false;
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.activeOscillators = [];

    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.disconnect();
      } catch (e) {}
      this.gainNode = null;
    }
  }

  public playTapFeedback() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }
}

export const soundManager = new AudioEngine();
