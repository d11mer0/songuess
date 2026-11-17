import { FC, useState } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '../../../store/store';
import { GameType, SelectedTracks, TrackItem } from '../../../types/gameTypes';
import { useAppSelector } from '../../../store/hooks';
import { selectCurrentRoom } from '../../../store/gameplay/gameplaySelectors';
import { useTranslation } from '../../../i18n/LanguageContext';
import { useToast } from '../../UI/Toast/ToastContext';

import LeaderWaitingView from './CreatingGame/LeaderWaitingView';
import GameTypeSelection from './CreatingGame/GameTypeSelection';
import TrackSelectionBlock from './CreatingGame/TrackSelectionBlock';

import styles from './CreatingGame.module.css';

interface CreatingGameProps {
    startGame: (tracks: SelectedTracks) => void;
}

interface MixSourceEntry {
    key: string;
    label: string;
    tracks: TrackItem[];
}

const CreatingGame: FC<CreatingGameProps> = ({ startGame }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { user } = useSelector((state: RootState) => state.user);
    const currentRoom = useAppSelector(selectCurrentRoom);

    const [selectedGameType, setSelectedGameType] = useState<GameType>('ARTIST');
    const [isMixMode, setIsMixMode] = useState(false);
    const [mixSources, setMixSources] = useState<MixSourceEntry[]>([]);

    if (!currentRoom) return null;

    const deduplicatedMixTracks = (() => {
        const seen = new Set<string>();
        const list: TrackItem[] = [];
        for (const src of mixSources) {
            for (const tr of src.tracks) {
                const id = String(tr.id);
                if (!tr.preview || seen.has(id)) continue;
                seen.add(id);
                list.push(tr);
            }
        }
        return list;
    })();

    const handleSourceSubmit = (payload: SelectedTracks) => {
        if (!isMixMode) {
            startGame(payload);
            return;
        }

        const label =
            payload.artist?.name ||
            payload.playlist?.title ||
            payload.album?.title ||
            payload.type ||
            'Mix';
        const key = `${payload.type || 'MIX'}:${payload.artist?.id || payload.playlist?.id || payload.album?.id || label}:${mixSources.length}`;

        const existingIds = new Set(deduplicatedMixTracks.map((tr) => String(tr.id)));
        const newUniqueCount = payload.tracks.filter(
            (tr) => tr.preview && !existingIds.has(String(tr.id)),
        ).length;

        setMixSources((prev) => [...prev, { key, label, tracks: payload.tracks }]);
        showToast(
            t('gameCreation.mixAddedToast', { label, added: newUniqueCount }),
            'success',
        );
    };

    const handleRemoveMixSource = (key: string) => {
        setMixSources((prev) => prev.filter((s) => s.key !== key));
    };

    const handleLaunchMix = () => {
        if (deduplicatedMixTracks.length < 4) return;
        const shuffled = [...deduplicatedMixTracks].sort(() => Math.random() - 0.5);
        startGame({
            type: 'PLAYLIST',
            playlist: {
                id: 'mix-pack',
                title: mixSources.map((s) => s.label).join(' + '),
            },
            tracks: shuffled,
        });
    };

    return (
        <div className={styles.container}>
            {user?.id !== currentRoom.leaderId ? (
                <LeaderWaitingView />
            ) : (
                <>
                    <div className={styles.mixModeToggleRow}>
                        <button
                            type="button"
                            className={`${styles.mixModeBtn} ${!isMixMode ? styles.mixModeBtnActive : ''}`}
                            onClick={() => setIsMixMode(false)}
                        >
                            🎵 {t('gameCreation.singleMode')}
                        </button>
                        <button
                            type="button"
                            className={`${styles.mixModeBtn} ${isMixMode ? styles.mixModeBtnActive : ''}`}
                            onClick={() => setIsMixMode(true)}
                        >
                            🎛️ {t('gameCreation.mixMode')}
                        </button>
                    </div>

                    {isMixMode && (
                        <div className={styles.mixBasket}>
                            <div className={styles.mixBasketHeader}>
                                <h3 className={styles.mixBasketTitle}>
                                    🎛️ {t('gameCreation.mixBasketTitle')} ({deduplicatedMixTracks.length})
                                </h3>
                            </div>

                            {mixSources.length === 0 ? (
                                <p className={styles.mixEmptyHint}>{t('gameCreation.mixEmptyHint')}</p>
                            ) : (
                                <>
                                    <div className={styles.mixChipsRow}>
                                        {mixSources.map((src) => (
                                            <span key={src.key} className={styles.mixChip}>
                                                <span>{src.label} ({src.tracks.length})</span>
                                                <button
                                                    type="button"
                                                    className={styles.mixChipRemove}
                                                    onClick={() => handleRemoveMixSource(src.key)}
                                                    title={t('common.delete')}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        className={styles.mixLaunchBtn}
                                        onClick={handleLaunchMix}
                                        disabled={deduplicatedMixTracks.length < 4}
                                    >
                                        🚀 {t('gameCreation.mixStartBtn', { count: deduplicatedMixTracks.length })}
                                    </button>
                                    {deduplicatedMixTracks.length < 4 && (
                                        <p className={styles.mixMinWarning}>
                                            {t('gameCreation.minTracksWarning', { min: 4 })}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    <GameTypeSelection
                        selectedGameType={selectedGameType}
                        onChange={setSelectedGameType}
                    />

                    <div className={styles.selectionSection}>
                        <TrackSelectionBlock
                            selectedGameType={selectedGameType}
                            onStart={handleSourceSubmit}
                            isMixMode={isMixMode}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default CreatingGame;
