import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/request-user.type';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  // GET /store/items — catalog, kèm owned/equipped nếu đã đăng nhập
  @Get('items')
  @UseGuards(OptionalJwtAuthGuard)
  getItems(@CurrentUser() user: RequestUser | null) {
    return this.storeService.getItems(user?.userId);
  }

  // GET /store/inventory — vật phẩm của tôi
  @Get('inventory')
  @UseGuards(JwtAuthGuard)
  getInventory(@CurrentUser() user: RequestUser) {
    return this.storeService.getInventory(user.userId);
  }

  // POST /store/purchase/:itemId
  @Post('purchase/:itemId')
  @UseGuards(JwtAuthGuard)
  purchaseItem(
    @CurrentUser() user: RequestUser,
    @Param('itemId') itemId: string,
  ) {
    return this.storeService.purchaseItem(user.userId, itemId);
  }
}
