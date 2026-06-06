---
title: Compiler
emoji: ⚡
colorFrom: yellow
colorTo: yellow
sdk: docker
pinned: false
---

# ⚡ CodeEditor

Trình biên dịch code online hỗ trợ **C++20/17/14/11**, **C11** và **Python 3**, chạy thực tế trên server qua Socket.IO streaming. Giao diện Monaco Editor đầy đủ IntelliSense, layout 3 panel có thể resize, tối ưu cho cả desktop lẫn mobile.

---

## Mục lục

1. [Tính năng](#tính-năng)
2. [Tech stack](#tech-stack)
3. [Kiến trúc tổng quan](#kiến-trúc-tổng-quan)
4. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
5. [Backend — server.js](#backend--serverjs)
6. [API HTTP fallback](#api-http-fallback--appapicompileroutets)
7. [Frontend — EditorLayout](#frontend--editorlayout)
8. [Components](#components)
9. [Lib / Utilities](#lib--utilities)
10. [State persistence](#state-persistence)
11. [Share feature](#share-feature)
12. [Test Cases](#test-cases)
13. [CSS / Styling](#css--styling)
14. [Cài đặt & chạy](#cài-đặt--chạy)
15. [Docker](#docker)
16. [Biến môi trường](#biến-môi-trường)
17. [Giới hạn runtime](#giới-hạn-runtime)

---

## Tính năng

| Tính năng | Chi tiết |
|---|---|
| **Đa ngôn ngữ** | C++20, C++17, C++14, C++11, C11, Python 3 |
| **Streaming output** | Kết quả stdout in ra ngay khi chạy qua WebSocket — không chờ đến khi kết thúc |
| **Test Cases** | Nhiều test case, chấm **PASS / FAIL / TLE / ERR** so sánh expected output tự động |
| **Monaco Editor** | IntelliSense C++, 100+ snippet cạnh tranh lập trình (fori, bfs, dfs, dp...), signature hints |
| **Mobile-first** | Bottom tab bar, long-press để select text trong editor, tự chuyển sang output sau khi Run |
| **Share** | Nén `{code, testCases}` bằng fflate deflate-9, encode base64url → URL `/s/[data]` — không cần backend |
| **Export** | Tải về `main.cpp` / `input.txt` / `output.txt` |
| **3-panel resizable** | Kéo divider để thay đổi kích thước panel Code / Input / Output trên desktop |
| **Lưu setting** | Ngôn ngữ, optimize, panels, tab, font size, minimap... tự động lưu localStorage, khôi phục khi mở lại |
| **Auto-save** | Code + test cases debounce 800ms → nén → lưu localStorage |
| **Optimize** | Toggle `-O2` flag khi compile C/C++ |
| **Batch run** | Compile 1 lần, chạy song song tất cả test cases — hiệu quả hơn chạy từng cái |
| **Real-time feedback** | Test case đang chạy hiển thị trạng thái `running` ngay lập tức |
| **Diagnostics** | Parse lỗi g++ → hiện squiggles và marker inline trong Monaco |
| **Undo/Redo** | Nút Undo/Redo floating trong editor |
| **PCH** | Dockerfile pre-compile `bits/stdc++.h` → tăng tốc compile C++ |

---

## Tech stack

| Layer | Công nghệ |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS 3 |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Icons | Lucide React |
| Toast | Sonner |
| WebSocket | Socket.IO 4 (server) + socket.io-client 4 (client) |
| Compression | fflate (deflate level 9, pure JS, no Worker) |
| Runtime | Node.js ≥ 20 |
| Compiler | g++ / gcc (C/C++), python3 |
| Font | JetBrains Mono (Google Fonts) |

---

## Kiến trúc tổng quan

```
Browser
  │
  ├─ Monaco Editor (code)
  ├─ React state (EditorLayout)
  └─ Socket.IO client
           │  WebSocket /api/socket
           ▼
      server.js
      ├─ Next.js request handler  (GET /, GET /s/[data], static)
      └─ Socket.IO server
           ├─ compile         → spawn g++/python3 → streaming stdout chunks
           └─ compile:batch   → compile ONCE → run N inputs → stream results
```

**Luồng compile đơn:**
1. Client emit `compile { code, input, optimize, langId }`
2. Server write source to `/tmp/cppeditor_<uuid>.cpp`
3. C/C++: `g++ -std=c++20 [-O0|-O2] -pipe -Wall -Wextra -o bin src` (30s timeout)
4. Nếu compile OK: chạy binary với stdin = `input` (10s timeout)
5. Mỗi chunk stdout → `compile:stdout` → client append realtime
6. Kết thúc → `compile:done { stdout, stderr, exitCode, runtime, timedOut }`
7. Cleanup: xoá temp files

**Luồng batch (Test Cases):**
1. Client emit `compile:batch { code, inputs[], optimize, langId }`
2. Server compile 1 lần → binary duy nhất
3. Lần lượt chạy từng input → `compile:batch:result { index, stdout, ... }`
4. Kết thúc → `compile:batch:done { total }`

**Fallback HTTP:** Nếu WebSocket chưa kết nối, client POST `/api/compile` → `lib/compiler.ts` → cùng kết quả nhưng không streaming.

---

## Cấu trúc thư mục

```
.
├── server.js                        # Entry point: HTTP + Socket.IO + Next.js
├── package.json
├── Dockerfile
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
│
├── app/
│   ├── layout.tsx                   # Root layout: font, Toaster, metadata
│   ├── page.tsx                     # Trang chủ → <EditorLayout />
│   ├── globals.css                  # Tailwind + custom CSS (pane-bar, dot, resize-handle...)
│   ├── api/
│   │   └── compile/
│   │       └── route.ts             # HTTP fallback: POST /api/compile
│   └── s/
│       └── [data]/
│           └── page.tsx             # Share view: decode URL → render editor
│
├── components/
│   ├── EditorLayout.tsx             # ★ Orchestrator chính — state + logic + layout
│   ├── CodeEditor.tsx               # Monaco wrapper (IntelliSense, diagnostics, mobile)
│   ├── Header.tsx                   # Toolbar: Run, Export, Share, Panel toggles, Settings
│   ├── LanguageSelector.tsx         # Dropdown chọn ngôn ngữ, grouped by family
│   ├── SettingsPanel.tsx            # Slide-in panel tùy chỉnh Monaco
│   ├── OutputPanel.tsx              # Tab Output / Errors / Info
│   ├── TestCasePanel.tsx            # Danh sách test case + badge PASS/FAIL
│   ├── TestCaseModal.tsx            # Modal nhập input + expected output
│   ├── ResizableDivider.tsx         # Drag-to-resize divider (mouse + touch)
│   ├── InputDrawer.tsx              # Drawer stdin (mobile)
│   ├── OutputDrawer.tsx             # Drawer output (mobile)
│   ├── InputEditor.tsx              # Textarea stdin với toolbar Copy/Clear
│   └── ShareButton.tsx              # Nén + copy URL share
│
└── lib/
    ├── languages.ts                 # Định nghĩa ngôn ngữ, compiler flags, hello world
    ├── editor-settings.ts           # EditorSettings type + localStorage
    ├── user-prefs.ts                # UserPrefs type + localStorage (lang, optimize, panels, tab)
    ├── testcases.ts                 # TestCase type, compareOutput, serialize/deserialize
    ├── cpp-suggestions.ts           # IntelliSense completions + diagnostic parser
    ├── compiler.ts                  # HTTP compile logic (server-side only)
    ├── compress.ts                  # fflate compress/decompress → base64url
    └── utils.ts                     # debounce, formatDuration, downloadTextFile, constants
```

---

## Backend — `server.js`

File này là **entry point duy nhất** (`npm start` / `npm run dev` đều chạy `node server.js`).

### Khởi động

```js
app.prepare()                  // Next.js build/dev init
  → createServer(handle)       // HTTP server cho Next.js
  → new Server(io, { path: '/api/socket' })   // Socket.IO mount
  → httpServer.listen(port, hostname)
```

### Constants

| Hằng | Giá trị | Ý nghĩa |
|---|---|---|
| `MAX_OUTPUT_BYTES` | 2 MB | Cắt stdout/stderr nếu vượt |
| `COMPILE_TIMEOUT` | 30,000 ms | Tối đa compile C/C++ |
| `RUN_TIMEOUT` | 10,000 ms | Tối đa chạy binary/python |

### `runProcess(cmd, args, stdinData, timeoutMs, onStdout?, onStderr?)`

Spawn process, pipe stdin, stream stdout/stderr. Nếu quá timeout → `SIGTERM` → 1s sau `SIGKILL`. Trả về `{ stdout, stderr, exitCode, timedOut }`.

### `compileAndRunStream(code, input, timeoutMs, optimize, langId, callbacks)`

Luồng compile một lần:

```
writeFile(source)
  → Python?  → runProcess(python3 src) → callbacks.onDone
  → C/C++?   → runProcess(g++/gcc compile) → if ok → runProcess(bin) → callbacks.onDone
  → finally: cleanup temp files
```

Callbacks: `onStatus(s)`, `onStdout(chunk)`, `onStderr(chunk)`, `onDone(result)`.

### Socket.IO events

#### `compile` (client → server)

```js
{ code: string, input: string, optimize: boolean, langId: string }
```

Validation: code phải là string, ≤ 100KB. Nếu đang compile (isCompiling flag per-socket) → emit `compile:error`.

Server emits:
- `compile:status` — `'compiling'` | `'running'`
- `compile:stdout` — chunk string (streaming)
- `compile:stderr` — chunk string
- `compile:done` — `{ stdout, stderr, compileError, exitCode, runtime, timedOut }`
- `compile:error` — `{ message }` nếu validation fail hoặc exception

#### `compile:batch` (client → server)

```js
{ code: string, inputs: string[], optimize: boolean, langId: string }
```

C/C++: compile 1 lần → chạy N lần. Python: chạy N lần trực tiếp.

Server emits:
- `compile:batch:status` — `'compiling'` | `'running'`
- `compile:batch:error` — `{ stderr, exitCode }` nếu compile fail (dừng luôn)
- `compile:batch:result` — `{ index, stdout, stderr, exitCode, runtime, timedOut }` (1 per test)
- `compile:batch:done` — `{ total }`

### Language map (`LANG_MAP`)

```js
const LANG_MAP = {
  cpp20:   { ext: 'cpp', compiler: 'g++',     stdFlag: '-std=c++20', extraLibs: [] },
  cpp17:   { ext: 'cpp', compiler: 'g++',     stdFlag: '-std=c++17', extraLibs: [] },
  cpp14:   { ext: 'cpp', compiler: 'g++',     stdFlag: '-std=c++14', extraLibs: [] },
  cpp11:   { ext: 'cpp', compiler: 'g++',     stdFlag: '-std=c++11', extraLibs: [] },
  c11:     { ext: 'c',   compiler: 'gcc',     stdFlag: '-std=c11',   extraLibs: ['-lm'] },
  python3: { ext: 'py',  compiler: 'python3', stdFlag: null,         extraLibs: [] },
}
```

---

## API HTTP fallback — `app/api/compile/route.ts`

`POST /api/compile` — dùng khi WebSocket chưa connect được.

**Request body:**
```json
{
  "code": "...",
  "input": "",
  "optimize": false,
  "langId": "cpp20"
}
```

**Limits:** code ≤ 100KB, input ≤ 10KB. Response là `CompileResult` JSON.

Gọi `lib/compiler.ts` → `compileAndRun()` (không streaming, đợi kết quả xong mới trả về).

---

## Frontend — EditorLayout

`components/EditorLayout.tsx` là **orchestrator** toàn bộ frontend. Quản lý state, kết nối Socket.IO, điều phối render Desktop vs Mobile.

### State chính

| State | Khởi tạo từ | Ý nghĩa |
|---|---|---|
| `langId` | `loadPrefs().langId` | Ngôn ngữ hiện tại |
| `code` | `initialCode` hoặc `lang.hello` | Nội dung editor |
| `optimize` | `loadPrefs().optimize` | Flag -O2 |
| `settings` | `loadSettings()` | Cài đặt Monaco |
| `panels` | `loadPrefs().panels` | Hiển thị panel |
| `activeTab` | `loadPrefs().activeTab` | `single` hay `testcases` |
| `testCases` | `initialTestCases` hoặc default | Danh sách test case |
| `output` | `null` | Kết quả compile gần nhất |
| `diagnostics` | `[]` | Lỗi compiler → Monaco markers |
| `isCompiling` | `false` | Đang chạy đơn |
| `isRunningAll` | `false` | Đang chạy batch |
| `streamStdout` | `''` | Buffer streaming realtime |
| `isMobile` | media query | Desktop hay mobile layout |
| `viewH` | `visualViewport.height` | Height thực của viewport (tránh lỗi bàn phím ảo) |
| `codeW`, `inputW` | container / 3 | Pixel width của panel |

### Luồng compile đơn (`handleRun`)

```
setIsCompiling(true) → toast "Đang compile..." → runOnce(code, singleInput, onChunk)
  → socket connected? → socket.emit('compile') + listen events
  : fetch '/api/compile'
→ setOutput(result) → parse diagnostics → toast kết quả
→ setIsCompiling(false)
```

### Luồng batch (`handleRunAll`)

```
setIsRunningAll(true) → reset tất cả test case về idle
  → socket connected? → socket.emit('compile:batch')
      → listen compile:batch:status/error/result/done
      → cập nhật từng test case realtime
  : HTTP fallback → lần lượt runOnce cho mỗi test case
→ toast tổng kết (x/N PASS)
→ setIsRunningAll(false)
```

### Auto-save

Debounce 800ms mỗi khi `code` hoặc `testCases` thay đổi (sau `isReady`):
```
{code, input, testCases} → JSON → fflate compress → base64url → localStorage[AUTOSAVE_KEY]
```

Restore khi mount (chỉ khi không phải shared view):
```
localStorage[AUTOSAVE_KEY] → decompress → parse → setCode + setTestCases
```

### `runOnce(code, input, onChunk?) → Promise<CompileResult>`

Abstraction layer: thử WebSocket trước, fallback HTTP. `onChunk` callback cho streaming stdout.

### Desktop layout

3 panel liền kề: `Code | Input/TestCases | Output`. Mỗi panel có thể ẩn/hiện qua `panels` state. `ResizableDivider` giữa Code-Input và Input-Output. Panel cuối cùng visible = `flex: 1`.

### Mobile layout

Header nhỏ gọn + bottom navigation bar với 4 tab (Code / Input / Tests / Output) + nút Run lớn bên phải. Sau khi Run đơn → tự chuyển sang tab Output.

---

## Components

### `CodeEditor.tsx`

Monaco Editor wrapper. Lazy-loaded (`next/dynamic`, `ssr: false`).

**Props:**
- `value`, `onChange` — controlled value
- `onRun` — Ctrl+Enter callback
- `language` — Monaco language id (cpp, c, python)
- `diagnostics` — mảng `{ line, col, message, severity }` → set Monaco markers
- `settings` — `EditorSettings` (cập nhật live qua `editor.updateOptions()`)
- `readOnly` — dùng cho share view

**Tính năng đặc biệt:**
- C++ IntelliSense: `registerCppSuggestions()` đăng ký một lần globally (tracked bằng `_registeredLangs` Set), cung cấp 100+ completions + 50+ snippets
- Diagnostics: parse stderr g++ → `monaco.editor.setModelMarkers()` → squiggles đỏ/vàng
- Undo/Redo tracking: đọc `_undoRedoService` nội bộ của Monaco
- Mobile: long-press 350ms để chọn từ, kéo để mở rộng selection, nút Copy sel / Copy all
- Layout on resize: lắng nghe `visualViewport.resize` + `window.resize` → `editor.layout()`
- Suppress Monaco `Canceled` errors: filter `unhandledrejection` events bình thường khi autocomplete bị cancel

### `Header.tsx`

Toolbar actions. Có 2 chế độ:
- **`minimal=false`** (default): full header với Logo, panel toggles, tất cả actions
- **`minimal=true`**: chỉ actions (dùng trong EditorLayout desktop header khi EditorLayout tự render logo + tabs)

**Actions:** Optimize toggle, Run button, Export dropdown (main.cpp / input.txt / output.txt), Share button, Settings button.

### `LanguageSelector.tsx`

Dropdown grouped theo family (C++ / C / Python). Hiển thị dot màu theo ngôn ngữ. Đóng khi click ngoài.

### `SettingsPanel.tsx`

Slide-in panel từ phải. Đóng khi nhấn Escape hoặc click backdrop. Chia 3 nhóm: **IntelliSense**, **Display**, **Typography**. Settings con bị disable (opacity 40%) khi master toggle tắt (e.g. suggestions sub-settings disabled khi `suggestions=false`).

### `OutputPanel.tsx`

3 tab:
- **Output**: stdout (`text-emerald-300`), kèm cảnh báo timeout
- **Errors**: compile error (`text-red-300`) và runtime stderr (`text-orange-300`) tách biệt, có badge đỏ số lỗi
- **Info**: bảng metadata (exit code, runtime, stdout/stderr size)

Status badge ngay trên header: OK (xanh), Compile Error (đỏ), Timeout (vàng), Exit non-zero (cam).

### `TestCasePanel.tsx`

Danh sách test case có thể expand. Mỗi row:
- Chevron expand/collapse
- Status icon (idle / running spinner / ok checkmark / wrong X / error triangle / timeout clock)
- Verdict badge: `PASS` (xanh), `FAIL` (đỏ), `TLE` (vàng), `ERR` (cam), hoặc thời gian nếu pass không có expected
- Hover: nút Edit (pencil) + Run (play)

Expanded: hiện Input, Output, Expected (so sánh side-by-side khi FAIL), Error/stderr.

Summary bar trên header: `2✓ 1✗ 1⏱`.

### `TestCaseModal.tsx`

Modal fullscreen-ish. Hai textarea: stdin (background `#080810`) và expected output (background `#06100a`). Editable label inline. Đóng khi Escape hoặc click backdrop.

### `ResizableDivider.tsx`

4px thick (horizontal) hoặc 4px tall (vertical). Mouse drag + touch drag. Khi hover/drag: `background: #6366f1`. Emit `onDrag(delta)` để parent tính toán kích thước mới.

### `ShareButton.tsx`

```
serializeTestCases(testCases) → JSON → compressToBase64Url → /s/{compressed}
→ navigator.clipboard.writeText(url) → toast
```

Sau khi tạo URL: hiện nút Copy nhỏ để copy lại.

### `InputEditor.tsx`

Textarea đơn giản cho stdin. Tab key → 2 spaces. Toolbar: số ký tự, Copy, Clear.

---

## Lib / Utilities

### `lib/languages.ts`

Định nghĩa `LangVersion[]`:
```ts
interface LangVersion {
  id, label, lang, monacoLang, compiler, args, ext, hello
}
```

`LANG_VERSIONS` là source of truth cho cả client và server (server.js có LANG_MAP riêng vì không thể import TS). `DEFAULT_LANG_ID = 'cpp20'`.

### `lib/editor-settings.ts`

```ts
interface EditorSettings {
  suggestions, parameterHints, quickSuggestions, snippets,  // IntelliSense
  minimap, wordWrap, lineNumbers, bracketPairColorization,   // Display
  renderWhitespace, fontLigatures, smoothCaret,
  fontSize, tabSize                                          // Font
}
```

- `loadSettings()` — merge với `DEFAULT_SETTINGS`, safe với SSR
- `saveSettings(s)` — JSON stringify → `localStorage['cpp-editor-settings-v1']`

### `lib/user-prefs.ts`

```ts
interface UserPrefs {
  langId:    string;
  optimize:  boolean;
  panels:    { code: boolean; input: boolean; output: boolean };
  activeTab: 'single' | 'testcases';
}
```

- `loadPrefs()` — merge với `DEFAULT_PREFS`, backward-compatible
- `savePrefs(p)` — `localStorage['codeeditor-user-prefs-v1']`, try/catch quota

### `lib/testcases.ts`

```ts
interface TestCase {
  id, label, input, expectedOutput,    // persistent fields
  output, error, status, runtime       // runtime fields (không save)
}
interface SavedTestCase { id, label, input, expectedOutput }  // URL/localStorage format
```

- `createTestCase(label?)` — UUID polyfill (crypto.randomUUID → getRandomValues fallback)
- `compareOutput(actual, expected)` — normalize: trimEnd mỗi dòng + trim toàn chuỗi
- `serializeTestCases(tcs)` — bỏ runtime fields
- `deserializeTestCases(saved)` — restore runtime fields về idle, filter invalid

### `lib/cpp-suggestions.ts`

- `registerCppSuggestions(monaco, options)` — đăng ký completion provider cho `cpp` và `c`
  - Keyword completions (100+)
  - Snippet completions: `fori`, `forr`, `bfs`, `dfs`, `dp`, `seg`, `bit`, `debug`, ...
  - Snippet dùng `insertTextRules: InsertAsSnippet` với `$1`, `$2` placeholders
- `parseGppDiagnostics(stderr)` — parse output g++ dạng `file.cpp:line:col: error/warning: message` → `Diagnostic[]`

### `lib/compiler.ts`

HTTP fallback compile (server-side only). `compileAndRun(code, input, timeoutMs, optimize, langId)`. Không streaming — đợi process xong mới trả về. Dùng bởi `app/api/compile/route.ts`.

### `lib/compress.ts`

```ts
compressToBase64Url(data: string): Promise<string>
decompressFromBase64Url(b64url: string): Promise<string>
```

Dùng `fflate.deflateSync` / `inflateSync` (sync, không cần Worker). Base64url = base64 thay `+/=` thành `-_` (URL-safe, không cần percent-encode).

### `lib/utils.ts`

| Export | Mô tả |
|---|---|
| `debounce(fn, delay)` | Debounce generic |
| `formatDuration(ms)` | `450ms` hoặc `1.23s` |
| `formatBytes(bytes)` | `1.2 KB`, `3.4 MB` |
| `downloadTextFile(content, filename)` | Tạo blob URL, trigger click |
| `clamp(value, min, max)` | Giới hạn số trong khoảng |
| `AUTOSAVE_KEY` | `'cppeditor_autosave_v2'` |
| `MAX_CODE_BYTES` | 100 KB |
| `SHARE_WARN_BYTES` | 60 KB |

---

## State persistence

Dùng **hai key localStorage** riêng biệt:

### Key 1: `cpp-editor-settings-v1` — Cài đặt Monaco

Lưu/load bởi `lib/editor-settings.ts`. Chứa tất cả tùy chỉnh giao diện editor (font, toggles). Được update mỗi khi user thay đổi setting trong SettingsPanel.

### Key 2: `codeeditor-user-prefs-v1` — Lựa chọn UI cấp cao

Lưu/load bởi `lib/user-prefs.ts`. Chứa lựa chọn session:

| Field | Khi nào save |
|---|---|
| `langId` | Mỗi khi đổi ngôn ngữ (handleLangChange) |
| `optimize` | Mỗi khi toggle nút Optimize |
| `panels` | Mỗi khi toggle ẩn/hiện panel |
| `activeTab` | Mỗi khi đổi tab Single/Test Cases |

### Key 3: `cppeditor_autosave_v2` — Auto-save code + test cases

Nội dung: `{code, input, testCases[]}` → JSON → fflate compress → base64url. Debounce 800ms sau mỗi thay đổi.

---

## Share feature

Luồng tạo link:
```
{code, input, testCases} → JSON → fflate deflate-9 → base64url → /s/{data}
```

Luồng mở link (`app/s/[data]/page.tsx`):
```
URL param → decompressFromBase64Url → JSON.parse → setInitialCode + setInitialTestCases
→ <EditorLayout initialCode initialTestCases isSharedView />
```

Shared view: `isSharedView=true` → không auto-save (tránh ghi đè session của người dùng). Hiển thị badge "Shared" trên header.

URL format backward-compatible: link cũ chỉ có `{code, input}` (không có `testCases`) vẫn hoạt động.

---

## Test Cases

### Kiểu dữ liệu

```ts
type Status = 'idle' | 'running' | 'ok' | 'wrong' | 'error' | 'timeout'
```

### So sánh output

`compareOutput(actual, expected)`:
- Trim trailing whitespace từng dòng (`.trimEnd()`)
- Trim toàn chuỗi
- So sánh string
- Nếu expected rỗng → không chấm (return true)

### Verdicts

| Badge | Điều kiện |
|---|---|
| `PASS` | status `ok` + có expected + match |
| *(runtime)* | status `ok` + không có expected |
| `FAIL` | status `wrong` (output ≠ expected) |
| `ERR` | status `error` (compile error hoặc exit ≠ 0) |
| `TLE` | status `timeout` |

---

## CSS / Styling

`app/globals.css` định nghĩa các custom class dùng chung:

| Class | Mô tả |
|---|---|
| `.pane-bar` | Thanh tiêu đề panel (32px, flex, nền `#0e0e18`) |
| `.dot`, `.dot-red/yellow/green` | 3 chấm macOS style |
| `.resize-handle[-h|-v]` | Thanh drag resize, đổi màu indigo khi hover |
| `.code-textarea` | Textarea stdin (JetBrains Mono, nền `#0c0c14`) |
| `.output-pre` | Pre cho stdout (font mono, wrap) |
| `.panel-toggle.active/.inactive` | Nút toggle panel trên header |
| `.loading-pulse` | Keyframe animation nhấp nháy |
| `.bg-bg-header`, `.bg-bg-base`, `.border-border` | Alias màu nền |

**Viewport height fix:** `body { position: fixed; width: 100% }` + lắng nghe `visualViewport.resize` để cập nhật `viewH` state — tránh lỗi layout đen khi bàn phím ảo iOS đóng/mở.

**Toast offset mobile:** `[data-sonner-toaster] { bottom: calc(66px + safe-area-inset-bottom) }` — đẩy toast lên trên bottom nav bar.

---

## Cài đặt & chạy

### Yêu cầu hệ thống

- **Node.js** ≥ 20
- **g++** / **gcc** — `apt install build-essential` (Debian/Ubuntu) hoặc `apk add build-base` (Alpine)
- **python3**
- **ccache** *(tùy chọn, tăng tốc compile lại)*

### Development

```bash
npm install
npm run dev       # node server.js với NODE_ENV=development
```

Truy cập: [http://localhost:3000](http://localhost:3000)

Hot-reload Next.js bật sẵn. Socket.IO + Next.js chạy cùng một process.

### Production (không Docker)

```bash
npm install
npm run build     # next build → .next/standalone
NODE_ENV=production npm start  # node server.js
```

---

## Docker

### Multi-stage build

**Stage 1 (builder):** `node:20-alpine` → `npm ci` → `npm run build`

**Stage 2 (runner):** `node:20-alpine` → `apk add build-base ccache python3` → pre-compile PCH `bits/stdc++.h` (cả `-O0` lẫn `-O2`) → copy standalone build → override `server.js`.

**Socket.IO modules** được copy thủ công vì Next.js standalone trace không tự gộp chúng (`socket.io`, `engine.io`, `ws`, `@socket.io`, các parser, `cors`, `debug`...).

### Build & chạy

```bash
docker build -t codeeditor .

docker run -d \
  --name codeeditor \
  -p 3000:3000 \
  --restart unless-stopped \
  codeeditor
```

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

### Nginx reverse proxy

Socket.IO **bắt buộc** cần header `Upgrade` và `Connection: upgrade` để WebSocket hoạt động:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;

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

## Biến môi trường

| Biến | Default | Mô tả |
|---|---|---|
| `PORT` | `3000` | Port HTTP lắng nghe |
| `HOSTNAME` | `0.0.0.0` | Bind address |
| `NODE_ENV` | `development` | `production` tắt hot-reload Next.js |
| `CCACHE_DIR` | `/tmp/ccache` | Thư mục cache ccache |
| `CCACHE_MAXSIZE` | `512M` | Giới hạn dung lượng ccache |
| `CCACHE_COMPRESS` | `1` | Bật nén cache (trong Docker) |

---

## Giới hạn runtime

| Thông số | Giá trị | Cấu hình tại |
|---|---|---|
| Timeout compile C/C++ | 30 giây | `COMPILE_TIMEOUT` trong `server.js` và `compiler.ts` |
| Timeout chạy | 10 giây | `RUN_TIMEOUT` trong `server.js`; `RUN_TIMEOUT_MS` trong `route.ts` |
| Max output (stdout + stderr) | 2 MB | `MAX_OUTPUT_BYTES` trong `server.js` và `compiler.ts` |
| Max code size | 100 KB | `server.js` + `route.ts` + `utils.ts` |
| Max input size (HTTP) | 10 KB | `route.ts` |
| Share URL warning | 60 KB | `SHARE_WARN_BYTES` trong `utils.ts` |

---

## License

MIT
