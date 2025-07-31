import React from 'react';
import Button from '../../../../UI/Button/Button';
import { BsTrash } from 'react-icons/bs';

import styles from '../TrackSelection.module.css';

interface ClearSelectionButtonProps {
    onClear: () => void;
    width?: string;
}

const ClearSelectionButton: React.FC<ClearSelectionButtonProps> = ({
    onClear,
    width = '170px',
}) => (
    <div className={styles.clearButtonWrapper}>
        <Button variant="neutral" onClick={onClear} width={width}>
            <BsTrash style={{ marginRight: '0.3rem' }} />
            Clear selection
        </Button>
    </div>
);

export default ClearSelectionButton;