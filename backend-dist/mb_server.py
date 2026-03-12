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
import soundfile as sf
from llama_cpp import Llama
from pydantic import BaseModel

from fastapi import FastAPI, Form, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Ép hệ thống tải và lưu model vào thư mục "model_cache" ngay bên trong thư mục dự án
# Điều này cực kỳ quan trọng để khi đóng gói, phần mềm mang theo được "bộ não"
os.environ["HF_HOME"] = os.path.join(BASE_DIR, "model_cache")

from vieneu import Vieneu

app = FastAPI(title="MB-TTS API Server (DHSYSTEM Core)", version="3.0")

app = FastAPI(title="MB-TTS API Server (DHSYSTEM Core)", version="3.0")
LLM_MODEL_PATH = os.path.join(BASE_DIR, "model_cache", "llm", "local_llm.gguf")
llm_engine = None

class GenerateRequest(BaseModel):
    prompt: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("[*] Đang khởi tạo hệ thống lõi VieNeu-TTS (Phiên bản CPU GGUF)...")

# Khởi tạo model ở chế độ local, sử dụng bản nén q4-gguf để chạy mượt trên CPU
tts = Vieneu(
    mode="standard", 
    backbone_repo="pnnbao-ump/VieNeu-TTS-0.3B-q4-gguf" 
)

VOICE_BANK_DIR = os.path.join(BASE_DIR, "src", "vieneu", "assets", "samples")
os.makedirs(VOICE_BANK_DIR, exist_ok=True)

# Thư mục chứa nhạc nền (Tiếng Việt không dấu)
BGM_DIR = os.path.join(BASE_DIR, "nhac_nen")
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
async def get_available_voices():
    """Lấy danh sách các giọng nói đã được định danh (có đủ file wav và txt)"""
    voices = []
    if os.path.exists(VOICE_BANK_DIR):
        for file in os.listdir(VOICE_BANK_DIR):
            if file.endswith(".txt"):
                base_name = file[:-4]
                # Chỉ xác nhận là giọng hợp lệ nếu có cả file .wav đi kèm
                if os.path.exists(os.path.join(VOICE_BANK_DIR, f"{base_name}.wav")):
                    voices.append(base_name)
    return {"success": True, "voices": sorted(voices)}

@app.get("/api/bgm")
async def get_bgm_list():
    """API quét thư mục nhac_nen và trả về danh sách file nhạc"""
    bgm_list = []
    if os.path.exists(BGM_DIR):
        for file in os.listdir(BGM_DIR):
            if file.endswith((".wav", ".mp3")):
                bgm_list.append(file)
    return {"success": True, "bgm": bgm_list}

@app.post("/api/clone-voice")
async def clone_voice(
    voice_name: str = Form(...),
    ref_text: str = Form(...),
    audio_file: UploadFile = File(...)
):
    """API Nhân bản giọng nói: Nhận Audio và văn bản mẫu để tạo hồ sơ"""
    try:
        import shutil
        # Dọn dẹp tên file để tránh lỗi hệ điều hành
        safe_name = "".join([c for c in voice_name if c.isalpha() or c.isdigit() or c in " -_()"]).strip()
        if not safe_name:
            return {"success": False, "error": "Tên giọng không hợp lệ."}

        wav_path = os.path.join(VOICE_BANK_DIR, f"{safe_name}.wav")
        txt_path = os.path.join(VOICE_BANK_DIR, f"{safe_name}.txt")
        
        # Lưu file Audio
        with open(wav_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)
            
        # Lưu file Text (UTF-8)
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(ref_text)
            
        print(f"[+] Đã khởi tạo hồ sơ nhân bản: {safe_name}")
        return {"success": True, "message": f"Đã khởi tạo thành công hồ sơ: {safe_name}"}
    except Exception as e:
        print(f"[-] Lỗi Clone Voice: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/add-voice")
async def add_voice(
    voice_name: str = Form(...),
    ref_text: str = Form(...),
    audio_file: UploadFile = File(...)
):
    """Fallback / Legacy API (Khuyên dùng /api/clone-voice thay thế)"""
    return await clone_voice(voice_name, ref_text, audio_file)

