import { CardPriority } from '../../../entities/card.entity';

export class UpdateCardDto {
  title?: string;
  description?: string;
  position?: number;
  priority?: CardPriority;
  color?: string;
  tags?: string[];
  estimatedHours?: number;
  dueDate?: Date;
  columnId?: string;
  assigneeId?: string;
  completedAt?: Date;
}
