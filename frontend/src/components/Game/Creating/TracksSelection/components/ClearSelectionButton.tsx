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
    width,
}) => {
    const { t } = useTranslation();

    return (
        <div className={styles.clearButtonWrapper}>
            <Button
                variant="neutral"
                onClick={onClear}
                style={{
                    width: width || 'auto',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 18px',
                }}
            >
                <BsTrash style={{ marginRight: '0.4rem', flexShrink: 0 }} />
                {t('gameCreation.clearSelection')}
            </Button>
        </div>
    );
};

export default ClearSelectionButton;