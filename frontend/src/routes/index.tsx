import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation/Navigation';
import Footer from '../components/Footer/Footer';
import { useGetMeQuery } from '../store/api/userApi';
import Loader from '../components/UI/Loader/Loader/Loader';

import MainPage from '../pages/DefaultPages/MainPage/MainPage';

const AuthRoutes = lazy(() => import('./modules/auth/AuthRoutes'));
const SongsRoutes = lazy(() => import('./modules/songs/SongsRoutes'));
const GameRoutes = lazy(() => import('./modules/game/GameRoutes'));
const UserRoutes = lazy(() => import('./modules/users/UserRoutes'));
const JoinRoomPage = lazy(() => import('../pages/Game/JoinRoomPage'));
const PartyControllerPage = lazy(() => import('../pages/Party/PartyControllerPage'));
const PartyHostPage = lazy(() => import('../pages/Party/PartyHostPage'));
const ErrorPage = lazy(() => import('../pages/DefaultPages/ErrorPage/ErrorPage'));

const AppRoutes: React.FC = () => {
    const location = useLocation();
    const isPartyOrGamepad = location.pathname.startsWith('/play') || location.pathname.startsWith('/party');

    // Check current user session in the background without blocking initial app render
    const hasToken = Boolean(localStorage.getItem('accessToken'));
    useGetMeQuery(undefined, { skip: !hasToken });

    return (
        <>
            {!isPartyOrGamepad && <Navigation />}
            <Suspense fallback={<Loader />}>
                <Routes>
                    <Route path="/error" element={<ErrorPage />} />
                    <Route path="/auth/*" element={<AuthRoutes />} />
                    <Route path="/songs/*" element={<SongsRoutes />} />
                    <Route path="/game/*" element={<GameRoutes />} />
                    <Route path="/user/*" element={<UserRoutes />} />
                    <Route path="/join/:code" element={<JoinRoomPage />} />
                    <Route path="/play/:code" element={<PartyControllerPage />} />
                    <Route path="/play" element={<PartyControllerPage />} />
                    <Route path="/party/host/:id" element={<PartyHostPage />} />
                    <Route path="/party/host" element={<PartyHostPage />} />
                    <Route path="/" element={<MainPage />} />
                    <Route path="*" element={<Navigate to="/error" replace />} />
                </Routes>
            </Suspense>
            {!isPartyOrGamepad && <Footer />}
        </>
    );
};

export default AppRoutes;
