import { Routes, Route, Navigate } from 'react-router-dom';

import GameLobby from '../../../pages/Game/GameLobby';
import Gameplay from '../../../pages/Game/Gameplay';
import ProtectedRoute from '../../guards/ProtectedRoute';

const GameRoutes: React.FC = () => (
    <Routes>
        <Route element={<ProtectedRoute />}>
            <Route path="/" element={<GameLobby />} />
            <Route path="/:id" element={<Gameplay />} />
            <Route path="*" element={<Navigate to="/error" replace />} />
        </Route>
    </Routes>
);

export default GameRoutes;
