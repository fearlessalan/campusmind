interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

export function convertToWav(rawData: string, mimeType: string): Buffer {
  const options = parseMimeType(mimeType);
  const wavHeader = createWavHeader(rawData.length, options);
  const buffer = Buffer.from(rawData, "base64");
  return Buffer.concat([wavHeader, buffer]);
}

function parseMimeType(mimeType: string): WavConversionOptions {
  const [fileType, ...params] = mimeType.split(";").map((s) => s.trim());
  const [, format] = fileType.split("/");

  const options: Partial<WavConversionOptions> = { numChannels: 1, sampleRate: 24000, bitsPerSample: 16 };

  if (format?.startsWith("L")) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) options.bitsPerSample = bits;
  }

  for (const param of params) {
    const [key, value] = param.split("=").map((s) => s.trim());
    if (key === "rate") options.sampleRate = parseInt(value, 10);
  }

  return options as WavConversionOptions;
}

function createWavHeader(dataLength: number, options: WavConversionOptions): Buffer {
  const { numChannels, sampleRate, bitsPerSample } = options;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = Buffer.alloc(44);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

export function normalizeGeminiAudio(inlineData: { data?: string; mimeType?: string }): {
  base64Audio: string;
  mimeType: string;
} {
  const mimeType = inlineData.mimeType || "audio/wav";
  const raw = inlineData.data || "";

  if (mimeType.includes("wav")) {
    return { base64Audio: raw, mimeType: "audio/wav" };
  }

  const wavBuffer = convertToWav(raw, mimeType);
  return { base64Audio: wavBuffer.toString("base64"), mimeType: "audio/wav" };
}
