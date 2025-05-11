import * as Tone from 'tone';

export enum SoundEffectType {
  HOVER = 'hover',
  CLICK = 'click',
  OPEN = 'open',
  SUCCESS = 'success',
  ERROR = 'error'
}

class SoundEffectService {
  private synth: Tone.PolySynth;
  private isMuted: boolean = false;
  private currentPreset: string = 'digital';
  
  // Available sound presets
  private soundPresets = {
    digital: {
      [SoundEffectType.HOVER]: { note: 'C5', duration: '32n', velocity: 0.2 },
      [SoundEffectType.CLICK]: { note: 'E5', duration: '16n', velocity: 0.3 },
      [SoundEffectType.OPEN]: { note: 'G5', duration: '8n', velocity: 0.4 },
      [SoundEffectType.SUCCESS]: { note: 'C6', duration: '4n', velocity: 0.5 },
      [SoundEffectType.ERROR]: { note: 'B3', duration: '8n', velocity: 0.5 }
    },
    minimal: {
      [SoundEffectType.HOVER]: { note: 'A4', duration: '64n', velocity: 0.1 },
      [SoundEffectType.CLICK]: { note: 'B4', duration: '32n', velocity: 0.2 },
      [SoundEffectType.OPEN]: { note: 'C5', duration: '16n', velocity: 0.3 },
      [SoundEffectType.SUCCESS]: { note: 'E5', duration: '8n', velocity: 0.3 },
      [SoundEffectType.ERROR]: { note: 'F3', duration: '16n', velocity: 0.3 }
    },
    sci_fi: {
      [SoundEffectType.HOVER]: { note: 'D6', duration: '64n', velocity: 0.15 },
      [SoundEffectType.CLICK]: { note: 'F6', duration: '32n', velocity: 0.25 },
      [SoundEffectType.OPEN]: { note: 'A6', duration: '16n', velocity: 0.35 },
      [SoundEffectType.SUCCESS]: { note: 'C7', duration: '8n', velocity: 0.4 },
      [SoundEffectType.ERROR]: { note: 'D#3', duration: '8n', velocity: 0.4 }
    }
  };

  constructor() {
    // Initialize Tone.js
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
    
    // Configure default synth settings
    this.synth.set({
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    });
    
    // Set initial volume
    this.synth.volume.value = -12; // Lower volume (-12dB)
    
    // Load settings from localStorage
    this.loadSettings();
  }

  // Play a sound effect
  public play(type: SoundEffectType): void {
    if (this.isMuted) return;
    
    try {
      const preset = this.soundPresets[this.currentPreset as keyof typeof this.soundPresets];
      const sound = preset[type];
      
      if (sound) {
        // Use setTimeout to avoid blocking the thread
        setTimeout(() => {
          this.synth.triggerAttackRelease(
            sound.note,
            sound.duration,
            Tone.now(),
            sound.velocity
          );
        }, 0);
      }
    } catch (error) {
      console.error('Error playing sound effect:', error);
    }
  }

  // Toggle mute/unmute
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.saveSettings();
    return this.isMuted;
  }

  // Set sound preset
  public setPreset(preset: string): void {
    if (preset in this.soundPresets) {
      this.currentPreset = preset;
      this.saveSettings();
    }
  }

  // Get current sound settings
  public getSettings(): { isMuted: boolean; currentPreset: string } {
    return {
      isMuted: this.isMuted,
      currentPreset: this.currentPreset
    };
  }

  // Get available presets
  public getPresets(): string[] {
    return Object.keys(this.soundPresets);
  }

  // Save settings to localStorage
  private saveSettings(): void {
    try {
      localStorage.setItem('soundSettings', JSON.stringify({
        isMuted: this.isMuted,
        currentPreset: this.currentPreset
      }));
    } catch (error) {
      console.error('Error saving sound settings:', error);
    }
  }

  // Load settings from localStorage
  private loadSettings(): void {
    try {
      const settings = localStorage.getItem('soundSettings');
      if (settings) {
        const { isMuted, currentPreset } = JSON.parse(settings);
        this.isMuted = isMuted;
        
        if (currentPreset in this.soundPresets) {
          this.currentPreset = currentPreset;
        }
      }
    } catch (error) {
      console.error('Error loading sound settings:', error);
    }
  }
}

// Export singleton instance
export const soundEffectService = new SoundEffectService(); 