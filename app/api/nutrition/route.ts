import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const VALID_STATUS = new Set(["COMPLETED", "PENDING"]);
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const petId = searchParams.get("petId");

    const where = petId ? { petId } : undefined;
    let items: Array<{
      id: string;
      petId: string;
      foodName: string;
      amount: string;
      frequency: number;
      feedTime: string;
      status: "COMPLETED" | "PENDING";
      notes: string | null;
    }> = [];

    try {
      items = await prisma.nutrition.findMany({
        where,
        orderBy: [{ feedTime: "asc" }, { createdAt: "asc" }],
      }) as typeof items;
    } catch {
      // Backward-compatible fallback for stale runtime/client schema.
      const legacyItems = await prisma.nutrition.findMany({ where });
      items = legacyItems.map((item) => ({
        id: item.id,
        petId: item.petId,
        foodName: item.foodName,
        amount: item.amount,
        frequency: item.frequency,
        feedTime: "08:30",
        status: "PENDING",
        notes: item.notes,
      }));
    }

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beslenme kayıtları alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      petId?: string;
      foodName?: string;
      amount?: string;
      frequency?: number;
      feedTime?: string;
      status?: string;
      notes?: string;
    };

    const petId = (body.petId ?? "").trim();
    const foodName = (body.foodName ?? "").trim();
    const amount = (body.amount ?? "").trim();
    const feedTime = (body.feedTime ?? "").trim();
    const status = (body.status ?? "PENDING").trim();
    const frequency = Number(body.frequency ?? 1);
    const notes = (body.notes ?? "").trim();

    if (!petId) {
      return NextResponse.json({ error: "Profil seçimi zorunludur." }, { status: 400 });
    }
    if (!foodName) {
      return NextResponse.json({ error: "Mama adı zorunludur." }, { status: 400 });
    }
    if (!amount) {
      return NextResponse.json({ error: "Miktar zorunludur." }, { status: 400 });
    }
    if (!TIME_REGEX.test(feedTime)) {
      return NextResponse.json({ error: "Saat formatı HH:MM olmalıdır." }, { status: 400 });
    }
    if (!VALID_STATUS.has(status)) {
      return NextResponse.json({ error: "Durum geçersiz." }, { status: 400 });
    }
    if (Number.isNaN(frequency) || frequency < 1 || frequency > 10) {
      return NextResponse.json({ error: "Öğün sayısı 1-10 arasında olmalıdır." }, { status: 400 });
    }

    const pet = await prisma.pet.findUnique({ where: { id: petId }, select: { id: true } });
    if (!pet) {
      return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
    }

    let item:
      | {
          id: string;
          petId: string;
          foodName: string;
          amount: string;
          frequency: number;
          feedTime: string;
          status: "COMPLETED" | "PENDING";
          notes: string | null;
        }
      | undefined;

    try {
      item = await prisma.nutrition.create({
        data: {
          petId,
          foodName,
          amount,
          frequency,
          feedTime,
          status: status as "COMPLETED" | "PENDING",
          notes: notes || null,
        },
      }) as typeof item;
    } catch {
      // Backward-compatible fallback for stale runtime/client schema.
      const legacyItem = await prisma.nutrition.create({
        data: {
          petId,
          foodName,
          amount,
          frequency,
          notes: notes || null,
        },
      });
      item = {
        id: legacyItem.id,
        petId: legacyItem.petId,
        foodName: legacyItem.foodName,
        amount: legacyItem.amount,
        frequency: legacyItem.frequency,
        feedTime,
        status: status as "COMPLETED" | "PENDING",
        notes: legacyItem.notes,
      };
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Öğün eklenemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
