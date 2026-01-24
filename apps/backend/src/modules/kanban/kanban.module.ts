import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from '../../entities/board.entity';
import { Column } from '../../entities/column.entity';
import { Card } from '../../entities/card.entity';
import { BoardMember } from '../../entities/board-member.entity';
import { BoardService } from './services/board.service';
import { ColumnService } from './services/column.service';
import { CardService } from './services/card.service';
import { BoardController } from './controllers/board.controller';
import { ColumnController } from './controllers/column.controller';
import { CardController } from './controllers/card.controller';
import { BoardAccessGuard } from './guards/board-access.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Board, Column, Card, BoardMember]),
    AuthModule,
  ],
  controllers: [BoardController, ColumnController, CardController],
  providers: [BoardService, ColumnService, CardService, BoardAccessGuard],
  exports: [BoardService, ColumnService, CardService, BoardAccessGuard],
})
export class KanbanModule {}
