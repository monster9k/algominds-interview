# 🗺️ AlgoMinds — Roadmap: Deploy production lên Oracle Cloud Free Tier (Ampere A1)

> Bản roadmap trước ("Liên kết tài khoản Email ⇄ Google") đã hoàn thành 100% P0→P2 — commit `2deab1a` (P0: gate `providerId`), `ac1de6a` (P1: Connect Google), `2df59c4` (P2: Set Password). Xem lại nội dung các commit đó nếu cần tham chiếu.
>
> Bản này **thay thế hoàn toàn** — chủ đề khác hẳn (hạ tầng deploy, không phải auth). Bối cảnh: commit `d3725d8` (`feat(deploy): add production Docker deploy config for VPS`) đã dựng xong `docker-compose.prod.yml` + Dockerfiles + Caddy + `deploy.sh` + GitHub Actions, nhắm tới 1 VPS trả phí ~$4/mo vì Piston cần `privileged: true` (hầu hết PaaS free tier không cho phép). User không có ngân sách cho VPS trả phí và không muốn xin phép tác giả Piston để chạy trên PaaS (khả năng fail cao) → đã khảo sát và chốt hướng đi: **Oracle Cloud Always Free, shape Ampere A1 (ARM, 2 OCPU/12GB kể từ 15/06/2026 — Oracle đã âm thầm cắt từ 4 OCPU/24GB)**.

## Vì sao không dùng thẳng image Piston chính thức trên Oracle A1

`docker-compose.prod.yml` hiện trỏ `image: ghcr.io/engineer-man/piston` — image này **không có build arm64 chính chủ**. Ampere A1 là kiến trúc ARM (aarch64). Có 1 bản cộng đồng arm64 (`otakulabz/piston-arm`) nhưng không phải image gốc, độ tin cậy/update không đảm bảo — **không dùng**.

Giải pháp đã xác nhận: repo đã có sẵn `piston_src/` (vendor clone chính chủ từ `engineer-man/piston`, gitignored, dùng để build/customize image — xem `CLAUDE.md`). `piston_src/api/Dockerfile` build được multi-arch qua `docker buildx --platform linux/arm64`. Tự build + push image arm64 lên registry riêng (GHCR của user) thay vì phụ thuộc image cộng đồng không rõ nguồn gốc.

## Rủi ro đã biết, chấp nhận đánh đổi

- **Capacity Ampere A1 hay hết chỗ** ("Out of capacity" khi tạo instance) — cần thử nhiều region/availability domain, có thể mất vài ngày mới xin được.
- **Oracle từng lặng lẽ đổi chính sách free tier** (vụ cắt RAM tháng 6/2026, không thông báo trước) — rủi ro chính sách tiếp tục đổi trong tương lai, chấp nhận vì đây là lựa chọn duy nhất trong ngân sách hiện tại.
- **Tự build/maintain Piston image** — nếu upstream `engineer-man/piston` đổi cấu trúc source, phải tự theo dõi cập nhật, không còn "pull image có sẵn" đơn giản như VPS thường.
- **Phương án dự phòng đã thống nhất**: nếu sau ~1 tuần thử vẫn không xin được capacity A1 → chuyển hướng sang shape x86 `E2.1.Micro` (free, không cần build lại Piston) tách Piston và phần còn lại ra 2 instance 1GB RAM riêng — sẽ mở roadmap mới cho hướng này nếu xảy ra, không lẫn vào bản này.

---

## Kế hoạch theo thứ tự ưu tiên

### 🔴 P0 — Xin capacity Oracle A1 + tự build image Piston arm64
- [ ] Đăng ký Oracle Cloud, tạo instance `VM.Standard.A1.Flex` (2 OCPU/12GB) — thử nhiều region/availability domain nếu gặp lỗi "Out of capacity"; ghi lại region thành công để tái sử dụng khi cần scale thêm.
  📍 Oracle Cloud Console (ngoài repo).
- [ ] Cài Docker Engine + Docker Compose plugin trên instance (Ubuntu ARM image khuyến nghị).
  📍 Instance Oracle (ngoài repo).
- [ ] Build multi-arch image Piston từ `piston_src/api/Dockerfile` bằng `docker buildx build --platform linux/arm64`, xác nhận build thành công trên máy dev hoặc CI trước khi push (kiểm tra `piston_src/builder/Dockerfile`, `piston_src/repo/Dockerfile` — build thêm nếu `docker-compose.yaml` gốc của Piston yêu cầu nhiều image phối hợp, không chỉ riêng `api`).
  📍 `piston_src/api/Dockerfile`, `piston_src/docker-compose.yaml` (đọc lại để biết đủ service cần build).
