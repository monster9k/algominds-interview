/*
  Tách Problem.testCases thành sampleTestCases (public, dùng cho Run) +
  hiddenTestCases (private, chỉ dùng khi Submit). testCases được giữ lại
  (chuyển thành nullable) làm bản sao lưu để rollback, sẽ xoá ở 1 migration
  sau khi luồng mới đã ổn định.

  Backfill cho các problem đã có sẵn dữ liệu:
    - sampleTestCases = testcase đầu tiên trong mảng testCases cũ (đủ để "Run" hoạt động ngay).
    - hiddenTestCases = các testcase còn lại (index 1 trở đi), không trùng với sampleTestCases.
  Admin có thể bổ sung thêm hiddenTestCases sau bằng script bulk-gen.
*/

-- AlterEnum
ALTER TYPE "SubmissionStatus" ADD VALUE 'MLE';

-- AlterTable: thêm cột mới ở dạng nullable trước để backfill, drop cột exampleCases (chưa từng dùng)
ALTER TABLE "problems" DROP COLUMN "exampleCases",
ADD COLUMN     "hiddenTestCases" JSONB,
ADD COLUMN     "sampleTestCases" JSONB,
ALTER COLUMN "testCases" DROP NOT NULL;

-- Backfill: problem có testCases hợp lệ (mảng không rỗng)
UPDATE "problems"
SET "sampleTestCases" = jsonb_build_array("testCases"->0),
    "hiddenTestCases" = CASE
      WHEN jsonb_array_length("testCases") > 1 THEN "testCases" - 0
      ELSE '[]'::jsonb
    END
WHERE "testCases" IS NOT NULL
  AND jsonb_typeof("testCases") = 'array'
  AND jsonb_array_length("testCases") > 0;

-- Fallback cho problem không có testCases hợp lệ (không nên xảy ra vì testCases
-- vốn NOT NULL trước migration này, nhưng vẫn guard để tránh NULL vi phạm ràng buộc bên dưới)
UPDATE "problems"
SET "sampleTestCases" = '[]'::jsonb
WHERE "sampleTestCases" IS NULL;

-- sampleTestCases là bắt buộc kể từ nay (mọi problem phải có ít nhất 1 sample case để Run hoạt động)
ALTER TABLE "problems" ALTER COLUMN "sampleTestCases" SET NOT NULL;
