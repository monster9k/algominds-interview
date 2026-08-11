export type ShopItemCategory = "AVATAR_FRAME" | "TITLE" | "BADGE_COLOR";

// Catalog fields as stored on ShopItem (server: schema.prisma) — iconKey is
// either a lucide-react icon name (TITLE) or a hex color (AVATAR_FRAME /
// BADGE_COLOR), no image assets for now.
export interface ShopItemCatalog {
  id: string;
  key: string;
  name: string;
  description: string;
  category: ShopItemCategory;
  price: number;
  iconKey: string;
  createdAt: string;
}

// Shape returned by GET /store/items (server: store.service.ts#getItems) —
// catalog entry enriched with the current user's ownership state.
export interface ShopItem extends ShopItemCatalog {
  owned: boolean;
  equipped: boolean;
}

// Shape returned by GET /store/inventory and POST /store/purchase/:itemId
// (server: store.service.ts#getInventory / #purchaseItem) — a UserItem row
// with its catalog item joined in.
export interface UserItemEntry {
  id: string;
  userId: string;
  itemId: string;
  purchasedAt: string;
  equipped: boolean;
  item: ShopItemCatalog;
}
