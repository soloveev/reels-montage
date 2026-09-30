"""Перемонтаж говорящей головы по списку отрезков и поиск тишины для склеек.

  python3 recut.py silence <видео> <t0> <t1>
      печатает участки тишины (громкость ниже -45 dBFS, от 0,05 с) — по ним ставить склейки,
      а не по таймингам whisper (он ставит слова на 0,15–0,2 с раньше звука)

  python3 recut.py cut <видео> <whisper.json> '<EDL>' --name A [--fixes fixes.txt] [--caps '[0,1]'] [--out .]
      EDL — [[начало, конец], …] в секундах исходника, границы снапятся к кадрам 29,97.
      На выходе: <name>-raw.mp4 (склейка с фейдами звука 12 мс), <name>.ass (субтитры subs.py,
      одобренный текст переносится на новую шкалу), <name>-words.json (тайминги слов +0,15 с — для анимаций).
      --caps: номера отрезков, у которых первое слово надо сделать заглавным (новое начало фразы).

Проверять каждый отрезок повторным распознаванием: whisper-cli на вырезанном куске.
"""
import argparse
import array
import json
import math
import subprocess
import sys
import types

sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))  # subs.py лежит рядом
import subs  # noqa: E402

FPS = 30000 / 1001
snap = lambda t: round(t * FPS) / FPS  # noqa: E731


def cmd_silence(a):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(a.t0), "-to", str(a.t1), "-i", a.video, "-ac", "1", "-ar", "16000",
                          "-f", "s16le", "-"], capture_output=True, check=True).stdout
    x = array.array('h', raw)
    W = 160
    db = [20 * math.log10(math.sqrt(sum(v * v for v in x[i:i + W]) / W) / 32768 + 1e-9) for i in range(0, len(x) - W, W)]
    runs, st = [], None
    for i, d in enumerate(db + [0]):
        if d < -45 and st is None:
            st = i
        elif d >= -45 and st is not None:
            if i - st >= 5:
                runs.append((round(a.t0 + st / 100, 2), round(a.t0 + i / 100, 2)))
            st = None
    print("тишина:", runs or "нет")


def cmd_cut(a):
    segs = [(snap(x), snap(y)) for x, y in json.loads(a.edl)]
    caps = json.loads(a.caps)
    parts = []
    for i, (x, y) in enumerate(segs):
        d = y - x
        parts.append(f"[0:v]trim={x:.5f}:{y:.5f},setpts=PTS-STARTPTS[v{i}];"
                     f"[0:a]atrim={x:.5f}:{y:.5f},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={d - 0.012:.5f}:d=0.012[a{i}];")
    fc = "".join(parts) + "".join(f"[v{i}][a{i}]" for i in range(len(segs))) + f"concat=n={len(segs)}:v=1:a=1[v][a]"
    raw = f"{a.out}/{a.name}-raw.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.video, "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
                    "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", raw], check=True)
    words = subs.apply_fixes(subs.load_words(a.whisper), subs.load_fixes(a.fixes))
    new, off = [], 0.0
    for i, (x, y) in enumerate(segs):
        # слово относится к отрезку по середине, с поправкой на ранние тайминги whisper
        seg = [[t, max(0, s - x) + off, min(e, y) - x + off] for t, s, e in words if x <= (s + e) / 2 + 0.2 < y]
        while seg and seg[0][0] == "—":
            seg.pop(0)
        if i in caps and seg:
            seg[0][0] = seg[0][0][0].upper() + seg[0][0][1:]
        new += seg
        off += y - x
    json.dump([[t, round(s + 0.15, 2), round(e + 0.15, 2)] for t, s, e in new], open(f"{a.out}/{a.name}-words.json", "w"), ensure_ascii=False)
    subs.load_words = lambda p: [list(w) for w in new]
    subs.apply_fixes = lambda w, f: w
    subs.cmd_build(types.SimpleNamespace(json="x", out=f"{a.out}/{a.name}.ass", fixes=None, y=735, width=1080, height=1920,
                                         font="Inter Display ExtraBold", size=64, outline=5, accent="#FFD700", max_chars=20, max_words=4, gap=0.35))
    print("длительность:", round(off, 3))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("silence")
    s.add_argument("video"); s.add_argument("t0", type=float); s.add_argument("t1", type=float)
    s.set_defaults(func=cmd_silence)
    s = sub.add_parser("cut")
    s.add_argument("video"); s.add_argument("whisper"); s.add_argument("edl")
    s.add_argument("--name", required=True); s.add_argument("--fixes"); s.add_argument("--caps", default="[]"); s.add_argument("--out", default=".")
    s.set_defaults(func=cmd_cut)
    a = p.parse_args()
    a.func(a)


if __name__ == "__main__":
    main()
