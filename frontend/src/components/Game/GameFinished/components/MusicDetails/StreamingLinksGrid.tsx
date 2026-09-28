import React from 'react';
import styles from './MusicDetailsModal.module.css';
import { StreamingLinkItem } from '../../../../../utils/music/streamingLinks';
import { 
    SiSpotify, 
    SiApplemusic, 
    SiYoutube, 
    SiSoundcloud, 
    SiGenius 
} from 'react-icons/si';
import { FaDeezer } from 'react-icons/fa6';
import { FaExternalLinkAlt } from 'react-icons/fa';

interface StreamingLinksGridProps {
    links: StreamingLinkItem[];
}

const renderServiceIcon = (id: StreamingLinkItem['id']) => {
    switch (id) {
        case 'spotify':
            return <SiSpotify className={styles.serviceIcon} style={{ color: '#1db954' }} />;
        case 'deezer':
            return <FaDeezer className={styles.serviceIcon} style={{ color: '#ef5466' }} />;
        case 'apple':
            return <SiApplemusic className={styles.serviceIcon} style={{ color: '#fc3c44' }} />;
        case 'youtube':
            return <SiYoutube className={styles.serviceIcon} style={{ color: '#ff0000' }} />;
        case 'soundcloud':
            return <SiSoundcloud className={styles.serviceIcon} style={{ color: '#ff5500' }} />;
        case 'genius':
            return <SiGenius className={styles.serviceIcon} style={{ color: '#ffff64' }} />;
        default:
            return null;
    }
};

const StreamingLinksGrid: React.FC<StreamingLinksGridProps> = ({ links }) => {
    return (
        <div className={styles.servicesGrid}>
            {links.map((link) => (
                <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.serviceLink}
                    title={link.name}
                >
                    <span className={styles.serviceLinkLeft}>
                        {renderServiceIcon(link.id)}
                        <span>{link.name}</span>
                    </span>
                    <FaExternalLinkAlt style={{ fontSize: 11, opacity: 0.5 }} />
                </a>
            ))}
        </div>
    );
};

export default StreamingLinksGrid;
