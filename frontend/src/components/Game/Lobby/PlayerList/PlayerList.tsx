import { FC } from 'react';

import { useAppSelector } from '../../../../store/hooks';
import { selectCurrentRoom } from '../../../../store/gameplay/gameplaySelectors';

interface Props {
    onKick: (userId: number) => void;
}

const PlayerList: FC<Props> = ({ onKick }) => {

    const currentRoom = useAppSelector(selectCurrentRoom);
    const userId = useAppSelector((state) => state.user.user?.id || 0);
    
    if (!currentRoom) return <div>Some troubles with currentRoom</div>;
    
    return (
        <div>
            {currentRoom.players.map((p) => (
                <p key={p.id}>
                    {p.id} {p.login} {p.isOnline ? '+' : '-'}
                    {currentRoom.leaderId === userId && p.id !== currentRoom.leaderId && (
                        <button onClick={() => onKick(p.id)}>❌</button>                        
                    )}
                </p>
            ))}
        </div>
    );
}

export default PlayerList;