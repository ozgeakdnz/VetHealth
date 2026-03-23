"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  Plus,
  ShieldCheck,
  Syringe,
  UserRoundCog,
  Weight,
} from "lucide-react";
import Image from "next/image";

type Pet = {
  id: string;
  name: string;
  species: "CAT" | "DOG" | "BIRD";
  breed: string | null;
  gender: "MALE" | "FEMALE" | "UNKNOWN";
  birthDate: string | null;
  weight: number | null;
  ownerId: string;
};

async function readApiResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  const text = await res.text();
  throw new Error(text.slice(0, 180) || "Sunucu JSON yerine farklı bir yanıt döndürdü.");
}

const summaryItems = [
  {
    icon: Syringe,
    title: "Son Aşı",
    key: "lastVaccine",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Weight,
    title: "Kilo Durumu",
    key: "weightStatus",
    color: "bg-amber-100 text-amber-700",
  },
  {
    icon: Calendar,
    title: "Yaklaşan Randevu",
    key: "upcomingAppointment",
    color: "bg-rose-100 text-rose-700",
  },
] as const;

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPolicyDetail, setShowPolicyDetail] = useState(false);
  const [summary, setSummary] = useState({
    lastVaccine: "Yükleniyor...",
    weightStatus: "Yükleniyor...",
    upcomingAppointment: "Yükleniyor...",
  });

  const activePet = useMemo(
    () => pets.find((pet) => pet.id === activePetId) ?? null,
    [activePetId, pets],
  );

  const [form, setForm] = useState({
    name: "",
    breed: "",
    birthDate: "",
    weight: "",
    species: "CAT" as "CAT" | "DOG" | "BIRD",
    gender: "UNKNOWN" as "MALE" | "FEMALE" | "UNKNOWN",
    ownerId: "owner-1",
  });

  useEffect(() => {
    void loadPets();
  }, []);

  useEffect(() => {
    if (!activePet) return;
    setForm({
      name: activePet.name,
      breed: activePet.breed ?? "",
      birthDate: activePet.birthDate ? activePet.birthDate.slice(0, 10) : "",
      weight: activePet.weight?.toString() ?? "",
      species: activePet.species,
      gender: activePet.gender,
      ownerId: activePet.ownerId,
    });
  }, [activePet]);

  useEffect(() => {
    if (!activePetId) {
      setSummary({
        lastVaccine: "Profil seçilmedi",
        weightStatus: "Profil seçilmedi",
        upcomingAppointment: "Profil seçilmedi",
      });
      return;
    }
    void loadSummary(activePetId);
  }, [activePetId]);

  async function loadPets() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pets", { cache: "no-store" });
      const data = await readApiResponse<{ pets?: Pet[]; error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Profil verileri alınamadı.");
      const loadedPets = data.pets ?? [];
      setPets(loadedPets);
      setActivePetId((prev) => {
        if (!prev) return loadedPets[0]?.id ?? null;
        const exists = loadedPets.some((pet) => pet.id === prev);
        return exists ? prev : (loadedPets[0]?.id ?? null);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSummary(petId: string) {
    try {
      const res = await fetch(`/api/pets/${petId}/summary`, { cache: "no-store" });
      const data = await readApiResponse<{
        summary?: {
          lastVaccine: string;
          weightStatus: string;
          upcomingAppointment: string;
        };
        error?: string;
      }>(res);
      if (!res.ok || !data.summary) {
        throw new Error(data.error ?? "Sağlık özeti alınamadı.");
      }
      setSummary(data.summary);
    } catch {
      setSummary({
        lastVaccine: "Aşı özeti alınamadı",
        weightStatus: "Kilo özeti alınamadı",
        upcomingAppointment: "Randevu özeti alınamadı",
      });
    }
  }

  async function handleAddPet() {
    setError(null);
    setNotice(null);
    try {
      const payload = {
        name: `Yeni Pet ${pets.length + 1}`,
        species: "CAT",
        breed: "Belirtilmedi",
        gender: "UNKNOWN",
        birthDate: new Date().toISOString().slice(0, 10),
        weight: 0,
        ownerId: "owner-1",
      };

      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readApiResponse<{ pet?: Pet; error?: string }>(res);

      if (!res.ok || !data.pet) {
        throw new Error(data.error ?? "Yeni profil eklenemedi.");
      }

      setPets((prev) => [data.pet!, ...prev]);
      setActivePetId(data.pet.id);
      setIsEditing(true);
      setNotice("Yeni evcil hayvan profili eklendi. Bilgileri düzenleyebilirsin.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profil ekleme başarısız.");
    }
  }

  async function handleSave() {
    if (!activePet) return;
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch(`/api/pets/${activePet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          breed: form.breed,
          birthDate: form.birthDate,
          weight: form.weight,
          species: form.species,
          gender: form.gender,
          ownerId: form.ownerId,
        }),
      });
      const data = await readApiResponse<{ pet?: Pet; error?: string }>(res);

      if (!res.ok || !data.pet) {
        throw new Error(data.error ?? "Kayıt güncellenemedi.");
      }

      setPets((prev) => prev.map((pet) => (pet.id === data.pet!.id ? data.pet! : pet)));
      setIsEditing(false);
      setNotice("Profil bilgileri başarıyla kaydedildi.");
      await loadSummary(data.pet.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Güncelleme başarısız.");
    } finally {
      setIsSaving(false);
    }
  }

  function handlePolicyClick() {
    setShowPolicyDetail(true);
  }

  const türEtiketi =
    activePet?.species === "CAT" ? "Kedi" : activePet?.species === "DOG" ? "Köpek" : activePet?.species === "BIRD" ? "Kuş" : "-";
  const cinsiyetEtiketi =
    activePet?.gender === "FEMALE"
      ? "Dişi"
      : activePet?.gender === "MALE"
        ? "Erkek"
        : activePet?.gender === "UNKNOWN"
          ? "Bilinmiyor"
          : "-";
  const aktifTür = isEditing ? form.species : activePet?.species;
  const profilResmi =
    aktifTür === "DOG"
      ? "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80"
      : aktifTür === "BIRD"
        ? "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=800&q=80"
        : "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=800&q=80";

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-teal-900">Hayvan Profilleri</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="hidden rounded-full border border-slate-200 bg-white p-2 text-slate-500 sm:inline-flex"
            onClick={() => {
              setNotice("Bildirimler güncellendi.");
              setError(null);
            }}
          >
            <Bell size={16} />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700"
            onClick={() => void handleAddPet()}
          >
            <Plus size={16} />
            Evcil Hayvan Ekle
          </button>
        </div>
      </header>

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {notice && <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">{notice}</p>}

      <article className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          <div className="h-56 overflow-hidden rounded-[2rem] bg-slate-200 sm:h-full">
            <Image
              key={`${activePetId ?? "default-pet-image"}-${aktifTür ?? "CAT"}`}
              src={profilResmi}
              alt={activePet ? `${activePet.name} profil resmi` : "Profil resmi"}
              width={800}
              height={1000}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-4 py-2">
            <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold tracking-wide text-amber-700">
              AKTİF PROFİL
            </span>
            <div className="max-w-xs">
              <select
                value={activePetId ?? ""}
                onChange={(e) => setActivePetId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
              >
                {pets.length === 0 && <option value="">Kayıt bulunamadı</option>}
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <h3 className="text-5xl font-bold tracking-tight text-slate-900">
                {isLoading ? "Yükleniyor..." : activePet?.name ?? "Profil Yok"}
              </h3>
              <p className="mt-1 text-xl text-slate-500">
                {activePet?.breed ?? "Cins belirtilmedi"} • {türEtiketi}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="rounded-2xl bg-slate-100 px-6 py-3">
                <p className="text-xs font-medium text-slate-500">KILO</p>
                <p className="text-3xl font-bold text-teal-700">{activePet?.weight ?? "-"} kg</p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-6 py-3">
                <p className="text-xs font-medium text-slate-500">TÜR</p>
                <p className="text-3xl font-bold text-teal-700">{türEtiketi}</p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-6 py-3">
                <p className="text-xs font-medium text-slate-500">CİNSİYET</p>
                <p className="text-3xl font-bold text-teal-700">{cinsiyetEtiketi}</p>
              </div>
            </div>
          </div>
        </div>
      </article>

      <div className="grid gap-5 xl:grid-cols-[1.9fr_1fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h4 className="text-4xl font-semibold tracking-tight text-slate-900">
              Profil Bilgileri
            </h4>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700"
              onClick={() => setIsEditing((prev) => !prev)}
            >
              <UserRoundCog size={16} />
              {isEditing ? "Düzenlemeyi Kapat" : "Düzenle"}
            </button>
          </div>

          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
          >
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-500">İsim</span>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                disabled={!isEditing || !activePet}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-teal-200"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-500">Cins</span>
              <input
                value={form.breed}
                onChange={(e) => setForm((prev) => ({ ...prev, breed: e.target.value }))}
                disabled={!isEditing || !activePet}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-teal-200"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-500">Doğum Tarihi</span>
              <div className="relative">
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))}
                  disabled={!isEditing || !activePet}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-teal-200"
                />
                <Calendar
                  size={16}
                  className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-slate-400"
                />
              </div>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-500">Ağırlık (kg)</span>
              <input
                type="number"
                step="0.1"
                value={form.weight}
                onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
                disabled={!isEditing || !activePet}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-teal-200"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-500">Tür</span>
              <select
                value={form.species}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, species: e.target.value as "CAT" | "DOG" | "BIRD" }))
                }
                disabled={!isEditing || !activePet}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-teal-200"
              >
                <option value="CAT">Kedi</option>
                <option value="DOG">Köpek</option>
                <option value="BIRD">Kuş</option>
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-500">Cinsiyet</span>
              <select
                value={form.gender}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, gender: e.target.value as "MALE" | "FEMALE" | "UNKNOWN" }))
                }
                disabled={!isEditing || !activePet}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-teal-200"
              >
                <option value="FEMALE">Dişi</option>
                <option value="MALE">Erkek</option>
                <option value="UNKNOWN">Bilinmiyor</option>
              </select>
            </label>
          </form>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              onClick={() => void handleSave()}
              disabled={!isEditing || !activePet || isSaving}
              className="rounded-full bg-teal-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </button>
          </div>
        </article>

        <aside className="space-y-4">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h5 className="text-2xl font-semibold text-slate-900">Sağlık Özeti</h5>
            <div className="mt-4 space-y-4">
              {summaryItems.map(({ icon: Icon, title, key, color }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className={`rounded-xl p-2 ${color}`}>
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-slate-900">{title}</p>
                    <p className="text-sm text-slate-500">{summary[key]}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] bg-teal-700 p-5 text-white shadow-sm">
            <p className="text-xs uppercase tracking-wide text-teal-100">Pet Sigortası</p>
            <h5 className="mt-1 text-3xl font-semibold">Sağlık Poliçesi Aktif</h5>
            <button
              type="button"
              onClick={handlePolicyClick}
              className="mt-2 text-sm text-teal-100 underline underline-offset-4"
            >
              Poliçe detaylarını gör
            </button>
            {showPolicyDetail ? (
              <div className="mt-3 rounded-xl bg-white/15 p-3 text-xs text-teal-50">
                <p className="font-semibold">Poliçe Detayları</p>
                <p className="mt-1">Yıllık rutin kontrol: Dahil</p>
                <p>Acil muayene desteği: Dahil</p>
                <p>İlaç geri ödeme oranı: %60</p>
                <button
                  type="button"
                  onClick={() => setShowPolicyDetail(false)}
                  className="mt-2 rounded-md bg-white/20 px-2 py-1 text-[11px] font-semibold"
                >
                  Kapat
                </button>
              </div>
            ) : null}
            <div className="mt-4 inline-flex rounded-xl bg-teal-600 p-2">
              <ShieldCheck size={20} />
            </div>
          </article>
        </aside>
      </div>

    </section>
  );
}
