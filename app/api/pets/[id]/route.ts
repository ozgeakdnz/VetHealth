import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const VALID_SPECIES = new Set(["CAT", "DOG", "BIRD"]);
const VALID_GENDERS = new Set(["MALE", "FEMALE", "UNKNOWN"]);

export async function GET(_req: Request, ctx: RouteContext<"/api/pets/[id]">) {
  try {
    const { id } = await ctx.params;
    const pet = await prisma.pet.findUnique({ where: { id } });

    if (!pet) {
      return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ pet });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayıt alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/pets/[id]">) {
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    name?: string;
    species?: string;
    breed?: string;
    imageUrl?: string;
    gender?: string;
    birthDate?: string;
    weight?: number | string;
    ownerId?: string;
  };

  const data: {
    name?: string;
    species?: "CAT" | "DOG" | "BIRD";
    breed?: string | null;
    imageUrl?: string | null;
    gender?: "MALE" | "FEMALE" | "UNKNOWN";
    birthDate?: Date | null;
    weight?: number | null;
    ownerId?: string;
  } = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "İsim boş olamaz." }, { status: 400 });
    }
    data.name = name;
  }

  if (body.ownerId !== undefined) {
    const ownerId = body.ownerId.trim();
    if (!ownerId) {
      return NextResponse.json({ error: "Sahip kimliği boş olamaz." }, { status: 400 });
    }
    data.ownerId = ownerId;
  }

  if (body.species !== undefined) {
    if (!VALID_SPECIES.has(body.species)) {
      return NextResponse.json({ error: "Geçersiz tür." }, { status: 400 });
    }
    data.species = body.species as "CAT" | "DOG" | "BIRD";
  }

  if (body.gender !== undefined) {
    if (!VALID_GENDERS.has(body.gender)) {
      return NextResponse.json({ error: "Geçersiz cinsiyet." }, { status: 400 });
    }
    data.gender = body.gender as "MALE" | "FEMALE" | "UNKNOWN";
  }

  if (body.breed !== undefined) {
    data.breed = body.breed.trim() || null;
  }

  if (body.imageUrl !== undefined) {
    data.imageUrl = body.imageUrl.trim() || null;
  }

  if (body.weight !== undefined) {
    if (body.weight === "" || body.weight === null) {
      data.weight = null;
    } else {
      const parsedWeight = Number(body.weight);
      if (Number.isNaN(parsedWeight)) {
        return NextResponse.json({ error: "Ağırlık sayısal olmalıdır." }, { status: 400 });
      }
      data.weight = parsedWeight;
    }
  }

  if (body.birthDate !== undefined) {
    if (!body.birthDate) {
      data.birthDate = null;
    } else {
      const parsedBirthDate = new Date(body.birthDate);
      if (Number.isNaN(parsedBirthDate.getTime())) {
        return NextResponse.json({ error: "Doğum tarihi geçersiz." }, { status: 400 });
      }
      data.birthDate = parsedBirthDate;
    }
  }

  try {
    const pet = await prisma.pet.update({
      where: { id },
      data,
    });

    return NextResponse.json({ pet });
  } catch {
    return NextResponse.json({ error: "Kayıt güncellenemedi." }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/pets/[id]">) {
  const { id } = await ctx.params;

  try {
    await prisma.pet.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Kayıt silinemedi." }, { status: 404 });
  }
}
