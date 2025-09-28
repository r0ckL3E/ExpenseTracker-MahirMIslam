#!/bin/bash
#type ./skeleton.sh
find . \( -type d \( -name node_modules -o -name dist -o -name build -o -name .next \) -print -prune \) -o \( -path "*/.git/objects/*" -prune \) -o -print > layout.txt
echo "✅ Project skeleton saved to layout.txt"