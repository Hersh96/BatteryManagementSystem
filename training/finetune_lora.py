from __future__ import annotations

import argparse

from datasets import load_dataset
from peft import LoraConfig
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from trl import SFTTrainer


def main() -> None:
    parser = argparse.ArgumentParser(description="Fine-tune a small LLM for battery diagnostic reports.")
    parser.add_argument("--model", default="Qwen/Qwen3-0.6B")
    parser.add_argument("--dataset", default="training/data/battery_reports.jsonl")
    parser.add_argument("--output", default="training/output/battery-lora")
    parser.add_argument("--epochs", type=float, default=2)
    parser.add_argument("--batch-size", type=int, default=1)
    args = parser.parse_args()

    dataset = load_dataset("json", data_files=args.dataset, split="train")
    tokenizer = AutoTokenizer.from_pretrained(args.model, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        args.model,
        device_map="auto",
        trust_remote_code=True,
    )

    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    )

    training_args = TrainingArguments(
        output_dir=args.output,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=8,
        learning_rate=2e-4,
        logging_steps=10,
        save_steps=100,
        fp16=True,
        report_to="none",
    )

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        peft_config=lora_config,
        args=training_args,
        formatting_func=format_example,
    )
    trainer.train()
    trainer.save_model(args.output)
    tokenizer.save_pretrained(args.output)
    print(f"Saved LoRA adapter to {args.output}")


def format_example(example: dict[str, str]) -> str:
    return (
        "### Instruction\n"
        f"{example['instruction']}\n\n"
        "### Input\n"
        f"{example['input']}\n\n"
        "### Response\n"
        f"{example['output']}"
    )


if __name__ == "__main__":
    main()

