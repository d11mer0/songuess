import { Routes, Route, Navigate } from 'react-router-dom';

import GameLobby from '../../../pages/Game/GameLobby';

const GameRoutes: React.FC = () => (
    <Routes>
      <Route path="/" element={<GameLobby />} />
      <Route path="*" element={<Navigate to="/error" replace />} />
    </Routes>
  );
  
  export default GameRoutes;