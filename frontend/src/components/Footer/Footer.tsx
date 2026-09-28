import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    FaGithub, 
    FaDiscord, 
    FaTwitter, 
    FaTelegramPlane, 
    FaPaperPlane, 
    FaCheck, 
    FaGamepad, 
    FaShieldAlt, 
    FaTimes 
} from 'react-icons/fa';
import { useTranslation } from '../../i18n/LanguageContext';
import styles from './Footer.module.css';

type ModalTab = 'about' | 'contacts' | 'privacy' | 'terms';

const Footer: React.FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [activeModalTab, setActiveModalTab] = useState<ModalTab | null>(null);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setIsSubscribed(true);
        setTimeout(() => {
            setEmail('');
            setIsSubscribed(false);
        }, 3500);
    };

    const modalContent: Record<ModalTab, { title: string; body: React.ReactNode }> = {
        about: {
            title: t('footer.aboutUs'),
            body: (
                <div>
                    <p>
                        <strong>SonGuess</strong> — це інтерактивна багатокористувацька музична вікторина наступного покоління.
                        Перевіряйте свої знання, змагайтеся у бліц-дуелях 1v1, розгадуйте щоденну «Пісню Дня» та підкорюйте глобальні таблиці лідерів!
                    </p>
                    <p>
                        Слухайте уривки, вгадуйте виконавців та назви пісень на швидкість, відкривайте нові треки та змагайтеся з друзями!
                    </p>
                </div>
            ),
        },
        contacts: {
            title: t('footer.contacts'),
            body: (
                <div>
                    <p>Маєте запитання, пропозиції або знайшли баг? Зв’яжіться з нами:</p>
                    <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                        <li><strong>GitHub:</strong> <a href="https://github.com/d11mer0/songuess" target="_blank" rel="noreferrer" style={{ color: '#00f3ff' }}>github.com/d11mer0/songuess</a></li>
                        <li><strong>Discord:</strong> Спільнота SonGuess</li>
                        <li><strong>Email:</strong> support@songuess.app</li>
                    </ul>
                </div>
            ),
        },
        privacy: {
            title: t('footer.privacyPolicy'),
            body: (
                <div>
                    <p>Ми піклуємося про вашу конфіденційність:</p>
                    <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                        <li>Ми не передаємо та не продаємо персональні дані третім особам.</li>
                        <li>Сесії та токени авторизації слугують виключно для входу та збереження ігрового прогресу.</li>
                        <li>Ігрова статистика є публічною в загальних списках лідербордів.</li>
                    </ul>
                </div>
            ),
        },
        terms: {
            title: t('footer.termsOfUse'),
            body: (
                <div>
                    <p>Правила користування SonGuess:</p>
                    <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                        <li>Гра призначена для некомерційного розважального та пізнавального використання.</li>
                        <li>Використання скриптів автоматизації та чітів суворо заборонено.</li>
                        <li>Поважайте інших учасників у спільних кімнатах та лобі.</li>
                    </ul>
                </div>
            ),
        },
    };

    return (
        <footer className={styles.footer}>
            <div className={styles.footerInner}>
                <div className={styles.grid}>
                    {/* Brand Column */}
                    <div className={styles.brandCol}>
                        <Link to="/game" className={styles.brandLogo}>
                            <img src="/logo.png" alt="SonGuess" className={styles.logoImg} />
                            <span>SonGuess</span>
                        </Link>
                        <p className={styles.brandTagline}>{t('footer.tagline')}</p>
                        <div className={styles.statusIndicator}>
                            <span className={styles.statusDot} />
                            <span className={styles.statusText}>{t('footer.statusLive')}</span>
                        </div>
                    </div>

                    {/* Navigation Column */}
                    <div className={styles.linksCol}>
                        <h4 className={styles.colTitle}>
                            <FaGamepad className={styles.colIcon} />
                            <span>{t('footer.navigationTitle')}</span>
                        </h4>
                        <ul className={styles.linksList}>
                            <li>
                                <Link to="/game" className={styles.footerLink}>
                                    {t('footer.gameLobby')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/game/daily" className={styles.footerLink}>
                                    {t('footer.dailyChallenge')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/game/leaderboards" className={styles.footerLink}>
                                    {t('footer.leaderboards')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/songs" className={styles.footerLink}>
                                    {t('footer.tracksLibrary')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* About & Legal Column */}
                    <div className={styles.linksCol}>
                        <h4 className={styles.colTitle}>
                            <FaShieldAlt className={styles.colIcon} />
                            <span>{t('footer.aboutTitle')}</span>
                        </h4>
                        <ul className={styles.linksList}>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => setActiveModalTab('about')}
                                    className={styles.modalTriggerBtn}
                                >
                                    {t('footer.aboutUs')}
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => setActiveModalTab('contacts')}
                                    className={styles.modalTriggerBtn}
                                >
                                    {t('footer.contacts')}
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => setActiveModalTab('privacy')}
                                    className={styles.modalTriggerBtn}
                                >
                                    {t('footer.privacyPolicy')}
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => setActiveModalTab('terms')}
                                    className={styles.modalTriggerBtn}
                                >
                                    {t('footer.termsOfUse')}
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter Column */}
                    <div className={styles.newsletterCol}>
                        <h4 className={styles.colTitle}>
                            <FaPaperPlane className={styles.colIcon} />
                            <span>{t('footer.newsletterTitle')}</span>
                        </h4>
                        <p className={styles.newsletterDesc}>{t('footer.newsletterDesc')}</p>
                        <form className={styles.newsletterForm} onSubmit={handleSubscribe}>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('footer.emailPlaceholder')}
                                    required
                                    className={styles.newsletterInput}
                                    disabled={isSubscribed}
                                />
                                <button
                                    type="submit"
                                    className={`${styles.subscribeBtn} ${isSubscribed ? styles.subscribedState : ''}`}
                                    disabled={isSubscribed}
                                >
                                    {isSubscribed ? (
                                        <>
                                            <FaCheck className={styles.btnIcon} />
                                            <span>{t('footer.subscribed')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaPaperPlane className={styles.btnIcon} />
                                            <span>{t('footer.subscribeBtn')}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Socials Row */}
                <div className={styles.socialsRow}>
                    <a
                        href="https://github.com/d11mer0/songuess"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.socialPill}
                        title="GitHub"
                        aria-label="GitHub"
                    >
                        <FaGithub />
                    </a>
                    <a
                        href="https://discord.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.socialPill} ${styles.discord}`}
                        title="Discord"
                        aria-label="Discord"
                    >
                        <FaDiscord />
                    </a>
                    <a
                        href="https://twitter.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.socialPill} ${styles.twitter}`}
                        title="Twitter / X"
                        aria-label="Twitter"
                    >
                        <FaTwitter />
                    </a>
                    <a
                        href="https://t.me"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.socialPill} ${styles.telegram}`}
                        title="Telegram"
                        aria-label="Telegram"
                    >
                        <FaTelegramPlane />
                    </a>
                </div>

                <hr className={styles.divider} />

                {/* Bottom Bar */}
                <div className={styles.bottomBar}>
                    <p className={styles.copyright}>
                        &copy; {new Date().getFullYear()} {t('footer.copyright')}
                    </p>
                    <p className={styles.craftedWith}>{t('footer.craftedWith')}</p>
                </div>
            </div>

            {/* Interactive Info Modal */}
            {activeModalTab && (
                <div className={styles.modalOverlay} onClick={() => setActiveModalTab(null)}>
                    <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>{modalContent[activeModalTab].title}</h3>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setActiveModalTab(null)}
                                aria-label="Close modal"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            {modalContent[activeModalTab].body}
                        </div>
                    </div>
                </div>
            )}
        </footer>
    );
};

export default Footer;
