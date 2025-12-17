
export class AudioService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;

  constructor() {}

  init(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.audioContext) {
          this.audioContext.close();
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
        this.audioElement = new Audio();
        
        const objectUrl = URL.createObjectURL(file);
        this.audioElement.src = objectUrl;
        this.audioElement.loop = true;

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 512;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        this.source = this.audioContext.createMediaElementSource(this.audioElement);
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.audioElement.play().then(() => resolve()).catch(reject);
      } catch (e) {
        reject(e);
      }
    });
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  play() {
    if (this.audioElement && this.audioContext) {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      this.audioElement.play();
    }
  }

  getFrequencyData() {
    if (!this.analyser || !this.dataArray) return { bass: 0, mid: 0, treble: 0 };
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate averages for bands
    const bufferLength = this.analyser.frequencyBinCount;
    const bassRange = Math.floor(bufferLength * 0.1); // Low freq
    const midRange = Math.floor(bufferLength * 0.5);  // Mid freq
    
    let bass = 0, mid = 0, treble = 0;

    for(let i = 0; i < bufferLength; i++) {
      const val = this.dataArray[i] / 255.0;
      if (i < bassRange) bass += val;
      else if (i < midRange) mid += val;
      else treble += val;
    }

    bass /= bassRange;
    mid /= (midRange - bassRange);
    treble /= (bufferLength - midRange);

    return { bass, mid, treble };
  }

  resume() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export const audioService = new AudioService();
