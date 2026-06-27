// AudioManager singleton for sound effects
// Uses Web Audio API with lazy initialization

interface SoundConfig {
  src: string;
  volume: number;
}

const sounds: Record<string, SoundConfig> = {
  'add-to-cart': { src: '/sounds/pop.mp3', volume: 0.3 },
  'purchase-success': { src: '/sounds/cha-ching.mp3', volume: 0.5 },
  'achievement-unlock': { src: '/sounds/fanfare.mp3', volume: 0.6 },
  'error': { src: '/sounds/buzzer.mp3', volume: 0.3 },
};

class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private soundEnabled: boolean = true;
  private globalVolume: number = 1.0;
  private maxBuffers: number = 5;
  private accessOrder: string[] = [];

  private constructor() {
    const saved = localStorage.getItem('dopamine-sound-settings');
    if (saved) {
      const settings = JSON.parse(saved);
      this.soundEnabled = settings.enabled ?? true;
      this.globalVolume = settings.volume ?? 1.0;
    }
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private async initContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  private async loadBuffer(name: string): Promise<AudioBuffer | null> {
    if (this.buffers.has(name)) {
      this.accessOrder = this.accessOrder.filter((n) => n !== name);
      this.accessOrder.push(name);
      return this.buffers.get(name)!;
    }

    const config = sounds[name];
    if (!config) return null;

    try {
      const response = await fetch(config.src);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = this.audioContext || new AudioContext();
      const buffer = await audioContext.decodeAudioData(arrayBuffer);

      if (this.buffers.size >= this.maxBuffers) {
        const oldest = this.accessOrder.shift();
        if (oldest) this.buffers.delete(oldest);
      }

      this.buffers.set(name, buffer);
      this.accessOrder.push(name);
      return buffer;
    } catch (err) {
      console.warn(`Failed to load sound: ${name}`, err);
      return null;
    }
  }

  async play(name: string) {
    if (!this.soundEnabled) return;
    await this.initContext();
    const buffer = await this.loadBuffer(name);
    if (!buffer || !this.audioContext) return;

    const config = sounds[name];
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = config.volume * this.globalVolume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start(0);
  }

  setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    this.saveSettings();
  }

  setVolume(volume: number) {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  private saveSettings() {
    localStorage.setItem('dopamine-sound-settings', JSON.stringify({
      enabled: this.soundEnabled,
      volume: this.globalVolume,
    }));
  }

  getSettings() {
    return { enabled: this.soundEnabled, volume: this.globalVolume };
  }
}

export const audioManager = AudioManager.getInstance();

export function useAudio() {
  return {
    play: (name: string) => audioManager.play(name),
    setEnabled: (enabled: boolean) => audioManager.setEnabled(enabled),
    setVolume: (volume: number) => audioManager.setVolume(volume),
    getSettings: () => audioManager.getSettings(),
  };
}
