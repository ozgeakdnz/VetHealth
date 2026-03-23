import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const petId = searchParams.get("petId");

  const items = await prisma.symptomLog.findMany({
    where: petId ? { petId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      pet: {
        select: { name: true },
      },
    },
  });

  const rows = [
    ["Profil", "Tarih", "Belirti", "Şiddet", "Açıklama"].join(";"),
    ...items.map((item) =>
      [
        item.pet.name,
        item.createdAt.toISOString(),
        item.symptom,
        item.severity,
        (item.description ?? "").replaceAll(";", ","),
      ].join(";"),
    ),
  ];

  const content = rows.join("\n");
  return new Response(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="belirti-kayitlari.csv"',
    },
  });
}
