import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleAuthService {
  private googleClient: OAuth2Client;

  constructor(private configService: ConfigService) {
    this.googleClient = new OAuth2Client(this.configService.get<string>('GOOGLE_CLIENT_ID'));
  }

  async verifyGoogleToken(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.name) {
      throw new UnauthorizedException('Invalid Google ID Token');
    }

    return payload;
  }
}
