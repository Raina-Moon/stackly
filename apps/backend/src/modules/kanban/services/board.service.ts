import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Board } from '../../../entities/board.entity';
import { BoardMember, BoardRole } from '../../../entities/board-member.entity';
import { CreateBoardDto } from '../dto/create-board.dto';
import { UpdateBoardDto } from '../dto/update-board.dto';
import { CacheService, CacheInvalidationService } from '../../../cache';

const BOARD_FULL_TTL = 60_000;       // 1 minute
const USER_BOARDS_TTL = 120_000;     // 2 minutes
const MEMBER_TTL = 600_000;          // 10 minutes
const FAVORITES_TTL = 600_000;       // 10 minutes

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
    @InjectRepository(BoardMember)
    private boardMemberRepository: Repository<BoardMember>,
    private readonly cacheService: CacheService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  async create(createBoardDto: CreateBoardDto, ownerId: string): Promise<Board> {
    const inviteCode = uuidv4();

    const board = this.boardRepository.create({
      ...createBoardDto,
      ownerId,
      inviteCode,
      isPrivate: true,
    });

    const savedBoard = await this.boardRepository.save(board);

    // Add owner as board member with OWNER role
    const ownerMember = this.boardMemberRepository.create({
      boardId: savedBoard.id,
      userId: ownerId,
      role: BoardRole.OWNER,
      canEdit: true,
      canComment: true,
    });
    await this.boardMemberRepository.save(ownerMember);

    // Invalidate owner's board list
    await this.cacheService.del(this.cacheInvalidation.userBoardsKey(ownerId));

    return savedBoard;
  }

  async findAll(skip = 0, take = 10, ownerId?: string): Promise<{ data: Board[]; total: number }> {
    const query = this.boardRepository.createQueryBuilder('board');

    if (ownerId) {
      query.where('board.ownerId = :ownerId', { ownerId });
    }

    query.where('board.deletedAt IS NULL');
    query.orderBy('board.createdAt', 'DESC');
    query.skip(skip).take(take);
    query.leftJoinAndSelect('board.columns', 'columns');
    query.leftJoinAndSelect('board.owner', 'owner', 'owner.deletedAt IS NULL');

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async findById(id: string): Promise<Board> {
    const cacheKey = this.cacheInvalidation.boardFullKey(id);
    const cached = await this.cacheService.get<Board>(cacheKey);
    if (cached) return cached;

    const board = await this.boardRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['columns', 'cards', 'members', 'members.user', 'owner'],
    });

    if (!board) {
      throw new NotFoundException('보드를 찾을 수 없습니다.');
    }

    // Debug: log card positions when board is fetched
    if (board.cards?.length) {
      console.log(`[findById] Board ${id} cards:`, board.cards.map(c => `${c.id.slice(0,8)}→col:${c.columnId.slice(0,8)} pos:${c.position}`));
    }

    await this.cacheService.set(cacheKey, board, BOARD_FULL_TTL);
    return board;
  }

  async update(id: string, updateBoardDto: UpdateBoardDto): Promise<Board> {
    const board = await this.findById(id);
    Object.assign(board, updateBoardDto);
    const saved = await this.boardRepository.save(board);

    const memberIds = await this.getBoardMemberIds(id);
    await this.cacheInvalidation.onBoardContentChange(id, memberIds);

    return saved;
  }

  async remove(id: string): Promise<void> {
    const board = await this.findById(id);
    const memberIds = await this.getBoardMemberIds(id);

    board.deletedAt = new Date();
    await this.boardRepository.save(board);

    await this.cacheInvalidation.onBoardDelete(id, memberIds);
  }

  async findByOwner(ownerId: string): Promise<Board[]> {
    return this.boardRepository.find({
      where: { ownerId, deletedAt: IsNull() },
      relations: ['columns', 'owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByInviteCode(inviteCode: string): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { inviteCode, deletedAt: IsNull() },
      relations: ['owner'],
    });

    if (!board) {
      throw new NotFoundException('유효하지 않은 초대 코드입니다.');
    }

    return board;
  }

  async joinBoard(inviteCode: string, userId: string): Promise<BoardMember> {
    const board = await this.findByInviteCode(inviteCode);

    // Check if user is already a member
    const existingMember = await this.boardMemberRepository.findOne({
      where: { boardId: board.id, userId },
    });

    if (existingMember) {
      throw new ConflictException('이미 이 보드의 멤버입니다.');
    }

    // Add user as a member with MEMBER role
    const member = this.boardMemberRepository.create({
      boardId: board.id,
      userId,
      role: BoardRole.MEMBER,
      canEdit: true,
      canComment: true,
    });

    const saved = await this.boardMemberRepository.save(member);

    const allMemberIds = await this.getBoardMemberIds(board.id);
    await this.cacheInvalidation.onBoardMemberChange(board.id, userId, allMemberIds);

    return saved;
  }

  async regenerateInviteCode(boardId: string, userId: string): Promise<string> {
    const board = await this.findById(boardId);

    // Check if user is owner or admin
    const member = await this.boardMemberRepository.findOne({
      where: { boardId, userId },
    });

    if (!member || (member.role !== BoardRole.OWNER && member.role !== BoardRole.ADMIN)) {
      throw new ForbiddenException('초대 코드 재생성 권한이 없습니다.');
    }

    const newInviteCode = uuidv4();
    board.inviteCode = newInviteCode;
    await this.boardRepository.save(board);

    await this.cacheService.del(this.cacheInvalidation.boardFullKey(boardId));

    return newInviteCode;
  }

  async removeMember(boardId: string, targetUserId: string, requesterId: string): Promise<void> {
    const board = await this.findById(boardId);

    // Check requester's permission
    const requester = await this.boardMemberRepository.findOne({
      where: { boardId, userId: requesterId },
    });

    if (!requester || (requester.role !== BoardRole.OWNER && requester.role !== BoardRole.ADMIN)) {
      throw new ForbiddenException('멤버 제거 권한이 없습니다.');
    }

    // Cannot remove the owner
    if (targetUserId === board.ownerId) {
      throw new ForbiddenException('보드 소유자는 제거할 수 없습니다.');
    }

    const targetMember = await this.boardMemberRepository.findOne({
      where: { boardId, userId: targetUserId },
    });

    if (!targetMember) {
      throw new NotFoundException('멤버를 찾을 수 없습니다.');
    }

    // Admin cannot remove another admin (only owner can)
    if (requester.role === BoardRole.ADMIN && targetMember.role === BoardRole.ADMIN) {
      throw new ForbiddenException('관리자를 제거할 권한이 없습니다.');
    }

    await this.boardMemberRepository.remove(targetMember);

    const remainingMemberIds = await this.getBoardMemberIds(boardId);
    await this.cacheInvalidation.onBoardMemberChange(boardId, targetUserId, remainingMemberIds);
  }

  async isMember(boardId: string, userId: string): Promise<boolean> {
    const cacheKey = this.cacheInvalidation.boardMemberKey(boardId, userId);
    const cached = await this.cacheService.get<boolean>(cacheKey);
    if (cached !== undefined) return cached;

    const member = await this.boardMemberRepository.findOne({
      where: { boardId, userId },
    });
    const result = !!member;

    await this.cacheService.set(cacheKey, result, MEMBER_TTL);
    return result;
  }

  async getMember(boardId: string, userId: string): Promise<BoardMember | null> {
    return this.boardMemberRepository.findOne({
      where: { boardId, userId },
    });
  }

  async areAllMembers(boardId: string, userIds: string[]): Promise<boolean> {
    const normalized = Array.from(new Set(userIds.filter(Boolean)));
    if (normalized.length === 0) return true;

    const count = await this.boardMemberRepository.count({
      where: normalized.map((userId) => ({ boardId, userId })),
    });

    return count === normalized.length;
  }

  async findUserBoards(userId: string): Promise<Board[]> {
    const cacheKey = this.cacheInvalidation.userBoardsKey(userId);
    const cached = await this.cacheService.get<Board[]>(cacheKey);
    if (cached) return cached;

    const memberships = await this.boardMemberRepository.find({
      where: { userId },
      relations: ['board', 'board.columns', 'board.cards', 'board.owner'],
    });

    const boards = memberships
      .filter((m) => m.board && !m.board.deletedAt)
      .map((m) => m.board);

    await this.cacheService.set(cacheKey, boards, USER_BOARDS_TTL);
    return boards;
  }

  async toggleFavorite(boardId: string, userId: string): Promise<{ isFavorite: boolean }> {
    const member = await this.boardMemberRepository.findOne({
      where: { boardId, userId },
    });

    if (!member) {
      throw new ForbiddenException('이 보드에 접근 권한이 없습니다.');
    }

    member.isFavorite = !member.isFavorite;
    await this.boardMemberRepository.save(member);

    await this.cacheInvalidation.onFavoriteToggle(userId);

    return { isFavorite: member.isFavorite };
  }

  async getFavoriteIds(userId: string): Promise<string[]> {
    const cacheKey = this.cacheInvalidation.userFavoritesKey(userId);
    const cached = await this.cacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    const memberships = await this.boardMemberRepository.find({
      where: { userId, isFavorite: true },
      select: ['boardId'],
    });

    const ids = memberships.map((m) => m.boardId);
    await this.cacheService.set(cacheKey, ids, FAVORITES_TTL);
    return ids;
  }

  /** Helper: get all member user IDs for a board (for cache invalidation) */
  async getBoardMemberIds(boardId: string): Promise<string[]> {
    const members = await this.boardMemberRepository.find({
      where: { boardId },
      select: ['userId'],
    });
    return members.map((m) => m.userId);
  }
}
