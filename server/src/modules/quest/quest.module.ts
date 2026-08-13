import { Module } from '@nestjs/common';
import { CareerModule } from '../career/career.module';
import { AdminModule } from '../admin/admin.module';
import { QuestController } from './quest.controller';
import { QuestService } from './quest.service';

@Module({
  // CareerModule.export CareerService — quest.service.ts#createAttempt gọi
  // autoGradeStage() khi 1 ván Quest hoàn thành đúng lúc stage QUEST đang
  // ACTIVE (P5). Chiều phụ thuộc 1 chiều (quest -> career), CareerModule
  // không import ngược lại QuestModule nên không tạo cycle.
  // AdminModule.export AdminAuditService — quest.controller.ts cần ghi audit
  // log cho CRUD BugSnippet admin, đúng pattern StoreModule.
  imports: [CareerModule, AdminModule],
  controllers: [QuestController],
  providers: [QuestService],
})
export class QuestModule {}
