import { useNavigate } from 'react-router-dom';
import styles from './MainPage.module.css';
import Button from '../../../components/UI/Button/Button';

const MainPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <h1 className={styles.title}>Welcome to Songuess!</h1>
                <p className={styles.subtitle}>
                    A fun and engaging game where you and your friends race against time to guess songs 🎵.
                </p>
                <p className={styles.description}>
                    Challenge your friends or play with people worldwide.  
                    To participate, you need to register an account.  
                    Once logged in, hit the button below to dive into the game!
                </p>
                <Button
                    variant="primary"
                    width="220px"
                    onClick={() => navigate('/game')}
                >
                    Start Playing
                </Button>
            </div>
        </div>
    );
};

export default MainPage;