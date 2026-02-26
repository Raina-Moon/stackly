import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../auth/services/user.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractTokenFromHandshake(client);

    if (!token) {
      throw new WsException('Authentication token required');
    }

    try {
      const secret = this.configService.getOrThrow<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret });

      const user = await this.userService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new WsException('User not found or inactive');
      }

      // Attach user to socket data
      client.data.user = {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
      };

      return true;
    } catch (error) {
      throw new WsException('Invalid authentication token');
    }
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    // Try auth header first
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // Try query parameter
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (token && typeof token === 'string') {
      return token;
    }

    return null;
  }
}
