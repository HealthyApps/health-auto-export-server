import { Request, Response, NextFunction } from 'express';

/**
 * Authentication middleware for read access
 */
export const requireReadAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['api-key'] as string;

    if (!token || !token.startsWith('sk-') || token !== process.env.READ_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized: Invalid read token' });
    }

    next();
};

/**
 * Authentication middleware for write access
 */
export const requireWriteAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['api-key'] as string;

    if (!token || !token.startsWith('sk-') || token !== process.env.WRITE_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized: Invalid write token' });
    }

    next();
};

/**
 * Authentication middleware that accepts either read or write token.
 * Used by supplement tracker routes where a single API key grants full access.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['api-key'] as string;

    if (!token || !token.startsWith('sk-') ||
        (token !== process.env.READ_TOKEN && token !== process.env.WRITE_TOKEN)) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }

    next();
}; 