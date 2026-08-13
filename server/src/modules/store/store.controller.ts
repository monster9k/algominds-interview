import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateShopItemDto } from './dto/create-shop-item.dto';
import { UpdateShopItemDto } from './dto/update-shop-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/request-user.type';
import { AdminAuditService } from '../admin/admin-audit.service';

@Controller('store')
export class StoreController {
  constructor(
    private readonly storeService: StoreService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

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

  // POST /store/items/:itemId/equip
  @Post('items/:itemId/equip')
  @UseGuards(JwtAuthGuard)
  equipItem(@CurrentUser() user: RequestUser, @Param('itemId') itemId: string) {
    return this.storeService.equipItem(user.userId, itemId);
  }

  // POST /store/items (Admin only)
  @Post('items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createItem(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateShopItemDto,
  ) {
    const item = await this.storeService.createItem(dto);
    await this.adminAuditService.log(
      user.userId,
      'CREATE_SHOP_ITEM',
      'ShopItem',
      item.id,
    );
    return item;
  }

  // PATCH /store/items/:id (Admin only)
  @Patch('items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateItem(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateShopItemDto,
  ) {
    const item = await this.storeService.updateItem(id, dto);
    await this.adminAuditService.log(
      user.userId,
      'UPDATE_SHOP_ITEM',
      'ShopItem',
      item.id,
      { ...dto },
    );
    return item;
  }

  // DELETE /store/items/:id (Admin only) — soft delete
  @Delete('items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async removeItem(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const item = await this.storeService.softDeleteItem(id);
    await this.adminAuditService.log(
      user.userId,
      'DELETE_SHOP_ITEM',
      'ShopItem',
      item.id,
    );
    return item;
  }
}
