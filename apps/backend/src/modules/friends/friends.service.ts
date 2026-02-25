import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In, IsNull } from 'typeorm';
import { Friend, FriendshipStatus } from '../../entities/friend.entity';
import { User } from '../../entities/user.entity';
import { BoardMember } from '../../entities/board-member.entity';
import { CacheService, CacheInvalidationService } from '../../cache';

export interface ContactUser {
  id: string;
  email: string;
  nickname: string;
  firstName: string;
  lastName?: string;
  avatar?: string;
  isFriend: boolean;
  isCollaborator: boolean;
}

const FRIENDS_TTL = 300_000;        // 5 minutes
const COLLABORATORS_TTL = 300_000;  // 5 minutes
const CONTACTS_TTL = 300_000;       // 5 minutes

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BoardMember)
    private boardMemberRepository: Repository<BoardMember>,
    private readonly cacheService: CacheService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friend> {
    if (requesterId === addresseeId) {
      throw new BadRequestException('자기 자신에게 친구 요청을 보낼 수 없습니다.');
    }

    // Check if addressee exists
    const addressee = await this.userRepository.findOne({
      where: { id: addresseeId, deletedAt: IsNull() },
    });
    if (!addressee) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // Check if request already exists (in either direction)
    const existingRequest = await this.friendRepository.findOne({
      where: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('이미 친구입니다.');
      }
      if (existingRequest.status === FriendshipStatus.PENDING) {
        if (existingRequest.requesterId === requesterId) {
          throw new ConflictException('이미 친구 요청을 보냈습니다.');
        } else {
          // The other person already sent a request, auto-accept
          existingRequest.status = FriendshipStatus.ACCEPTED;
          const saved = await this.friendRepository.save(existingRequest);
          await this.cacheInvalidation.onFriendshipChange(requesterId, addresseeId);
          return saved;
        }
      }
      if (existingRequest.status === FriendshipStatus.REJECTED) {
        // Allow re-sending if previously rejected
        existingRequest.status = FriendshipStatus.PENDING;
        existingRequest.requesterId = requesterId;
        existingRequest.addresseeId = addresseeId;
        return this.friendRepository.save(existingRequest);
      }
    }

    const friendRequest = this.friendRepository.create({
      requesterId,
      addresseeId,
      status: FriendshipStatus.PENDING,
    });

    return this.friendRepository.save(friendRequest);
  }

  async acceptFriendRequest(requestId: string, userId: string): Promise<Friend> {
    const request = await this.friendRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    }

    if (request.addresseeId !== userId) {
      throw new BadRequestException('이 요청을 수락할 권한이 없습니다.');
    }

    if (request.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('이미 처리된 요청입니다.');
    }

    request.status = FriendshipStatus.ACCEPTED;
    const saved = await this.friendRepository.save(request);
    await this.cacheInvalidation.onFriendshipChange(request.requesterId, request.addresseeId);
    return saved;
  }

  async rejectFriendRequest(requestId: string, userId: string): Promise<Friend> {
    const request = await this.friendRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    }

    if (request.addresseeId !== userId) {
      throw new BadRequestException('이 요청을 거절할 권한이 없습니다.');
    }

    if (request.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('이미 처리된 요청입니다.');
    }

    request.status = FriendshipStatus.REJECTED;
    const saved = await this.friendRepository.save(request);
    await this.cacheInvalidation.onFriendshipChange(request.requesterId, request.addresseeId);
    return saved;
  }

  async removeFriend(userId: string, friendUserId: string): Promise<void> {
    const friendship = await this.friendRepository.findOne({
      where: [
        { requesterId: userId, addresseeId: friendUserId, status: FriendshipStatus.ACCEPTED },
        { requesterId: friendUserId, addresseeId: userId, status: FriendshipStatus.ACCEPTED },
      ],
    });

    if (!friendship) {
      throw new NotFoundException('친구 관계를 찾을 수 없습니다.');
    }

    await this.friendRepository.remove(friendship);
    await this.cacheInvalidation.onFriendshipChange(userId, friendUserId);
  }

  async getFriends(userId: string): Promise<ContactUser[]> {
    const cacheKey = this.cacheInvalidation.userFriendsKey(userId);
    const cached = await this.cacheService.get<ContactUser[]>(cacheKey);
    if (cached) return cached;

    const friendships = await this.friendRepository.find({
      where: [
        { requesterId: userId, status: FriendshipStatus.ACCEPTED },
        { addresseeId: userId, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['requester', 'addressee'],
    });

    const collaboratorIds = await this.getCollaboratorIds(userId);
    const collaboratorSet = new Set(collaboratorIds);

    const result = friendships.map((f) => {
      const friend = f.requesterId === userId ? f.addressee : f.requester;
      return {
        id: friend.id,
        email: friend.email,
        nickname: friend.nickname,
        firstName: friend.firstName,
        lastName: friend.lastName,
        avatar: friend.avatar,
        isFriend: true,
        isCollaborator: collaboratorSet.has(friend.id),
      };
    });

    await this.cacheService.set(cacheKey, result, FRIENDS_TTL);
    return result;
  }

  async getCollaborators(userId: string): Promise<ContactUser[]> {
    const cacheKey = this.cacheInvalidation.userCollaboratorsKey(userId);
    const cached = await this.cacheService.get<ContactUser[]>(cacheKey);
    if (cached) return cached;

    // Get all boards the user is a member of
    const userMemberships = await this.boardMemberRepository.find({
      where: { userId },
      select: ['boardId'],
    });

    if (userMemberships.length === 0) {
      await this.cacheService.set(cacheKey, [], COLLABORATORS_TTL);
      return [];
    }

    const boardIds = userMemberships.map((m) => m.boardId);

    // Get all members of those boards (excluding the user)
    const collaboratorMemberships = await this.boardMemberRepository.find({
      where: {
        boardId: In(boardIds),
        userId: Not(userId),
      },
      relations: ['user'],
    });

    // Deduplicate by user ID
    const userMap = new Map<string, User>();
    collaboratorMemberships.forEach((m) => {
      if (m.user && !m.user.deletedAt) {
        userMap.set(m.user.id, m.user);
      }
    });

    // Get friend IDs for marking
    const friendIds = await this.getFriendIds(userId);
    const friendSet = new Set(friendIds);

    const result = Array.from(userMap.values()).map((user) => ({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      isFriend: friendSet.has(user.id),
      isCollaborator: true,
    }));

    await this.cacheService.set(cacheKey, result, COLLABORATORS_TTL);
    return result;
  }

  async getAllContacts(userId: string): Promise<ContactUser[]> {
    const cacheKey = this.cacheInvalidation.userContactsKey(userId);
    const cached = await this.cacheService.get<ContactUser[]>(cacheKey);
    if (cached) return cached;

    const friends = await this.getFriends(userId);
    const collaborators = await this.getCollaborators(userId);

    // Merge and deduplicate
    const contactMap = new Map<string, ContactUser>();

    friends.forEach((f) => contactMap.set(f.id, f));

    collaborators.forEach((c) => {
      const existing = contactMap.get(c.id);
      if (existing) {
        // Update flags - user is both friend and collaborator
        existing.isCollaborator = true;
      } else {
        contactMap.set(c.id, c);
      }
    });

    const result = Array.from(contactMap.values());
    await this.cacheService.set(cacheKey, result, CONTACTS_TTL);
    return result;
  }

  async getIncomingRequests(userId: string): Promise<Array<Friend & { requester: User }>> {
    const requests = await this.friendRepository.find({
      where: {
        addresseeId: userId,
        status: FriendshipStatus.PENDING,
      },
      relations: ['requester'],
      order: { createdAt: 'DESC' },
    });

    return requests as Array<Friend & { requester: User }>;
  }

  private async getFriendIds(userId: string): Promise<string[]> {
    const friendships = await this.friendRepository.find({
      where: [
        { requesterId: userId, status: FriendshipStatus.ACCEPTED },
        { addresseeId: userId, status: FriendshipStatus.ACCEPTED },
      ],
    });

    return friendships.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId,
    );
  }

  private async getCollaboratorIds(userId: string): Promise<string[]> {
    const userMemberships = await this.boardMemberRepository.find({
      where: { userId },
      select: ['boardId'],
    });

    if (userMemberships.length === 0) {
      return [];
    }

    const boardIds = userMemberships.map((m) => m.boardId);

    const collaboratorMemberships = await this.boardMemberRepository.find({
      where: {
        boardId: In(boardIds),
        userId: Not(userId),
      },
      select: ['userId'],
    });

    return [...new Set(collaboratorMemberships.map((m) => m.userId))];
  }
}
