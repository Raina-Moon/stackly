import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardMember } from '../../entities/board-member.entity';
import { UserPresence } from './dto/socket-events.dto';

interface BoardRoom {
  users: Map<string, UserPresence>;
  voiceUsers: Set<string>;
}

@Injectable()
export class RealtimeService {
  // Map of boardId -> BoardRoom
  private boards: Map<string, BoardRoom> = new Map();
  // Map of socketId -> { userId, boardIds }
  private connections: Map<string, { userId: string; boardIds: Set<string> }> = new Map();

  constructor(
    @InjectRepository(BoardMember)
    private boardMemberRepository: Repository<BoardMember>,
  ) {}

  async canAccessBoard(boardId: string, userId: string): Promise<boolean> {
    const member = await this.boardMemberRepository.findOne({
      where: { boardId, userId },
    });
    return !!member;
  }

  registerConnection(socketId: string, userId: string): void {
    this.connections.set(socketId, { userId, boardIds: new Set() });
  }

  unregisterConnection(socketId: string): { userId: string; boardIds: string[] } | null {
    const connection = this.connections.get(socketId);
    if (!connection) return null;

    this.connections.delete(socketId);
    return {
      userId: connection.userId,
      boardIds: Array.from(connection.boardIds),
    };
  }

  joinBoard(socketId: string, boardId: string, user: UserPresence): UserPresence[] {
    // Update connection's board list
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.boardIds.add(boardId);
    }

    // Initialize board room if needed
    if (!this.boards.has(boardId)) {
      this.boards.set(boardId, {
        users: new Map(),
        voiceUsers: new Set(),
      });
    }

    const room = this.boards.get(boardId)!;
    room.users.set(user.id, user);

    return Array.from(room.users.values());
  }

  leaveBoard(socketId: string, boardId: string, userId: string): void {
    // Update connection's board list
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.boardIds.delete(boardId);
    }

    const room = this.boards.get(boardId);
    if (!room) return;

    room.users.delete(userId);
    room.voiceUsers.delete(userId);

    // Clean up empty rooms
    if (room.users.size === 0) {
      this.boards.delete(boardId);
    }
  }

  getBoardUsers(boardId: string): UserPresence[] {
    const room = this.boards.get(boardId);
    if (!room) return [];
    return Array.from(room.users.values());
  }

  getVoiceUsers(boardId: string): string[] {
    const room = this.boards.get(boardId);
    if (!room) return [];
    return Array.from(room.voiceUsers);
  }

  updateCursor(boardId: string, userId: string, x: number, y: number): void {
    const room = this.boards.get(boardId);
    if (!room) return;

    const user = room.users.get(userId);
    if (user) {
      user.cursor = { x, y };
    }
  }

  setDragState(
    boardId: string,
    userId: string,
    isDragging: boolean,
    dragItem?: { type: 'card' | 'column'; id: string },
  ): void {
    const room = this.boards.get(boardId);
    if (!room) return;

    const user = room.users.get(userId);
    if (user) {
      user.isDragging = isDragging;
      user.dragItem = isDragging ? dragItem : undefined;
    }
  }

  joinVoice(boardId: string, userId: string): string[] {
    const room = this.boards.get(boardId);
    if (!room) return [];

    const existingUsers = Array.from(room.voiceUsers);
    room.voiceUsers.add(userId);

    const user = room.users.get(userId);
    if (user) {
      user.isInVoice = true;
    }

    return existingUsers;
  }

  leaveVoice(boardId: string, userId: string): void {
    const room = this.boards.get(boardId);
    if (!room) return;

    room.voiceUsers.delete(userId);

    const user = room.users.get(userId);
    if (user) {
      user.isInVoice = false;
    }
  }

  isUserInVoice(boardId: string, userId: string): boolean {
    const room = this.boards.get(boardId);
    if (!room) return false;
    return room.voiceUsers.has(userId);
  }

  getUserSocketIds(boardId: string, userId: string): string[] {
    const socketIds: string[] = [];
    for (const [socketId, connection] of this.connections) {
      if (connection.userId === userId && connection.boardIds.has(boardId)) {
        socketIds.push(socketId);
      }
    }
    return socketIds;
  }
}
