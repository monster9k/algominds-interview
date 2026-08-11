import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/request-user.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { DiscussService } from './discuss.service';

@Controller('discuss')
export class DiscussController {
  constructor(private readonly discussService: DiscussService) {}

  // GET /discuss?problemId=&tag=&sort=&search= — khách vãng lai cũng xem
  // được, đúng kiểu LeetCode Discuss công khai.
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findPosts(
    @CurrentUser() user: RequestUser | null,
    @Query('problemId') problemId?: string,
    @Query('tag') tag?: string,
    @Query('sort') sort?: string,
    @Query('search') search?: string,
  ) {
    return this.discussService.findPosts(
      { problemId, tag, sort, search },
      user?.userId,
    );
  }

  // GET /discuss/tags/trending — khai báo TRƯỚC "/:id" để không bị route
  // param nuốt mất "tags".
  @Get('tags/trending')
  @UseGuards(OptionalJwtAuthGuard)
  getTrendingTags() {
    return this.discussService.getTrendingTags();
  }

  // GET /discuss/contributors/top — khai báo TRƯỚC "/:id" cùng lý do trên.
  @Get('contributors/top')
  @UseGuards(OptionalJwtAuthGuard)
  getTopContributors() {
    return this.discussService.getTopContributors();
  }

  // GET /discuss/:id
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findPostById(
    @CurrentUser() user: RequestUser | null,
    @Param('id') id: string,
  ) {
    return this.discussService.findPostById(id, user?.userId);
  }

  // POST /discuss
  @Post()
  @UseGuards(JwtAuthGuard)
  createPost(@CurrentUser() user: RequestUser, @Body() dto: CreatePostDto) {
    return this.discussService.createPost(user.userId, dto);
  }

  // POST /discuss/:id/comments
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  createComment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.discussService.createComment(id, user.userId, dto);
  }

  // POST /discuss/:id/vote — toggle upvote
  @Post(':id/vote')
  @UseGuards(JwtAuthGuard)
  toggleVote(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.discussService.toggleVote(id, user.userId);
  }
}
