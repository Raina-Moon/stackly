import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBoardDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
