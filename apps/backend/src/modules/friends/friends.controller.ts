import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser, AuthUser } from '../auth/decorators/get-user.decorator';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  async getFriends(@GetUser() user: AuthUser) {
    return this.friendsService.getFriends(user.id);
  }

  @Get('collaborators')
  async getCollaborators(@GetUser() user: AuthUser) {
    return this.friendsService.getCollaborators(user.id);
  }

  @Get('all')
  async getAllContacts(@GetUser() user: AuthUser) {
    return this.friendsService.getAllContacts(user.id);
  }

  @Get('requests/incoming')
  async getIncomingRequests(@GetUser() user: AuthUser) {
    return this.friendsService.getIncomingRequests(user.id);
  }

  @Post('request')
  async sendFriendRequest(
    @Body() body: { addresseeId: string },
    @GetUser() user: AuthUser,
  ) {
    const request = await this.friendsService.sendFriendRequest(user.id, body.addresseeId);
    return {
      message: '친구 요청을 보냈습니다.',
      request,
    };
  }

  @Put('request/:id/accept')
  async acceptFriendRequest(
    @Param('id') id: string,
    @GetUser() user: AuthUser,
  ) {
    const request = await this.friendsService.acceptFriendRequest(id, user.id);
    return {
      message: '친구 요청을 수락했습니다.',
      request,
    };
  }

  @Put('request/:id/reject')
  async rejectFriendRequest(
    @Param('id') id: string,
    @GetUser() user: AuthUser,
  ) {
    const request = await this.friendsService.rejectFriendRequest(id, user.id);
    return {
      message: '친구 요청을 거절했습니다.',
      request,
    };
  }

  @Delete(':userId')
  async removeFriend(
    @Param('userId') friendUserId: string,
    @GetUser() user: AuthUser,
  ) {
    await this.friendsService.removeFriend(user.id, friendUserId);
    return {
      message: '친구를 삭제했습니다.',
    };
  }
}
