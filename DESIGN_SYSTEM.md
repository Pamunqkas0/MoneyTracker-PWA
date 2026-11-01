# 🎨 SavOr MoneyTracker — Design System & UI/UX Guidelines

Dokumen ini merupakan acuan resmi (*single source of truth*) untuk desain visual, sistem komponen, dan arsitektur responsif pada aplikasi **SavOr MoneyTracker**. Semua pengembangan halaman dan komponen baru wajib mengacu pada panduan ini agar tampilan tetap konsisten, rapi, dan berkelas.

---

## 🏛️ 1. Filosofi Desain

- **Gaya Desain:** *Warm Soft Bento Grid Fintech*
- **Karakter:** Hangat (*warm*), ramah (*approachable*), taktil (*tactile*), lapang (*breathable*), dan modern.
- **Prinsip Utama:**
  1. **Mobile-First & Desktop-Expansive:** Sempurna dan nyaman di layar smartphone 375px (single-column vertical stack), namun memanfaatkan ruang layar lebar di desktop (multi-kolom modular `max-w-7xl`).
  2. **Zero Harsh Borders:** Menghindari garis border gelap tebal. Gunakan border ultra-subtle (`border-black/[0.04]` atau `border-white/[0.06]`) dipadu bayangan lembut.
  3. **Generous Radii:** Sudut kartu membulat besar (`rounded-3xl` / `rounded-[32px]`), tombol berbentuk kapsul penuh (`rounded-full`), dan avatar/icon berbentuk squircle (`rounded-2xl`).
  4. **Full Number Clarity:** Angka nominal finansial wajib ditampilkan penuh dan presisi (`Rp 3.249.632`), bukan disingkat kasar (`3,2 jt`), terutama pada kartu metrik utama dan modal rincian.

---

## 🎨 2. Design Tokens & Palet Warna

### A. Background & Surface

| Token | Light Mode | Dark Mode | Penggunaan |
|---|---|---|---|
| `--bg-warm` / Page Canvas | `#F7F4EE` | `#0B0F1A` / `#121316` | Background penuh halaman |
| `--surface-card` / Bento | `#FFFFFF` | `#111827` / `#1C1E23` | Latar utama kartu bento |
| `--surface-muted` | `#F2EFEB` | `#1F2937` / `#252830` | Container input, filter kapsul non-aktif |
| Card Border | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.06)` | Border pembatas kartu halus |

### B. Brand & Aksen Utama

| Token | Nilai HEX | Penggunaan |
|---|---|---|
| `--brand-orange` (Primary) | `#E85024` / `#FF5C28` | Tombol CTA utama, tab filter aktif, aksen titik status |
| `--brand-dark` (Active State)| `#1A1A1A` | Tab pill aktif di light mode, teks heading utama |
| Success / Pemasukan | `#16A34A` / `#60BA3A` | Nominal `+Rp...`, tren naik, badge verified |
| Danger / Pengeluaran | `#E85024` / `#EF4444` | Nominal `−Rp...`, tren turun, status jatuh tempo |

### C. Pastel Highlight Palette (Kartu, Icon & Progress Bar)

| Kategori | Background (Light) | Background (Dark) | Teks / Stroke | Contoh Penggunaan |
|---|---|---|---|---|
| **Lime Green** | `#D8F5A2` / `#ECFDC5` | `oklch(0.26 0.05 172)` | `#166534` | Income Card, Kategori Belanja, Status Selesai |
| **Warm Peach** | `#FDD5C1` / `#FFE2D9` | `rgba(244,63,94,0.15)` | `#9F1239` / `#E85024` | Outcome Card, Tagihan, Cicilan |
| **Pastel Yellow** | `#FAD170` / `#FEF08A` | `rgba(234,179,8,0.15)` | `#854D0E` | Hero Saldo Rekening, Gaji, Autopay |
| **Soft Lavender** | `#E0E6FD` / `#DDE3FA` | `rgba(99,102,241,0.15)`| `#3730A3` | Koneksi, Utilitas, Langganan |
| **Mint / Cyan** | `#DAEFEA` / `#72D3E3` | `rgba(6,182,212,0.15)` | `#155E75` | Tabungan (Savings), Aset Kripto, Investasi |

---

## 📐 3. Skala Geometri & Border Radius

Gunakan tingkatan *border-radius* berikut secara disiplin:

