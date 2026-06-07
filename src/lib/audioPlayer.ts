"use client";

let currentAudio: HTMLAudioElement | null = null;

export function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

export async function playBase64Audio(
  base64: string,
  mimeType = "audio/wav",
  onEnd?: () => void
): Promise<HTMLAudioElement> {
  stopCurrentAudio();
  const audio = new Audio(`data:${mimeType};base64,${base64}`);
  currentAudio = audio;
  audio.onended = () => {
    if (currentAudio === audio) currentAudio = null;
    onEnd?.();
  };
  audio.onerror = () => {
    if (currentAudio === audio) currentAudio = null;
    onEnd?.();
  };
  await audio.play();
  return audio;
}
