#!/bin/zsh
# Сборка ролика: ./build.sh V1 "<ролик> — монтаж 1"   (переменные: SUBS=subs.ass, FACE="475,435", FACEW=229, END=<проект визитки>)
# Remotion-рендер → субтитры ($SUBS) → [визитка из последнего кадра, если задан END] → ../<имя>.mp4
set -e
ID=$1; NAME=$2
cd "${0:A:h}"
END="${END:-}"   # необязательно: папка Remotion-проекта визитки с композицией Iris
SUBS="${SUBS:-subs.ass}"; FACE="${FACE:-475,435}"; FACEW="${FACEW:-229}"
SK="${0:A:h}/subs.py"
mkdir -p out
PROPS=()
# Mix берёт выбор с монтажного стола
[ "$ID" = Mix ] && PROPS=(--props="$(python3 -c 'import json;print(json.dumps({"choices":json.load(open("стол/selection.json"))["choices"]}))')")
npx remotion render src/index.ts $ID out/$ID.mp4 --crf=16 --log=error --concurrency=4 "${PROPS[@]}"
python3 $SK burn out/$ID.mp4 $SUBS --out out/$ID-subs.mp4
if [ -z "$END" ]; then
  # без визитки: готовый ролик = версия с субтитрами
  cp out/$ID-subs.mp4 "../$NAME.mp4"
else
  ffmpeg -v error -y -sseof -0.1 -i out/$ID-subs.mp4 -update 1 -frames:v 1 "$END/public/last-$ID.png"
  # FACE — центр лица в последнем кадре (между глаз), FACEW — ширина лица; смотреть по кадру с сеткой
  (cd "$END" && npx remotion render src/index.ts Iris out/iris-$ID.mp4 --crf=14 --muted --log=error \
    --props="{\"last\":\"last-$ID.png\",\"face\":[$FACE],\"faceW\":$FACEW}")
  ffmpeg -v error -y -i out/$ID-subs.mp4 -i "$END/out/iris-$ID.mp4" -filter_complex \
   "[0:v]fps=30000/1001,setsar=1,format=yuv420p[a];[1:v]fps=30000/1001,setsar=1,format=yuv420p[b];[a][b]concat=n=2:v=1:a=0[v];[0:a]apad[au]" \
   -map "[v]" -map "[au]" -shortest -c:v libx264 -crf 17 -preset slow -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart \
   "../$NAME.mp4"
fi
ffprobe -v error -show_entries format=duration -of csv=p=0 "../$NAME.mp4"
