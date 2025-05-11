import { STORAGE_KEYS } from '../constants/storage';

// Sound effect types
export enum SoundEffectType {
  HOVER = 'hover',
  CLICK = 'click',
  OPEN = 'open',
  SUCCESS = 'success',
  ERROR = 'error'
}

// Sound settings interface
interface SoundSettings {
  isMuted: boolean;
  currentPreset: string;
}

class SoundEffectService {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isMuted: boolean = false;
  private currentPreset: string = 'digital';
  private isInitialized: boolean = false;

  constructor() {
    // Load settings from localStorage
    this.loadSettings();
  }

  // Initialize audio context safely
  private initializeAudioContext(): void {
    if (this.isInitialized) return;
    
    try {
      // Create audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
  }

  // Play a sound effect
  public play(type: SoundEffectType): void {
    // Don't try to play if muted or not initialized
    if (this.isMuted) return;
    
    // Initialize on first user interaction
    if (!this.isInitialized) {
      this.initializeAudioContext();
    }
    
    // Exit if we still don't have audio initialized
    if (!this.audioContext || !this.gainNode) return;
    
    // Resume audio context if it's suspended (browser requirement)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    try {
      // Configure sound based on type and preset
      let frequency = 440; // Default A4
      let waveType: OscillatorType = 'sine';
      let duration = 0.15;
      let gain = 0.1;
      
      // Configure based on sound type and preset
      switch(type) {
        case SoundEffectType.HOVER:
          frequency = this.currentPreset === 'digital' ? 440 : 
                      this.currentPreset === 'minimal' ? 880 : 660;
          waveType = this.currentPreset === 'sci_fi' ? 'sawtooth' : 'sine';
          gain = 0.05;
          duration = 0.1;
          break;
          
        case SoundEffectType.CLICK:
          frequency = this.currentPreset === 'digital' ? 523.25 : 
                      this.currentPreset === 'minimal' ? 660 : 587.33;
          waveType = this.currentPreset === 'digital' ? 'triangle' : 
                     this.currentPreset === 'sci_fi' ? 'square' : 'sine';
          gain = 0.1;
          duration = 0.15;
          break;
          
        case SoundEffectType.SUCCESS:
          frequency = this.currentPreset === 'digital' ? 587.33 : 
                      this.currentPreset === 'minimal' ? 784 : 880;
          waveType = 'sine';
          gain = 0.15;
          duration = 0.2;
          break;
          
        case SoundEffectType.OPEN:
          frequency = this.currentPreset === 'digital' ? 659.25 : 
                      this.currentPreset === 'minimal' ? 523.25 : 783.99;
          waveType = this.currentPreset === 'sci_fi' ? 'sawtooth' : 'sine';
          gain = 0.15;
          duration = 0.2;
          break;
          
        case SoundEffectType.ERROR:
          frequency = this.currentPreset === 'digital' ? 196 : 
                     this.currentPreset === 'minimal' ? 220 : 185;
          waveType = this.currentPreset === 'sci_fi' ? 'square' : 'triangle';
          gain = 0.15;
          duration = 0.3;
          break;
      }
      
      // Create and configure oscillator
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.type = waveType;
      oscillator.frequency.value = frequency;
      gainNode.gain.value = gain;
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(this.gainNode);
      
      // Play for specified duration
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration);
      
      // Clean up
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    } catch (error) {
      console.error(`Error playing sound of type ${type}:`, error);
    }
  }

  // Toggle mute
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.saveSettings();
    return this.isMuted;
  }

  // Get sound settings
  public getSettings(): SoundSettings {
    return {
      isMuted: this.isMuted,
      currentPreset: this.currentPreset
    };
  }

  // Set sound preset
  public setPreset(preset: string): void {
    if (['digital', 'minimal', 'sci_fi'].includes(preset)) {
      this.currentPreset = preset;
      this.saveSettings();
    }
  }

  // Save settings to localStorage
  private saveSettings(): void {
    try {
      const settings: SoundSettings = {
        isMuted: this.isMuted,
        currentPreset: this.currentPreset
      };
      localStorage.setItem(STORAGE_KEYS.SOUND_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving sound settings:', error);
    }
  }

  // Load settings from localStorage
  private loadSettings(): void {
    try {
      const settingsString = localStorage.getItem(STORAGE_KEYS.SOUND_SETTINGS);
      if (settingsString) {
        const settings: SoundSettings = JSON.parse(settingsString);
        this.isMuted = settings.isMuted;
        
        if (settings.currentPreset && ['digital', 'minimal', 'sci_fi'].includes(settings.currentPreset)) {
          this.currentPreset = settings.currentPreset;
        }
      }
    } catch (error) {
      console.error('Error loading sound settings:', error);
    }
  }
}

// Create singleton instance
export const soundEffectService = new SoundEffectService(); 