import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function formatDate(date: Date) {
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export async function GET(_req: Request, ctx: RouteContext<"/api/pets/[id]/summary">) {
  const { id } = await ctx.params;

  try {
    const [pet, lastVaccine, upcoming] = await Promise.all([
      prisma.pet.findUnique({
        where: { id },
        select: { id: true, weight: true },
      }),
      prisma.vaccination.findFirst({
        where: { petId: id, status: "COMPLETED" },
        orderBy: { date: "desc" },
      }),
      prisma.vaccination.findFirst({
        where: { petId: id, date: { gte: new Date() } },
        orderBy: { date: "asc" },
      }),
    ]);

    if (!pet) {
      return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
    }

    const summary = {
      lastVaccine: lastVaccine
        ? `${lastVaccine.name} - ${formatDate(lastVaccine.date)}`
        : "Henüz tamamlanan aşı kaydı yok",
      weightStatus:
        pet.weight != null
          ? `Güncel ağırlık: ${pet.weight.toFixed(1)} kg`
          : "Ağırlık kaydı henüz girilmedi",
      upcomingAppointment: upcoming
        ? `${upcoming.name} - ${formatDate(upcoming.date)}`
        : "Yaklaşan randevu/aşı kaydı yok",
    };

    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ error: "Sağlık özeti alınamadı." }, { status: 500 });
  }
}
