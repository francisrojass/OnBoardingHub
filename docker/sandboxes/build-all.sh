#!/bin/bash
# Build all sandbox images from docker/sandboxes/<name>/Dockerfile
# Each folder becomes an image: onboardinghub/<folder-name>:latest
#
# Usage: bash docker/sandboxes/build-all.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔨 Building all sandbox images from $SCRIPT_DIR ..."
echo ""

built=0
for dir in "$SCRIPT_DIR"/*/; do
  [ -d "$dir" ] || continue
  name=$(basename "$dir")
  dockerfile="$dir/Dockerfile"

  if [ ! -f "$dockerfile" ]; then
    echo "⚠️  Skipping $name — no Dockerfile found"
    continue
  fi

  image="onboardinghub/$name"
  echo "📦 Building $image from $dir ..."
  docker build -t "$image" "$dir"
  echo "✅ $image built successfully"
  echo ""
  built=$((built + 1))
done

echo "🏁 Done — $built image(s) built."
