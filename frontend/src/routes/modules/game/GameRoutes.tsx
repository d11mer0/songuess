import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../../guards/ProtectedRoute';
import Loader from '../../../components/UI/Loader/Loader/Loader';

import { ErrorBoundary } from '../../../components/common/ErrorBoundary';

const GameLobby = lazy(() => import('../../../pages/Game/GameLobby'));
const Gameplay = lazy(() => import('../../../pages/Game/Gameplay'));
const DailyChallengePage = lazy(() => import('../../../pages/Game/DailyChallenge/DailyChallengePage'));
const LeaderboardPage = lazy(() => import('../../../pages/Game/Leaderboard/LeaderboardPage'));

const GameRoutes: React.FC = () => (
    <ErrorBoundary fallbackTitle="Помилка ігрової кімнати">
        <Suspense fallback={<Loader />}>
            <Routes>
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<GameLobby />} />
                    <Route path="/daily" element={<DailyChallengePage />} />
                    <Route path="/leaderboards" element={<LeaderboardPage />} />
                    <Route path="/:id" element={<Gameplay />} />
                    <Route path="*" element={<Navigate to="/error" replace />} />
                </Route>
            </Routes>
        </Suspense>
    </ErrorBoundary>
);

export default GameRoutes;