import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { DATABASE } from '../../database/database.module';
import { users } from '../../database/schema';

export interface JwtPayload {
  sub: number;
  username: string;
  email: string;
  operatorId: number;
  roleId: number;
  isSuper: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly INACTIVITY_TIMEOUT_MINUTES = 30; // 30 minutes of inactivity

  constructor(
    private readonly configService: ConfigService,
    @Inject(DATABASE) private db: MySql2Database,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'your-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    // Check if user is still active and validate inactivity timeout
    const [user] = await this.db
      .select({
        id: users.id,
        status: users.status,
        lastActivityAt: users.lastActivityAt,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.status) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Check inactivity timeout
    if (user.lastActivityAt) {
      const inactiveMinutes =
        (Date.now() - user.lastActivityAt.getTime()) / 60000;

      if (inactiveMinutes > this.INACTIVITY_TIMEOUT_MINUTES) {
        throw new UnauthorizedException(
          'Session expired due to inactivity. Please log in again.',
        );
      }
    }

    // Update last activity timestamp
    await this.db
      .update(users)
      .set({ lastActivityAt: new Date() })
      .where(eq(users.id, payload.sub));

    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      operatorId: payload.operatorId,
      roleId: payload.roleId,
      isSuper: payload.isSuper,
    };
  }
}
