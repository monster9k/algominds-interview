# `.claude/` — cấu hình Claude Code cho AlgoMinds

Thư mục này chứa toàn bộ cấu hình dành riêng cho Claude Code khi làm việc trong repo này. File này là tài liệu điều hướng cho **người** (dev) — không phải bộ nhớ mà Claude tự động đọc (bộ nhớ thật nằm ở `CLAUDE.md` tại root repo, xem giải thích bên dưới).

## Vì sao `CLAUDE.md` không nằm trong `.claude/`?
Claude Code đọc project memory từ `CLAUDE.md` ở **root repo** (`D:\algominds\CLAUDE.md`), không phải từ trong `.claude/`. Đây là hành vi mặc định của công cụ, không phải lựa chọn của repo này — nên `CLAUDE.md` được giữ nguyên ở root. Các file `rules/*.md` bên dưới được `CLAUDE.md` root import vào qua cú pháp `@rules/xxx.md` ở cuối file, nên vẫn được Claude tự động load mỗi phiên, chỉ là tách nhỏ ra cho dễ đọc/dễ maintain.

## Cấu trúc

| File/thư mục | Tác dụng | Có commit vào git? |
|---|---|---|
| `settings.json` | Permission allow/deny-list cho Claude Code (lệnh nào được tự chạy không cần hỏi). Áp dụng chung cho cả team. | Có |
| `settings.local.json.example` | Mẫu để copy thành `settings.local.json` — nơi mỗi dev override cá nhân (thêm quyền riêng...). | Có (bản `.example`) |
| `settings.local.json` | Bản override cá nhân thật, copy từ file `.example` ở trên. | **Không** (đã gitignore) |
| `rules/workflow.md` | Quy trình git/PR, luồng session PHASE_1→PHASE_2, lưu ý về việc chưa có test suite. | Có |
| `rules/design.md` | Quy ước frontend: stack, cấu trúc feature-folder, state management. | Có |
| `rules/tech-defaults.md` | Quy ước backend: cấu trúc module NestJS, guards, Prisma, Piston. | Có |
| `agents/nestjs-reviewer.md` | Subagent review code backend theo convention hiện có. Gọi qua Agent tool hoặc nhắc "dùng agent nestjs-reviewer review giúp". | Có |
| `agents/feature-scaffolder.md` | Subagent dựng khung feature/module mới đúng pattern. | Có |
| `skills/*/SKILL.md` | Các playbook nhiều bước, tái sử dụng, tự động được Claude nhận diện theo ngữ cảnh (hoặc gọi thủ công `/add-nestjs-module`...). | Có |
| `commands/check-phase-flow.md` | Slash command thủ công `/check-phase-flow <sessionId>` — tra nhanh trạng thái 1 session. | Có |

## Skills vs Agents vs Commands — khác nhau thế nào?
- **Skills** (`skills/*/SKILL.md`): playbook dài, Claude tự nhận diện khi ngữ cảnh khớp mô tả (`description` trong frontmatter), hoặc gọi thủ công bằng `/<ten-skill>`. Dùng cho quy trình nhiều bước lặp lại (thêm module, thêm feature...).
- **Agents** (`agents/*.md`): subagent chuyên biệt, chạy trong ngữ cảnh riêng (không tốn context chính), phù hợp cho việc review/khảo sát tốn nhiều bước đọc code.
- **Commands** (`commands/*.md`): slash command ngắn, gọi thủ công bằng tên file, nhận tham số qua `$ARGUMENTS`. Dùng cho tác vụ tra cứu/thao tác nhanh, không cần Claude tự "đoán" khi nào nên chạy.

## Cách dùng nhanh
```bash
# Copy settings cá nhân (chỉ cần làm 1 lần)
cp .claude/settings.local.json.example .claude/settings.local.json

# Gọi 1 skill thủ công
/add-nestjs-module

# Gọi command tra cứu session
/check-phase-flow <sessionId>
```
