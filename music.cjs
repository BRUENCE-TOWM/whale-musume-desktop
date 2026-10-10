class ClickMusic {
  constructor(audio, notify = () => {}) {
    this.audio = audio; this.notify = notify; this.enabled = true;
    this.wantsPlayback = false; this.revision = 0;
    audio.loop = false;
    audio.addEventListener('ended', () => { this.wantsPlayback = false; });
  }
  configure({ enabled = this.enabled, volume = this.audio.volume } = {}) {
    this.enabled = enabled;
    this.audio.volume = Math.min(1, Math.max(0, volume));
    this.audio.loop = false;
    if (!enabled) this.pause();
  }
  toggle() {
    if (!this.enabled || !this.audio.getAttribute('src')) return;
    if (this.wantsPlayback || !this.audio.paused) this.pause();
    else void this.play();
  }
  async play() {
    if (!this.enabled || !this.audio.getAttribute('src')) return;
    if (this.audio.ended) this.audio.currentTime = 0;
    const revision = ++this.revision;
    this.wantsPlayback = true;
    try {
      await this.audio.play();
      if (!this.wantsPlayback || !this.enabled) this.audio.pause();
    } catch (error) {
      if (revision !== this.revision) return;
      this.wantsPlayback = false;
      if (error.name !== 'AbortError') this.notify('音乐播放失败：' + error.message);
    }
  }
  pause() { this.wantsPlayback = false; this.revision++; this.audio.pause(); }
  select(url) {
    this.pause();
    if (url) this.audio.src = url;
    else { this.audio.removeAttribute('src'); this.audio.load(); }
    this.audio.currentTime = 0;
    this.audio.loop = false;
  }
}
module.exports = { ClickMusic };
