import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

const Confetti: React.FC = () => {
    useEffect(() => {
        const colors = ['#ffd700', '#00f3ff', '#f15bb5', '#9b5de5', '#00ff88'];

        try {
            // Initial celebratory center burst
            confetti({
                particleCount: 80,
                spread: 75,
                origin: { y: 0.6 },
                colors,
                disableForReducedMotion: true,
            });

            // Timed side cannons
            const t1 = setTimeout(() => {
                confetti({
                    particleCount: 45,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0.05, y: 0.65 },
                    colors,
                    disableForReducedMotion: true,
                });
            }, 250);

            const t2 = setTimeout(() => {
                confetti({
                    particleCount: 45,
                    angle: 120,
                    spread: 55,
                    origin: { x: 0.95, y: 0.65 },
                    colors,
                    disableForReducedMotion: true,
                });
            }, 450);

            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
                try {
                    confetti.reset();
                } catch {}
            };
        } catch {}
    }, []);

    return null;
};

export default Confetti;