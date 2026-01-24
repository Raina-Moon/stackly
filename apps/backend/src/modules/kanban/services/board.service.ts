import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Board } from '../../../entities/board.entity';
import { BoardMember, BoardRole } from '../../../entities/board-member.entity';
import { CreateBoardDto } from '../dto/create-board.dto';
import { UpdateBoardDto } from '../dto/update-board.dto';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
    @InjectRepository(BoardMember)
    private boardMemberRepository: Repository<BoardMember>,
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
    const board = await this.boardRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['columns', 'cards', 'members', 'owner'],
    });

    if (!board) {
      throw new NotFoundException('보드를 찾을 수 없습니다.');
    }

    return board;
  }

  async update(id: string, updateBoardDto: UpdateBoardDto): Promise<Board> {
    const board = await this.findById(id);
    Object.assign(board, updateBoardDto);
    return this.boardRepository.save(board);
  }

  async remove(id: string): Promise<void> {
    const board = await this.findById(id);
    board.deletedAt = new Date();
    await this.boardRepository.save(board);
  }

  async findByOwner(ownerId: string): Promise<Board[]> {
    return this.boardRepository.find({
      where: { ownerId, deletedAt: null },
      relations: ['columns', 'owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByInviteCode(inviteCode: string): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { inviteCode, deletedAt: null },
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

    return this.boardMemberRepository.save(member);
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
  }

  async isMember(boardId: string, userId: string): Promise<boolean> {
    const member = await this.boardMemberRepository.findOne({
      where: { boardId, userId },
    });
    return !!member;
  }

  async getMember(boardId: string, userId: string): Promise<BoardMember | null> {
    return this.boardMemberRepository.findOne({
      where: { boardId, userId },
    });
  }

  async findUserBoards(userId: string): Promise<Board[]> {
    const memberships = await this.boardMemberRepository.find({
      where: { userId },
      relations: ['board', 'board.columns', 'board.owner'],
    });

    return memberships
      .filter((m) => m.board && !m.board.deletedAt)
      .map((m) => m.board);
  }
}
