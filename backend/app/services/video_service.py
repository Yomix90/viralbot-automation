import subprocess
import os
import asyncio
import json
import structlog
from typing import List, Optional, Dict

from app.core.config import settings

logger = structlog.get_logger()

class VideoProcessingService:
    TARGET_WIDTH = 1080
    TARGET_HEIGHT = 1920
    
    async def process_video(self, input_path: str, output_path: str, transcript_segments: Optional[List[Dict]] = None, add_progress_bar: bool = True, target_duration: Optional[int] = None) -> str:
        loop = asyncio.get_event_loop()
        temp_path = output_path.replace(".mp4", "_temp.mp4")
        await loop.run_in_executor(None, self._convert_to_vertical, input_path, temp_path, target_duration)
        if transcript_segments:
            captioned_path = temp_path.replace("_temp", "_captioned")
            await loop.run_in_executor(None, self._add_dynamic_captions, temp_path, captioned_path, transcript_segments)
            os.rename(captioned_path, temp_path)
        if add_progress_bar:
            pb_path = temp_path.replace("_temp", "_pb")
            await loop.run_in_executor(None, self._add_progress_bar, temp_path, pb_path)
            os.rename(pb_path, temp_path)
        await loop.run_in_executor(None, self._optimize_for_tiktok, temp_path, output_path)
        if os.path.exists(temp_path): os.remove(temp_path)
        return output_path
    
    def _convert_to_vertical(self, input_path: str, output_path: str, target_duration: Optional[int] = None):
        probe_result = subprocess.run(["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", input_path], capture_output=True, text=True)
        info = json.loads(probe_result.stdout)
        video_stream = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
        if not video_stream: raise ValueError("No video stream found")
        src_w, src_h = int(video_stream["width"]), int(video_stream["height"])
        target_crop_w = int(src_h * 9 / 16)
        if target_crop_w <= src_w:
            vf_filter = f"crop={target_crop_w}:{src_h}:{(src_w - target_crop_w) // 2}:0,scale={self.TARGET_WIDTH}:{self.TARGET_HEIGHT},fps=30"
        else:
            vf_filter = f"scale={self.TARGET_WIDTH}:-2,pad={self.TARGET_WIDTH}:{self.TARGET_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black,fps=30"
        cmd = ["ffmpeg", "-y", "-i", input_path, "-vf", vf_filter, "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "128k"]
        if target_duration: cmd.extend(["-t", str(target_duration)])
        cmd.append(output_path)
        subprocess.run(cmd, check=True)
    
    def _add_dynamic_captions(self, input_path: str, output_path: str, segments: List[Dict]):
        filters = []
        for seg in segments:
            text = seg.get("text", "").strip().replace("'", "\\'").replace(":", "\\:").replace(",", "\\,")
            if not text: continue
            filters.append(f"drawtext=text='{text}':fontsize=52:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.75:enable='between(t,{seg['start']},{seg['end']})':box=1:boxcolor=black@0.4:boxborderw=10")
        if not filters:
            import shutil
            shutil.copy2(input_path, output_path)
            return
        subprocess.run(["ffmpeg", "-y", "-i", input_path, "-vf", ",".join(filters), "-c:v", "libx264", "-preset", "fast", "-c:a", "copy", output_path], check=False)
    
    def _add_progress_bar(self, input_path: str, output_path: str):
        probe_result = subprocess.run(["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", input_path], capture_output=True, text=True)
        duration = float(json.loads(probe_result.stdout)["format"].get("duration", 60))
        vf = f"drawbox=x=0:y=ih-8:w=iw:h=8:color=white@0.3:t=fill,drawbox=x=0:y=ih-8:w='iw*t/{duration}':h=8:color=#FF0050:t=fill"
        subprocess.run(["ffmpeg", "-y", "-i", input_path, "-vf", vf, "-c:v", "libx264", "-preset", "fast", "-c:a", "copy", output_path], check=False)
    
    def _optimize_for_tiktok(self, input_path: str, output_path: str):
        cmd = ["ffmpeg", "-y", "-i", input_path, "-c:v", "libx264", "-profile:v", "high", "-level", "4.0", "-pix_fmt", "yuv420p", "-b:v", "4000k", "-r", "30", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-vf", f"scale={self.TARGET_WIDTH}:{self.TARGET_HEIGHT}", output_path]
        subprocess.run(cmd, check=True)

video_processor = VideoProcessingService()
