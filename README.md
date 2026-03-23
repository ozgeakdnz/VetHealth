## Vet-Health

Vet-Health, `Next.js App Router + Tailwind CSS + Lucide-React + Prisma + PostgreSQL (Supabase)` stack'i ile hazirlanmis modern bir evcil hayvan saglik takip uygulamasi baslangic projesidir.

### Ozellikler

- Modern ve mobil uyumlu temiz arayuz
- Tum sayfalar arasi gecis saglayan sidebar yapisi
- Hayvan profili yonetimi
- Asi/randevu takvimi
- Belirti gunlugu
- Beslenme tablosu
- Sag alt koseye sabit `Pati Dostu` AI chatbox bileseni

## Getting Started

1. Ortam degiskenlerini hazirla:

```bash
cp .env.example .env
```

2. `.env` icindeki `DATABASE_URL` degerini Supabase PostgreSQL baglanti cumlen ile guncelle.

3. Prisma client'i olustur:

```bash
npm run prisma:generate
```

4. Gelistirme sunucusunu baslat:

```bash
npm run dev
```

5. Tarayicida [http://localhost:1570](http://localhost:1570) adresini ac.

### Prisma Komutlari

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

### Teknolojiler

- Next.js 16 (App Router)
- Tailwind CSS 4
- Lucide-React
- Prisma ORM
- PostgreSQL (Supabase)
