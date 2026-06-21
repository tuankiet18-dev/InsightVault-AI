"""Provider interface for text generation models."""

from dataclasses import dataclass
from typing import Protocol

import google.generativeai as genai
import httpx

from core.config import current_chat_model_name, settings


class ChatModelProvider(Protocol):
    @property
    def model_name(self) -> str:
        """Return the configured provider model name."""

    def generate_text(self, prompt: str) -> str:
        """Generate a text response for a single prompt."""


@dataclass
class GeminiChatProvider:
    model_name: str

    def __post_init__(self) -> None:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self._model = genai.GenerativeModel(self.model_name)

    def generate_text(self, prompt: str) -> str:
        response = self._model.generate_content(prompt)
        return response.text.strip()


@dataclass
class GroqChatProvider:
    model_name: str

    def generate_text(self, prompt: str) -> str:
        if not settings.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is required when CHAT_PROVIDER=groq")

        response = httpx.post(
            f"{settings.GROQ_BASE_URL.rstrip('/')}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model_name,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": settings.CHAT_TEMPERATURE,
            },
            timeout=60.0,
        )
        response.raise_for_status()
        payload = response.json()
        return payload["choices"][0]["message"]["content"].strip()


def create_chat_provider(model_name: str | None = None) -> ChatModelProvider:
    provider = settings.CHAT_PROVIDER
    
    # Auto-detect provider from model name if provided
    if model_name:
        model_name = model_name.strip()
        if model_name.startswith("models/"):
            model_name = model_name[7:]
            
        name_lower = model_name.lower()
        if "gemini" in name_lower:
            provider = "gemini"
        elif any(keyword in name_lower for keyword in ["llama", "mixtral", "gemma", "groq"]):
            provider = "groq"

    if provider == "gemini":
        return GeminiChatProvider(model_name or settings.GEMINI_CHAT_MODEL)
    if provider == "groq":
        return GroqChatProvider(model_name or settings.GROQ_CHAT_MODEL)
    raise ValueError(f"Unsupported CHAT_PROVIDER: {provider}")


chat_model = create_chat_provider()


def get_chat_model(model_name: str | None = None) -> ChatModelProvider:
    normalized_model_name = model_name.strip() if model_name else None
    if not normalized_model_name or normalized_model_name == chat_model.model_name:
        return chat_model
    return create_chat_provider(normalized_model_name)


def get_chat_model_name(model_name: str | None = None) -> str:
    return model_name.strip() if model_name else current_chat_model_name()
