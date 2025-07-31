import { FC } from 'react';
import Button from '../../../../UI/Button/Button';

import styles from '../TrackSelection.module.css';

type TracksFormat = 'ALL' | 'PLAYLIST' | 'ALBUM';

interface Props {
    selected: TracksFormat;
    onChange: (type: TracksFormat) => void;
}

const TrackTypeSelector: FC<Props> = ({ selected, onChange }) => (
    <div className={styles.container}>
        <h2 className={styles.heading}>How would you like to select tracks?</h2>
        <div className={styles.buttonGroup}>
             <Button
               
                variant={selected === 'ALBUM' ? 'secondary' : 'neutral'}
                onClick={() => onChange('ALBUM')}
            >
                From album
            </Button>
            <Button 
               
                variant={selected === 'PLAYLIST' ? 'secondary' : 'neutral'}
                onClick={() => onChange('PLAYLIST')}
            >
                From playlist
            </Button>
            <Button
              
                variant={selected === 'ALL' ? 'secondary' : 'neutral'}
                onClick={() => onChange('ALL')}
            >
                All tracks
            </Button>
           
        </div>
    </div>
);

export default TrackTypeSelector;