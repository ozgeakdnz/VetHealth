import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Boş dosya yüklenemez." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Sadece görsel veya PDF yükleyebilirsin." }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
    const safeExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, "");
    const fileName = `${randomUUID()}${safeExt}`;
    const filePath = path.join(uploadDir, fileName);
    const bytes = Buffer.from(await file.arrayBuffer());

    await writeFile(filePath, bytes);

    return NextResponse.json({
      fileUrl: `/uploads/${fileName}`,
      mimeType: file.type,
      fileName: file.name,
    });
  } catch {
    return NextResponse.json({ error: "Dosya yükleme başarısız oldu." }, { status: 500 });
  }
}
