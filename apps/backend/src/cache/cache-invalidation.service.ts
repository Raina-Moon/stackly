import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';

/** Centralized cache key builder & invalidation helpers */
@Injectable()
export class CacheInvalidationService {
  constructor(private readonly cache: CacheService) {}

  // ── Key builders ─────────────────────────────────────────────

  jwtProfileKey(userId: string) {
    return `stackly:user:${userId}:jwt-profile`;
  }

  userProfileKey(userId: string) {
    return `stackly:user:${userId}:profile`;
  }

  boardFullKey(boardId: string) {
    return `stackly:board:${boardId}:full`;
  }

  userBoardsKey(userId: string) {
    return `stackly:user:${userId}:boards`;
  }

  boardMemberKey(boardId: string, userId: string) {
    return `stackly:board:${boardId}:member:${userId}`;
  }

  userFavoritesKey(userId: string) {
    return `stackly:user:${userId}:favorites`;
  }

  userFriendsKey(userId: string) {
    return `stackly:user:${userId}:friends`;
  }

  userCollaboratorsKey(userId: string) {
    return `stackly:user:${userId}:collaborators`;
  }

  userContactsKey(userId: string) {
    return `stackly:user:${userId}:contacts`;
  }

  notifSummaryKey(userId: string) {
    return `stackly:user:${userId}:notif-summary`;
  }

  userSearchKey(queryHash: string) {
    return `stackly:user:search:${queryHash}`;
  }

  recurringOccKey(id: string, startDate: string, endDate: string) {
    return `stackly:recurring:${id}:occ:${startDate}:${endDate}`;
  }

  // ── Domain-level invalidation ───────────────────────────────

  /** User profile updated or deleted */
  async onUserProfileChange(userId: string) {
    await this.cache.delMany([
      this.jwtProfileKey(userId),
      this.userProfileKey(userId),
    ]);
  }

  /** Board content changed (cards, columns, board props) */
  async onBoardContentChange(boardId: string, memberUserIds: string[]) {
    const keys = [
      this.boardFullKey(boardId),
      ...memberUserIds.map((uid) => this.userBoardsKey(uid)),
    ];
    await this.cache.delMany(keys);
  }

  /** Board member added or removed */
  async onBoardMemberChange(
    boardId: string,
    changedUserId: string,
    allMemberUserIds: string[],
  ) {
    const keys = [
      this.boardFullKey(boardId),
      this.boardMemberKey(boardId, changedUserId),
      this.userBoardsKey(changedUserId),
      this.userCollaboratorsKey(changedUserId),
      this.userContactsKey(changedUserId),
      ...allMemberUserIds.flatMap((uid) => [
        this.userBoardsKey(uid),
        this.userCollaboratorsKey(uid),
        this.userContactsKey(uid),
      ]),
    ];
    await this.cache.delMany(keys);
  }

  /** Board deleted */
  async onBoardDelete(boardId: string, memberUserIds: string[]) {
    const keys = [
      this.boardFullKey(boardId),
      ...memberUserIds.flatMap((uid) => [
        this.boardMemberKey(boardId, uid),
        this.userBoardsKey(uid),
        this.userCollaboratorsKey(uid),
        this.userContactsKey(uid),
      ]),
    ];
    await this.cache.delMany(keys);
  }

  /** Favorite toggled */
  async onFavoriteToggle(userId: string) {
    await this.cache.del(this.userFavoritesKey(userId));
  }

  /** Friend request accepted/rejected/removed */
  async onFriendshipChange(userIdA: string, userIdB: string) {
    await this.cache.delMany([
      this.userFriendsKey(userIdA),
      this.userFriendsKey(userIdB),
      this.userContactsKey(userIdA),
      this.userContactsKey(userIdB),
    ]);
  }

  /** Notification created or read */
  async onNotificationChange(userId: string) {
    await this.cache.del(this.notifSummaryKey(userId));
  }

  /** Recurring schedule modified */
  async onRecurringScheduleChange(scheduleId: string) {
    // We can't enumerate all date-range keys, so we rely on TTL (1h).
    // For immediate invalidation, we'd need to track which keys were created.
    // This is acceptable given the 1h TTL.
  }
}
