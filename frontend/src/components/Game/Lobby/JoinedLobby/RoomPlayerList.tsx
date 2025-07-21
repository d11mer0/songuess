import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import styles from './JoinedLobby.module.css';

interface Props {
    kickMember: (memberId: number) => void;
}

import { FaCrown } from 'react-icons/fa';
import { BsXLg, BsPerson } from 'react-icons/bs';
import { useAppSelector } from '../../../../store/hooks';
import { selectCurrentRoom } from '../../../../store/gameplay/gameplaySelectors';

const RoomPlayerList = ({kickMember}: Props) => {
    const { user } = useSelector((state: RootState) => state.user);
    const roomInfo = useAppSelector(selectCurrentRoom);
    
    if(!roomInfo) return<div></div>;

    const slots = Array.from({ length: roomInfo.lobbyOptions.maxPlayers }, (_, index) => roomInfo.players[index] ?? null);

    return (
            <ul className={styles.grid}>
                {slots.map((player, i) => (
                    <li className={styles.playerSlot} key={i}>
                        <div className={styles.playerInfo}>
                            {player ? ( <>
                                <div className={styles.avatarWrapper}>
                                    {player.id === roomInfo.leaderId && (
                                        <span className={styles.leaderBadge}>
                                            <FaCrown />
                                        </span>
                                    )}
                                    <img
                                        src={player.avatar || ''}
                                        alt={player.login}
                                        className={styles.avatar}
                                    />
                                    {user?.id === roomInfo.leaderId && player.id !== roomInfo.leaderId && (
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
