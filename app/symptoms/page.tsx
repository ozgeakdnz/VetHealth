 "use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, PlusCircle, TriangleAlert } from "lucide-react";

type Pet = { id: string; name: string };
type SymptomItem = {
  id: string;
  symptom: string;
  description: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
};

type GörselSeviye = "Düşük" | "Orta" | "Yüksek";
type RenkAnahtarı = "kırmızı" | "sarı" | "yeşil";

function toInputDate(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toViewDate(dateText: string) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return dateText;
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function mapSeverityToView(severity: SymptomItem["severity"]): { seviye: GörselSeviye; renk: RenkAnahtarı } {
  if (severity === "HIGH") return { seviye: "Yüksek", renk: "kırmızı" };
  if (severity === "MEDIUM") return { seviye: "Orta", renk: "sarı" };
  return { seviye: "Düşük", renk: "yeşil" };
}

const seviyeStilleri = {
  kırmızı: {
    kutu: "border-red-200 bg-white",
    kenar: "border-l-4 border-l-red-500",
    rozet: "bg-red-100 text-red-700",
    ikon: <AlertCircle className="h-5 w-5 text-red-600" />,
  },
  sarı: {
    kutu: "border-amber-200 bg-white",
    kenar: "border-l-4 border-l-amber-500",
    rozet: "bg-amber-100 text-amber-700",
    ikon: <TriangleAlert className="h-5 w-5 text-amber-500" />,
  },
  yeşil: {
    kutu: "border-emerald-200 bg-white",
    kenar: "border-l-4 border-l-emerald-500",
    rozet: "bg-emerald-100 text-emerald-700",
    ikon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  },
} as const;

export default function SymptomsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [items, setItems] = useState<SymptomItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    date: toInputDate(new Date()),
    symptom: "Kusma",
    severity: "LOW" as SymptomItem["severity"],
    description: "",
  });

  const loadLogs = useCallback(async (petId: string, startOffset: number, append: boolean) => {
    const res = await fetch(`/api/symptoms?petId=${petId}&limit=5&offset=${startOffset}`, {
      cache: "no-store",
    });
    const data = (await res.json()) as {
      items?: SymptomItem[];
      hasMore?: boolean;
      error?: string;
    };
    if (!res.ok) throw new Error(data.error ?? "Belirti kayıtları alınamadı.");

    const nextItems = data.items ?? [];
    setItems((prev) => (append ? [...prev, ...nextItems] : nextItems));
    setOffset(startOffset + nextItems.length);
    setHasMore(Boolean(data.hasMore));
  }, []);

  const loadPetsAndInitialLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const petsRes = await fetch("/api/pets", { cache: "no-store" });
      const petsData = (await petsRes.json()) as { pets?: Pet[]; error?: string };
      if (!petsRes.ok) throw new Error(petsData.error ?? "Profil verileri alınamadı.");

      const allPets = petsData.pets ?? [];
      setPets(allPets);

      const firstPetId = allPets[0]?.id ?? "";
      setSelectedPetId(firstPetId);

      if (firstPetId) {
        await loadLogs(firstPetId, 0, false);
      } else {
        setItems([]);
        setOffset(0);
        setHasMore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Veriler yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }, [loadLogs]);

  useEffect(() => {
    void loadPetsAndInitialLogs();
  }, [loadPetsAndInitialLogs]);

  async function handlePetChange(petId: string) {
    setSelectedPetId(petId);
    setError(null);
    setNotice(null);
    if (!petId) return;
    try {
      await loadLogs(petId, 0, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Belirti kayıtları alınamadı.");
    }
  }

  async function handleSave() {
    if (!selectedPetId) {
      setError("Önce bir profil ekleyin veya seçin.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const createdAt = form.date ? new Date(`${form.date}T00:00:00`).toISOString() : new Date().toISOString();
      const res = await fetch("/api/symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petId: selectedPetId,
          symptom: form.symptom,
          severity: form.severity,
          description: form.description,
          createdAt,
        }),
      });
      const data = (await res.json()) as { item?: SymptomItem; error?: string };
      if (!res.ok || !data.item) throw new Error(data.error ?? "Kayıt oluşturulamadı.");

      setItems((prev) => [data.item!, ...prev]);
      setOffset((prev) => prev + 1);
      setForm((prev) => ({ ...prev, description: "" }));
      setNotice("Belirti kaydı eklendi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt sırasında hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLoadMore() {
    if (!selectedPetId || !hasMore) return;
    setIsLoadingMore(true);
    setError(null);
    try {
      await loadLogs(selectedPetId, offset, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Daha fazla kayıt alınamadı.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  const geçmişKayıtlar = useMemo(
    () =>
      items.map((item) => {
        const mapped = mapSeverityToView(item.severity);
        return {
          id: item.id,
          zaman: toViewDate(item.createdAt),
          başlık: item.symptom,
          açıklama: item.description ?? "Açıklama eklenmedi.",
          seviye: mapped.seviye,
          renk: mapped.renk,
        };
      }),
    [items],
  );

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header>
        <h2 className="text-4xl font-bold tracking-tight text-slate-900">Belirti Günlüğü</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-600">
          Pati dostunuzun sağlık durumunu düzenli olarak takip ederek veteriner hekiminize en doğru bilgiyi sunabilirsiniz.
        </p>
      </header>

      <div className="mt-8 grid gap-8 xl:grid-cols-[340px_1fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)]">
          <h3 className="flex items-center gap-3 text-3xl font-semibold text-slate-900">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 text-teal-700">
              <PlusCircle className="h-6 w-6" />
            </span>
            Yeni Belirti Ekle
          </h3>

          {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}
          {notice && <p className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm text-teal-700">{notice}</p>}

          <form
            className="mt-7 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Profil</span>
              <select
                value={selectedPetId}
                onChange={(e) => void handlePetChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none ring-teal-500 transition focus:ring-2"
              >
                {pets.length === 0 ? <option value="">Profil bulunamadı</option> : null}
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Tarih</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none ring-teal-500 transition focus:ring-2"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Belirti Türü</span>
              <select
                value={form.symptom}
                onChange={(e) => setForm((prev) => ({ ...prev, symptom: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none ring-teal-500 transition focus:ring-2"
              >
                <option>Kusma</option>
                <option>İştahsızlık</option>
                <option>Halsizlik</option>
                <option>Öksürük</option>
              </select>
            </label>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Şiddet Seviyesi</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, severity: "LOW" }))}
                  className="rounded-xl border border-emerald-200 bg-emerald-100 px-2 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200"
                >
                  Düşük
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, severity: "MEDIUM" }))}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-2 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                >
                  Orta
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, severity: "HIGH" }))}
                  className="rounded-xl border border-red-200 bg-red-50 px-2 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Yüksek
                </button>
              </div>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Notlar (Opsiyonel)</span>
              <textarea
                rows={4}
                placeholder="Eklemek istediğiniz detaylar..."
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none ring-teal-500 transition focus:ring-2"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="h-12 w-full rounded-full bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-400 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition hover:brightness-105"
            >
              {isSubmitting ? "Kaydediliyor..." : "Kaydı Kaydet"}
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-3xl font-semibold text-slate-900">Geçmiş Kayıtlar</h3>
            <a
              href={`/api/symptoms/export${selectedPetId ? `?petId=${selectedPetId}` : ""}`}
              className="text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Tümünü İndir (PDF)
            </a>
          </div>

          <div className="mt-6 space-y-5">
            {geçmişKayıtlar.map((kayıt) => {
              const stiller = seviyeStilleri[kayıt.renk];

              return (
                <article key={kayıt.id} className="grid grid-cols-[30px_1fr] gap-4">
                  <div className="mt-2 flex items-start justify-center">{stiller.ikon}</div>
                  <div className={`rounded-3xl border p-5 ${stiller.kutu} ${stiller.kenar}`}>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-semibold tracking-wide text-slate-500">{kayıt.zaman}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stiller.rozet}`}>{kayıt.seviye}</span>
                    </div>
                    <h4 className="mt-2 text-2xl font-semibold text-slate-900">{kayıt.başlık}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{kayıt.açıklama}</p>
                  </div>
                </article>
              );
            })}
            {!isLoading && geçmişKayıtlar.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Henüz kayıt yok.</p>
            ) : null}
          </div>

          <div className="mt-7 flex justify-center">
            <button
              type="button"
              onClick={() => void handleLoadMore()}
              disabled={!hasMore || isLoadingMore}
              className="rounded-full border border-slate-200 bg-slate-50 px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              {isLoadingMore ? "Yükleniyor..." : "Daha Fazla Kayıt Yükle"}
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