```css
rounded-[36px]  /* Outer Canvas Shell Bento Wrapper (Desktop & Tablet) */
rounded-[32px]  /* Bento Cards Utama (Hero Saldo, Savings Stats, Chart Card) */
rounded-2xl     /* Sub-cards, List Baris Transaksi, Squircle Icon Avatar */
rounded-xl      /* Dropdown Item, Mini Badges, Input Fields */
rounded-full    /* Buttons, Active Filter Pills, Search Bar, Bottom Nav */
```

---

## 📱 vs 🖥️ 4. Arsitektur Responsif (Desktop vs Mobile)

Threshold breakpoint desktop aplikasi ini adalah `lg:` (**1024px**).

```
Layar Mobile (< 1024px)                  Layar Desktop (≥ 1024px)
┌────────────────────────────┐          ┌─────────────────────────────────────────────────────────┐
│ [☰]  Hello, Fred      [👤] │          │ [🐷 SavOr]    ( Home  Savings  Stats  Analytics  More ) │
├────────────────────────────┤          ├─────────────────────────────────────────────────────────┤
│                            │          │  [ Kolom Kiri ]     [ Kolom Tengah ]    [ Kolom Kanan ] │
│  Single Column Stack       │          │  - Rekening / Hero  - Savings Stats     - Chart & Pasar │
│  (Vertical Flow)           │          │  - Quick Actions    - Spend Rate        - Portofolio    │
│                            │          │  (col-span-4)       (col-span-4)        (col-span-4)    │
│                            │          │                                                         │
├────────────────────────────┤          │  * Container: w-full max-w-7xl mx-auto                  │
│ [🏠] [🐷]  (+)  [📊] [👤]  │          │  * Bottom Nav: HIDDEN                                   │
└────────────────────────────┘          └─────────────────────────────────────────────────────────┘
```

### Aturan Visibilitas Navigasi:
1. **Desktop Top Navigation (`DashboardHeader`):**
   - Wajib menggunakan class: `hidden lg:flex`.
   - Menampilkan logo brand, pill menu 5 tab (*Home, Savings, Statistic, Analytics, More*), quick search, notifikasi, dan avatar profil.
   - **Wajib hadir di seluruh halaman:** `/dashboard`, `/dashboard/transactions`, `/dashboard/budget`, dan `/dashboard/profile`.
2. **Mobile Top Header (`AppTopHeader`):**
   - Wajib menggunakan class: `flex lg:hidden`.
   - Menampilkan icon menu kiri, sapaan `Hello, [Name]`, dan avatar profil kanan.
3. **Mobile Floating Bottom Nav (`BottomNav`):**
   - Wajib menggunakan class: `flex lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50`.
   - Tombol oranye `(+)` selalu terkunci tepat di tengah (*dead-center*) dengan *safe clearance* agar tidak menabrak kapsul tab aktif.
4. **Safe-Area Content Padding:**
   - Container halaman wajib memiliki `pb-safe-nav lg:pb-8` agar konten terbawah tidak tertutup oleh bottom bar di mobile.

---

## 🧩 5. Standar Komponen & Kode Acuan

### 1. Main Canvas Outer Shell

Gunakan pembungkus ini sebagai root container di setiap halaman:

```tsx
<div className="min-h-screen bg-[#F7F4EE] dark:bg-[#0b0f1a] text-[#18181B] dark:text-[#f1f5f9] px-3 pb-3 pt-0 sm:p-5 md:p-6 lg:p-8 flex justify-center items-start selection:bg-brand-orange/20 transition-colors">
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
    className="w-full max-w-7xl rounded-[28px] sm:rounded-[32px] md:rounded-[36px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-black/[0.04] dark:border-slate-800 p-4 sm:p-6 md:p-8 lg:p-10 shadow-xs flex flex-col gap-6"
  >
    {/* 1. Desktop Navigation Bar (Tampil di semua page pada breakpoint lg) */}
    <div className="hidden lg:block">
      <DashboardHeader ... />
    </div>

    {/* 2. Mobile Top Header (Hanya tampil di mobile) */}
    <div className="block lg:hidden">
      <AppTopHeader ... />
    </div>

    {/* 3. Page Content */}
    {children}
  </motion.div>
</div>
```

---

### 2. Bento Card Dasar

```tsx
<div className="bg-white dark:bg-[#1C1E23] rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 border border-black/[0.03] dark:border-white/[0.06] shadow-xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
  {/* Card Header & Content */}
</div>
```

