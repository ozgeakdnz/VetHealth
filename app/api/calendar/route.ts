import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const petId = searchParams.get("petId");
    const month = searchParams.get("month"); // YYYY-MM

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "month parametresi YYYY-MM formatında olmalıdır." }, { status: 400 });
    }

    const [yearText, monthText] = month.split("-");
    const year = Number(yearText);
    const monthIndex = Number(monthText) - 1;
    const monthStart = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
    const monthEnd = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));
    const whereByPet = petId ? { petId } : undefined;
    const [events, reminders] = await Promise.all([
      prisma.vaccination.findMany({
        where: {
          ...(whereByPet ?? {}),
          date: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        orderBy: { date: "asc" },
      }),
      prisma.vaccination.findMany({
        where: {
          ...(whereByPet ?? {}),
        },
        orderBy: { date: "desc" },
        take: 6,
      }),
    ]);

    return NextResponse.json({ events, reminders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Takvim verileri alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      petId?: string;
      name?: string;
      date?: string;
      notes?: string;
      status?: string;
    };

    const petId = (body.petId ?? "").trim();
    const name = (body.name ?? "").trim();
    const dateText = (body.date ?? "").trim();
    const notes = (body.notes ?? "").trim();
    const status = body.status === "COMPLETED" ? "COMPLETED" : "PENDING";
    const parsedDate = new Date(dateText);

    if (!petId) {
      return NextResponse.json({ error: "Profil seçimi zorunludur." }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Aşı adı zorunludur." }, { status: 400 });
    }
    if (!dateText || Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Tarih geçersiz." }, { status: 400 });
    }

    const pet = await prisma.pet.findUnique({ where: { id: petId }, select: { id: true } });
    if (!pet) {
      return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
    }

    let event:
      | {
          id: string;
          petId: string;
          name: string;
          date: Date;
          status: "COMPLETED" | "PENDING";
          notes?: string | null;
        }
      | undefined;

    try {
      event = await prisma.vaccination.create({
        data: {
          petId,
          name,
          date: parsedDate,
          status: status as "COMPLETED" | "PENDING",
          notes: notes || null,
        },
      }) as typeof event;
    } catch {
      // Backward-compatible fallback for stale Prisma client/runtime.
      event = await prisma.vaccination.create({
        data: {
          petId,
          name,
          date: parsedDate,
          status: status as "COMPLETED" | "PENDING",
        },
      }) as typeof event;
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Hatırlatıcı eklenemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
