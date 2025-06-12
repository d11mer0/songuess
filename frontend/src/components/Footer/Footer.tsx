import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
    return (
        <footer className={styles.footer}>
            {/* Навігація */}
            <nav className={styles.footerNav}>
                <ul>
                    <li>
                        <Link to="/about">About us</Link>
                    </li>
                    <li>
                        <Link to="/contact">Contacts</Link>
                    </li>
                    <li>
                        <Link to="/privacy">Privacy Policy</Link>
                    </li>
                    <li>
                        <Link to="/terms">Terms of use</Link>
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
                <input type="email" placeholder="Input email" required />
                <button type="submit">Sign up</button>
            </form>

            {/* Copyright */}
            <p className={styles.copyright}>
                &copy; {new Date().getFullYear()} MusicApp. All rights reserved.
            </p>
        </footer>
    );
};

export default Footer;
