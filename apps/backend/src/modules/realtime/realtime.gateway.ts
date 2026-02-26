import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RealtimeService } from './realtime.service';
import { UserService } from '../auth/services/user.service';
import {
  JoinBoardDto,
  LeaveBoardDto,
  CardMoveDto,
  CardUpdateDto,
  CardCreateDto,
  CardDeleteDto,
  CardReorderDto,
  ColumnCreateDto,
  ColumnUpdateDto,
  ColumnDeleteDto,
  ColumnReorderDto,
  CursorMoveDto,
  DragStartDto,
  DragEndDto,
  VoiceJoinDto,
  VoiceLeaveDto,
  VoiceOfferDto,
  VoiceAnswerDto,
  VoiceIceCandidateDto,
  AuthUser,
  UserPresence,
} from './dto/socket-events.dto';
import {
  decodeRealtimeMessage,
  encodeRealtimeMessage,
} from '@stackly/proto';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private realtimeService: RealtimeService,
    private userService: UserService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = await this.authenticateSocket(client);
      client.data.user = user;
      this.realtimeService.registerConnection(client.id, user.id);
      console.log(`Client connected: ${client.id} (${user.nickname})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Client authentication failed: ${client.id}`, message);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const connection = this.realtimeService.unregisterConnection(client.id);
    if (connection) {
      // Notify all boards the user was in
      for (const boardId of connection.boardIds) {
        this.realtimeService.leaveBoard(client.id, boardId, connection.userId);
        this.server.to(`board:${boardId}`).emit('user_left', {
          userId: connection.userId,
          boardId,
        });
      }
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  private async authenticateSocket(client: Socket): Promise<AuthUser> {
    const token = this.extractToken(client);
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

      return {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      };
    } catch (error) {
      throw new WsException('Invalid authentication token');
    }
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return client.handshake.auth?.token || client.handshake.query?.token || null;
  }

  private getUser(client: Socket): AuthUser {
    const user = client.data.user;
    if (!user) {
      throw new WsException('Not authenticated');
    }
    return user;
  }

  // ============ Room Management ============

  @SubscribeMessage('join_board')
  async handleJoinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinBoardDto,
  ): Promise<void> {
    const user = this.getUser(client);
    const { boardId } = data;

    // Check board access
    const canAccess = await this.realtimeService.canAccessBoard(boardId, user.id);
    if (!canAccess) {
      throw new WsException('Access denied to this board');
    }

    // Join socket room
    client.join(`board:${boardId}`);

    // Track user presence
    const userPresence: UserPresence = {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
    };
    const users = this.realtimeService.joinBoard(client.id, boardId, userPresence);
    const voiceUsers = this.realtimeService.getVoiceUsers(boardId);

    // Send current board state to joining user
    client.emit('board_sync', { users, voiceUsers });

    // Notify others
    client.to(`board:${boardId}`).emit('user_joined', {
      user: userPresence,
      boardId,
    });

    console.log(`User ${user.nickname} joined board ${boardId}`);
  }

  @SubscribeMessage('leave_board')
  async handleLeaveBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LeaveBoardDto,
  ): Promise<void> {
    const user = this.getUser(client);
    const { boardId } = data;

    client.leave(`board:${boardId}`);
    this.realtimeService.leaveBoard(client.id, boardId, user.id);

    // Notify others
    this.server.to(`board:${boardId}`).emit('user_left', {
      userId: user.id,
      boardId,
    });

    console.log(`User ${user.nickname} left board ${boardId}`);
  }

  // ============ Card Events ============

  @SubscribeMessage('card_move')
  async handleCardMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CardMoveDto & { boardId: string },
  ): Promise<void> {
    const user = this.getUser(client);
    client.to(`board:${data.boardId}`).emit('card_moved', {
      ...data,
      userId: user.id,
    });
  }

  @SubscribeMessage('card_update')
  async handleCardUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CardUpdateDto,
  ): Promise<void> {
    const user = this.getUser(client);
    client.to(`board:${data.boardId}`).emit('card_updated', {
      ...data,
      userId: user.id,
    });
  }

  @SubscribeMessage('card_create')
  async handleCardCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CardCreateDto,
  ): Promise<void> {
    const user = this.getUser(client);
    client.to(`board:${data.boardId}`).emit('card_created', {
      ...data,
      userId: user.id,
    });
  }

  @SubscribeMessage('card_delete')
  async handleCardDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CardDeleteDto,
  ): Promise<void> {
    const user = this.getUser(client);
    client.to(`board:${data.boardId}`).emit('card_deleted', {
      ...data,
      userId: user.id,
    });
  }

  @SubscribeMessage('card_reorder')
  async handleCardReorder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CardReorderDto,
  ): Promise<void> {
    const user = this.getUser(client);
    client.to(`board:${data.boardId}`).emit('cards_reordered', {
      ...data,
      userId: user.id,
    });
  }

  // ============ Column Events ============

  @SubscribeMessage('column_create')
  async handleColumnCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ColumnCreateDto,
  ): Promise<void> {
    const user = this.getUser(client);
    client.to(`board:${data.boardId}`).emit('column_created', {
      ...data,
      userId: user.id,
    });
  }

  @SubscribeMessage('column_update')
  async handleColumnUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ColumnUpdateDto,
  ): Promise<void> {
    const user = this.getUser(client);
    client.to(`board:${data.boardId}`).emit('column_updated', {
      ...data,
      userId: user.id,
    });
  }

  @SubscribeMessage('column_delete')
  async handleColumnDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ColumnDeleteDto,
  ): Promise<void> {
    const user = this.getUser(client);
    client.to(`board:${data.boardId}`).emit('column_deleted', {
      ...data,
      userId: user.id,
    });
  }

  @SubscribeMessage('column_reorder')
  async handleColumnReorder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ColumnReorderDto,
  ): Promise<void> {
    const user = this.getUser(client);
    client.to(`board:${data.boardId}`).emit('columns_reordered', {
      ...data,
      userId: user.id,
    });
  }

  // ============ Presence Events ============

  @SubscribeMessage('cursor_move')
  async handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CursorMoveDto,
  ): Promise<void> {
    const user = this.getUser(client);
    this.realtimeService.updateCursor(data.boardId, user.id, data.x, data.y);

    client.to(`board:${data.boardId}`).emit('cursor_updated', {
      userId: user.id,
      boardId: data.boardId,
      x: data.x,
      y: data.y,
    });
  }

  @SubscribeMessage('drag_start')
  async handleDragStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: DragStartDto,
  ): Promise<void> {
    const user = this.getUser(client);
    this.realtimeService.setDragState(data.boardId, user.id, true, {
      type: data.itemType,
      id: data.itemId,
    });

    client.to(`board:${data.boardId}`).emit('drag_started', {
      userId: user.id,
      boardId: data.boardId,
      itemType: data.itemType,
      itemId: data.itemId,
    });
  }

  @SubscribeMessage('drag_end')
  async handleDragEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: DragEndDto,
  ): Promise<void> {
    const user = this.getUser(client);
    this.realtimeService.setDragState(data.boardId, user.id, false);

    client.to(`board:${data.boardId}`).emit('drag_ended', {
      userId: user.id,
      boardId: data.boardId,
    });
  }

  // ============ Voice Chat Events ============

  @SubscribeMessage('voice_join')
  async handleVoiceJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: VoiceJoinDto,
  ): Promise<void> {
    const user = this.getUser(client);
    const existingUsers = this.realtimeService.joinVoice(data.boardId, user.id);

    // Notify existing voice users
    client.to(`board:${data.boardId}`).emit('voice_user_joined', {
      userId: user.id,
      nickname: user.nickname,
      boardId: data.boardId,
    });

    // Send list of existing voice users to the joining user
    client.emit('voice_users', {
      boardId: data.boardId,
      userIds: existingUsers,
    });

    console.log(`User ${user.nickname} joined voice in board ${data.boardId}`);
  }

  @SubscribeMessage('voice_leave')
  async handleVoiceLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: VoiceLeaveDto,
  ): Promise<void> {
    const user = this.getUser(client);
    this.realtimeService.leaveVoice(data.boardId, user.id);

    client.to(`board:${data.boardId}`).emit('voice_user_left', {
      userId: user.id,
      boardId: data.boardId,
    });

    console.log(`User ${user.nickname} left voice in board ${data.boardId}`);
  }

  @SubscribeMessage('voice_offer')
  async handleVoiceOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: VoiceOfferDto,
  ): Promise<void> {
    const user = this.getUser(client);

    // Find target user's socket and send offer
    const targetSocketIds = this.realtimeService.getUserSocketIds(
      data.boardId,
      data.targetUserId,
    );

    for (const socketId of targetSocketIds) {
      this.server.to(socketId).emit('voice_offer', {
        fromUserId: user.id,
        offer: data.offer,
        boardId: data.boardId,
      });
    }
  }

  @SubscribeMessage('voice_answer')
  async handleVoiceAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: VoiceAnswerDto,
  ): Promise<void> {
    const user = this.getUser(client);

    const targetSocketIds = this.realtimeService.getUserSocketIds(
      data.boardId,
      data.targetUserId,
    );

    for (const socketId of targetSocketIds) {
      this.server.to(socketId).emit('voice_answer', {
        fromUserId: user.id,
        answer: data.answer,
        boardId: data.boardId,
      });
    }
  }

  @SubscribeMessage('voice_ice_candidate')
  async handleVoiceIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: VoiceIceCandidateDto,
  ): Promise<void> {
    const user = this.getUser(client);

    const targetSocketIds = this.realtimeService.getUserSocketIds(
      data.boardId,
      data.targetUserId,
    );

    for (const socketId of targetSocketIds) {
      this.server.to(socketId).emit('voice_ice_candidate', {
        fromUserId: user.id,
        candidate: data.candidate,
        boardId: data.boardId,
      });
    }
  }

  @SubscribeMessage('voice_audio_level')
  async handleVoiceAudioLevel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string; level: number },
  ): Promise<void> {
    const user = this.getUser(client);

    // Broadcast audio level to other users in the board
    client.to(`board:${data.boardId}`).emit('voice_audio_level', {
      userId: user.id,
      level: data.level,
    });
  }

  // ============ Binary Protobuf Handlers ============

  @SubscribeMessage('cursor_move:bin')
  async handleCursorMoveBin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: Buffer,
  ): Promise<void> {
    const user = this.getUser(client);
    const msg = decodeRealtimeMessage(new Uint8Array(data));
    const cursor = msg.cursorMove;
    if (!cursor?.boardId) return;

    this.realtimeService.updateCursor(cursor.boardId, user.id, cursor.x ?? 0, cursor.y ?? 0);

    const response = encodeRealtimeMessage({
      cursorUpdate: {
        userId: user.id,
        boardId: cursor.boardId,
        x: cursor.x,
        y: cursor.y,
      },
    });
    client.to(`board:${cursor.boardId}`).emit('cursor_updated:bin', Buffer.from(response));
  }

  @SubscribeMessage('drag_start:bin')
  async handleDragStartBin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: Buffer,
  ): Promise<void> {
    const user = this.getUser(client);
    const msg = decodeRealtimeMessage(new Uint8Array(data));
    const drag = msg.dragStart;
    if (!drag?.boardId) return;

    this.realtimeService.setDragState(drag.boardId, user.id, true, {
      type: (drag.itemType as 'card' | 'column') ?? 'card',
      id: drag.itemId ?? '',
    });

    const response = encodeRealtimeMessage({
      dragStarted: {
        userId: user.id,
        boardId: drag.boardId,
        itemType: drag.itemType,
        itemId: drag.itemId,
      },
    });
    client.to(`board:${drag.boardId}`).emit('drag_started:bin', Buffer.from(response));
  }

  @SubscribeMessage('drag_end:bin')
  async handleDragEndBin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: Buffer,
  ): Promise<void> {
    const user = this.getUser(client);
    const msg = decodeRealtimeMessage(new Uint8Array(data));
    const drag = msg.dragEnd;
    if (!drag?.boardId) return;

    this.realtimeService.setDragState(drag.boardId, user.id, false);

    const response = encodeRealtimeMessage({
      dragEnded: {
        userId: user.id,
        boardId: drag.boardId,
      },
    });
    client.to(`board:${drag.boardId}`).emit('drag_ended:bin', Buffer.from(response));
  }

  @SubscribeMessage('card_move:bin')
  async handleCardMoveBin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: Buffer,
  ): Promise<void> {
    const user = this.getUser(client);
    const msg = decodeRealtimeMessage(new Uint8Array(data));
    const card = msg.cardMove;
    if (!card?.boardId) return;

    const response = encodeRealtimeMessage({
      cardMoved: {
        boardId: card.boardId,
        cardId: card.cardId,
        sourceColumnId: card.sourceColumnId,
        targetColumnId: card.targetColumnId,
        position: card.position,
        userId: user.id,
      },
    });
    client.to(`board:${card.boardId}`).emit('card_moved:bin', Buffer.from(response));
  }

  @SubscribeMessage('column_reorder:bin')
  async handleColumnReorderBin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: Buffer,
  ): Promise<void> {
    const user = this.getUser(client);
    const msg = decodeRealtimeMessage(new Uint8Array(data));
    const reorder = msg.columnReorder;
    if (!reorder?.boardId) return;

    const response = encodeRealtimeMessage({
      columnsReordered: {
        boardId: reorder.boardId,
        columnIds: reorder.columnIds,
        userId: user.id,
      },
    });
    client.to(`board:${reorder.boardId}`).emit('columns_reordered:bin', Buffer.from(response));
  }

  @SubscribeMessage('audio_level:bin')
  async handleAudioLevelBin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: Buffer,
  ): Promise<void> {
    const user = this.getUser(client);
    const msg = decodeRealtimeMessage(new Uint8Array(data));
    const audio = msg.audioLevel;
    if (!audio?.boardId) return;

    const response = encodeRealtimeMessage({
      audioLevelUpdate: {
        userId: user.id,
        level: audio.level,
      },
    });
    client.to(`board:${audio.boardId}`).emit('audio_level:bin', Buffer.from(response));
  }
}
