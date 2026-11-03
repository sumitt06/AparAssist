import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is missing in environment variables');
}

export interface AuthRequest extends Request {
    user?: {
        id: number;
        role: 'INSTITUTION_ADMIN' | 'AICTE_ADMIN' | 'AICTE_DEMO';
        institution_id: number | null;
    };
}

export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is required'
            });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];

        if (
            !decoded ||
            typeof decoded.id !== 'number' ||
            !['INSTITUTION_ADMIN', 'AICTE_ADMIN', 'AICTE_DEMO'].includes(decoded.role)
        ) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token'
            });
        }

        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

export const authorizeRoles = (...roles: Array<'INSTITUTION_ADMIN' | 'AICTE_ADMIN' | 'AICTE_DEMO'>) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this resource'
            });
        }

        next();
    };
};