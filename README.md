# 📡 SQTT.AI DESKTOP PRO - TRUNG TÂM ĐIỀU HÀNH PHÁT THANH AI

> **Bản quyền © 2026 DHSYSTEM.**  
> _Hệ thống điều hành phát thanh kỹ thuật số thế hệ mới, tích hợp trí tuệ nhân tạo tối ưu cho môi trường độc lập và bảo mật._

---

## 📖 Giới thiệu Tổng quan (Overview)

**SQTT.AI DESKTOP PRO** là hệ thống phần mềm Desktop chuyên dụng, được thiết kế để chuẩn hóa và tự động hóa quy trình sản xuất nội dung âm thanh. Hệ thống tập trung vào khả năng chuyển đổi văn bản thành giọng nói (TTS) tiếng Việt với độ tự nhiên cao, hoạt động hoàn toàn **Offline**, đảm bảo an toàn thông tin tuyệt đối cho các đơn vị đặc thù.

Sức mạnh của hệ thống nằm ở khả năng tối ưu hóa 100% hiệu suất CPU, cho phép vận hành mượt mà trên nhiều cấu hình phần cứng mà không cần GPU rời hay kết nối Internet.

---

## ⚡ Tính năng Nổi bật (Key Features)

- **Offline AI Engine:** Tích hợp mô hình `VieNeu-TTS-0.3B-q4-gguf` siêu nhẹ, nạp trực tiếp vào RAM, phản hồi tức thì với độ trễ cực thấp.
- **🎙️ Voice Cloning (Nhân bản Giọng nói):** Công nghệ Zero-shot tiên tiến giúp sao chép đặc trưng giọng nói chỉ với một file mẫu `.wav` và `.txt` tham chiếu.
- **🎵 Auto Audio Mixing (Hòa trộn Âm thanh Tự động):** Tích hợp engine `pydub`, tự động lồng ghép nhạc nền từ thư mục `nhac_nen`, điều chỉnh cường độ âm thanh (Vocal/BGM) và xử lý vòng lặp thông minh.
- **💾 Smart Workspace:** Quản lý luồng công việc theo dạng Dự án (Project-based). Người dùng toàn quyền chỉ định thư mục lưu trữ đầu ra, mang lại trải nghiệm chuyên nghiệp như bộ công cụ Microsoft Office.
- **🎨 Military Dashboard UI:** Giao diện chỉ huy tối giản, hiện đại, tối ưu cho sự tập trung. Hệ thống được trang bị cơ chế **Error Boundary** giúp ngăn chặn hoàn toàn lỗi Crash đột ngột.

---

## 🏗️ Kiến trúc Hệ thống (Architecture)

Hệ thống được xây dựng trên kiến trúc Hybrid hiện đại, tách biệt giữa giao diện điều khiển và lõi xử lý AI:

1.  **Giao diện (Frontend):**
    - Framework: **Electron** & **React**.
    - Build Tool: **Vite**.
    - Styling: **Tailwind CSS**.
    - Đảm nhiệm: Quản lý UI/UX, tương tác người dùng và điều phối tiến trình.

2.  **Lõi xử lý (Backend):**
    - Ngôn ngữ: **Python 3.x**.
    - API Framework: **FastAPI** & **Uvicorn**.
    - AI Library: **Vieneu** (TTS Core).
    - Audio Logic: **Pydub** & **FFmpeg**.

3.  **Trình quản lý Tiến trình (Process Manager):**
    - Cơ chế **Auto-spawn**: Frontend tự động khởi chạy Backend ngầm khi ứng dụng bắt đầu.
    - Cơ chế **Auto-cleanup**: Tự động dọn dẹp tài nguyên và tắt tiến trình Python khi đóng ứng dụng để tối ưu RAM/CPU.

---

## 📂 Cấu trúc Thư mục Quan trọng (Project Structure)

```bash
TTS-System/
├── src/                # Toàn bộ mã nguồn React (Frontend)
├── main/               # Mã nguồn khởi tạo Electron (Main Process)
├── backend-dist/       # Lõi xử lý Python và môi trường máy chủ
│   ├── mb_server.py    # File thực thi FastAPI Server chính
│   ├── .venv/          # Môi trường ảo Python cô lập
│   └── nhac_nen/       # Thư mục lưu trữ nhạc nền mặc định
├── extraResources/     # Tài nguyên bổ sung (Models, Dictionary, FFmpeg)
├── resources/          # Assets cố định (Icons, Splash screen)
└── package.json        # Cấu hình dự án và scripts
```

---

## 🛠️ Hướng dẫn dành cho Nhà phát triển (Development Guide)

### Yêu cầu hệ thống:

- Node.js (v18+)
- Python (3.10+)

### Bước 1: Khởi tạo Backend

Di chuyển vào thư mục `backend-dist`, khởi tạo môi trường ảo và cài đặt các thư viện cần thiết:

```powershell
cd backend-dist
python -m venv .venv
.\.venv\Scripts\activate
pip install fastapi uvicorn vieneu pydub
```

### Bước 2: Khởi tạo Frontend

Cài đặt các phụ kiện Node.js tại thư mục gốc:

```bash
npm install
```

### Bước 3: Chạy môi trường Development

Khởi chạy ứng dụng ở chế độ lập trình (Hỗ trợ Hot Reload):

```bash
npm run dev
```

---

## 📦 Hướng dẫn Đóng gói (Build Production)

Để tạo file cài đặt chính thức (`.exe`), sử dụng lệnh:

```bash
npm run build:win
```

> [!IMPORTANT]
> **Cấu hình ExtraResources:**
> Hệ thống đã được cấu hình trong `package.json` để tự động đóng gói toàn bộ thư mục `backend-dist` và `extraResources` vào file cài đặt. Điều này giúp ứng dụng có thể chạy độc lập ngay sau khi cài đặt mà không cần thiết lập thêm môi trường Python thủ công trên máy khách.

---

## 🚀 Hướng dẫn Sử dụng Nhanh (Quick Start)

### 1. Thêm giọng đọc mới (Cloning)

- Chuẩn bị 1 file âm thanh mẫu `.wav` (đã lọc nhiễu) và 1 file `.txt` tương ứng với nội dung trong file âm thanh.
- Bỏ cả 2 file vào thư mục `/samples` để hệ thống nhận diện tự động trong mục **Voice Lab**.

### 2. Thêm nhạc nền

- Sao chép các file nhạc nền (`.mp3`, `.wav`) vào thư mục `nhac_nen/`.
- Sử dụng tính năng **BGM Selector** trên bảng điều khiển để chọn và hòa trộn trực tiếp vào bản tin.

---

**DHSYSTEM - Kiến tạo nền tảng AI vững chắc.**
