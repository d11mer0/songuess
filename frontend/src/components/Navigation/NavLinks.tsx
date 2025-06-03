import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import styles from './Navigation.module.css';

const NavLinks: React.FC = () => {
    const { isAuthenticated } = useSelector((state: RootState) => state.user);

    return (
        <>
            <Link to="/songs" className={styles.navLink}>
                Watch Songs
            </Link>
            {isAuthenticated && (
                <Link to="/songs/create" className={styles.navLink}>
                    Create Song
                </Link>
            )}
        </>
    );
};

export default NavLinks;
