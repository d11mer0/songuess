import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class HashService {
    async hashPassword(password: string) {
        return await bcrypt.hash(password, 10);
    }

    async comparePasswords(password: string, hashedPassword: string) {
        if (!password || !hashedPassword) {
            throw new BadRequestException('Invalid login or password');
        }
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (!isMatch) {
            throw new BadRequestException('Incorrect login or password');
        }
        return isMatch;
    }
}
