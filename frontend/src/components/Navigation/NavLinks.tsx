import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import styles from './Navigation.module.css';
import { useTranslation } from '../../i18n/LanguageContext';

interface NavLinksProps {
    onNavigate?: () => void;
}

const NavLinks: React.FC<NavLinksProps> = ({ onNavigate }) => {
    const { isAuthenticated } = useSelector((state: RootState) => state.user);
    const { t } = useTranslation();

    return (
        <>
            <NavLink
                to="/game/daily"
                end
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
                style={{ color: '#00f3ff', fontWeight: 700 }}
                onClick={onNavigate}
            >
                {t('nav.daily')}
            </NavLink>
            <NavLink
                to="/game/leaderboards"
                end
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
                style={{ color: '#ffd700', fontWeight: 700 }}
                onClick={onNavigate}
            >
                {t('nav.leaderboard')}
            </NavLink>
            <NavLink
                to="/songs"
                end
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
                onClick={onNavigate}
            >
                {t('nav.songs')}
            </NavLink>
            {isAuthenticated && (
                <NavLink
                    to="/songs/create"
                    end
                    className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
                    onClick={onNavigate}
                >
                    {t('nav.createSong')}
                </NavLink>
            )}
        </>
    );
};

export default NavLinks;