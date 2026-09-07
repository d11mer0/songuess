import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../../guards/ProtectedRoute';
import Loader from '../../../components/UI/Loader/Loader/Loader';

const AllSongsPage = lazy(() => import('../../../pages/Songs/AllSongsPage'));
const CreateSongPage = lazy(() => import('../../../pages/Songs/CreateSongPage'));
const ArtistPage = lazy(() => import('../../../pages/Songs/ArtistPage'));
const AlbumPage = lazy(() => import('../../../pages/Songs/AlbumPage'));
const TrackPage = lazy(() => import('../../../pages/Songs/TrackPage'));
const PlaylistPage = lazy(() => import('../../../pages/Songs/PlaylistPage'));
const EditSongPage = lazy(() => import('../../../pages/Songs/EditSongPage'));

const SongsRoutes: React.FC = () => (
    <Suspense fallback={<Loader />}>
        <Routes>
            <Route path="/" element={<AllSongsPage />} />
            <Route path="/artist" element={<ArtistPage />} />
            <Route path="/playlist" element={<PlaylistPage />} />
            <Route path="/album" element={<AlbumPage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route element={<ProtectedRoute />}>
                <Route path="/create" element={<CreateSongPage />} />
                <Route path="/edit/:id" element={<EditSongPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/error" replace />} />
        </Routes>
    </Suspense>
);

export default SongsRoutes;