---

### 3. Dual Metric Cards (Income & Outcome) dengan Scale Ticks

```tsx
<div className="grid grid-cols-2 gap-3.5">
  {/* Income Card */}
  <div className="bg-white dark:bg-[#1C1E23] rounded-[28px] sm:rounded-[32px] p-5 border border-black/[0.03] dark:border-white/[0.06] shadow-xs flex flex-col justify-between min-h-[180px]">
    <div className="w-12 h-12 rounded-full bg-[#ECFDC5] dark:bg-emerald-950/40 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
      <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
    </div>
    <div>
      <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Income</span>
      <p className="text-xl sm:text-2xl font-black text-[#111827] dark:text-white tracking-tight mt-0.5 mb-2 tabular-nums">
        Rp 3.249.632
      </p>
      {/* Scale Ticks */}
      <div className="flex justify-between text-[10px] font-bold text-stone-400 dark:text-stone-500 px-0.5 mb-1">
        <span>0%</span>
        <span className="text-emerald-600 dark:text-emerald-400">75%</span>
        <span>100%</span>
      </div>
      {/* Progress Bar dengan Pembatas Garis Hitam 2px */}
      <div className="flex items-center gap-1.5 w-full h-3.5">
        <div className="h-full bg-[#8CE644] rounded-full w-[75%]" />
        <div className="w-[2px] h-full bg-black/80 dark:bg-white/80 rounded-full shrink-0" />
        <div className="h-full bg-stone-100 dark:bg-stone-800 rounded-full flex-1" />
      </div>
    </div>
  </div>

  {/* Outcome Card */}
  <div className="bg-white dark:bg-[#1C1E23] rounded-[28px] sm:rounded-[32px] p-5 border border-black/[0.03] dark:border-white/[0.06] shadow-xs flex flex-col justify-between min-h-[180px]">
    <div className="w-12 h-12 rounded-full bg-[#FFE2D9] dark:bg-rose-950/40 flex items-center justify-center text-[#E85024] dark:text-rose-300">
      <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
    </div>
    <div>
      <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Outcome</span>
      <p className="text-xl sm:text-2xl font-black text-[#111827] dark:text-white tracking-tight mt-0.5 mb-2 tabular-nums">
        Rp 3.587.141
      </p>
      {/* Scale Ticks */}
      <div className="flex justify-between text-[10px] font-bold text-stone-400 dark:text-stone-500 px-0.5 mb-1">
        <span>0%</span>
        <span className="text-[#E85024] dark:text-rose-400">20%</span>
        <span>100%</span>
      </div>
      {/* Progress Bar */}
      <div className="flex items-center gap-1.5 w-full h-3.5">
        <div className="h-full bg-[#E85024] rounded-full w-[20%]" />
        <div className="w-[2px] h-full bg-black/80 dark:bg-white/80 rounded-full shrink-0" />
        <div className="h-full bg-stone-100 dark:bg-stone-800 rounded-full flex-1" />
      </div>
    </div>
  </div>
</div>
```

---

### 4. Segmented Filter Pills (Kapsul Filter)

```tsx
<div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
  {/* Active Pill */}
  <button className="px-4 py-2 rounded-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] font-bold text-xs shadow-xs shrink-0 cursor-pointer">
    Semua Transaksi
  </button>
  {/* Inactive Pastel Pills */}
  <button className="px-4 py-2 rounded-full bg-[#D8F5A2]/70 dark:bg-emerald-950/40 text-stone-900 dark:text-emerald-300 font-semibold text-xs border border-transparent hover:border-[#D8F5A2] shrink-0 cursor-pointer transition-all">
    Belanja
  </button>
  <button className="px-4 py-2 rounded-full bg-[#FDD5C1]/70 dark:bg-rose-950/40 text-stone-900 dark:text-rose-300 font-semibold text-xs border border-transparent hover:border-[#FDD5C1] shrink-0 cursor-pointer transition-all">
    Tagihan
  </button>
</div>
```

---

### 5. Baris Transaksi (Transaction Card Item)

