import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  // Catalog đầy đủ, kèm cờ owned/equipped nếu có user (OptionalJwtAuthGuard
  // cho phép guest xem catalog nhưng không có owned/equipped).
  async getItems(userId?: string) {
    const items = await this.prisma.shopItem.findMany({
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
}
