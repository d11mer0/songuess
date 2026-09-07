import Button from "../../../UI/Button/Button";
import { useToast } from "../../../UI/Toast/ToastContext";
import { useTranslation } from "../../../../i18n/LanguageContext";

interface Props {
    roomId: string;
}

const InviteLink = ({ roomId }: Props) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    
    const copyInviteLink = () => {
        const inviteLink = `${window.location.origin}/game?room=${roomId}`;
        navigator.clipboard
            .writeText(inviteLink)
            .then(() => showToast(t('shareModal.linkCopied'), 'success'))
            .catch(() => showToast(t('common.error'), 'danger'));
    };

    return (
        <Button variant="neutral" onClick={copyInviteLink}>
            {t('gameplay.inviteFriends')}
        </Button>
    );
};

export default InviteLink;
