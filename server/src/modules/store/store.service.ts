import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShopItemDto } from './dto/create-shop-item.dto';
import { UpdateShopItemDto } from './dto/update-shop-item.dto';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  // Catalog đầy đủ, kèm cờ owned/equipped nếu có user (OptionalJwtAuthGuard
  // cho phép guest xem catalog nhưng không có owned/equipped). deletedAt:
  // null — item admin đã xoá không hiện trong catalog công khai (khác
  // admin.service.ts#getStoreItems() cố tình không filter, xem comment ở đó).
  async getItems(userId?: string) {
    const items = await this.prisma.shopItem.findMany({
      where: { deletedAt: null },
      orderBy: [{ category: 'asc' }, { price: 'asc' }],
    });

    if (!userId) {
      return items.map((item) => ({
        ...item,
        owned: false,
        equipped: false,
      }));
    }

    const owned = await this.prisma.userItem.findMany({
      where: { userId },
      select: { itemId: true, equipped: true },
    });
    const ownedByItemId = new Map(owned.map((o) => [o.itemId, o.equipped]));

    return items.map((item) => ({
      ...item,
      owned: ownedByItemId.has(item.id),
      equipped: ownedByItemId.get(item.id) ?? false,
    }));
  }

  async getInventory(userId: string) {
    return this.prisma.userItem.findMany({
      where: { userId },
      include: { item: true },
      orderBy: { purchasedAt: 'desc' },
    });
  }

  async purchaseItem(userId: string, itemId: string) {
    const item = await this.prisma.shopItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('Vật phẩm không tồn tại');

    const alreadyOwned = await this.prisma.userItem.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });
    if (alreadyOwned) {
      throw new ConflictException('Bạn đã sở hữu vật phẩm này rồi');
    }

    return this.prisma.$transaction(async (tx) => {
      // Trừ xu atomic (chỉ trừ nếu đủ số dư), cùng pattern với khấu trừ AI
      // credit ở chat.gateway.ts — tránh race condition 2 request mua cùng
      // lúc khi số dư chỉ đủ cho 1 lần mua.
      const deducted = await tx.userStats.updateMany({
        where: { userId, coins: { gte: item.price } },
        data: { coins: { decrement: item.price } },
      });

      if (deducted.count === 0) {
        throw new BadRequestException('Không đủ xu để mua vật phẩm này');
      }

      return tx.userItem.create({
        data: { userId, itemId },
        include: { item: true },
      });
    });
  }

  async equipItem(userId: string, itemId: string) {
    const userItem = await this.prisma.userItem.findUnique({
      where: { userId_itemId: { userId, itemId } },
      include: { item: true },
    });
    if (!userItem) {
      throw new NotFoundException('Bạn chưa sở hữu vật phẩm này');
    }

    return this.prisma.$transaction(async (tx) => {
      // Chỉ 1 item equipped/category — unequip mọi item cùng category trước
      // khi equip item mới (enforce ở service layer, xem comment
      // UserItem.equipped trong schema.prisma).
      await tx.userItem.updateMany({
        where: {
          userId,
          equipped: true,
          item: { category: userItem.item.category },
        },
        data: { equipped: false },
      });

      return tx.userItem.update({
        where: { userId_itemId: { userId, itemId } },
        data: { equipped: true },
        include: { item: true },
      });
    });
  }

  async createItem(dto: CreateShopItemDto) {
    const existing = await this.prisma.shopItem.findUnique({
      where: { key: dto.key },
    });
    if (existing) {
      throw new ConflictException('Mã vật phẩm (key) đã tồn tại');
    }

    return this.prisma.shopItem.create({ data: dto });
  }

  async updateItem(id: string, dto: UpdateShopItemDto) {
    const existing = await this.prisma.shopItem.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Vật phẩm không tồn tại');
    }

    if (dto.key && dto.key !== existing.key) {
      const keyTaken = await this.prisma.shopItem.findUnique({
        where: { key: dto.key },
      });
      if (keyTaken) {
        throw new ConflictException('Mã vật phẩm (key) đã tồn tại');
      }
    }

    return this.prisma.shopItem.update({ where: { id }, data: dto });
  }

  // Soft delete — KHÔNG hard-delete (xem comment ShopItem.deletedAt trong
  // schema.prisma: UserItem.item onDelete Cascade sẽ xoá luôn đồ user đã mua).
  async softDeleteItem(id: string) {
    const existing = await this.prisma.shopItem.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Vật phẩm không tồn tại');
    }

    return this.prisma.shopItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
