import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, ctx: RouteContext<"/api/calendar/[id]">) {
  const { id } = await ctx.params;

  try {
    const body = (await req.json()) as {
      status?: string;
    };

    const status = body.status === "COMPLETED" ? "COMPLETED" : "PENDING";

    const event = await prisma.vaccination.update({
      where: { id },
      data: { status: status as "COMPLETED" | "PENDING" },
    });

    return NextResponse.json({ event });
  } catch {
    return NextResponse.json({ error: "Hatırlatıcı güncellenemedi." }, { status: 404 });
  }
}
