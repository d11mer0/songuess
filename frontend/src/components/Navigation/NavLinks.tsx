import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import styles from './Navigation.module.css';
import { useTranslation } from '../../i18n/LanguageContext';
import { FaCalendarAlt, FaTrophy, FaMusic, FaPlusCircle } from 'react-icons/fa';

interface NavLinksProps {
    onNavigate?: () => void;
}

const NavLinks: React.FC<NavLinksProps> = ({ onNavigate }) => {
    const { isAuthenticated } = useSelector((state: RootState) => state.user);
    const { t } = useTranslation();

    return (
        <div className={styles.navLinksWrapper}>
            <NavLink
                to="/game/daily"
                end
                className={({ isActive }) =>
                    `${styles.navLink} ${styles.dailyLink} ${isActive ? styles.activeNavLink : ''}`
                }
                onClick={onNavigate}
            >
                <FaCalendarAlt className={styles.linkIconCyan} />
                <span>{t('nav.daily')}</span>
            </NavLink>
            <NavLink
                to="/game/leaderboards"
                end
                className={({ isActive }) =>
                    `${styles.navLink} ${styles.leaderboardLink} ${isActive ? styles.activeNavLink : ''}`
                }
                onClick={onNavigate}
            >
                <FaTrophy className={styles.linkIconGold} />
                <span>{t('nav.leaderboard')}</span>
            </NavLink>
            <NavLink
                to="/songs"
                end
                className={({ isActive }) =>
                    `${styles.navLink} ${styles.songsLink} ${isActive ? styles.activeNavLink : ''}`
                }
                onClick={onNavigate}
            >
                <FaMusic className={styles.linkIconPurple} />
                <span>{t('nav.songs')}</span>
            </NavLink>
            {isAuthenticated && (
                <NavLink
                    to="/songs/create"
                    end
                    className={({ isActive }) =>
                        `${styles.navLink} ${styles.createLink} ${isActive ? styles.activeNavLink : ''}`
                    }
                    onClick={onNavigate}
                >
                    <FaPlusCircle className={styles.linkIconPink} />
                    <span>{t('nav.createSong')}</span>
                </NavLink>
            )}
        </div>
    );
};

export default NavLinks;