import { Routes, Route, Navigate } from 'react-router-dom';

import SongsListPage from '../../../pages/Songs/SongsListPage';
import SongDetailPage from '../../../pages/Songs/SongDetailPage';
import CreateSongPage from '../../../pages/Songs/CreateSongPage';
import EditSongPage from '../../../pages/Songs/EditSongPage';

import ProtectedRoute from '../../guards/ProtectedRoute';


const SongsRoutes: React.FC = () => (
    <Routes>
      <Route path="/" element={<SongsListPage />} />
      <Route path="/:id" element={<SongDetailPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/create" element={<CreateSongPage />} />
        <Route path="/edit/:id" element={<EditSongPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/error" replace />} />
    </Routes>
  );
  
  export default SongsRoutes;