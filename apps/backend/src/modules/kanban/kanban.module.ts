import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from '../../entities/board.entity';
import { Column } from '../../entities/column.entity';
import { Card } from '../../entities/card.entity';
import { BoardService } from './services/board.service';
import { ColumnService } from './services/column.service';
import { CardService } from './services/card.service';
import { BoardController } from './controllers/board.controller';
import { ColumnController } from './controllers/column.controller';
import { CardController } from './controllers/card.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Board, Column, Card])],
  controllers: [BoardController, ColumnController, CardController],
  providers: [BoardService, ColumnService, CardService],
  exports: [BoardService, ColumnService, CardService],
})
export class KanbanModule {}
