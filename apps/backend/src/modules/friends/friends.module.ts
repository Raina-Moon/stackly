import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friend } from '../../entities/friend.entity';
import { User } from '../../entities/user.entity';
import { BoardMember } from '../../entities/board-member.entity';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Friend, User, BoardMember]),
    AuthModule,
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
