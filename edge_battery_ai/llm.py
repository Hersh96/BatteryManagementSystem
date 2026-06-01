from __future__ import annotations

import json

import requests

from .models import AiReport, SessionSummary


class BatteryReportGenerator:
    def __init__(self, provider: str, model: str, ollama_url: str, llama_cpp_url: str) -> None:
        self.provider = provider
        self.model = model
        self.ollama_url = ollama_url.rstrip("/")
        self.llama_cpp_url = llama_cpp_url.rstrip("/")

    def generate(self, summary: SessionSummary) -> AiReport:
        prompt = build_prompt(summary)
        if self.provider == "ollama":
            return self._ollama(prompt)
        if self.provider == "llama.cpp":
            return self._llama_cpp(prompt)
        return self._offline(summary)

    def _ollama(self, prompt: str) -> AiReport:
        try:
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={"model": self.model, "prompt": prompt, "stream": False},
                timeout=60,
            )
            response.raise_for_status()
            return AiReport(generated_by=f"ollama:{self.model}", report=response.json()["response"].strip())
        except requests.RequestException:
            return AiReport(
                generated_by="offline-fallback",
                report="Local LLM was unavailable, so the deterministic report was used. " + OFFLINE_HELP,
            )

    def _llama_cpp(self, prompt: str) -> AiReport:
        try:
            response = requests.post(
                f"{self.llama_cpp_url}/completion",
                json={"prompt": prompt, "n_predict": 220, "temperature": 0.2},
                timeout=60,
            )
            response.raise_for_status()
            data = response.json()
            return AiReport(generated_by=f"llama.cpp:{self.model}", report=data.get("content", "").strip())
        except requests.RequestException:
            return AiReport(
                generated_by="offline-fallback",
                report="llama.cpp server was unavailable, so the deterministic report was used. " + OFFLINE_HELP,
            )

    def _offline(self, summary: SessionSummary) -> AiReport:
        issue_text = "; ".join(summary.issues)
        recommendation_text = "; ".join(summary.recommendations)
        report = (
            f"Battery health is estimated at {summary.health_percent}% ({summary.status}). "
            f"Measured capacity is {summary.measured_capacity_mah} mAh compared with the rated "
            f"{summary.rated_capacity_mah} mAh, equal to about {summary.equivalent_cycles} full cycles "
            f"of measured throughput in this session. Main finding: {issue_text} "
            f"Recommendation: {recommendation_text}"
        )
        return AiReport(generated_by="offline-rules", report=report)


def build_prompt(summary: SessionSummary) -> str:
    facts = summary.model_dump(mode="json")
    return (
        "You are an edge battery diagnostics assistant running locally on a Raspberry Pi.\n"
        "Use only the provided facts. Do not invent cycle counts, device model, or missing values.\n"
        "Write a concise report with: diagnosis, evidence, and recommendation.\n\n"
        f"Battery diagnostic facts:\n{json.dumps(facts, indent=2)}"
    )


OFFLINE_HELP = (
    "Check whether Ollama is running at BATTERY_AI_OLLAMA_URL or llama.cpp is running at "
    "BATTERY_AI_LLAMA_CPP_URL."
)
