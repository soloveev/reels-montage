#!/bin/zsh
# Сборка вставки: ./build-ins.sh I1A 1 "вставка 1A — скриншоты"  (субтитры subs-ins<N>.ass, результат в ../вставки/)
# Remotion-рендер → субтитры subs-ins<N>.ass → ../новые добавление/варианты/<имя>.mp4
set -e
ID=$1; N=$2; NAME=$3
cd "${0:A:h}"
SK="${0:A:h}/subs.py"
mkdir -p out "../вставки"
npx remotion render src/index.ts $ID out/$ID.mp4 --crf=16 --log=error --concurrency=4
python3 $SK burn out/$ID.mp4 subs-ins$N.ass --out "../вставки/$NAME.mp4"
ffprobe -v error -show_entries format=duration -of csv=p=0 "../вставки/$NAME.mp4"
