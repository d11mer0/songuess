import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
    return (
        <footer className={styles.footer}>
            {/* Навігація */}
            <nav className={styles.footerNav}>
                <ul>
                    <li>
                        <Link to="/about">Про нас</Link>
                    </li>
                    <li>
                        <Link to="/contact">Контакти</Link>
                    </li>
                    <li>
                        <Link to="/privacy">Політика конфіденційності</Link>
                    </li>
                    <li>
                        <Link to="/terms">Умови використання</Link>
                    </li>
                </ul>
            </nav>

            {/* Соцмережі */}
            <div className={styles.footerSocials}>
                <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Facebook
                </a>
                <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Twitter
                </a>
                <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    GitHub
                </a>
            </div>

            {/* Форма підписки */}
            <form className={styles.newsletter}>
                <input type="email" placeholder="Введіть email" required />
                <button type="submit">Підписатися</button>
            </form>

            {/* Copyright */}
            <p className={styles.copyright}>
                &copy; {new Date().getFullYear()} Назва сайту. Всі права
                захищені.
            </p>
        </footer>
    );
};

export default Footer;
