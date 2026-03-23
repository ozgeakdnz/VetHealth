import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const VALID_SEVERITIES = new Set(["LOW", "MEDIUM", "HIGH"]);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const petId = searchParams.get("petId");
    const limitParam = Number(searchParams.get("limit") ?? "10");
    const offsetParam = Number(searchParams.get("offset") ?? "0");
    const take = Number.isNaN(limitParam) ? 10 : Math.min(Math.max(limitParam, 1), 50);
    const skip = Number.isNaN(offsetParam) ? 0 : Math.max(offsetParam, 0);

    const where = petId ? { petId } : undefined;
    const [items, total] = await Promise.all([
      prisma.symptomLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.symptomLog.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      hasMore: skip + items.length < total,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Belirti kayıtları alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      petId?: string;
      symptom?: string;
      description?: string;
      severity?: string;
      createdAt?: string;
    };

    const petId = (body.petId ?? "").trim();
    const symptom = (body.symptom ?? "").trim();
    const severity = (body.severity ?? "").trim();
    const description = (body.description ?? "").trim();
    const parsedDate = body.createdAt ? new Date(body.createdAt) : new Date();

    if (!petId) {
      return NextResponse.json({ error: "Profil seçimi zorunludur." }, { status: 400 });
    }
    if (!symptom) {
      return NextResponse.json({ error: "Belirti türü zorunludur." }, { status: 400 });
    }
    if (!VALID_SEVERITIES.has(severity)) {
      return NextResponse.json({ error: "Şiddet seviyesi geçersiz." }, { status: 400 });
    }
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Tarih geçersiz." }, { status: 400 });
    }

    const exists = await prisma.pet.findUnique({
      where: { id: petId },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Seçilen profil bulunamadı." }, { status: 404 });
    }

    const item = await prisma.symptomLog.create({
      data: {
        petId,
        symptom,
        description: description || null,
        severity: severity as "LOW" | "MEDIUM" | "HIGH",
        createdAt: parsedDate,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Belirti kaydı oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
