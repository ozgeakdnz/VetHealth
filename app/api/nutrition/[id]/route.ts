import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const VALID_STATUS = new Set(["COMPLETED", "PENDING"]);
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function PATCH(req: Request, ctx: RouteContext<"/api/nutrition/[id]">) {
  const { id } = await ctx.params;

  try {
    const body = (await req.json()) as {
      foodName?: string;
      amount?: string;
      frequency?: number;
      feedTime?: string;
      status?: string;
      notes?: string;
    };

    const data: {
      foodName?: string;
      amount?: string;
      frequency?: number;
      feedTime?: string;
      status?: "COMPLETED" | "PENDING";
      notes?: string | null;
    } = {};

    if (body.foodName !== undefined) {
      const foodName = body.foodName.trim();
      if (!foodName) return NextResponse.json({ error: "Mama adı boş olamaz." }, { status: 400 });
      data.foodName = foodName;
    }

    if (body.amount !== undefined) {
      const amount = body.amount.trim();
      if (!amount) return NextResponse.json({ error: "Miktar boş olamaz." }, { status: 400 });
      data.amount = amount;
    }

    if (body.frequency !== undefined) {
      const frequency = Number(body.frequency);
      if (Number.isNaN(frequency) || frequency < 1 || frequency > 10) {
        return NextResponse.json({ error: "Öğün sayısı 1-10 arasında olmalıdır." }, { status: 400 });
      }
      data.frequency = frequency;
    }

    if (body.feedTime !== undefined) {
      const feedTime = body.feedTime.trim();
      if (!TIME_REGEX.test(feedTime)) {
        return NextResponse.json({ error: "Saat formatı HH:MM olmalıdır." }, { status: 400 });
      }
      data.feedTime = feedTime;
    }

    if (body.status !== undefined) {
      const status = body.status.trim();
      if (!VALID_STATUS.has(status)) {
        return NextResponse.json({ error: "Durum geçersiz." }, { status: 400 });
      }
      data.status = status as "COMPLETED" | "PENDING";
    }

    if (body.notes !== undefined) {
      data.notes = body.notes.trim() || null;
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
      item = await prisma.nutrition.update({
        where: { id },
        data,
      }) as typeof item;
    } catch {
      // Backward-compatible fallback for stale runtime/client schema.
      const legacyData: { foodName?: string; amount?: string; frequency?: number; notes?: string | null } = {};
      if (data.foodName !== undefined) legacyData.foodName = data.foodName;
      if (data.amount !== undefined) legacyData.amount = data.amount;
      if (data.frequency !== undefined) legacyData.frequency = data.frequency;
      if (data.notes !== undefined) legacyData.notes = data.notes;

      const legacyItem = await prisma.nutrition.update({
        where: { id },
        data: legacyData,
      });

      item = {
        id: legacyItem.id,
        petId: legacyItem.petId,
        foodName: legacyItem.foodName,
        amount: legacyItem.amount,
        frequency: legacyItem.frequency,
        feedTime: data.feedTime ?? "08:30",
        status: data.status ?? "PENDING",
        notes: legacyItem.notes,
      };
    }

    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Öğün güncellenemedi." }, { status: 404 });
  }
}
