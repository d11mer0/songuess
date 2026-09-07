import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navigation from '../components/Navigation/Navigation';
import Footer from '../components/Footer/Footer';
import { useGetMeQuery } from '../store/api/userApi';
import Loader from '../components/UI/Loader/Loader/Loader';

import MainPage from '../pages/DefaultPages/MainPage/MainPage';

const AuthRoutes = lazy(() => import('./modules/auth/AuthRoutes'));
const SongsRoutes = lazy(() => import('./modules/songs/SongsRoutes'));
const GameRoutes = lazy(() => import('./modules/game/GameRoutes'));
const UserRoutes = lazy(() => import('./modules/users/UserRoutes'));
const ErrorPage = lazy(() => import('../pages/DefaultPages/ErrorPage/ErrorPage'));

const AppRoutes: React.FC = () => {
    // Check current user session in the background without blocking initial app render
    const hasToken = Boolean(localStorage.getItem('accessToken'));
    useGetMeQuery(undefined, { skip: !hasToken });

    return (
        <>
            <Navigation />
            <Suspense fallback={<Loader />}>
                <Routes>
                    <Route path="/error" element={<ErrorPage />} />
                    <Route path="/auth/*" element={<AuthRoutes />} />
                    <Route path="/songs/*" element={<SongsRoutes />} />
                    <Route path="/game/*" element={<GameRoutes />} />
                    <Route path="/user/*" element={<UserRoutes />} />
                    <Route path="/" element={<MainPage />} />
                    <Route path="*" element={<Navigate to="/error" replace />} />
                </Routes>
            </Suspense>
            <Footer />
        </>
    );
};

export default AppRoutes;
