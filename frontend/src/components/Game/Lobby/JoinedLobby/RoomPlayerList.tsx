import { Player } from '../../../../types/roomTypes';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';

interface Props {
    players: Player[];
    leaderId: number | undefined;
    kickMember: (memberId: number) => void;
}

const RoomPlayerList = ({ players, leaderId, kickMember }: Props) => {
    const { user } = useSelector((state: RootState) => state.user); // Отримуємо поточного користувача

    return (
        <ul>
            {players.map((player) => (
                <li key={player.id}>
                    {player.login} (ID: {player.id}){' '}
                    {player.isOnline ? '+' : '-'}
                    {leaderId === user?.id && player.id !== leaderId && (
                        <button onClick={() => kickMember(player.id)}>
                            ❌
                        </button>
                    )}
                </li>
            ))}
        </ul>
    );
};

export default RoomPlayerList;
