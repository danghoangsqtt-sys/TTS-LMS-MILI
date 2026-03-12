import sys
# Ép toàn bộ Terminal đọc chuẩn tiếng Việt (UTF-8)
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8')

import os
import threading
import uvicorn
import io
import json
from pydub import AudioSegment

from fastapi import FastAPI, Form, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import time

# Ép hệ thống tải và lưu model vào thư mục "model_cache" ngay bên trong thư mục dự án
# Điều này cực kỳ quan trọng để khi đóng gói, phần mềm mang theo được "bộ não"
os.environ["HF_HOME"] = os.path.join(os.getcwd(), "model_cache")

from vieneu import Vieneu

app = FastAPI(title="MB-TTS API Server (DHSYSTEM Core)", version="3.0")

# Cấu hình CORS để Electron (Frontend) có thể gọi API mà không bị chặn
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

print("[*] Đang khởi tạo hệ thống lõi VieNeu-TTS (Phiên bản CPU GGUF)...")

# Khởi tạo model ở chế độ local, sử dụng bản nén q4-gguf để chạy mượt trên CPU
tts = Vieneu(
    mode="standard", 
    backbone_repo="pnnbao-ump/VieNeu-TTS-0.3B-q4-gguf" 
)

VOICE_BANK_DIR = "src/vieneu/assets/samples"
os.makedirs(VOICE_BANK_DIR, exist_ok=True)

# Thư mục chứa nhạc nền (Tiếng Việt không dấu)
BGM_DIR = "nhac_nen"
os.makedirs(BGM_DIR, exist_ok=True)

# Biến trạng thái toàn cục
SYSTEM_STATUS = {"status": "initializing", "progress": 0, "message": "Đang khởi động trạm chỉ huy..."}

def update_status(msg, progress):
    SYSTEM_STATUS["message"] = msg
    SYSTEM_STATUS["progress"] = progress
    print(f"[*] {msg} ({progress}%)")

# ---------------------------------------------------------
# CƠ CHẾ WARM-UP: Nạp model vào RAM ngay khi bật server
# Giúp giải quyết vấn đề "tải giọng nói lâu" ở lượt gọi đầu tiên
# ---------------------------------------------------------
def warm_up_system():
    time.sleep(1) # Chờ 1 giây để Frontend sẵn sàng
    update_status("Đang nạp bộ não AI (Bản CPU)...", 20)
    try:
        # Giọng mặc định để warm-up (đảm bảo file này tồn tại trong assets/samples)
        sample_voice = os.path.join(VOICE_BANK_DIR, "Bình (nam miền Bắc).wav")
        sample_text = "Khởi động hệ thống."
        
        time.sleep(1.5)
        update_status("Đang giải mã từ điển...", 60)
        
        if os.path.exists(sample_voice):
            # Chạy thử một lượt ẩn để AI nằm sẵn trong RAM
            tts.infer(sample_text, ref_audio=sample_voice, ref_text="Bình nam miền Bắc.")
            time.sleep(1)
            update_status("Hệ thống đã sẵn sàng!", 100)
            SYSTEM_STATUS["status"] = "ready"
        else:
            time.sleep(1)
            update_status("Cảnh báo: Không tìm thấy giọng mẫu để Warm-up.", 90)
            SYSTEM_STATUS["status"] = "ready" 
    except Exception as e:
        update_status(f"Warm-up thất bại: {e}", 100)
        SYSTEM_STATUS["status"] = "ready"

# Chạy Warm-up trong luồng riêng để không làm chậm quá trình bật Server
threading.Thread(target=warm_up_system, daemon=True).start()

@app.get("/api/status")
async def get_status():
    """Kiểm tra trạng thái sẵn sàng của hệ thống với tiến trình cụ thể"""
    return SYSTEM_STATUS

@app.get("/api/health")
async def health_check():
    """Kiểm tra phản hồi nhanh của server"""
    return {"status": "alive"}

@app.get("/api/voices")
async def get_voices():
    """Lấy danh sách các giọng nói đã được định danh (có đủ file wav và txt)"""
    voices = []
    if os.path.exists(VOICE_BANK_DIR):
        for file in os.listdir(VOICE_BANK_DIR):
            if file.endswith(".wav"):
                voice_name = file.replace(".wav", "")
                # Chỉ hiển thị nếu có kèm file nội dung (transcript) để phục vụ clone
                if os.path.exists(os.path.join(VOICE_BANK_DIR, f"{voice_name}.txt")):
                    voices.append({"id": voice_name, "name": voice_name})
    return {"success": True, "voices": voices}

@app.get("/api/bgm")
async def get_bgm_list():
    """API quét thư mục nhac_nen và trả về danh sách file nhạc"""
    bgm_list = []
    if os.path.exists(BGM_DIR):
        for file in os.listdir(BGM_DIR):
            if file.endswith((".wav", ".mp3")):
                bgm_list.append(file)
    return {"success": True, "bgm": bgm_list}

