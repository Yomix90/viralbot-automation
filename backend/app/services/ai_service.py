import google.generativeai as genai
from openai import AsyncOpenAI
from typing import List, Dict, Optional, Tuple
import structlog
import json
import asyncio
import os

from app.core.config import settings

logger = structlog.get_logger()
genai.configure(api_key=settings.GEMINI_API_KEY)
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

class AIService:
    async def _generate_text_gemini(self, prompt: str, json_mode: bool = True) -> str:
        loop = asyncio.get_event_loop()
        def _run():
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                generation_config=genai.GenerationConfig(
                    temperature=0.8,
                    response_mime_type="application/json" if json_mode else "text/plain",
                    max_output_tokens=2048,
                ),
            )
            return model.generate_content(prompt).text
        return await loop.run_in_executor(None, _run)

    async def _generate_text(self, prompt: str, json_mode: bool = True, temperature: float = 0.8) -> str:
        if settings.AI_PROVIDER == "gemini" or not settings.OPENAI_API_KEY:
            return await self._generate_text_gemini(prompt, json_mode)
        else:
            response = await openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                response_format={"type": "json_object"} if json_mode else None,
            )
            return response.choices[0].message.content

    async def transcribe_audio(self, audio_path: str, language: Optional[str] = None) -> Dict:
        try:
            return await self._transcribe_gemini(audio_path, language)
        except Exception:
            if openai_client: return await self._transcribe_whisper(audio_path, language)
            raise

    async def _transcribe_gemini(self, audio_path: str, language: Optional[str] = None) -> Dict:
        loop = asyncio.get_event_loop()
        def _run():
            uploaded = genai.upload_file(audio_path)
            import time
            while uploaded.state.name == "PROCESSING":
                time.sleep(2)
                uploaded = genai.get_file(uploaded.name)
            prompt = ("Transcribe this accurately. Return JSON: "
                      '{"text": "...", "language": "...", "segments": [{"start": 0.0, "end": 5.0, "text": "..."}]}')
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            response = model.generate_content([uploaded, prompt], generation_config=genai.GenerationConfig(response_mime_type="application/json", max_output_tokens=8192))
            try: genai.delete_file(uploaded.name)
            except: pass
            return response.text
        raw = await loop.run_in_executor(None, _run)
        try:
            data = json.loads(raw)
            return {"text": data.get("text", ""), "segments": data.get("segments", []), "language": data.get("language", language or "fr")}
        except:
            return {"text": raw, "segments": [], "language": language or "fr"}

    async def _transcribe_whisper(self, audio_path: str, language: Optional[str] = None) -> Dict:
        with open(audio_path, "rb") as audio_file:
            transcript = await openai_client.audio.transcriptions.create(model="whisper-1", file=audio_file, response_format="verbose_json", timestamp_granularities=["segment"], language=language)
        return {"text": transcript.text, "segments": [{"id": i, "start": seg.start, "end": seg.end, "text": seg.text.strip()} for i, seg in enumerate(transcript.segments or [])], "language": getattr(transcript, "language", language or "fr")}

    async def generate_tiktok_content(self, transcript: str, video_title: str, channel: str = "", language: str = "fr") -> Dict:
        prompt = f"Expert viral TikTok. Analyse YouTube: TITLE: {video_title} CHANNEL: {channel} TRANSCRIPT: {transcript[:2000]}. Return JSON: {{tiktok_title, hook, description, hashtags, summary, emotional_tone, viral_potential, suggested_duration}}"
        try:
            raw = await self._generate_text(prompt, json_mode=True)
            raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            return json.loads(raw)
        except Exception:
            return self._default_content(video_title)

    async def analyze_emotions(self, transcript: str) -> Dict:
        prompt = f"Analyze emotions. Return JSON: {{dominant_emotion, emotions: {{positive, negative, neutral}}, engagement_prediction, content_type}}. Text: {transcript[:1000]}"
        try:
            raw = await self._generate_text(prompt, json_mode=True, temperature=0.3)
            raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            return json.loads(raw)
        except Exception:
            return {"dominant_emotion": "neutral", "emotions": {"positive": 50, "negative": 10, "neutral": 40}, "engagement_prediction": 5, "content_type": "entertainment"}

    async def translate_content(self, text: str, target_language: str = "fr") -> str:
        prompt = f"Traduis en {target_language}. Uniquement la traduction:\n\n{text}"
        try:
            return (await self._generate_text(prompt, json_mode=False)).strip()
        except:
            return text

    def _default_content(self, title: str) -> Dict:
        return {"tiktok_title": f"🔥 {title[:80]}", "hook": "Tu ne vas pas croire ça !", "description": f"{title[:200]} 🔥", "hashtags": ["viral", "trending"], "summary": title, "emotional_tone": "energetic", "viral_potential": 6, "suggested_duration": 60}

ai_service = AIService()
