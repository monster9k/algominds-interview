// jest's `expect.objectContaining` types as `any`, which trips
// no-unsafe-assignment on every nested matcher object below.

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { PrismaService } from '../../prisma/prisma.service';

interface PrismaMock {
  shopItem: { findMany: jest.Mock; findUnique: jest.Mock };
  userItem: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  userStats: { updateMany: jest.Mock };
  $transaction: jest.Mock;
}

describe('StoreService', () => {
  let service: StoreService;
  let prisma: PrismaMock;

  const item = {
    id: 'item-1',
    key: 'frame_gold',
    name: 'Khung Vàng',
    category: 'AVATAR_FRAME',
    price: 100,
    iconKey: '#ffd700',
  };

  beforeEach(() => {
    prisma = {
      shopItem: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      userItem: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      userStats: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(
        async (arg: ((tx: PrismaMock) => unknown) | unknown[]) => {
          if (typeof arg === 'function') {
            return arg(prisma);
          }
          return Promise.all(arg);
        },
      ),
    };

    service = new StoreService(prisma as unknown as PrismaService);
  });

  describe('getItems', () => {
    it('returns owned: false / equipped: false for every item when called without a userId (guest)', async () => {
      prisma.shopItem.findMany.mockResolvedValue([item]);

      const result = await service.getItems();

      expect(result).toEqual([{ ...item, owned: false, equipped: false }]);
      expect(prisma.userItem.findMany).not.toHaveBeenCalled();
    });

    it('marks items the user owns, and reflects their equipped state', async () => {
      prisma.shopItem.findMany.mockResolvedValue([
        item,
        { ...item, id: 'item-2', key: 'title_rookie' },
      ]);
      prisma.userItem.findMany.mockResolvedValue([
        { itemId: 'item-1', equipped: true },
      ]);

      const result = await service.getItems('user-1');

      expect(result).toEqual([
        { ...item, owned: true, equipped: true },
        {
          ...item,
          id: 'item-2',
          key: 'title_rookie',
          owned: false,
          equipped: false,
        },
      ]);
    });
  });

  describe('purchaseItem', () => {
    it('throws NotFoundException when the item does not exist', async () => {
      prisma.shopItem.findUnique.mockResolvedValue(null);

      await expect(
        service.purchaseItem('user-1', 'missing-item'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the user already owns the item', async () => {
      prisma.shopItem.findUnique.mockResolvedValue(item);
      prisma.userItem.findUnique.mockResolvedValue({ id: 'user-item-1' });

      await expect(
        service.purchaseItem('user-1', item.id),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the user does not have enough coins', async () => {
      prisma.shopItem.findUnique.mockResolvedValue(item);
      prisma.userItem.findUnique.mockResolvedValue(null);
      prisma.userStats.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.purchaseItem('user-1', item.id),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.userItem.create).not.toHaveBeenCalled();
    });

    it('deducts the exact price and creates the UserItem row on success', async () => {
      prisma.shopItem.findUnique.mockResolvedValue(item);
      prisma.userItem.findUnique.mockResolvedValue(null);
      prisma.userStats.updateMany.mockResolvedValue({ count: 1 });
      prisma.userItem.create.mockResolvedValue({
        id: 'user-item-1',
        userId: 'user-1',
        itemId: item.id,
        item,
      });

      await service.purchaseItem('user-1', item.id);

      expect(prisma.userStats.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', coins: { gte: item.price } },
          data: { coins: { decrement: item.price } },
        }),
      );
      expect(prisma.userItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { userId: 'user-1', itemId: item.id },
        }),
      );
    });
  });

  describe('equipItem', () => {
    it('throws NotFoundException when the user does not own the item', async () => {
      prisma.userItem.findUnique.mockResolvedValue(null);

      await expect(service.equipItem('user-1', item.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('unequips other items in the same category before equipping the target one', async () => {
      prisma.userItem.findUnique.mockResolvedValue({
        id: 'user-item-1',
        userId: 'user-1',
        itemId: item.id,
        item,
      });
      prisma.userItem.update.mockResolvedValue({
        id: 'user-item-1',
        equipped: true,
        item,
      });

      await service.equipItem('user-1', item.id);

      expect(prisma.userItem.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            equipped: true,
            item: { category: item.category },
          },
          data: { equipped: false },
        }),
      );
      expect(prisma.userItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_itemId: { userId: 'user-1', itemId: item.id } },
          data: { equipped: true },
        }),
      );
    });
  });
});