@app.get("/api/voices/{voice_id}/sample")
async def get_voice_sample(voice_id: str):
    """
    Phục vụ file âm thanh mẫu (.wav) của voice_id để nghe thử.
    """
    sample_path = os.path.join(VOICE_BANK_DIR, f"{voice_id}.wav")
    if os.path.exists(sample_path):
        return FileResponse(sample_path, media_type="audio/wav")
    raise HTTPException(status_code=404, detail="Không tìm thấy file mẫu cho giọng này.")

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
        output_dir = os.path.join(BASE_DIR, "output_audio")
        os.makedirs(output_dir, exist_ok=True)
        final_output_path = os.path.join(output_dir, f"tts_{voice_id}.wav")
    
    import shutil
    import tempfile

    try:
        print(f"[*] Khởi chạy engine TTS cho văn bản: {text[:50]}...")
        
        # FIX: Unicode Pathing - Copy file mẫu ra path tạm không dấu để tránh lỗi engine
        temp_dir = tempfile.gettempdir()
        temp_ref_audio = os.path.join(temp_dir, f"ref_{int(time.time())}.wav")
        print(f"[*] Copying ref audio to temp path: {temp_ref_audio}")
        shutil.copy2(ref_audio_path, temp_ref_audio)

        print("[*] Đang xuất audio từ AI...")
        
        # Lấy dữ liệu âm thanh từ AI - Handle both tuple and direct audio array
        result = tts.infer(text, ref_audio=temp_ref_audio, ref_text=ref_text_content)
        if isinstance(result, tuple):
            audio, sr = result[0], result[1]
        else:
            audio, sr = result, 24000 # Default to 24k if not returned
            
        # Log Shape để kiểm tra dữ liệu thô
        try:
            if hasattr(audio, 'shape'):
                print(f"[DEBUG] Shape của audio: {audio.shape}")
                if len(audio.shape) > 0 and audio.shape[0] == 0:
                    print("[!] CẢNH BÁO: Audio tensor trả về rỗng (0 shape)!")
            else:
                print(f"[DEBUG] Audio type: {type(audio)}")
        except Exception as shape_err:
            print(f"[!] Lỗi khi kiểm tra shape: {shape_err}")

        # 1. Lưu tạm file giọng đọc gốc (chưa mix)
        raw_output_path = final_output_path.replace(".wav", "_raw.wav")
        print(f"[*] Saving raw audio to: {raw_output_path}")
        
        # Use soundfile instead of non-existent tts.save_audio
        sf.write(raw_output_path, audio, sr)
        
        # Kiểm tra kích thước file sau khi save
        if os.path.exists(raw_output_path):
            raw_size = os.path.getsize(raw_output_path)
            print(f"[DEBUG] Kích thước file Raw: {raw_size} bytes")
            if raw_size < 100:
                print("[!] CẢNH BÁO: File Raw quá nhỏ, có thể bị lỗi ghi file hoặc file câm.")
        else:
            print("[!] LỖI: Không tìm thấy file Raw sau khi sf.write()")

        # Cleanup temp ref audio
        if os.path.exists(temp_ref_audio):
            os.remove(temp_ref_audio)

        # 2. Xử lý Trộn âm (Mixing) nếu có chọn nhạc nền
        if bgm and bgm != "none" and bgm.endswith((".wav", ".mp3")):
            bgm_path = os.path.join(BGM_DIR, bgm)
            if os.path.exists(bgm_path):
                print(f"[*] Đang trộn âm với nhạc nền: {bgm}")
                try:
                    # Đọc file giọng đọc
                    voice_audio = AudioSegment.from_file(raw_output_path)
                    print(f"[DEBUG] Voice Audio Duration: {len(voice_audio)}ms")
                    
                    # Đọc file nhạc nền
                    bgm_audio = AudioSegment.from_file(bgm_path)
                    print(f"[DEBUG] BGM Audio Duration: {len(bgm_audio)}ms")

                    # Giảm âm lượng nhạc nền
                    bgm_audio = bgm_audio - 15

                    if len(bgm_audio) < len(voice_audio):
                        loop_count = (len(voice_audio) // len(bgm_audio)) + 1
                        bgm_audio = bgm_audio * loop_count
                    
                    bgm_audio = bgm_audio[:len(voice_audio)]
                    mixed_audio = voice_audio.overlay(bgm_audio)

                    print(f"[*] Exporting mixed audio to: {final_output_path}")
                    mixed_audio.export(final_output_path, format="wav")
                    
                    mixed_size = os.path.getsize(final_output_path)
                    print(f"[DEBUG] Kích thước file Mixed: {mixed_size} bytes")
                    
                    os.remove(raw_output_path)
                    print("[+] Trộn âm thành công!")
                except Exception as mix_err:
                    print(f"[-] Lỗi khi trộn âm (Dùng bản Raw): {mix_err}")
                    if os.path.exists(raw_output_path):
                        os.replace(raw_output_path, final_output_path)
            else:
                print(f"[!] Không tìm thấy nhạc nền tại: {bgm_path}")
                if os.path.exists(raw_output_path):
                    os.replace(raw_output_path, final_output_path)
        else:
            if os.path.exists(raw_output_path):
                os.replace(raw_output_path, final_output_path)

        # Trả về file đã tạo
        if os.path.exists(final_output_path) and os.path.getsize(final_output_path) > 0:
            return FileResponse(final_output_path, media_type="audio/wav")
        else:
            raise Exception("File đầu ra không hợp lệ hoặc 0-byte.")

    except Exception as e:
        print(f"[-] LỖI CRITICAL tại Generate TTS: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-script")
async def generate_script(request: GenerateRequest):
    global llm_engine
    if not os.path.exists(LLM_MODEL_PATH):
        error_msg = f"Thiếu file {os.path.basename(LLM_MODEL_PATH)} tại {os.path.dirname(LLM_MODEL_PATH)}. " \
                    "Vui lòng chạy 'python setup_llm.py' để tải mô hình."
        return {"success": False, "error": error_msg}

    try:
        if llm_engine is None:
            print("[*] Đang nạp Động cơ Tham mưu LLM (Chế độ tối ưu CPU)...")
            # CẤU HÌNH SINH TỬ CHO MÁY YẾU:
            # n_gpu_layers=0: Bắt buộc chạy 100% bằng CPU
            # n_threads=4: Giới hạn dùng 4 luồng CPU để máy không bị đơ
            # n_ctx=1024: Giảm bộ nhớ ngữ cảnh xuống để tiết kiệm RAM
            llm_engine = Llama(
                model_path=LLM_MODEL_PATH, 
                n_ctx=1024, 
                n_threads=4, 
                n_gpu_layers=0, 
                verbose=False
            )
            
        print(f"[*] AI đang phân tích yêu cầu: {request.prompt}")
        system_prompt = "Bạn là một sĩ quan tham mưu, trợ lý biên tập chuyên nghiệp. Hãy viết văn bản bằng tiếng Việt, ngắn gọn, súc tích, văn phong nghiêm túc."
        
        response = llm_engine.create_chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.prompt}
            ],
            max_tokens=600,
            temperature=0.7,
        )
        
        generated_text = response['choices'][0]['message']['content']
        return {"success": True, "text": generated_text}
    except Exception as e:
        print(f"[-] Lỗi Động cơ LLM: {e}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    # Khởi động trạm chỉ huy tại cổng 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)