interface Props {
    roomId: string;
}

const InviteLink = ({ roomId }: Props) => {
    const copyInviteLink = () => {
        const inviteLink = `${window.location.origin}/game?room=${roomId}`;
        navigator.clipboard
            .writeText(inviteLink)
            .then(() => alert('Посилання скопійовано!'))
            .catch((err) => console.error('Помилка копіювання:', err));
    };

    return (
        <button onClick={copyInviteLink} className="button">
            Invite friends
        </button>
    );
};

export default InviteLink;
