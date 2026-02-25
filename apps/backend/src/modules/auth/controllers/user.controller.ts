import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateNotificationPreferencesDto } from '../dto/update-notification-preferences.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GetUser, AuthUser } from '../decorators/get-user.decorator';
import { CacheService, CacheInvalidationService } from '../../../cache';

@Controller('users')
export class UserController {
  private static readonly PROFILE_TTL = 600_000; // 10 minutes

  constructor(
    private readonly userService: UserService,
    private readonly cacheService: CacheService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async search(@Query('q') query: string, @GetUser() user: AuthUser) {
    const users = await this.userService.search(query, user.id);
    return users.map(({ password, ...rest }) => rest);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    // Exclude password from response
    const { password, ...result } = user;
    return result;
  }

  @Get()
  async findAll(@Query('skip') skip = 0, @Query('take') take = 10) {
    const { data, total } = await this.userService.findAll(skip, take);
    // Exclude passwords from response
    const sanitized = data.map(({ password, ...rest }) => rest);
    return { data: sanitized, total };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@GetUser() authUser: AuthUser) {
    const cacheKey = this.cacheInvalidation.userProfileKey(authUser.id);
    const cached = await this.cacheService.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const user = await this.userService.findById(authUser.id);
    const { password, ...result } = user;
    await this.cacheService.set(cacheKey, result, UserController.PROFILE_TTL);
    return result;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@GetUser() authUser: AuthUser, @Body() updateUserDto: UpdateUserDto) {
    const profileUpdate: UpdateUserDto = {
      nickname: updateUserDto.nickname,
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      avatar: updateUserDto.avatar,
    };
    const user = await this.userService.update(authUser.id, profileUpdate);
    const { password, ...result } = user;
    return {
      success: true,
      user: result,
    };
  }

  @Get('me/notification-preferences')
  @UseGuards(JwtAuthGuard)
  async getMyNotificationPreferences(@GetUser() authUser: AuthUser) {
    const preferences = await this.userService.getMyNotificationPreferences(authUser.id);
    return {
      success: true,
      preferences,
    };
  }

  @Patch('me/notification-preferences')
  @UseGuards(JwtAuthGuard)
  async updateMyNotificationPreferences(
    @GetUser() authUser: AuthUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    const preferences = await this.userService.updateMyNotificationPreferences(authUser.id, dto);
    return {
      success: true,
      preferences,
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    // Exclude password from response
    const { password, ...result } = user;
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.userService.update(id, updateUserDto);
    // Exclude password from response
    const { password, ...result } = user;
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    return { message: '사용자가 삭제되었습니다.' };
  }
}
