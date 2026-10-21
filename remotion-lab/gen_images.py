#!/usr/bin/env python3
"""
কবর — প্রতিটি লাইনের জন্য AI ছবি (Pollinations)।
ফ্রি টায়ারের সীমা: ৪৫ সেকেন্ডে ১টি ছবি।
- resume: আগে ডাউনলোড হওয়া ছবি এড়িয়ে যায়
- watermark: নিচের ৪২ পিক্সেল কেটে ফেলে
"""
import os, sys, time, json, subprocess, urllib.parse, random
sys.path.insert(0, "/home/imran/.hermes/cache/scratch")
from prompts_kabor import PROMPTS, STYLE

OUT = "/home/imran/.hermes/cache/scratch/kabor-assets"
LOG = "/tmp/img_gen.log"
WAIT = int(os.environ.get('IMG_WAIT', 46))  # ফ্রি লিমিট ৪৫ সে
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"


def log(m):
    print(m, flush=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(m + "\n")


def fetch(prompt, seed, tries=4):
    url = ("https://image.pollinations.ai/prompt/" + urllib.parse.quote(prompt) +
           f"?width=1920&height=1080&nologo=true&seed={seed}")
    for t in range(tries):
        p = subprocess.run(
            ["curl", "-sL", "--max-time", "90", "-A", UA, "-o", "/tmp/_img.jpg",
             "-w", "%{http_code}", url], capture_output=True, text=True)
        code = p.stdout.strip()[-3:]
        if code == "200":
            sz = os.path.getsize("/tmp/_img.jpg")
            if sz > 8000:
                return True, sz
            log(f"    ফাইল ছোট ({sz}B)")
        else:
            log(f"    HTTP {code} — {tries-t} বার বাকি")
        time.sleep(WAIT)
    return False, 0


def crop_watermark(src, dst):
    """নিচের ৪২ পিক্সেল কেটে ফেলা (pollinations.ai watermark)"""
    r = subprocess.run(
        ["ffmpeg", "-y", "-i", src, "-vf", "crop=iw:ih-42:0:0", "-q:v", "3", dst],
        capture_output=True, text=True)
    return os.path.exists(dst) and os.path.getsize(dst) > 5000


def main():
    os.makedirs(OUT, exist_ok=True)
    open(LOG, "w").close()
    n = len(PROMPTS)
    log(f"মোট {n} ছবি | ব্যাট {WAIT}s | {OUT}")
    t0 = time.time()
    done = 0
    for i, p in enumerate(PROMPTS, 1):
        dst = os.path.join(OUT, f"line-{i:03d}.jpg")
        if os.path.exists(dst) and os.path.getsize(dst) > 20000:
            done += 1
            continue
        full = p + ", " + STYLE
        seed = 1000 + i * 7
        ok, sz = fetch(full, seed)
        if not ok:
            log(f"  #{i:3} ব্যর্থ — পরে চেষ্টা করা হবে")
            continue
        if crop_watermark("/tmp/_img.jpg", dst):
            done += 1
            log(f"  #{i:3}/{n} ✓ {os.path.getsize(dst)//1024}KB  ({(time.time()-t0)/60:.1f} মিনিট)")
        else:
            log(f"  #{i:3} crop ব্যর্থ")
        time.sleep(WAIT)
    log(f"শেষ — {done}/{n} ছবি · {(time.time()-t0)/60:.1f} মিনিট")


if __name__ == "__main__":
    main()
