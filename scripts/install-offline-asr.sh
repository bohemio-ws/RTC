#!/usr/bin/env bash
# RTC Academy - preparar dependencias de voz para servirlas desde el mismo origen.
# Ejecutar desde la raíz del repositorio: bash scripts/install-offline-asr.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
command -v npm >/dev/null || { echo "Falta Node.js/npm"; exit 1; }
command -v python3 >/dev/null || { echo "Falta Python 3"; exit 1; }
mkdir -p modular/vendor modular/models/Xenova/whisper-tiny/onnx
TEMP="$(mktemp -d)"
trap 'rm -rf "$TEMP"' EXIT
cd "$TEMP"
npm init -y >/dev/null
npm install --no-audit --no-fund @huggingface/transformers@3.8.1 esbuild
./node_modules/.bin/esbuild node_modules/@huggingface/transformers/src/transformers.js --bundle --format=esm --platform=browser --target=es2022 --outfile="$ROOT/modular/vendor/transformers.min.js" --minify
# ONNX Runtime WASM se carga desde el mismo servidor, sin CDN.
find node_modules/onnxruntime-web/dist -maxdepth 1 -type f \( -name '*.wasm' -o -name '*.mjs' \) -exec cp {} "$ROOT/modular/vendor/" \;
python3 -m pip install --disable-pip-version-check huggingface_hub
export RTC_MODEL_DIR="$ROOT/modular/models/Xenova/whisper-tiny"
python3 - <<'PY'
import os
from huggingface_hub import snapshot_download
snapshot_download(
 repo_id="Xenova/whisper-tiny",
 local_dir=os.environ["RTC_MODEL_DIR"],
 allow_patterns=["*.json","onnx/*quantized.onnx","onnx/*q8.onnx"],
)
PY
test -s "$ROOT/modular/vendor/transformers.min.js" || { echo "ERROR: runtime JS ausente"; exit 1; }
find "$ROOT/modular/vendor" -name "*.wasm" -size +0c | grep -q . || { echo "ERROR: runtime WASM ausente"; exit 1; }
find "$RTC_MODEL_DIR/onnx" -name "*.onnx" -size +0c | grep -q . || { echo "ERROR: modelos ONNX ausentes"; exit 1; }
echo "Archivos locales descargados. Pendiente verificar carga y transcripción en navegador real."
