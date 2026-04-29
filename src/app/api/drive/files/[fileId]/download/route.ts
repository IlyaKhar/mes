import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { downloadFromSupabaseStorage } from "@/lib/storage/supabase-storage";

function getSafeFilename(name: string) {
  return name.replace(/[^\wа-яА-ЯёЁ.\- ]+/g, "_");
}

export async function GET(
  _request: Request,
  { params }: { params: { fileId: string } }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const file = await db.file.findFirst({
    where: {
      id: params.fileId,
      ...(user.role === "ADMIN" ? {} : { owner: { department: user.department } })
    },
    select: {
      name: true,
      kind: true,
      mimeType: true,
      size: true,
      url: true,
      owner: {
        select: { name: true }
      }
    }
  });

  if (!file) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }

  const filename = getSafeFilename(file.name);
  const blob = await downloadFromSupabaseStorage(file.url);
  const arrayBuffer = await blob.arrayBuffer();

  return new Response(arrayBuffer, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": arrayBuffer.byteLength.toString(),
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
