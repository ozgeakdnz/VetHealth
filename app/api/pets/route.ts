import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const VALID_SPECIES = new Set(["CAT", "DOG", "BIRD"]);
const VALID_GENDERS = new Set(["MALE", "FEMALE", "UNKNOWN"]);

export async function GET() {
  try {
    const pets = await prisma.pet.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ pets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profil listesi alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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

    const species = body.species ?? "CAT";
    const gender = body.gender ?? "UNKNOWN";
    const name = (body.name ?? "").trim();
    const ownerId = (body.ownerId ?? "").trim();
    const parsedWeight = body.weight == null || body.weight === "" ? null : Number(body.weight);
    const parsedBirthDate = body.birthDate ? new Date(body.birthDate) : null;

    if (!name) {
      return NextResponse.json({ error: "İsim zorunludur." }, { status: 400 });
    }

    if (!ownerId) {
      return NextResponse.json({ error: "Sahip kimliği zorunludur." }, { status: 400 });
    }

    if (!VALID_SPECIES.has(species)) {
      return NextResponse.json({ error: "Geçersiz tür." }, { status: 400 });
    }

    if (!VALID_GENDERS.has(gender)) {
      return NextResponse.json({ error: "Geçersiz cinsiyet." }, { status: 400 });
    }

    if (parsedWeight != null && Number.isNaN(parsedWeight)) {
      return NextResponse.json({ error: "Ağırlık sayısal olmalıdır." }, { status: 400 });
    }

    if (parsedBirthDate && Number.isNaN(parsedBirthDate.getTime())) {
      return NextResponse.json({ error: "Doğum tarihi geçersiz." }, { status: 400 });
    }

    const pet = await prisma.pet.create({
      data: {
        name,
        species: species as "CAT" | "DOG" | "BIRD",
        breed: body.breed?.trim() || null,
        imageUrl: body.imageUrl?.trim() || null,
        gender: gender as "MALE" | "FEMALE" | "UNKNOWN",
        birthDate: parsedBirthDate,
        weight: parsedWeight,
        ownerId,
      },
    });

    return NextResponse.json({ pet }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Evcil hayvan oluşturulamadı." }, { status: 500 });
  }
}
