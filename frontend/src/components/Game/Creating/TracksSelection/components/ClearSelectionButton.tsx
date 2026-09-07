import React from 'react';
import Button from '../../../../UI/Button/Button';
import { BsTrash } from 'react-icons/bs';
import { useTranslation } from '../../../../../i18n/LanguageContext';

import styles from '../TrackSelection.module.css';

interface ClearSelectionButtonProps {
    onClear: () => void;
    width?: string;
}

const ClearSelectionButton: React.FC<ClearSelectionButtonProps> = ({
    onClear,
    width = '170px',
}) => {
    const { t } = useTranslation();

    return (
        <div className={styles.clearButtonWrapper}>
            <Button variant="neutral" onClick={onClear} width={width}>
                <BsTrash style={{ marginRight: '0.3rem' }} />
                {t('gameCreation.clearSelection')}
            </Button>
        </div>
    );
};

export default ClearSelectionButton;