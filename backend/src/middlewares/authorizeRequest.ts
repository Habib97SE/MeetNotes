// src/middlewares/authorizeRequest.ts

import { Request, Response, NextFunction } from 'express';
import { TOKEN_SECRET } from '../config/env';

/**
 * Authorizes a request based on the token secret
 * @param req - The request object
 * @param res - The response object
 * @param next - The next function
 */
export const authorizeRequest = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token === TOKEN_SECRET) {
            next();
        } else {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
}



