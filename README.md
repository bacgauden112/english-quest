# English Quest

App tự học tiếng Anh kiểu game cho người đi làm ngành IT. Lộ trình 12 tuần, mỗi ngày 5 chặng: Từ vựng → Nghe → Đọc → Shadowing → Nói. Có XP, cấp độ, chuỗi ngày học, huy hiệu và rương thưởng.

Chạy trên **Cloudflare Workers**: file tĩnh nằm trong `public/`, còn một API nhỏ dùng **Workers KV** để đồng bộ tiến độ giữa các máy, bảo vệ bằng mật khẩu.

## Tính năng

- **Từ vựng:** ôn kiểu lặp lại ngắt quãng (spaced repetition). Có 131 thẻ từ vựng IT (có câu ví dụ) và 2.809 từ cơ bản NGSL (có công cụ lọc những từ đã biết).
- **Nghe:**
  - Danh sách nghe theo chủ đề, đánh dấu 3 lượt nghe, xem YouTube ngay trong app.
  - Phát file audio/video có trên máy, lặp đoạn A–B.
  - Ô dán transcript.
- **Nói:**
  - Shadowing có chấm độ khớp, dùng nhận giọng nói của trình duyệt (Chrome/Edge, kể cả Android).
  - Trả lời câu hỏi theo tình huống công việc.
- **Tiến độ:** bản đồ nhiệt 84 ngày, huy hiệu, lộ trình 12 tuần.

## Triển khai lần đầu

### Cách 1 — Qua dashboard Cloudflare (không cần cài gì)

1. **Tạo KV:** Cloudflare Dashboard → *Storage & Databases* → *KV* → *Create* → đặt tên `english-quest-kv`. Copy **Namespace ID**.
2. Mở `wrangler.toml`, thay `PASTE_KV_NAMESPACE_ID_HERE` bằng ID vừa copy, rồi commit và push.
3. **Tạo Worker từ repo:** *Workers & Pages* → *Create* → *Import a repository* → chọn `bacgauden112/english-quest`. Giữ nguyên thiết lập mặc định. Lệnh deploy là `npx wrangler deploy`. Bấm *Deploy*.
4. **Đặt mật khẩu:** vào Worker `english-quest` → *Settings* → *Variables and Secrets* → *Add* → kiểu **Secret**, tên `APP_PASSWORD`, giá trị là mật khẩu bạn muốn dùng.
5. Mở `https://english-quest.<tên-tài-khoản>.workers.dev`. Ở màn hình bắt đầu (hoặc Cài đặt ⚙), nhập đúng mật khẩu đó vào ô **Mật khẩu đồng bộ**.

Sau lần đầu, mỗi lần push lên `main` thì Cloudflare tự triển khai lại.

### Cách 2 — Bằng dòng lệnh

```bash
npm install
npx wrangler login
npx wrangler kv namespace create EQ_KV      # dán id vào wrangler.toml
npx wrangler secret put APP_PASSWORD        # nhập mật khẩu
npx wrangler deploy
```

Chạy thử trên máy: tạo file `.dev.vars` chứa dòng `APP_PASSWORD=...` rồi chạy `npx wrangler dev`.

## Dữ liệu được lưu ở đâu

- Toàn bộ tiến độ nằm trong một khóa `state` của KV `EQ_KV`, dạng JSON. Chỉ ai có mật khẩu mới đọc hoặc ghi được.
- Mỗi trình duyệt cũng giữ một bản sao trong localStorage để mở nhanh và dùng được khi offline. Khi đồng bộ, app giữ bản mới hơn.
- Muốn sao lưu thủ công: vào Cài đặt ⚙ → *Sao chép bản sao lưu*. Muốn khôi phục thì dán bản sao lưu vào ô *Khôi phục*.

## Cấu trúc

```
public/index.html          toàn bộ app (HTML + CSS + JS, không cần build)
public/manifest.webmanifest, public/icon.svg
src/worker.js              API /api/state (GET/PUT) + phục vụ file tĩnh
wrangler.toml              cấu hình Worker + KV
```

## Ghi công

- Danh sách từ: **New General Service List 1.2**, tác giả Browne, C., Culligan, B. & Phillips, J., giấy phép [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Nguồn: <https://www.newgeneralservicelist.com>
