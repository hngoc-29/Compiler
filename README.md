# ⚡ CodeEditor

Trình biên dịch code online hỗ trợ **C++**, **C** và **Python**, chạy trực tiếp trên server qua Socket.IO streaming. Giao diện Monaco Editor, tối ưu cho cả desktop lẫn mobile.

---

## Tính năng

| Tính năng | Mô tả |
|---|---|
| **Đa ngôn ngữ** | C++20, C++17, C++14, C++11, C11, Python 3 |
| **Streaming output** | Kết quả in ra ngay trong khi chạy (qua WebSocket) |
| **Test Cases** | Nhập nhiều test case, chấm **PASS / FAIL** tự động so sánh expected output |
| **Monaco Editor** | IntelliSense, C++ snippets, signature hints, syntax highlight |
| **Mobile-first** | Bottom tab bar (Code / Input / Tests / Output), auto-switch sang output sau khi Run |
| **Hash cache** | Không compile lại nếu code + input + settings giống lần trước (sessionStorage) |
| **Share** | Chia sẻ code qua URL (nén bằng fflate, không cần backend) |
| **Export** | Tải về file `.cpp` / `.py` / `.c` |
| **Tùy chỉnh editor** | Font size, tab size, minimap, word wrap, ligatures, suggestions... |

---

## Ngôn ngữ hỗ trợ

| ID | Ngôn ngữ | Compiler | Flags |
|---|---|---|---|
| `cpp20` | C++ 20 | g++ | `-std=c++20 -Wall -Wextra` |
| `cpp17` | C++ 17 | g++ | `-std=c++17 -Wall -Wextra` |
| `cpp14` | C++ 14 | g++ | `-std=c++14 -Wall -Wextra` |
| `cpp11` | C++ 11 | g++ | `-std=c++11 -Wall -Wextra` |
| `c11` | C 11 | gcc | `-std=c11 -lm -Wall -Wextra` |
| `python3` | Python 3 | python3 | *(chạy trực tiếp, không compile)* |

---

## Yêu cầu hệ thống

- **Node.js** >= 20
- **g++** / **gcc** (build-essential / build-base)
- **python3**
- **ccache** *(tùy chọn, tăng tốc compile lại)*

---

## Chạy local (Development)

```bash
# Cài dependencies
npm install

# Chạy dev server (Next.js + Socket.IO cùng 1 process)
npm run dev
```

Truy cập: [http://localhost:3000](http://localhost:3000)

---

## Chạy Production (không Docker)

```bash
npm install
npm run build
NODE_ENV=production npm start
```

---

## Docker

### Build & chạy

```bash
# Build image
docker build -t codeeditor .

# Chạy container
docker run -d \
  --name codeeditor \
  -p 3000:3000 \
  --restart unless-stopped \
  codeeditor
```

Truy cập: [http://localhost:3000](http://localhost:3000)

### Docker Compose

```yaml
services:
  codeeditor:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
```

```bash
docker compose up -d
```

### Với Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;

        # WebSocket (Socket.IO)
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 60s;
    }
}
```

---

## Cấu trúc project

```
.
├── server.js                  # Custom Next.js server + Socket.IO compiler
├── app/
│   ├── page.tsx               # Trang chủ
│   ├── layout.tsx
│   ├── api/compile/route.ts   # HTTP fallback API (khi WebSocket không kết nối được)
│   └── s/[data]/page.tsx      # Trang shared view
├── components/
│   ├── EditorLayout.tsx       # Layout chính, state management
│   ├── CodeEditor.tsx         # Monaco Editor wrapper
│   ├── OutputPanel.tsx        # Tab Output / Errors / Info
│   ├── TestCasePanel.tsx      # Multiple test cases, PASS/FAIL verdict
│   ├── TestCaseModal.tsx      # Modal nhập input + expected output
│   ├── Header.tsx             # Toolbar (Run, Export, Share, Settings)
│   ├── LanguageSelector.tsx   # Chọn ngôn ngữ / version
│   └── SettingsPanel.tsx      # Cài đặt editor
└── lib/
    ├── languages.ts           # Danh sách ngôn ngữ
    ├── testcases.ts           # TestCase type, compareOutput, UUID polyfill
    ├── cpp-suggestions.ts     # C++ IntelliSense completions
    ├── editor-settings.ts     # EditorSettings type + localStorage
    ├── compiler.ts            # HTTP compile logic
    ├── compress.ts            # URL compression (fflate)
    └── utils.ts               # debounce, formatDuration...
```

---

## Giới hạn runtime

| Thông số | Giá trị |
|---|---|
| Timeout compile | 30 giây |
| Timeout chạy | 10 giây |
| Max output | 2 MB |
| Max code size | 100 KB |

Chỉnh trong `server.js`:
```js
const COMPILE_TIMEOUT = 30_000;  // ms
const RUN_TIMEOUT     = 10_000;  // ms
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
```

---

## Test Cases — Hướng dẫn chấm điểm

1. Nhấn **Test Cases** tab (desktop) hoặc tab **Tests** (mobile)
2. Nhấn **Add** để thêm test case
3. Nhập **stdin/input** và **expected output** trong modal
4. Nhấn **Run All** — mỗi test case hiện badge:
   - `PASS` — output khớp expected (trim trailing whitespace)
   - `FAIL` — output không khớp
   - `ERR`  — lỗi compile hoặc runtime
   - `TLE`  — vượt timeout

> **Lưu ý:** Nếu để trống expected output, test case vẫn chạy bình thường nhưng không chấm điểm (chỉ hiện thời gian chạy).

---

## Biến môi trường

| Biến | Default | Mô tả |
|---|---|---|
| `PORT` | `3000` | Port lắng nghe |
| `HOSTNAME` | `0.0.0.0` | Bind address |
| `NODE_ENV` | `development` | `production` để tắt hot reload |
| `CCACHE_DIR` | `/tmp/ccache` | Thư mục cache ccache |
| `CCACHE_MAXSIZE` | `512M` | Dung lượng tối đa cache |

---

## License

MIT
