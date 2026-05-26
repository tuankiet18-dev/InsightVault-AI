"""
Gemini SDK client singleton.
All services import `gemini_client` from here.
"""

import google.generativeai as genai
from core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

# Chat/generation model
gemini_chat_model = genai.GenerativeModel(settings.GEMINI_CHAT_MODEL)
