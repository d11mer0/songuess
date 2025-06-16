import Button from "../../../UI/Button/Button";
import { useToast } from "../../../UI/Toast/ToastContext";

interface Props {
    roomId: string;
}


const InviteLink = ({ roomId }: Props) => {
    const { showToast } = useToast();
    
    const copyInviteLink = () => {
        const inviteLink = `${window.location.origin}/game?room=${roomId}`;
        navigator.clipboard
            .writeText(inviteLink)
            .then(() => showToast("The message was copied!", 'success'))
            .catch(() => showToast("You have problems with copying", 'danger'));
    };

    return (
        
        <Button variant="neutral" onClick={copyInviteLink} width="30%">
            Invite friends
        </Button>
    );
};

export default InviteLink;
