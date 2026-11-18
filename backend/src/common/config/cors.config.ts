export function isOriginAllowed(origin?: string): boolean {
    if (!origin) return true;

    const clientUrl = process.env.CLIENT_URL;
    const allowedOrigins = [
        ...(clientUrl ? clientUrl.split(',').map((u) => u.trim()) : []),
        'http://localhost:3001',
        'http://localhost:3000',
        'http://127.0.0.1:3001',
    ];

    if (allowedOrigins.includes(origin)) {
        return true;
    }

    try {
        const { hostname } = new URL(origin);
        return (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.endsWith('.vercel.app') ||
            hostname.endsWith('.onrender.com')
        );
    } catch {
        return false;
    }
}

export const corsOriginCallback = (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
) => {
    if (isOriginAllowed(origin)) {
        return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
};

export const wsCorsOptions = {
    origin: corsOriginCallback,
    credentials: true,
};
