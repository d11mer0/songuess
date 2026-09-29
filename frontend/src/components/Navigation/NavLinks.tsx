import { NavLink } from 'react-router-dom';
import styles from './Navigation.module.css';
import { useTranslation } from '../../i18n/LanguageContext';
import { FaCalendarAlt, FaTrophy } from 'react-icons/fa';

interface NavLinksProps {
    onNavigate?: () => void;
}

const NavLinks: React.FC<NavLinksProps> = ({ onNavigate }) => {
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
        </div>
    );
};

export default NavLinks;