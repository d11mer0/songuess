import { Player } from '../../../../types/roomTypes';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import styles from './JoinedLobby.module.css';

interface Props {
    players: Player[];
    leaderId: number | undefined;
    kickMember: (memberId: number) => void;
    maxPlayers: number;
}

import { FaCrown } from 'react-icons/fa';
import { BsXLg, BsPerson } from 'react-icons/bs';

const RoomPlayerList = ({ players, leaderId, kickMember, maxPlayers }: Props) => {
    const { user } = useSelector((state: RootState) => state.user);

    const slots = Array.from({ length: maxPlayers }, (_, index) => players[index] ?? null);

    return (
            <ul className={styles.grid}>
                {slots.map((player, i) => (
                    <li className={styles.playerSlot} key={i}>
                        <div className={styles.playerInfo}>
                            {player ? ( <>
                                <div className={styles.avatarWrapper}>
                                    {player.id === leaderId && (
                                        <span className={styles.leaderBadge}>
                                            <FaCrown />
                                        </span>
                                    )}
                                    <img
                                        src={player.avatar || ''}
                                        alt={player.login}
                                        className={styles.avatar}
                                    />
                                    {user?.id === leaderId && player.id !== leaderId && (
                                        <button
                                            onClick={() => kickMember(player.id)}
                                            className={styles.kickIcon}
                                        >
                                            <BsXLg />
                                        </button>
                                    )}
                                    <span
                                        className={styles.statusDot}
                                        style={{ backgroundColor: player.isOnline ? '#4caf50' : '#777' }}
                                    />
                                </div>
                                <div className={styles.login} title={player.login}>
                                    {player.login}
                                </div>
                            </> ) : ( <>
                                <div className={styles.avatarWrapper}>
                                    <div className={styles.emptySlot}>
                                        <span className={styles.emptyIcon}>
                                            <BsPerson />
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.login}></div>
                            </> )}
                        </div>
                        
                    </li>
                ))}
            </ul>
    );
};

export default RoomPlayerList;
