import { useNavigate } from 'react-router-dom';
import styles from './ErrorPage.module.css';
import Button from '../../../components/UI/Button/Button';

const ErrorPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.errorContainer}>
            <h1 className={styles.errorTitle}>404</h1>
            <p className={styles.errorMessage}>Page was not found</p>
            <Button variant="danger" onClick={() => navigate('/game')} style={{fontSize:'26px'}}>
                To main page
            </Button>
        </div>
    );
};

export default ErrorPage;
