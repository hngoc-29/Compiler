# CppEditor – C++ Online Compiler

Trình soạn thảo C++ online với **3 pane có thể resize/toggle**, compiler thật (`g++`),
và share link bằng **fflate** compression (không cần database).

## 🗜️ Tại sao URL ngắn với LZMA level 9?

| Thuật toán | Nén code C++ ~1KB | Ghi chú |
|---|---|---|
| Không nén | ~1400 chars | base64url thuần |
| Deflate (fflate) | ~680 chars | nén ~50% |
| **LZMA level 9** | **~520 chars** | **nén ~63%**, ngắn hơn deflate ~24% |

LZMA dùng dictionary size 64MB và back-reference dài hơn, đặc biệt hiệu quả với source code C++ vì có nhiều keyword lặp lại (`int`, `std::`, `cout`, `return`).

---



| Tính năng | Chi tiết |
|---|---|
| Monaco Editor | C++ syntax, autocomplete, Ctrl+Enter to Run |
| Compiler thật | `g++ -std=c++20 -O2` trong Docker |
| 3 pane resize | Kéo divider để thay đổi kích thước từng pane |
| Toggle panel | Ẩn/hiện từng pane (main.cpp / input.txt / output) |
| Share link | Nén fflate → base64url → URL `/s/[data]` |
| Auto-save | Debounce 800ms, nén fflate, lưu localStorage |
| Export | Tải main.cpp / input.txt / output.txt (đổi tên trước khi tải) |
| Dark mode | Mặc định, không cần cấu hình |
| Mobile | Responsive, stack dọc trên màn nhỏ |

---

## 🚀 Chạy local (Development)

```bash
# Yêu cầu: Node.js 20+, g++ trên máy
npm install
npm run dev
# → http://localhost:3000
```

---

## 🐳 Docker

### Build

```bash
docker build -t cppeditor .
```

### Chạy

```bash
docker run -p 3000:3000 cppeditor
# → http://localhost:3000
```

### Background + tự restart

```bash
docker run -d \
  --name cppeditor \
  -p 3000:3000 \
  --restart unless-stopped \
  cppeditor
```

### Logs

```bash
docker logs -f cppeditor
```

---

## ☁️ Deploy lên Render.com

1. Push code lên GitHub.
2. Vào [Render Dashboard](https://dashboard.render.com) → **New → Web Service**.
3. Kết nối GitHub repo.
4. Cài đặt:
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Port**: `3000`
5. Click **Deploy** – Render tự build và deploy.

> ⚠️ Free tier sẽ sleep sau 15 phút. Dùng **Starter ($7/tháng)** để không bị sleep.

---

## ☁️ Deploy lên Railway

```bash
npm install -g @railway/cli
railway login
railway up
```

Railway tự detect Dockerfile.

---

## 📁 Cấu trúc

```
cpp-editor/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── s/[data]/page.tsx        ← Share page
│   └── api/compile/route.ts     ← Compile API
├── components/
│   ├── EditorLayout.tsx          ← 3-pane layout + resize + toggle
│   ├── ResizableDivider.tsx      ← Drag handle
│   ├── CodeEditor.tsx            ← Monaco wrapper
│   ├── InputEditor.tsx           ← Stdin textarea
│   ├── OutputPanel.tsx           ← Output/Errors/Info tabs
│   ├── Header.tsx                ← Top bar
│   └── ShareButton.tsx           ← fflate share
├── lib/
│   ├── compress.ts               ← fflate compress/decompress
│   ├── compiler.ts               ← g++ logic (server-only)
│   └── utils.ts
└── Dockerfile                    ← Multi-stage + g++
```

---

## ⚙️ Cấu hình

**Timeout compile** (`app/api/compile/route.ts`):
```ts
const RUN_TIMEOUT_MS = 10_000; // 10 giây
```

**g++ flags** (`lib/compiler.ts`):
```ts
['-std=c++20', '-O2', '-Wall', '-Wextra', ...]
```

**Giới hạn kích thước** (`app/api/compile/route.ts`):
```ts
const MAX_CODE_BYTES  = 100 * 1024; // 100 KB
const MAX_INPUT_BYTES = 10  * 1024; // 10 KB
```

---

## 🔒 Bảo mật

- Code C++ chạy trong Docker container cô lập
- User `nextjs` không có quyền root
- Timeout 10s ngăn infinite loop
- File tạm (`/tmp/*.cpp`, `*.out`) xóa ngay sau khi chạy
- Không lưu code/input trên server – share data trong URL

---

## License: MIT
