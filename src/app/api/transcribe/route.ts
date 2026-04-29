import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";

const supportedMimePrefixes = ["audio/", "video/"];
const fakeDelayMs = 1200;

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function POST(request: Request) {
  await requireSession();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  }

  const isSupported = supportedMimePrefixes.some((prefix) => file.type.startsWith(prefix));

  if (!isSupported) {
    return NextResponse.json(
      { error: "Поддерживаются только аудио и видео файлы" },
      { status: 415 }
    );
  }

  await delay(fakeDelayMs);

  return NextResponse.json({
    transcript:
      "Имитация Whisper: встреча подтверждена, ключевой риск связан со сроками SLA, следующий шаг назначен ответственному.",
    file: {
      name: file.name,
      type: file.type,
      size: file.size
    }
  });
}
