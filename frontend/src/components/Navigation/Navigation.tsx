import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { Link, useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '../../store/api/authApi';
import { logout as logoutAction } from '../../store/users/userSlice';
import styles from './Navigation.module.css';
import NavLinks from './NavLinks';
import { socketInstance } from '../../services/socket';

const Navigation: React.FC = () => {
    const { isAuthenticated, user } = useSelector(
        (state: RootState) => state.user,
    );
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [logout] = useLogoutMutation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
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
                    </div>

                    <div className={styles.navRight}>
                        {isAuthenticated ? (
                            <div
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
                                    />
                                )}
                                <span className={styles.login}>
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
                                        >
                                            Edit Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className={styles.dropdownItem}
                                        >
                                            Log Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/auth/login" className={styles.navLink}>
                                Log In
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
                        ☰ Menu
                    </button>
                    <div
                        className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}
                    >
                        <NavLinks />
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Navigation;