@app.post("/api/add-voice")
async def add_voice(
    voice_name: str = Form(...),
    ref_text: str = Form(...),
    audio_file: UploadFile = File(...)
):
    """API lưu giọng nói mới vào Ngân hàng giọng nói"""
    safe_name = voice_name.strip()
    wav_path = os.path.join(VOICE_BANK_DIR, f"{safe_name}.wav")
    txt_path = os.path.join(VOICE_BANK_DIR, f"{safe_name}.txt")
    
    try:
        with open(wav_path, "wb") as f:
            f.write(await audio_file.read())
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(ref_text)
        return {"success": True, "message": f"Đã lưu giọng: {safe_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tts")
async def generate_tts(
    voice_id: str = Form(...),
    text: str = Form(...),
    speed: float = Form(1.0),       # Nhận thông số Tốc độ (Mặc định 1x)
    pitch: float = Form(1.0),       # Nhận thông số Cao độ (Mặc định 1)
    prosody: str = Form("{}"),      # Nhận chuỗi JSON cấu hình nhịp điệu
    bgm: str = Form(None),          # Nhận tên file nhạc nền từ giao diện
    save_path: str = Form(None)     # Thư mục người dùng muốn lưu file
):
    """API chính để chuyển đổi văn bản thành âm thanh với cấu hình cao cấp"""
    print(f"\n[+] Lệnh TTS - Giọng: {voice_id} | Tốc độ: {speed}x | Cao độ: {pitch} | BGM: {bgm}")
    ref_audio_path = os.path.join(VOICE_BANK_DIR, f"{voice_id}.wav")
    ref_text_path = os.path.join(VOICE_BANK_DIR, f"{voice_id}.txt")
    
    if not os.path.exists(ref_audio_path) or not os.path.exists(ref_text_path):
        raise HTTPException(status_code=404, detail="Dữ liệu giọng mẫu không đầy đủ.")
        
    with open(ref_text_path, "r", encoding="utf-8") as f:
        ref_text_content = f.read().strip()
        
    # Xử lý thư mục lưu file (Giống Office)
    if save_path and os.path.isdir(save_path):
        final_output_path = os.path.join(save_path, f"tts_{voice_id}.wav")
    else:
        # Fallback nếu người dùng chưa chọn thư mục
        output_dir = "output_audio"
        os.makedirs(output_dir, exist_ok=True)
        final_output_path = os.path.join(output_dir, f"tts_{voice_id}.wav")
    
    try:
        print("[*] Đang xuất audio từ AI...")
        audio, sr, *_ = tts.infer(text, ref_audio=ref_audio_path, ref_text=ref_text_content)
        
        # 1. Lưu tạm file giọng đọc gốc (chưa mix)
        raw_output_path = final_output_path.replace(".wav", "_raw.wav")
        tts.save_audio(audio, sr, raw_output_path)

        # 2. Xử lý Trộn âm (Mixing) nếu có chọn nhạc nền
        if bgm and bgm != "none" and bgm.endswith(".wav"):
            bgm_path = os.path.join(BGM_DIR, bgm)
            if os.path.exists(bgm_path):
                print(f"[*] Đang trộn âm với nhạc nền: {bgm}")
                try:
                    # Đọc 2 file âm thanh
                    voice_audio = AudioSegment.from_wav(raw_output_path)
                    bgm_audio = AudioSegment.from_wav(bgm_path)

                    # Giảm âm lượng nhạc nền xuống 15 dB (có thể chỉnh số này nếu muốn to/nhỏ hơn)
                    bgm_audio = bgm_audio - 15

                    # Xử lý độ dài: Nếu nhạc nền ngắn hơn giọng đọc -> Lặp lại nhạc nền
                    if len(bgm_audio) < len(voice_audio):
                        loop_count = (len(voice_audio) // len(bgm_audio)) + 1
                        bgm_audio = bgm_audio * loop_count
                    
                    # Cắt nhạc nền cho khớp chính xác đến từng mili-giây với giọng đọc
                    bgm_audio = bgm_audio[:len(voice_audio)]

                    # Lồng ghép (Overlay) giọng đọc lên trên nhạc nền
                    mixed_audio = voice_audio.overlay(bgm_audio)

                    # Xuất ra file cuối cùng
                    mixed_audio.export(final_output_path, format="wav")
                    
                    # Xóa file tạm gốc cho sạch sẽ
                    os.remove(raw_output_path)
                    print("[+] Trộn âm thành công!")
                except Exception as mix_err:
                    print(f"[-] Lỗi khi trộn âm (Bỏ qua BGM): {mix_err}")
                    # Nếu lỗi mix, tự động dùng luôn bản giọng đọc gốc để không bị gián đoạn
                    os.rename(raw_output_path, final_output_path)
            else:
                os.rename(raw_output_path, final_output_path)
        else:
            # Nếu không chọn BGM, đổi tên file tạm thành file chính thức
            os.rename(raw_output_path, final_output_path)

    except Exception as e:
        print(f"[-] Lỗi lõi AI: {e}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    # Khởi động trạm chỉ huy tại cổng 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)