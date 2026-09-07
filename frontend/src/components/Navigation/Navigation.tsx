import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { Link, useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '../../store/api/authApi';
import { logout as logoutAction } from '../../store/users/userSlice';
import styles from './Navigation.module.css';
import NavLinks from './NavLinks';
import { socketInstance } from '../../services/socket';
import { useTranslation } from '../../i18n/LanguageContext';
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher';

const Navigation: React.FC = () => {
    const { isAuthenticated, user } = useSelector(
        (state: RootState) => state.user,
    );
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [logout] = useLogoutMutation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement | null>(null);

    const isPremium = (user as any)?.isPremium;
    const nameColor = (user as any)?.nameColor || (isPremium ? '#ffd700' : '#ffffff');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsDropdownOpen(false);
        try {
            await logout().unwrap();
            navigate('/auth/login');
        } catch (error) {
            console.error('Logout failed:', error);
            navigate('/error');
        } finally {
            dispatch(logoutAction());
            socketInstance.disconnect();
        }
    };

    return (
        <div className={styles.container}>
            <nav className={styles.navbar}>
                <div className={styles.navTop}>
                    <div className={styles.navLeft}>
                        <Link to="/game" className={styles.logo}>
                            Songuess
                        </Link>
                        <div className={styles.navLinks}>
                            <NavLinks />
                        </div>
                    </div>

                    <div className={styles.navRight}>
                        <LanguageSwitcher />

                        {isAuthenticated ? (
                            <div
                                ref={userMenuRef}
                                className={styles.userMenu}
                                onClick={() =>
                                    setIsDropdownOpen(!isDropdownOpen)
                                }
                            >
                                {user?.avatar && (
                                    <img
                                        src={user.avatar}
                                        alt="Avatar"
                                        className={styles.avatar}
                                        referrerPolicy="no-referrer"
                                        style={{
                                            border: isPremium ? '2px solid #ffd700' : 'none',
                                            boxShadow: isPremium ? '0 0 10px rgba(255, 215, 0, 0.6)' : 'none',
                                        }}
                                    />
                                )}
                                <span
                                    className={styles.login}
                                    style={{
                                        color: nameColor,
                                        textShadow: isPremium ? `0 0 10px ${nameColor}88` : 'none',
                                        fontWeight: isPremium ? 800 : 600,
                                    }}
                                >
                                    {isPremium && '⭐ '}
                                    {user?.login}
                                </span>
                                <span
                                    className={`${styles.arrow} ${isDropdownOpen ? styles.rotate : ''}`}
                                >
                                    &#9662;
                                </span>

                                {isDropdownOpen && (
                                    <div className={styles.dropdownMenu}>
                                        <Link
                                            to="/user/me"
                                            className={styles.dropdownItem}
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            {t('nav.editProfile')}
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className={styles.dropdownItem}
                                        >
                                            {t('nav.logout')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/auth/login" className={styles.navLink}>
                                {t('nav.login')}
                            </Link>
                        )}
                    </div>
                </div>

                <hr className={`${styles.separator}`} />

                <div className={styles.mobileContainer}>
                    <button
                        className={styles.burger}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {t('nav.menu')}
                    </button>
                    <div
                        className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}
                    >
                        <NavLinks onNavigate={() => setIsMenuOpen(false)} />
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Navigation;
