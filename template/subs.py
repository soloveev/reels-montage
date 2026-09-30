"""Субтитры в стиле рилс поверх вертикального видео.

Команды:
  transcribe <видео>                  -> whisper.json рядом с видео (тайминги по словам)
  build <whisper.json> [опции]        -> subs.ass + список фраз для проверки
  preview <видео> <subs.ass> <сек>... -> кадры с субтитрами в _preview/
  burn <видео> <subs.ass>             -> «<имя> — субтитры.mp4» рядом с видео

Только stdlib, ffmpeg (с libass) и whisper-cli из Homebrew.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

MODEL = Path(os.environ.get("WHISPER_MODEL_DIR", Path.home() / ".local/share/whisper-models")) / "ggml-large-v3-turbo.bin"


def run(cmd):
    subprocess.run(cmd, check=True)


def probe_size(video):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
         "-of", "csv=p=0", str(video)], capture_output=True, text=True, check=True).stdout.strip()
    w, h = out.split(",")
    return int(w), int(h)


# ---------- transcribe ----------

def cmd_transcribe(a):
    video = Path(a.video)
    out = Path(a.out) if a.out else video.with_name("whisper.json")
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "a.wav"
        run(["ffmpeg", "-y", "-v", "error", "-i", str(video), "-ar", "16000", "-ac", "1", str(wav)])
        run(["whisper-cli", "-m", str(MODEL), "-l", a.lang, "-f", str(wav), "-ojf", "-np",
             "-of", str(out.with_suffix(""))])
    print(f"-> {out}")


# ---------- build ----------

def load_words(path):
    """Токены whisper -> слова [текст, начало, конец]. Токен с пробелом в начале = новое слово."""
    # Токен может резать кириллическую букву пополам, и файл в целом не валидный UTF-8:
    # читаем с surrogateescape и склеиваем слова байтами.
    data = json.loads(open(path, "rb").read().decode("utf-8", "surrogateescape"))
    words = []
    for seg in data["transcription"]:
        for t in seg["tokens"]:
            txt = t["text"].encode("utf-8", "surrogateescape")
            if txt.startswith(b"[_"):
                continue
            a, b = t["offsets"]["from"] / 1000, t["offsets"]["to"] / 1000
            if txt.startswith(b" ") or not words:
                words.append([txt.strip(), a, b])
            else:
                words[-1][0] += txt
                words[-1][2] = b
    words = [[w.decode("utf-8", "replace"), a, b] for w, a, b in words]
    return [w for w in words if w[0]]


def load_fixes(path):
    """Файл правок: строка «было => стало», слова через пробел. Пустая правая часть = удалить."""
    fixes = []
    if not path:
        return fixes
    for line in open(path):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        src, dst = line.split("=>")
        fixes.append((src.split(), dst.split()))
    return fixes


def apply_fixes(words, fixes):
    used = set()
    i = 0
    while i < len(words):
        for n, (src, dst) in enumerate(fixes):
            if [w[0] for w in words[i:i + len(src)]] == src:
                a, b = words[i][1], words[i + len(src) - 1][2]
                words[i:i + len(src)] = [[d, a, b] for d in dst]
                used.add(n)
                break
        i += 1
    for n, (src, _) in enumerate(fixes):
        if n not in used:
            print(f"⚠ правка не сработала: {' '.join(src)}", file=sys.stderr)
    return words


def chunk(words, max_chars, max_words, gap):
    chunks, cur = [], []
    for w in words:
        text_len = len(" ".join(x[0] for x in cur + [w]))
        pause = w[1] - cur[-1][2] if cur else 0
        if cur and (text_len > max_chars or len(cur) >= max_words or pause > gap):
            chunks.append(cur)
            cur = []
        cur.append(w)
        if w[0][-1] in ".,?!:;»":
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    return chunks


def ts(s):
    cs = int(round(s * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def clean(t):
    return t.rstrip(",.;:").replace("{", "(").replace("}", ")")


def bgr(hex_rgb):
    h = hex_rgb.lstrip("#")
    return f"&H{h[4:6]}{h[2:4]}{h[0:2]}&".upper()


def cmd_build(a):
    words = apply_fixes(load_words(a.json), load_fixes(a.fixes))
    chunks = chunk(words, a.max_chars, a.max_words, a.gap)
    accent = bgr(a.accent)
    x = a.width // 2
    lines = []
    for ci, ch in enumerate(chunks):
        nxt = chunks[ci + 1][0][1] if ci + 1 < len(chunks) else ch[-1][2] + 0.6
        chunk_end = min(ch[-1][2] + 0.25, nxt)
        for wi, w in enumerate(ch):
            start = w[1]
            end = ch[wi + 1][1] if wi + 1 < len(ch) else chunk_end
            if end <= start:
                continue
            parts = []
            for k, word in enumerate(ch):
                t = clean(word[0])
                if a.accent and k == wi:
                    t = f"{{\\c{accent}}}{t}{{\\c&HFFFFFF&}}"
                parts.append(t)
            lines.append(f"Dialogue: 0,{ts(start)},{ts(end)},Rail,,0,0,0,,{{\\pos({x},{a.y})}}" + " ".join(parts))

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {a.width}
PlayResY: {a.height}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Rail,{a.font},{a.size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,{a.outline},3,5,40,40,0,204

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    out = Path(a.out) if a.out else Path(a.json).with_name("subs.ass")
    out.write_text(header + "\n".join(lines) + "\n")
    print(f"-> {out}: {len(chunks)} фраз, {len(words)} слов\n")
    for ch in chunks:
        print(f"{ch[0][1]:6.2f}  " + " ".join(w[0] for w in ch))


# ---------- preview / burn ----------

def ass_filter(ass):
    # путь в фильтре ffmpeg: экранируем двоеточия и кавычки
    p = str(Path(ass).resolve()).replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")
    return f"ass='{p}'"


def cmd_preview(a):
    video = Path(a.video)
    outdir = video.with_name("_preview")
    outdir.mkdir(exist_ok=True)
    for t in a.times:
        png = outdir / f"t{t}.png"
        # -copyts: ass видит исходное время, а не ноль после -ss
        run(["ffmpeg", "-y", "-v", "error", "-ss", str(t), "-copyts", "-i", str(video),
             "-vf", ass_filter(a.ass), "-frames:v", "1", str(png)])
        print(f"-> {png}")


def cmd_burn(a):
    video = Path(a.video)
    out = Path(a.out) if a.out else video.with_name(f"{video.stem} — субтитры.mp4")
    run(["ffmpeg", "-y", "-v", "error", "-i", str(video), "-vf", ass_filter(a.ass),
         "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
         "-c:a", "copy", "-movflags", "+faststart", str(out)])
    print(f"-> {out}")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("transcribe")
    s.add_argument("video")
    s.add_argument("--out")
    s.add_argument("--lang", default="ru")
    s.set_defaults(fn=cmd_transcribe)

    s = sub.add_parser("build")
    s.add_argument("json")
    s.add_argument("--out")
    s.add_argument("--fixes", help="файл правок «было => стало»")
    s.add_argument("--y", type=int, default=735, help="центр строки по вертикали, px")
    s.add_argument("--width", type=int, default=1080)
    s.add_argument("--height", type=int, default=1920)
    s.add_argument("--font", default="Inter Display ExtraBold")
    s.add_argument("--size", type=int, default=64)
    s.add_argument("--outline", type=int, default=5)
    s.add_argument("--accent", default="#FFD700", help="цвет активного слова; '' — без подсветки")
    s.add_argument("--max-chars", type=int, default=20)
    s.add_argument("--max-words", type=int, default=4)
    s.add_argument("--gap", type=float, default=0.35, help="пауза, после которой новая фраза, с")
    s.set_defaults(fn=cmd_build)

    s = sub.add_parser("preview")
    s.add_argument("video")
    s.add_argument("ass")
    s.add_argument("times", nargs="+", type=float)
    s.set_defaults(fn=cmd_preview)

    s = sub.add_parser("burn")
    s.add_argument("video")
    s.add_argument("ass")
    s.add_argument("--out")
    s.set_defaults(fn=cmd_burn)

    a = p.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
