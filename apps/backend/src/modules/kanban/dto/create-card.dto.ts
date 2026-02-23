import { CardPriority } from '../../../entities/card.entity';

export class CreateCardDto {
  title: string;
  description?: string;
  position: number;
  priority?: CardPriority;
  color?: string;
  tags?: string[];
  estimatedHours?: number;
  dueDate?: Date;
  boardId: string;
  columnId: string;
  assigneeId?: string;
  assigneeIds?: string[];
}
