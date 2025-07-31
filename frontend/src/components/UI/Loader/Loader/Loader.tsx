import styles from './Loader.module.css';

interface LoaderProps {
    text?: string;
}

const Loader: React.FC<LoaderProps> = ({ text = 'Завантаження...' }) => {
    return (
        <div className={styles.loaderWrapper}>
            <div className={styles.spinner}></div>
            <p className={styles.text}>{text}</p>
        </div>
    );
};

export default Loader;
