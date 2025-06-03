import { Modal } from 'react-bootstrap';

interface CustomModalProps {
    title?: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const CustomModal: React.FC<CustomModalProps> = ({
    title = 'Verify Page',
    isOpen,
    onClose,
    children,
}) => {
    return (
        <Modal show={isOpen} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ minHeight: '150px' }}>{children}</Modal.Body>
        </Modal>
    );
};

export default CustomModal;
