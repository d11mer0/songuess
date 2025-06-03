import { Routes, Route, Navigate } from 'react-router-dom';

import ArtistPage from '../../../pages/Songs/ArtistPage';
import AlbumPage from '../../../pages/Songs/AlbumPage';
import TrackPage from '../../../pages/Songs/TrackPage';
import PlaylistPage from '../../../pages/Songs/PlaylistPage';

import EditSongPage from '../../../pages/Songs/EditSongPage';

import ProtectedRoute from '../../guards/ProtectedRoute';

const SongsRoutes: React.FC = () => (
    <Routes>
        <Route path="/artist" element={<ArtistPage />} />
        <Route path="/playlist" element={<PlaylistPage />} />
        <Route path="/album" element={<AlbumPage />} />
        <Route path="/track" element={<TrackPage />} />
        <Route element={<ProtectedRoute />}>
            <Route path="/edit/:id" element={<EditSongPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/error" replace />} />
    </Routes>
);

export default SongsRoutes;
