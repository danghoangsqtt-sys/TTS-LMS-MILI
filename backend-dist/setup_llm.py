import os
import requests
from tqdm import tqdm

def download_model():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    target_dir = os.path.join(base_dir, "model_cache", "llm")
    os.makedirs(target_dir, exist_ok=True)
    
    target_path = os.path.join(target_dir, "local_llm.gguf")
    
    # Lightweight Qwen2.5-0.5B-Instruct-GGUF (approx 350-400MB)
    # This is a very fast model for CPU-only office computers
    model_url = "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf"
    
    if os.path.exists(target_path):
        print(f"[*] Model file already exists at: {target_path}")
        return

    print(f"[*] Downloading lightweight CPU-optimized LLM (Qwen2.5-0.5B)...")
    print(f"[*] Target: {target_path}")
    
    try:
        response = requests.get(model_url, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        block_size = 1024 # 1 Kibibyte
        
        progress_bar = tqdm(total=total_size, unit='iB', unit_scale=True)
        
        with open(target_path, "wb") as f:
            for data in response.iter_content(block_size):
                progress_bar.update(len(data))
                f.write(data)
        progress_bar.close()
        
        if total_size != 0 and progress_bar.n != total_size:
            print("ERROR: Something went wrong during download")
        else:
            print("[+] Download complete! AI Core is ready.")
            
    except Exception as e:
        print(f"[-] Download failed: {e}")
        if os.path.exists(target_path):
            os.remove(target_path)

if __name__ == "__main__":
    download_model()