- [ ] Push image lên registry riêng (GHCR của user, vd `ghcr.io/monster9k/piston-arm64`), verify `docker pull` + `docker run` thành công trên chính instance Oracle A1 (không chỉ build được — phải chạy được).
  📍 GHCR (ngoài repo).

### 🟡 P1 — Cập nhật `docker-compose.prod.yml` & cài runtime ngôn ngữ
- [ ] Sửa service `piston` trong `docker-compose.prod.yml`: đổi `image: ghcr.io/engineer-man/piston` → image arm64 tự build ở P0. Giữ nguyên `privileged: true`, healthcheck, volume `piston_data`.
  📍 `docker-compose.prod.yml`.
- [ ] Cài runtime ngôn ngữ cần thiết vào Piston (image gốc không có sẵn runtime nào — gap đã ghi trong `README.md`, chưa từng được xử lý dù trên kiến trúc nào). Đối chiếu danh sách ngôn ngữ với `PistonService.getLanguageConfig()` để cài đúng version Piston mong đợi.
  📍 `server/src/modules/judge/services/piston.service.ts` (đối chiếu ngôn ngữ), Piston CLI/API trên instance Oracle (cài đặt).
- [ ] Verify `GET /api/v2/runtimes` trên Piston instance trả đúng danh sách runtime đã cài.
  📍 Instance Oracle (curl thủ công).

### 🟢 P2 — Domain, network, chạy deploy pipeline
- [ ] Trỏ DNS domain về IP public Oracle instance.
  📍 DNS provider (ngoài repo).
- [ ] Mở port 80/443 ở **cả 2 lớp**: Oracle Security List/NSG (network) và firewall OS (`iptables`/`ufw` tuỳ image) — gotcha phổ biến nhất khi domain không vào được dù Caddy đã đúng cấu hình.
  📍 Oracle Cloud Console (Security List), instance OS.
- [ ] Tạo `.env.prod` trên instance từ `.env.prod.example`, điền secrets thật (JWT, Google OAuth, Gemini, Caddy ACME email, domain).
  📍 `.env.prod.example` (template), instance Oracle (`.env.prod` thật, không commit).
- [ ] Set GitHub Secrets `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY` trỏ về Oracle instance (đổi từ giá trị VPS cũ nếu đã set thử).
  📍 GitHub repo Settings → Secrets (ngoài repo), dùng bởi `.github/workflows/deploy.yml`.
- [ ] Chạy `deploy.sh` thủ công lần đầu trên instance, verify toàn bộ stack `docker compose -f docker-compose.prod.yml ps` healthy (postgres/redis/piston/server/client/caddy).
  📍 `deploy.sh`, instance Oracle.
- [ ] Test end-to-end thật: tạo tài khoản, chạy 1 session phỏng vấn, `POST /judge/submit` với code thật qua image Piston arm64 tự build, xác nhận chấm điểm đúng (không chỉ container healthy — phải verify chức năng chấm code hoạt động đúng trên kiến trúc mới).
  📍 Ứng dụng thật qua domain đã trỏ.

---

## Việc cần làm ngay lượt này
Chỉ ghi kế hoạch trên vào `ROADMAP.md` — **không thực thi**. User đã chọn hướng (Oracle A1 + tự build Piston arm64) nhưng theo quy trình roadmap-first, chỉ bắt đầu code/thao tác khi được yêu cầu rõ (vd "làm P0", "tiếp tục roadmap").

## Verification (áp dụng khi thực thi, không phải lượt này)
- P0/P1 phần lớn thao tác ngoài repo (Oracle Console, GHCR, instance shell) — không có `tsc`/test suite để chạy, verify bằng cách chạy lệnh thật và quan sát kết quả (`docker pull`, `docker run`, `curl .../api/v2/runtimes`).
- P2: verify bằng cách chạy app thật qua domain, không chỉ tin container "healthy" — đặc biệt bước judge/Piston vì đây là lý do chính của toàn bộ roadmap này.
- 1 task = 1 commit cho các thay đổi trong repo (`docker-compose.prod.yml`); các bước ngoài repo (Oracle Console, DNS, GitHub Secrets) không tạo commit, chỉ tick checkbox sau khi xác nhận xong.
