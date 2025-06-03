import { Routes, Route, Navigate } from 'react-router-dom';

import GameLobby from '../../../pages/Game/GameLobby';
import Gameplay from '../../../pages/Game/Gameplay';

const GameRoutes: React.FC = () => (
    <Routes>
        <Route path="/" element={<GameLobby />} />
        <Route path="/:id" element={<Gameplay />} />
        <Route path="*" element={<Navigate to="/error" replace />} />
    </Routes>
);

export default GameRoutes;
