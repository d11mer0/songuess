import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallbackTitle?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught React Error caught by ErrorBoundary:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px 24px',
                    textAlign: 'center',
                    maxWidth: '520px',
                    margin: '60px auto',
                    background: 'rgba(26, 21, 40, 0.95)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 85, 85, 0.4)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    color: '#fff',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                    <h2 style={{ color: '#ff5555', marginBottom: '12px', fontSize: '24px' }}>
                        {this.props.fallbackTitle || 'Щось пішло не так'}
                    </h2>
                    <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
                        {this.state.error?.message || 'Сталася непередбачена помилка інтерфейсу.'}
                    </p>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.href = '/game';
                        }}
                        style={{
                            background: 'linear-gradient(135deg, #00f3ff, #0077ff)',
                            border: 'none',
                            color: '#000',
                            fontWeight: 700,
                            padding: '12px 28px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '15px'
                        }}
                    >
                        Повернутися в гру
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
