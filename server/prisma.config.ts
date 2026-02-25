import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';

// Ép hệ thống đọc file .env ngay lập tức trước khi chạy config
config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    // Gọi npx ts-node để chạy file seed của bạn
    seed: 'npx ts-node prisma/seed.ts',
  },
});
