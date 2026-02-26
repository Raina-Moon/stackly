import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsInt()
  @Min(0)
  position: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  wipLimit?: number;

  @IsUUID()
  boardId: string;
}
