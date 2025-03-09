import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: any; // 👈 або конкретний тип користувача, напр. `UserPayload`
}
