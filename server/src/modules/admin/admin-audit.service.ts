import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type AdminAction =
  | 'CREATE_PROBLEM'
  | 'UPDATE_PROBLEM'
  | 'DELETE_PROBLEM'
  | 'CREATE_CONTEST'
  | 'UPDATE_CONTEST'
  | 'DELETE_CONTEST'
  | 'UPDATE_USER_ROLE'
  | 'DELETE_USER'
  | 'DELETE_DISCUSS_POST'
  | 'CREATE_SHOP_ITEM'
  | 'UPDATE_SHOP_ITEM'
  | 'DELETE_SHOP_ITEM'
  | 'CREATE_BUG_SNIPPET'
  | 'UPDATE_BUG_SNIPPET'
  | 'DELETE_BUG_SNIPPET'
  | 'CREATE_CAREER_TRACK'
  | 'UPDATE_CAREER_TRACK'
  | 'DELETE_CAREER_TRACK';

export type AdminActionTargetType =
  | 'Problem'
  | 'Contest'
  | 'User'
  | 'DiscussPost'
  | 'ShopItem'
  | 'BugSnippet'
  | 'CareerTrack';

@Injectable()
export class AdminAuditService {
  constructor(private prisma: PrismaService) {}

  log(
    adminId: string,
    action: AdminAction,
    targetType: AdminActionTargetType,
    targetId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.prisma.adminActionLog.create({
      data: { adminId, action, targetType, targetId, metadata },
    });
  }
}
