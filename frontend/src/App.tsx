import './App.css';
import AppRoutes from './routes';
import { useEffect } from 'react';
import { useLazyRefreshQuery } from './store/api/authApi';

import { LanguageProvider } from './i18n/LanguageContext';

const App: React.FC = () => {
    const [triggerRefresh] = useLazyRefreshQuery();

    useEffect(() => {
        if (localStorage.getItem('accessToken')) {
            triggerRefresh();
        }
    }, [triggerRefresh]);

    return (
        <LanguageProvider>
            <div className="page-container">
                <AppRoutes />
            </div>
        </LanguageProvider>
    );
};

export default App;
