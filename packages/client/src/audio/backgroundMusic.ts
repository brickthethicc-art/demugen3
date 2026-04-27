class BackgroundMusic {
  private audio: HTMLAudioElement | null = null;
  private initialized: boolean = false;

  init() {
    if (this.initialized) return;
    
    this.audio = new Audio('/assets/audio/background.mp3');
    this.audio.loop = true;
    this.audio.volume = 0.10;
    
    const playPromise = this.audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        document.addEventListener('click', this.startOnFirstInteraction, { once: true });
      });
    }
    
    this.initialized = true;
  }

  private startOnFirstInteraction = () => {
    if (this.audio) {
      this.audio.play();
    }
  };
}

export const backgroundMusic = new BackgroundMusic();
