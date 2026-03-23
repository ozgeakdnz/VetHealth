"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, ChevronLeft, ChevronRight, Plus } from "lucide-react";

const günler = ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"];
const ayAdları = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

type Pet = {
  id: string;
  name: string;
  birthDate: string | null;
  breed: string | null;
};

type CalendarEvent = {
  id: string;
  petId: string;
  name: string;
  date: string;
  status: "COMPLETED" | "PENDING";
  notes: string | null;
};

function formatMonthKey(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}`;
}

function pad2(v: number) {
  return `${v}`.padStart(2, "0");
}

function toDateLabel(dateText: string) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return dateText;
  return `${pad2(date.getDate())} ${ayAdları[date.getMonth()].toUpperCase()} • ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function ageLabel(dateText: string | null) {
  if (!dateText) return "-";
  const birth = new Date(dateText);
  if (Number.isNaN(birth.getTime())) return "-";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const passedBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!passedBirthday) age--;
  return `${Math.max(age, 0)} Yaş`;
}

export default function CalendarPage() {
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    name: "Yeni Hatırlatıcı",
    date: "",
    time: "14:30",
    status: "PENDING" as "COMPLETED" | "PENDING",
    notes: "Genel Muayene",
  });

  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId) ?? null,
    [pets, selectedPetId],
  );

  const calendarCells = useMemo(() => {
    const firstDay = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const lastDay = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
    const weekDay = (firstDay.getDay() + 6) % 7;
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - weekDay);

    const cells: Date[] = [];
    for (let i = 0; i < 35; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      cells.push(d);
    }

    if (cells[cells.length - 1] < lastDay) {
      for (let i = 35; i < 42; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        cells.push(d);
      }
    }
    return cells;
  }, [monthCursor]);

  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const d = new Date(event.date);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      map.set(key, [...(map.get(key) ?? []), event]);
    }
    return map;
  }, [events]);

  const loadPets = useCallback(async () => {
    const res = await fetch("/api/pets", { cache: "no-store" });
    const data = (await res.json()) as { pets?: Pet[]; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Profiller alınamadı.");
    const list = data.pets ?? [];
    setPets(list);
    const chosen = selectedPetId && list.some((pet) => pet.id === selectedPetId) ? selectedPetId : (list[0]?.id || "");
    setSelectedPetId(chosen);
    return chosen;
  }, [selectedPetId]);

  const loadCalendar = useCallback(async (petId: string, monthDate: Date) => {
    if (!petId) {
      setEvents([]);
      setReminders([]);
      return;
    }
    const month = formatMonthKey(monthDate);
    const res = await fetch(`/api/calendar?petId=${petId}&month=${month}`, { cache: "no-store" });
    const data = (await res.json()) as { events?: CalendarEvent[]; reminders?: CalendarEvent[]; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Takvim verileri alınamadı.");
    setEvents(data.events ?? []);
    setReminders(data.reminders ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      setError(null);
      try {
        const petId = await loadPets();
        if (petId) await loadCalendar(petId, monthCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Veriler yüklenemedi.");
      }
    })();
  }, [loadPets, loadCalendar, monthCursor]);

  async function onChangePet(petId: string) {
    setSelectedPetId(petId);
    setError(null);
    try {
      await loadCalendar(petId, monthCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Takvim verileri alınamadı.");
    }
  }

  async function addReminder() {
    if (!selectedPetId) {
      setError("Önce profil seçmelisin.");
      return;
    }
    setError(null);
    setNotice(null);
    try {
      const datePart = newReminder.date || `${monthCursor.getFullYear()}-${pad2(monthCursor.getMonth() + 1)}-15`;
      const isoDate = `${datePart}T${newReminder.time || "14:30"}:00`;
      const date = new Date(isoDate);
      if (Number.isNaN(date.getTime())) {
        throw new Error("Tarih veya saat geçersiz.");
      }
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petId: selectedPetId,
          name: newReminder.name,
          date: date.toISOString(),
          notes: newReminder.notes,
          status: newReminder.status,
        }),
      });
      const data = (await res.json()) as { event?: CalendarEvent; error?: string };
      if (!res.ok || !data.event) throw new Error(data.error ?? "Hatırlatıcı eklenemedi.");
      setNotice("Yeni hatırlatıcı eklendi.");
      setShowReminderForm(false);
      setNewReminder({
        name: "Yeni Hatırlatıcı",
        date: "",
        time: "14:30",
        status: "PENDING",
        notes: "Genel Muayene",
      });
      await loadCalendar(selectedPetId, monthCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hatırlatıcı eklenemedi.");
    }
  }

  async function toggleReminderStatus(item: CalendarEvent) {
    setError(null);
    setNotice(null);
    try {
      const nextStatus = item.status === "COMPLETED" ? "PENDING" : "COMPLETED";
      const res = await fetch(`/api/calendar/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = (await res.json()) as { event?: CalendarEvent; error?: string };
      if (!res.ok || !data.event) throw new Error(data.error ?? "Hatırlatıcı güncellenemedi.");
      setNotice(nextStatus === "COMPLETED" ? "Hatırlatıcı tamamlandı olarak işaretlendi." : "Hatırlatıcı bekliyor durumuna alındı.");
      await loadCalendar(selectedPetId, monthCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hatırlatıcı güncellenemedi.");
    }
  }

  const ayYılıEtiketi = `${ayAdları[monthCursor.getMonth()]} ${monthCursor.getFullYear()}`;

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="flex items-center justify-between">
        <h2 className="text-4xl font-bold tracking-tight text-teal-800">Aşı ve Randevu Takvimi</h2>
        <div className="flex items-center gap-5 text-slate-600">
          <Bell className="h-5 w-5 text-teal-700" />
          <span className="text-lg">{ayYılıEtiketi}</span>
        </div>
      </header>
      {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}
      {notice && <p className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm text-teal-700">{notice}</p>}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_300px]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <button
                type="button"
                onClick={() =>
                  setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                }
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                }
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <span className="inline-flex items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-300" />
                Gelecek Aşılar
              </span>
              <span className="inline-flex items-center gap-2 text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                Geçmiş Aşılar
              </span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-7 border-t border-l border-slate-100">
            {günler.map((gün) => (
              <div
                key={gün}
                className="border-r border-b border-slate-100 py-3 text-center text-xs font-semibold tracking-[0.16em] text-slate-500"
              >
                {gün}
              </div>
            ))}

            {calendarCells.map((date) => {
              const key = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
              const dayEvents = eventMap.get(key) ?? [];
              const mainEvent = dayEvents[0];
              const bugün =
                date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear();
              const dışAy = date.getMonth() !== monthCursor.getMonth();
              const geçmişEtkinlik = mainEvent?.status === "COMPLETED";
              const yaklaşanEtkinlik = mainEvent && mainEvent.status === "PENDING";

              return (
                <div key={key} className="relative h-24 border-r border-b border-slate-100 p-2.5">
                  <p className={`text-lg ${dışAy ? "text-slate-300" : "text-slate-700"}`}>{date.getDate()}</p>

                  {geçmişEtkinlik && (
                    <div className="mt-1 rounded-lg bg-slate-100 p-1.5 text-[10px] font-medium text-slate-600">
                      {mainEvent?.name}
                      <br />
                      (Tamamlandı)
                    </div>
                  )}

                  {bugün && (
                    <div className="pointer-events-none absolute inset-1 rounded-3xl border-2 border-teal-300">
                      <p className="absolute bottom-2 left-2 text-xs font-semibold text-teal-700">Bugün</p>
                    </div>
                  )}

                  {yaklaşanEtkinlik ? (
                    <div className="mt-1 w-[68px] rounded-xl bg-teal-100 p-1.5 text-[10px] font-semibold text-teal-800">
                      {mainEvent?.name}
                      <br />
                      ({pad2(new Date(mainEvent.date).getHours())}:{pad2(new Date(mainEvent.date).getMinutes())})
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.45)]">
          <h3 className="flex items-center gap-2 text-3xl font-semibold text-slate-900">
            <Bell className="h-5 w-5 text-teal-700" />
            Yaklaşan Hatırlatıcılar
          </h3>
          <div className="mt-4">
            <select
              value={selectedPetId}
              onChange={(e) => void onChangePet(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
            >
              {pets.length === 0 ? <option value="">Profil bulunamadı</option> : null}
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 space-y-3">
            {reminders.map((öğe) => (
              <article
                key={`${öğe.id}-${öğe.name}`}
                className={`rounded-2xl border border-slate-100 border-l-4 bg-slate-50 p-4 ${
                  öğe.status === "COMPLETED" ? "border-l-amber-700" : "border-l-teal-600"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-slate-500">{toDateLabel(öğe.date)}</p>
                    <h4 className="mt-1 text-xl font-semibold text-slate-900">{öğe.name}</h4>
                    <p className="mt-0.5 text-sm text-slate-500">{öğe.notes || "Genel Muayene"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggleReminderStatus(öğe)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {öğe.status === "COMPLETED" ? "Bekliyor Yap" : "Tamamlandı Yap"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowReminderForm((prev) => !prev)}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-slate-300 bg-white py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Yeni Hatırlatıcı Ekle
          </button>

          {showReminderForm ? (
            <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <input
                type="text"
                value={newReminder.name}
                onChange={(e) => setNewReminder((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Başlık"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={newReminder.date}
                  onChange={(e) => setNewReminder((prev) => ({ ...prev, date: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                />
                <input
                  type="time"
                  value={newReminder.time}
                  onChange={(e) => setNewReminder((prev) => ({ ...prev, time: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                />
              </div>
              <select
                value={newReminder.status}
                onChange={(e) =>
                  setNewReminder((prev) => ({ ...prev, status: e.target.value as "COMPLETED" | "PENDING" }))
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
              >
                <option value="PENDING">Bekliyor</option>
                <option value="COMPLETED">Tamamlandı</option>
              </select>
              <input
                type="text"
                value={newReminder.notes}
                onChange={(e) => setNewReminder((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Detay"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
              />
              <button
                type="button"
                onClick={() => void addReminder()}
                className="h-10 w-full rounded-xl bg-teal-700 text-sm font-semibold text-white"
              >
                Hatırlatıcıyı Kaydet
              </button>
            </div>
          ) : null}

          <div className="mt-8 rounded-3xl bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-500 p-4 text-white">
            <p className="text-sm text-teal-100">Aktif Pet</p>
            <p className="text-3xl font-semibold">{selectedPet?.name ?? "-"}</p>
            <p className="mt-1 inline-flex rounded-full bg-white/20 px-2.5 py-1 text-xs">
              {ageLabel(selectedPet?.birthDate ?? null)} • {selectedPet?.breed ?? "Cins belirtilmedi"}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
