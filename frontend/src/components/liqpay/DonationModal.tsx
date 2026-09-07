import React, { useState } from 'react';
import { Modal, Form } from 'react-bootstrap';
import { useCreateCheckoutMutation, useSimulateTestDonationMutation } from '../../store/api/liqpayApi';
import { useTranslation } from '../../i18n/LanguageContext';
import Button from '../UI/Button/Button';

interface DonationModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({ show, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [selectedAmount, setSelectedAmount] = useState<number>(100);
    const [customAmount, setCustomAmount] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const [createCheckout, { isLoading: isCheckingOut }] = useCreateCheckoutMutation();
    const [simulateTest, { isLoading: isSimulating }] = useSimulateTestDonationMutation();

    const activeAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

    const handleLiqPaySubmit = async () => {
        if (activeAmount <= 0) return;

        try {
            const data = await createCheckout({
                amount: activeAmount,
                type: 'premium',
                description: 'SonGuess VIP & Підтримка',
            }).unwrap();

            // Створюємо динамічну форму для редіректу на LiqPay
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = data.checkoutUrl;
            form.acceptCharset = 'utf-8';

            const inputData = document.createElement('input');
            inputData.type = 'hidden';
            inputData.name = 'data';
            inputData.value = data.data;
            form.appendChild(inputData);

            const inputSignature = document.createElement('input');
            inputSignature.type = 'hidden';
            inputSignature.name = 'signature';
            inputSignature.value = data.signature;
            form.appendChild(inputSignature);

            document.body.appendChild(form);
            form.submit();
        } catch (err: any) {
            console.error('Failed to initiate LiqPay checkout', err);
            setStatusMessage('Помилка при з’єднанні з платіжною системою');
        }
    };

    const handleSimulateTest = async () => {
        if (activeAmount <= 0) return;

        try {
            await simulateTest({ amount: activeAmount, type: 'premium' }).unwrap();
            setStatusMessage(t('liqpay.successMsg'));
            if (onSuccess) onSuccess();
            setTimeout(() => {
                setStatusMessage(null);
                onClose();
            }, 1800);
        } catch (err: any) {
            console.error('Failed to simulate test donation', err);
            setStatusMessage('Помилка активації тестового платежу');
        }
    };

    const tiers = [
        { amount: 50, title: t('liqpay.tierCoffee'), desc: t('liqpay.tierCoffeeDesc') },
        { amount: 100, title: t('liqpay.tierCake'), desc: t('liqpay.tierCakeDesc') },
        { amount: 250, title: t('liqpay.tierPatron'), desc: t('liqpay.tierPatronDesc') },
    ];

    return (
        <Modal show={show} onHide={onClose} centered size="lg" contentClassName="bg-dark text-white border-warning">
            <Modal.Header closeButton closeVariant="white">
                <Modal.Title style={{ color: '#ffd700', fontWeight: 800, textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}>
                    {t('liqpay.modalTitle')}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="text-secondary small">{t('liqpay.modalSubtitle')}</p>

                {/* Переваги VIP */}
                <div
                    style={{
                        backgroundColor: 'rgba(255, 215, 0, 0.08)',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '12px',
                        padding: '14px',
                        marginBottom: '20px',
                    }}
                >
                    <div style={{ fontWeight: 700, color: '#ffd700', marginBottom: '8px' }}>
                        {t('liqpay.perksTitle')}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#e0e0e0' }}>
                        <li>{t('liqpay.perkGlow')}</li>
                        <li>{t('liqpay.perkVipBadge')}</li>
                        <li>{t('liqpay.perkBadge')}</li>
                        <li>{t('liqpay.perkSupport')}</li>
                    </ul>
                </div>

                {/* Варіанти сум */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px',
                        marginBottom: '16px',
                    }}
                >
                    {tiers.map((tier) => {
                        const isSelected = !customAmount && selectedAmount === tier.amount;
                        return (
                            <div
                                key={tier.amount}
                                onClick={() => {
                                    setSelectedAmount(tier.amount);
                                    setCustomAmount('');
                                }}
                                style={{
                                    border: isSelected ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '12px',
                                    padding: '14px 10px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255,255,255,0.03)',
                                    boxShadow: isSelected ? '0 0 12px rgba(255, 215, 0, 0.3)' : 'none',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffd700' }}>
                                    {tier.amount} ₴
                                </div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '4px' }}>
                                    {tier.title}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#aaaaaa', marginTop: '2px' }}>
                                    {tier.desc}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Кастомна сума */}
                <Form.Group className="mb-3">
                    <Form.Label className="small text-secondary">{t('liqpay.customAmount')}</Form.Label>
                    <Form.Control
                        type="number"
                        min="1"
                        placeholder="150"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="bg-secondary text-white border-0"
                    />
                </Form.Group>

                {statusMessage && (
                    <div
                        style={{
                            padding: '10px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(57, 255, 20, 0.15)',
                            border: '1px solid #39ff14',
                            color: '#39ff14',
                            fontWeight: 600,
                            textAlign: 'center',
                            marginBottom: '15px',
                        }}
                    >
                        {statusMessage}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    variant="neutral"
                    onClick={handleSimulateTest}
                    disabled={isSimulating || isCheckingOut || activeAmount <= 0}
                    style={{ fontSize: '0.85rem', backgroundColor: '#28a745', borderColor: '#28a745', color: '#ffffff' }}
                >
                    {isSimulating ? t('common.loading') : t('liqpay.testSimulate')}
                </Button>
                <div>
                    <Button variant="secondary" onClick={onClose} style={{ marginRight: '8px' }}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleLiqPaySubmit}
                        disabled={isSimulating || isCheckingOut || activeAmount <= 0}
                        style={{
                            background: 'linear-gradient(135deg, #ffd700 0%, #ff8800 100%)',
                            border: 'none',
                            color: '#000000',
                            fontWeight: 700,
                        }}
                    >
                        {isCheckingOut ? t('liqpay.processing') : `${t('liqpay.checkoutLiqPay')} (${activeAmount} ₴)`}
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};