```tsx
<div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-white dark:bg-[#1C1E23] border border-black/[0.03] dark:border-white/[0.04] rounded-2xl shadow-xs hover:-translate-y-0.5 transition-all">
  {/* Sisi Kiri: Squircle Avatar + Judul + Rekening */}
  <div className="flex items-center gap-3 min-w-0 flex-1">
    <div className="w-11 h-11 rounded-2xl bg-[#FDD5C1]/70 dark:bg-rose-950/40 flex items-center justify-center text-xl shrink-0">
      🛒
    </div>
    <div className="min-w-0 flex-1">
      <h4 className="text-xs sm:text-sm font-bold text-[#18181B] dark:text-white truncate">
        Supermarket GrandLucky
      </h4>
      <p className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium truncate mt-0.5">
        BCA Utama • Groceries
      </p>
    </div>
  </div>

  {/* Sisi Kanan: Nominal Penuh + Tanggal */}
  <div className="text-right shrink-0">
    <p className="text-xs sm:text-sm font-black tabular-nums tracking-tight text-[#18181B] dark:text-white">
      −Rp 142.800
    </p>
    <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
      14 Sep • 12:45
    </p>
  </div>
</div>
```

---

### 6. Modal / Dialog Standar (Bottom-Sheet di Mobile, Centered di Desktop)

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent
    showHandle={false}
    className="p-0 overflow-hidden rounded-t-[32px] md:rounded-[36px] bg-white dark:bg-[#15171C] border border-black/[0.04] dark:border-white/[0.08] shadow-2xl max-w-lg w-full mx-auto max-h-[90vh] flex flex-col text-[#18181B] dark:text-stone-100"
  >
    {/* Grab Handle (Mobile Only) */}
    <div className="w-full flex items-center justify-center pt-3 pb-1 md:hidden">
      <div className="w-12 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full" />
    </div>

    {/* Header */}
    <div className="flex items-center justify-between px-6 pt-3 pb-2">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-[#FFEFEB] dark:bg-orange-950/40 text-[#E85024] flex items-center justify-center text-xl font-bold">
          +
        </div>
        <div>
          <DialogTitle className="text-base sm:text-lg font-black text-[#111] dark:text-white">
            Tambah Transaksi
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500">
            Catat pengeluaran & pemasukan harian
          </DialogDescription>
        </div>
      </div>
      <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
        <X className="w-4 h-4" />
      </button>
    </div>

    {/* Scrollable Body */}
    <div className="overflow-y-auto px-6 py-3 flex flex-col gap-4">
      {/* Inputs & Selectors */}
    </div>

    {/* Sticky Primary Footer */}
    <div className="p-5 pt-2 bg-white/95 dark:bg-[#15171C]/95 border-t border-black/[0.04] dark:border-white/[0.04]">
      <button className="w-full rounded-full bg-[#E85024] hover:bg-[#d44319] text-white font-black py-4 text-sm sm:text-base shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
        Simpan Transaksi →
      </button>
    </div>
  </DialogContent>
</Dialog>
```

---

## 🚫 6. Aturan Penting (Do's & Don'ts)

| Hal yang HARUS Dilakukan (Do) | Hal yang DILARANG (Don't) |
|---|---|
| Gunakan class `hidden lg:flex` untuk elemen eksklusif desktop. | Jangan menaruh `AppTopHeader` (mobile header) di breakpoint desktop tanpa `lg:hidden`. |
| Gunakan angka nominal lengkap (`Rp 3.249.632`) pada metrik dan rincian. | Jangan menyingkat angka menjadi `3,2 jt` pada kartu metrik utama. |
| Gunakan vector icons SVG (`lucide-react`) pada elemen fungsional. | Jangan memakai karakter emoji mentah (`📥`, `📊`) untuk icon tombol/aksi. |
| Beri `pb-safe-nav lg:pb-0` pada kontainer utama. | Jangan biarkan konten terbawah tertindih oleh Floating Bottom Nav di mobile. |
| Pastikan border kartu bernilai sangat tipis (`border-black/[0.03]`). | Jangan gunakan border hitam pekat atau bayangan `shadow-2xl` hitam pekat yang kaku. |
| Pertahankan active pill kapsul hitam `#1A1A1A` di light mode. | Jangan membuat tab aktif dengan garis bawah (*underline*) biasa yang monoton. |

---

> 💡 **Panduan Penyimpanan:** File ini disimpan di root direktori proyek sebagai `DESIGN_SYSTEM.md` dan dapat langsung dibaca oleh developer maupun AI Assistant saat merefaktor atau membuat fitur baru.
