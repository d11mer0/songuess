import styles from './WatingLoader.module.css';

const WaitingLoader = () => {
    return (
        <div className={styles.loaderWrapper}>
            <div className={styles.dotFlashing}></div>
        </div>
    );
};

export default WaitingLoader;