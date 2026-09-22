/**
 * Intercepts OS and headphone/hardware media keys (play, pause, headset tap)
 * via navigator.mediaSession to prevent unintended audio playback outside of game rounds.
 */
export const blockMediaSessionHardwareKeys = (audioElement?: HTMLAudioElement | null) => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
        navigator.mediaSession.setActionHandler('play', () => {
            // Suppress hardware play/headphone single-tap resume.
            // Game playback is strictly synchronized by the server round state.
            if (audioElement && audioElement.paused) {
                audioElement.pause();
            }
        });

        navigator.mediaSession.setActionHandler('pause', () => {
            // Prevent accidental headphone pause from freezing game round audio
        });

        navigator.mediaSession.setActionHandler('stop', () => {
            if (audioElement) {
                audioElement.pause();
            }
        });

        // Block seek and track skip buttons on headphones as well
        navigator.mediaSession.setActionHandler('seekto', () => {});
        navigator.mediaSession.setActionHandler('seekbackward', () => {});
        navigator.mediaSession.setActionHandler('seekforward', () => {});
        navigator.mediaSession.setActionHandler('previoustrack', () => {});
        navigator.mediaSession.setActionHandler('nexttrack', () => {});
    } catch {
        // Safe ignore for older browsers or unsupported actions
    }
};

export const clearMediaSessionPlayback = (audioElement?: HTMLAudioElement | null) => {
    if (audioElement) {
        audioElement.pause();
        audioElement.removeAttribute('src');
        audioElement.load();
    }
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        try {
            navigator.mediaSession.playbackState = 'none';
        } catch {}
    }
};
