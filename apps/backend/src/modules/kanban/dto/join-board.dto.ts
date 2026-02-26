import { IsNotEmpty, IsString } from 'class-validator';

export class JoinBoardDto {
  @IsString()
  @IsNotEmpty()
  inviteCode: string;
}
