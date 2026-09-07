import React, { useRef, useEffect } from 'react';
import styles from './NeonVisualizer.module.css';

interface NeonVisualizerProps {
    isPlaying: boolean;
}

const BAR_COUNT = 32;

const NeonVisualizer: React.FC<NeonVisualizerProps> = ({ isPlaying }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const peaksRef = useRef<number[]>(new Array(BAR_COUNT).fill(0));
    const heightsRef = useRef<number[]>(new Array(BAR_COUNT).fill(4));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = (canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1));
        let height = (canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1));

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
            height = canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
        };

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(canvas);

        let phase = 0;

        const render = () => {
            phase += 0.08;
            ctx.clearRect(0, 0, width, height);

            const gap = 3 * (window.devicePixelRatio || 1);
            const totalGaps = gap * (BAR_COUNT - 1);
            const barWidth = Math.max(2, (width - totalGaps) / BAR_COUNT);

            // Створюємо неоновий градієнт
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#f15bb5'); // Neon Magenta
            gradient.addColorStop(0.5, '#7928ca'); // Purple
            gradient.addColorStop(1, '#00f3ff'); // Neon Cyan

            for (let i = 0; i < BAR_COUNT; i++) {
                let targetHeight = 4;
                if (isPlaying) {
                    // Симулюємо динамічний музичний спектр
                    const s1 = Math.sin(phase + i * 0.4) * 0.5 + 0.5;
                    const s2 = Math.cos(phase * 1.3 - i * 0.25) * 0.5 + 0.5;
                    const s3 = Math.sin(phase * 0.7 + i * 0.8) * 0.5 + 0.5;
                    const energy = (s1 * 0.4 + s2 * 0.35 + s3 * 0.25);
                    const envelope = 1 - Math.abs((i - BAR_COUNT / 2) / (BAR_COUNT / 2)) * 0.3;

                    targetHeight = Math.max(6, energy * envelope * (height * 0.88));
                } else {
                    // Спокійний стан (idle)
                    targetHeight = Math.max(3, 4 + Math.sin(phase * 0.4 + i * 0.3) * 3);
                }

                // Плавна інтерполяція висоти
                heightsRef.current[i] += (targetHeight - heightsRef.current[i]) * 0.3;
                const curH = heightsRef.current[i];

                // Обчислення піків (падаючі крапки)
                if (curH >= peaksRef.current[i]) {
                    peaksRef.current[i] = curH;
                } else {
                    peaksRef.current[i] = Math.max(curH, peaksRef.current[i] - 1.2);
                }

                const x = i * (barWidth + gap);
                const y = height - curH;

                // Малювання стовпчика еквалайзера
                ctx.save();
                ctx.fillStyle = gradient;
                ctx.shadowColor = isPlaying ? '#00f3ff' : 'transparent';
                ctx.shadowBlur = isPlaying ? 8 : 0;

                // Заокруглений прямокутник
                const radius = Math.min(barWidth / 2, 3);
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + barWidth - radius, y);
                ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
                ctx.lineTo(x + barWidth, height);
                ctx.lineTo(x, height);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
                ctx.fill();

                // Малювання неонової шапки піку
                if (isPlaying) {
                    const peakY = height - peaksRef.current[i] - 2;
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = '#f15bb5';
                    ctx.shadowBlur = 10;
                    ctx.fillRect(x, peakY, barWidth, 2);
                }

                ctx.restore();
            }

            // Малювання плавної хвилі поверх стовпчиків
            if (isPlaying) {
                ctx.save();
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(0, 243, 255, 0.45)';
                ctx.lineWidth = 2 * (window.devicePixelRatio || 1);
                ctx.shadowColor = '#00f3ff';
                ctx.shadowBlur = 12;

                for (let i = 0; i < BAR_COUNT; i++) {
                    const x = i * (barWidth + gap) + barWidth / 2;
                    const y = height - heightsRef.current[i];
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.restore();
            }

            animFrameRef.current = requestAnimationFrame(render);
        };

        animFrameRef.current = requestAnimationFrame(render);

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            resizeObserver.disconnect();
        };
    }, [isPlaying]);

    return (
        <div className={styles.visualizerContainer}>
            <div className={styles.visualizerHeader}>
                <div className={styles.statusText}>
                    <span className={`${styles.statusDot} ${!isPlaying ? styles.idle : ''}`} />
                    {isPlaying ? 'AUDIO LIVE' : 'STANDBY'}
                </div>
            </div>
            <canvas ref={canvasRef} className={styles.canvas} />
        </div>
    );
};

export default NeonVisualizer;