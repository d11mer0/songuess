import { useAppSelector } from '../../../../store/hooks';
import { selectTrackInfo } from '../../../../store/gameplay/gameplaySelectors';
import { useAudioPlayer } from '../../../../hooks/useAudioPlayer';


const AudioPlayer = () => {
    const trackInfo = useAppSelector(selectTrackInfo);
   
    const { audioRef, volume, setVolume } = useAudioPlayer({
        previewUrl: trackInfo?.preview ?? null,
        startedAt: trackInfo?.startedAt ?? null,
        initialVolume: 0.1,
    });

    if (!trackInfo) return null;

    return (
        <>
            <audio ref={audioRef} style={{ display: 'none' }} />
            <div style={{ marginTop: '20px' }}>
                <label>Гучність: </label>
                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                />
            </div>
        </>
    );
};

export default AudioPlayer;