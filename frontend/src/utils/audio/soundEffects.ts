// Web Audio API Sound Effects Engine (zero-latency, no external assets needed)

class SoundEffectsEngine {
    private audioCtx: AudioContext | null = null;
    private muted: boolean = false;
    private listeners: Set<(muted: boolean) => void> = new Set();

    constructor() {
        if (typeof window !== 'undefined') {
            this.muted = localStorage.getItem('songuess_sfx_muted') === 'true';
        }
    }

    private getContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.audioCtx) {
            const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtxClass) {
                this.audioCtx = new AudioCtxClass();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => {});
        }
        return this.audioCtx;
    }

    public isMuted(): boolean {
        return this.muted;
    }

    public setMuted(muted: boolean): void {
        this.muted = muted;
        if (typeof window !== 'undefined') {
            localStorage.setItem('songuess_sfx_muted', String(muted));
        }
        this.listeners.forEach((listener) => listener(this.muted));
    }

    public toggleMute(): boolean {
        this.setMuted(!this.muted);
        return this.muted;
    }

    public onMuteChange(listener: (muted: boolean) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    // Тікання таймера на останніх секундах (частота збільшується з наближенням 0)
    public playTick(secondsLeft: number): void {
        if (this.muted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // 3s -> 800Hz, 2s -> 1050Hz, 1s -> 1350Hz
        const baseFreq = secondsLeft <= 1 ? 1350 : secondsLeft <= 2 ? 1050 : 800;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    }

    // Приємний дзвін при правильній відповіді (гармонійний мажорний акорд)
    public playCorrect(): void {
        if (this.muted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            gain.gain.setValueAtTime(0, now + idx * 0.06);
            gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.06 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.35);
        });
    }

    // М'який спадний тон при неправильній відповіді
    public playIncorrect(): void {
        if (this.muted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.3);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    // Стрік-бонус: динамічне висхідне арпеджіо
    public playStreak(streakCount: number): void {
        if (this.muted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const baseNotes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
        const count = Math.min(baseNotes.length, 2 + streakCount);

        for (let i = 0; i < count; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseNotes[i % baseNotes.length], now + i * 0.07);

            gain.gain.setValueAtTime(0, now + i * 0.07);
            gain.gain.linearRampToValueAtTime(0.22, now + i * 0.07 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.3);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + i * 0.07);
            osc.stop(now + i * 0.07 + 0.3);
        }
    }

    // Тріумфальні фанфари при перемозі / завершенні гри
    public playVictory(): void {
        if (this.muted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        // Тріумфальна послідовність нот
        const chords = [
            { freqs: [523.25, 659.25], start: 0, dur: 0.18 },
            { freqs: [523.25, 659.25], start: 0.20, dur: 0.18 },
            { freqs: [523.25, 659.25], start: 0.40, dur: 0.18 },
            { freqs: [659.25, 783.99, 1046.5], start: 0.65, dur: 0.7 },
        ];

        chords.forEach(({ freqs, start, dur }) => {
            freqs.forEach((freq) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + start);

                gain.gain.setValueAtTime(0, now + start);
                gain.gain.linearRampToValueAtTime(0.16, now + start + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + start);
                osc.stop(now + start + dur);
            });
        });
    }
}

export const soundEffects = new SoundEffectsEngine();