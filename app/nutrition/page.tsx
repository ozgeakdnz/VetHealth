 "use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bolt, Info, Pencil, PlusCircle, Salad, Sun, UtensilsCrossed } from "lucide-react";

type Pet = {
  id: string;
  name: string;
  weight: number | null;
  birthDate: string | null;
};

type NutritionItem = {
  id: string;
  petId: string;
  foodName: string;
  amount: string;
  frequency: number;
  feedTime: string;
  status: "COMPLETED" | "PENDING";
  notes: string | null;
};

function parseAmount(amount: string) {
  const match = amount.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function getIconByTime(feedTime: string) {
  const hour = Number(feedTime.split(":")[0] ?? "0");
  if (Number.isNaN(hour)) return <UtensilsCrossed className="h-4 w-4 text-teal-700" />;
  if (hour < 12) return <UtensilsCrossed className="h-4 w-4 text-teal-700" />;
  if (hour < 17) return <Sun className="h-4 w-4 text-amber-500" />;
  return <Salad className="h-4 w-4 text-emerald-700" />;
}

export default function NutritionPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [items, setItems] = useState<NutritionItem[]>([]);
  const [focus, setFocus] = useState("Kilo Koruma");
  const [mealCount, setMealCount] = useState(3);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewMealForm, setShowNewMealForm] = useState(false);
  const [newMeal, setNewMeal] = useState({
    feedTime: "08:30",
    amount: "120 gr",
    foodName: "Royal Canin Adult",
    status: "PENDING" as "COMPLETED" | "PENDING",
    notes: "",
  });

  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId) ?? null,
    [pets, selectedPetId],
  );

  const fetchMeals = useCallback(async (petId: string) => {
    const res = await fetch(`/api/nutrition?petId=${petId}`, { cache: "no-store" });
    const data = (await res.json()) as { items?: NutritionItem[]; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Öğün verileri alınamadı.");
    setItems(data.items ?? []);
  }, []);

  const loadInitial = useCallback(async () => {
    setError(null);
    try {
      const petsRes = await fetch("/api/pets", { cache: "no-store" });
      const petsData = (await petsRes.json()) as { pets?: Pet[]; error?: string };
      if (!petsRes.ok) throw new Error(petsData.error ?? "Profil verileri alınamadı.");
      const list = petsData.pets ?? [];
      setPets(list);
      const firstPetId = list[0]?.id ?? "";
      setSelectedPetId(firstPetId);
      if (firstPetId) await fetchMeals(firstPetId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Veriler alınamadı.");
    }
  }, [fetchMeals]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  async function handlePetChange(petId: string) {
    setSelectedPetId(petId);
    setError(null);
    setNotice(null);
    if (!petId) {
      setItems([]);
      return;
    }
    try {
      await fetchMeals(petId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Öğün verileri alınamadı.");
    }
  }

  async function handleAddMeal() {
    if (!selectedPetId) {
      setError("Önce bir profil oluşturmalısın.");
      return;
    }
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petId: selectedPetId,
          foodName: newMeal.foodName,
          amount: newMeal.amount,
          frequency: mealCount,
          feedTime: newMeal.feedTime,
          status: newMeal.status,
          notes: newMeal.notes || focus,
        }),
      });
      const data = (await res.json()) as { item?: NutritionItem; error?: string };
      if (!res.ok || !data.item) throw new Error(data.error ?? "Öğün eklenemedi.");
      setItems((prev) => [...prev, data.item!].sort((a, b) => a.feedTime.localeCompare(b.feedTime)));
      setNotice("Yeni öğün eklendi.");
      setShowNewMealForm(false);
      setNewMeal({
        feedTime: "08:30",
        amount: "120 gr",
        foodName: "Royal Canin Adult",
        status: "PENDING",
        notes: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Öğün eklenemedi.");
    }
  }

  async function toggleMealStatus(item: NutritionItem) {
    setError(null);
    setNotice(null);
    try {
      const nextStatus = item.status === "COMPLETED" ? "PENDING" : "COMPLETED";
      const res = await fetch(`/api/nutrition/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = (await res.json()) as { item?: NutritionItem; error?: string };
      if (!res.ok || !data.item) throw new Error(data.error ?? "Öğün güncellenemedi.");
      setItems((prev) => prev.map((m) => (m.id === data.item!.id ? data.item! : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Öğün güncellenemedi.");
    }
  }

  async function applyPlan() {
    if (!selectedPetId) return;
    setNotice("Plan güncellendi.");
    setError(null);
    await fetchMeals(selectedPetId);
  }

  const bazKalori = selectedPet?.weight ? Math.round(30 * selectedPet.weight + 70) : 1240;
  const odakKatsayısı = focus === "Kilo Verme" ? 0.9 : focus === "Kilo Alma" ? 1.1 : 1;
  const öğünKatsayısı = mealCount === 2 ? 0.95 : mealCount === 4 ? 1.05 : 1;
  const günlükHedef = Math.max(Math.round(bazKalori * odakKatsayısı * öğünKatsayısı), 300);
  const tüketilen = items
    .filter((item) => item.status === "COMPLETED")
    .reduce((sum, item) => sum + parseAmount(item.amount), 0);
  const kalan = Math.max(günlükHedef - tüketilen, 0);
  const oran = Math.min(Math.round((tüketilen / günlükHedef) * 100), 100);
  const uzmanTavsiyesi =
    focus === "Kilo Verme"
      ? `Evcil hayvanın kilo kontrolü için öğünler düzenli saatlerde verilmeli, günlük hareket süresi artırılmalı ve öğün sayısı ${mealCount} olarak korunmalıdır.`
      : focus === "Kilo Alma"
        ? `Evcil hayvanın kilo alımını desteklemek için enerji yoğunluğu daha yüksek öğünler tercih edilmeli, protein oranı artırılmalı ve öğün sayısı ${mealCount} olarak planlanmalıdır.`
        : `Evcil hayvanın kilosu dengede tutmak için mevcut öğün planına sadık kalınmalı, su tüketimi takip edilmeli ve günlük aktivite seviyesi düzenli sürdürülmelidir.`;

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900">Beslenme Tablosu</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            Pati dostunuzun sağlıklı gelişimi için günlük kalori ve öğün planlamasını buradan yönetin.
          </p>
        </div>
        <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Aktif Profil</p>
          <select
            value={selectedPetId}
            onChange={(e) => void handlePetChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none ring-teal-500 transition focus:ring-2"
          >
            {pets.length === 0 ? <option value="">Profil bulunamadı</option> : null}
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}
      {notice && <p className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm text-teal-700">{notice}</p>}

      <div className="mt-8 grid gap-7 xl:grid-cols-[320px_1fr]">
        <div className="space-y-5">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.5)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Günlük Hedef</p>
                <p className="mt-2 text-5xl font-bold leading-none text-teal-700">
                  {günlükHedef} <span className="text-xl font-medium text-slate-600">kcal</span>
                </p>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                <Bolt className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-slate-500">Kalan:</span>
              <span className="font-semibold text-slate-900">{kalan} kcal</span>
            </div>

            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-gradient-to-r from-teal-700 via-teal-500 to-cyan-300" style={{ width: `${oran}%` }} />
            </div>

            <p className="mt-4 text-xs italic leading-5 text-slate-500">
              Evcil hayvanın kilosu ve aktivite seviyesine göre optimize edilmiştir.
            </p>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.5)]">
            <h3 className="text-3xl font-semibold text-slate-900">Diyet Hedefleri</h3>

            <label className="mt-6 block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Haftalık Odak</span>
              <select
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none ring-teal-500 transition focus:ring-2"
              >
                <option>Kilo Koruma</option>
                <option>Kilo Verme</option>
                <option>Kilo Alma</option>
              </select>
            </label>

            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Öğün Sayısı</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMealCount(2)}
                  className={`h-10 rounded-lg border text-sm font-semibold ${
                    mealCount === 2
                      ? "border-teal-600 bg-teal-700 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  2
                </button>
                <button
                  type="button"
                  onClick={() => setMealCount(3)}
                  className={`h-10 rounded-lg border text-sm font-semibold ${
                    mealCount === 3
                      ? "border-teal-600 bg-teal-700 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  3
                </button>
                <button
                  type="button"
                  onClick={() => setMealCount(4)}
                  className={`h-10 rounded-lg border text-sm font-semibold ${
                    mealCount === 4
                      ? "border-teal-600 bg-teal-700 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  4
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void applyPlan()}
              className="mt-7 h-12 w-full rounded-full bg-gradient-to-r from-teal-700 via-teal-500 to-cyan-300 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition hover:brightness-105"
            >
              Planı Güncelle
            </button>
          </section>
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.5)]">
          <div className="flex items-center justify-between">
            <h3 className="text-4xl font-semibold text-slate-900">Öğün Zamanlayıcı</h3>
            <button
              type="button"
              onClick={() => setShowNewMealForm((prev) => !prev)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
            >
              <PlusCircle className="h-4 w-4" />
              Yeni Öğün Ekle
            </button>
          </div>

          {showNewMealForm ? (
            <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
              <input
                type="time"
                value={newMeal.feedTime}
                onChange={(e) => setNewMeal((prev) => ({ ...prev, feedTime: e.target.value }))}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
              />
              <input
                type="text"
                value={newMeal.amount}
                onChange={(e) => setNewMeal((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="Miktar (ör. 120 gr)"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
              />
              <input
                type="text"
                value={newMeal.foodName}
                onChange={(e) => setNewMeal((prev) => ({ ...prev, foodName: e.target.value }))}
                placeholder="Mama markası"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
              />
              <select
                value={newMeal.status}
                onChange={(e) =>
                  setNewMeal((prev) => ({ ...prev, status: e.target.value as "COMPLETED" | "PENDING" }))
                }
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
              >
                <option value="PENDING">Bekliyor</option>
                <option value="COMPLETED">Tamamlandı</option>
              </select>
              <input
                type="text"
                value={newMeal.notes}
                onChange={(e) => setNewMeal((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Not (opsiyonel)"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 md:col-span-2"
              />
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => void handleAddMeal()}
                  className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  Öğünü Kaydet
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                <tr>
                  <th className="py-3">Zaman</th>
                  <th className="py-3">Miktar (gr)</th>
                  <th className="py-3">Mama Markası</th>
                  <th className="py-3">Durum</th>
                  <th className="py-3 text-right">Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {items.map((öğün) => {
                  const tamamlandı = öğün.status === "COMPLETED";
                  const durum = tamamlandı ? "Tamamlandı" : "Bekliyor";
                  const durumRenk = tamamlandı ? "text-teal-700" : "text-slate-400";
                  const noktaRenk = tamamlandı ? "bg-teal-600" : "bg-slate-300";

                  return (
                  <tr key={öğün.id} className="border-t border-slate-100">
                    <td className="py-5">
                      <div className="flex items-center gap-3 text-xl font-semibold text-slate-900">
                        {getIconByTime(öğün.feedTime)}
                        {öğün.feedTime}
                      </div>
                    </td>
                    <td className="py-5 text-lg text-slate-700">{öğün.amount}</td>
                    <td className="py-5">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold text-teal-800">{öğün.foodName}</span>
                    </td>
                    <td className="py-5">
                      <span className={`inline-flex items-center gap-2 text-sm font-medium ${durumRenk}`}>
                        <span className={`h-2 w-2 rounded-full ${noktaRenk}`} />
                        {durum}
                      </span>
                    </td>
                    <td className="py-5 text-right">
                      <button
                        type="button"
                        onClick={() => void toggleMealStatus(öğün)}
                        className="text-slate-500 transition hover:text-slate-800"
                      >
                        <Pencil className="ml-auto h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-3xl border border-amber-100 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white">
                <Info className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-2xl font-semibold text-amber-900">Uzman Tavsiyesi</h4>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900/90">
                  {uzmanTavsiyesi}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
