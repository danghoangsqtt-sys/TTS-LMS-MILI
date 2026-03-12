<p align="center">
  <img src="assets/logo.png" width="180" alt="SQTT.AI Logo">
</p>

<h1 align="center">📡 SQTT.AI DESKTOP PRO</h1>
<h3 align="center">TRUNG TÂM ĐIỀU HÀNH PHÁT THANH AI</h3>

<p align="center">
  <strong>Tác giả: DHSYSTEM</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI">
</p>

---

## 📖 Tổng quan (Overview)

**SQTT.AI DESKTOP PRO** là hệ thống phần mềm Desktop độc lập (Offline-first), chuyên dụng cho nhiệm vụ chuyển đổi văn bản thành giọng nói (TTS) Tiếng Việt với độ chuẩn xác và bảo mật cao nhất.

Được phát triển bởi **DHSYSTEM**, hệ thống tối ưu hóa 100% tài nguyên CPU để vận hành các mô hình ngôn ngữ lớn ngay trên RAM cục bộ, đảm bảo tính bền bỉ và an toàn tuyệt đối trong các kịch bản vận hành nội bộ, cách ly hoàn toàn với Internet.

---

## ⚡ Bảng Tính năng Chiến lược (Key Features)

| Tính năng             | Mô tả Kỹ thuật                                                      | Lợi ích Chiến lược                                    |
| :-------------------- | :------------------------------------------------------------------ | :---------------------------------------------------- |
| **Offline AI Engine** | Sử dụng lõi `VieNeu-TTS-0.3B-q4-gguf` nạp thẳng RAM.                | Hoạt động không cần Internet, độ trễ cực thấp.        |
| **Voice Cloning**     | Công nghệ nhân bản giọng nói Zero-shot từ file mẫu `.wav` & `.txt`. | Cá nhân hóa thông điệp phát thanh chỉ trong giây lát. |
| **Auto Audio Mixing** | Tự động lồng nhạc nền, loop và ducking volume qua `pydub`.          | Sản xuất bản tin hoàn chỉnh chuyên nghiệp, tự động.   |
| **Smart Workspace**   | Quản lý xuất file theo thư mục chỉ định (Office Style).             | Lưu trữ khoa học, dễ dàng tra cứu và quản lý dự án.   |
| **Military UI/UX**    | Giao diện chỉ huy tối giản, dashboard dashboard chuyên nghiệp.      | Tối ưu hóa tập trung, Error Boundary chống lỗi Crash. |

---

## 🏗️ Cấu trúc Hệ thống (Architecture Tree)

Hệ thống vận hành theo mô hình Client-Server cục bộ (Local Distributed):

```text
SQTT.AI DESKTOP PRO (Root)
├── 🖥️ src/ (React Frontend)          # Giao diện người dùng & Logic điều khiển
├── ⚙️ out/main/ (Electron Main)      # Nhân Electron điều phối tiến trình ngầm
├── 🐍 backend-dist/ (Python API)      # Lõi FastAPI + Mô hình AI (TTS Engine)
│   ├── mb_server.py                  # Server entry point
│   ├── .venv/                        # Môi trường thực thi cô lập
│   └── output_audio/                 # Bộ đệm âm thanh tạm thời
├── 🎵 nhac_nen/                       # Thư mục tài nguyên âm nhạc chiến lược
├── 🚀 assets/                         # Tài nguyên thương hiệu (Logo, Icons)
└── 📦 extraResources/                 # Các thành phần thực thi bổ trợ (FFmpeg, Models)
```

---

## 🛠️ Hướng dẫn Triển khai (Development & Build)

### 1. Khởi tạo Frontend (Client Side)

Hệ thống sử dụng Node.js để vận hành giao diện:

```bash
# Cài đặt toàn bộ dependencies
npm install
```

### 2. Khởi tạo Backend (AI Core)

Thiết lập môi trường Python 3.10+ để vận hành lõi AI:

```bash
cd backend-dist
# Tạo môi trường ảo
python -m venv .venv
# Kích hoạt (Windows)
.\.venv\Scripts\activate
# Cài đặt các thư viện lõi
pip install fastapi uvicorn vieneu pydub
```

### 3. Khởi chạy Môi trường Phát triển

```bash
# Khởi chạy Electron + Vite (Tự động spawn Backend)
npm run dev
```

### 4. Đóng gói Xuất xưởng (Production Build)

Để xuất bản bản cài đặt thương mại (`.exe`), sử dụng:

```bash
npm run build:win
```

> [!NOTE]
> **Cơ chế extraResources:** Hệ thống tự động đóng gói thư mục `backend-dist` và `extraResources` vào tệp cài đặt thông qua cầu hình trong `package.json`, đảm bảo tính di động tuyệt đối mà không cần cài đặt lại môi trường trên máy đích.

---

## 🚀 Hướng dẫn Sử dụng Nhanh (Quick Start)

- **Nạp giọng mới:** Thả file `.wav` và `.txt` vào thư mục `samples` để bắt đầu Voice Cloning.
- **Quản lý nhạc nền:** Thêm tệp âm thanh vào thư mục `nhac_nen/`, hệ thống sẽ tự động cập nhật thư viện trên UI.
- **Xuất bản:** Chọn thư mục Workspace mong muốn, hệ thống sẽ lưu trữ và quản lý phiên bản tương tự trải nghiệm dùng Word/Excel.

---

**DHSYSTEM - KIẾN TẠO CÔNG NGHỆ CHỈ HUY.**
