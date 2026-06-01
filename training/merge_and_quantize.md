# Merge and Quantize Notes

Fine-tuning produces a LoRA adapter. For Raspberry Pi deployment, merge the adapter into the base model, convert to GGUF, and quantize.

Typical flow on a Linux machine:

```bash
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp
cmake -B build
cmake --build build --config Release
```

Use Hugging Face/PEFT to merge the adapter, then convert:

```bash
python llama.cpp/convert_hf_to_gguf.py merged-battery-model --outfile battery-model-f16.gguf
./llama.cpp/build/bin/llama-quantize battery-model-f16.gguf battery-model-q4_k_m.gguf Q4_K_M
```

Run on Raspberry Pi:

```bash
./llama.cpp/build/bin/llama-server -m battery-model-q4_k_m.gguf --host 0.0.0.0 --port 8080
BATTERY_AI_LLM_PROVIDER=llama.cpp BATTERY_AI_MODEL=battery-model-q4_k_m python -m edge_battery_ai.server
```

