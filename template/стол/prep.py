"""Готовит медиа для монтажного стола по scenes.json: лёгкие полные версии, кусочки по сценам, кадры, data.json.

Запуск из папки стола: python3 prep.py [scenes.json]
scenes.json (пример — scenes.example.json):
  title, duration, words (путь к words.json с таймингами слов),
  versions: [{name, short, file}]   — file: ролик версии с субтитрами, БЕЗ визитки (обычно ../out/V<i>-subs.mp4)
  rows:     [{start, end, full, desc: ["что внизу в версии 0", "в версии 1", …]}]
"""
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
MEDIA = HERE / "media"
FPS = 30000 / 1001


def snap(t):
    return round(t * FPS) / FPS


def ff(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def full_lowres(src, v):
    # лёгкая полная версия для проигрывателя сборки: частые ключевые кадры для точной перемотки
    ff("-i", src, "-vf", "scale=432:768", "-c:v", "libx264", "-crf", "27", "-preset", "veryfast",
       "-g", "10", "-an", "-movflags", "+faststart", str(MEDIA / f"v{v}.mp4"))


def clip(src, v, i, a, b):
    base = MEDIA / "clips" / f"r{i + 1:02d}-v{v}"
    ff("-ss", f"{a:.4f}", "-i", src, "-t", f"{b - a:.4f}", "-vf", "scale=432:768", "-c:v", "libx264", "-crf", "25",
       "-preset", "veryfast", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", f"{base}.mp4")
    ff("-ss", f"{a + (b - a) * 0.55:.4f}", "-i", src, "-frames:v", "1", "-vf", "scale=540:960", "-q:v", "3", f"{base}.jpg")
    # полоска из трёх кадров нижней зоны (строки 812–1919)
    for j, p in enumerate((0.2, 0.5, 0.85)):
        ff("-ss", f"{a + (b - a) * p:.4f}", "-i", src, "-frames:v", "1", "-vf", "crop=1080:1108:0:812,scale=240:-2", "-q:v", "4",
           f"{base}-s{j}.jpg")


def main():
    cfg_path = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "scenes.json"
    cfg = json.loads(cfg_path.read_text())
    (MEDIA / "clips").mkdir(parents=True, exist_ok=True)
    words = json.loads((cfg_path.parent / cfg["words"]).read_text()) if cfg.get("words") else []
    srcs = [str((cfg_path.parent / v["file"]).resolve()) for v in cfg["versions"]]
    rows, jobs = [], []
    with ThreadPoolExecutor(max_workers=6) as ex:
        for v, src in enumerate(srcs):
            jobs.append(ex.submit(full_lowres, src, v))
        for i, r in enumerate(cfg["rows"]):
            a, b = snap(r["start"]), snap(min(r["end"], cfg["duration"]))
            text = " ".join(w for w, s, e in words if a <= (s + e) / 2 < b)
            rows.append({"n": i + 1, "start": round(a, 3), "end": round(b, 3), "full": r.get("full", False), "text": text,
                         "variants": [{"v": v, "desc": r["desc"][v] if v < len(r["desc"]) else ""} for v in range(len(srcs))]})
            for v, src in enumerate(srcs):
                jobs.append(ex.submit(clip, src, v, i, a, b))
        for j in jobs:
            j.result()
    # звук сборки — из версии 0 (у всех версий он одинаковый)
    ff("-i", srcs[0], "-vn", "-c:a", "aac", "-b:a", "160k", str(MEDIA / "voice.m4a"))
    versions = [{"id": i, "name": v["name"], "short": v.get("short", v["name"])} for i, v in enumerate(cfg["versions"])]
    data = {"title": cfg["title"], "duration": cfg["duration"], "versions": versions, "rows": rows, "default": [None] * len(rows)}
    (HERE / "data.json").write_text(json.dumps(data, ensure_ascii=False, indent=1))
    print(f"ok: {len(rows)} сцен × {len(srcs)} версий → data.json, media/")


if __name__ == "__main__":
    main()
