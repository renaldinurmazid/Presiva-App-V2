# Design System — Aplikasi Absensi Karyawan

> Design system ini mendefinisikan seluruh token visual, komponen, dan panduan UI untuk aplikasi absensi karyawan berbasis React Native.

---

## 1. Brand & Prinsip Desain

| Prinsip | Deskripsi |
|---|---|
| **Clarity** | Informasi absensi harus terbaca seketika tanpa ambiguitas |
| **Trust** | Tampilan profesional & konsisten membangun kepercayaan pengguna |
| **Efficiency** | Aksi utama (scan barcode, check-in) dapat dicapai dalam ≤2 tap |
| **Clean** | Tidak ada shadow — kedalaman dibangun lewat warna, border, dan spacing |

---

## 2. Color Palette

### Primary

| Token | Hex | Penggunaan |
|---|---|---|
| `primary.500` | `#2880E3` | CTA utama, icon aktif, aksen |
| `primary.400` | `#4D95EA` | Hover / pressed state |
| `primary.300` | `#7DB3F0` | Disabled, placeholder aksen |
| `primary.100` | `#D6E8FB` | Background chip, badge |
| `primary.50` | `#EBF4FE` | Background highlight ringan |

### Neutral

| Token | Hex | Penggunaan |
|---|---|---|
| `neutral.900` | `#0F1923` | Teks utama / heading |
| `neutral.700` | `#3B4A5A` | Teks sekunder |
| `neutral.500` | `#6B7A8D` | Placeholder, label lemah |
| `neutral.300` | `#B8C4D0` | Border, divider |
| `neutral.100` | `#EEF2F6` | Background card, input |
| `neutral.50` | `#F7F9FB` | Background halaman |
| `neutral.0` | `#FFFFFF` | Surface card |

### Semantic

| Token | Hex | Penggunaan |
|---|---|---|
| `success.500` | `#22C55E` | Hadir / tepat waktu |
| `success.100` | `#DCFCE7` | Badge hadir |
| `warning.500` | `#F59E0B` | Terlambat |
| `warning.100` | `#FEF3C7` | Badge terlambat |
| `danger.500` | `#EF4444` | Absen / izin ditolak |
| `danger.100` | `#FEE2E2` | Badge absen |
| `info.500` | `#2880E3` | Informasi / pengumuman |
| `info.100` | `#D6E8FB` | Badge informasi |

---

## 3. Typography

**Font Family:** `Poppins`

```
npm install @expo-google-fonts/poppins
```

```js
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
```

### Scale

| Token | Size | Weight | Line Height | Penggunaan |
|---|---|---|---|---|
| `text.xs` | 10px | Regular / Medium | 16px | Caption kecil, timestamp, badge |
| `text.sm` | 12px | Regular / Medium | 18px | Label form, helper text, sub-caption |
| `text.base` | 14px | Regular / SemiBold | 22px | Body teks, item list, deskripsi |
| `text.md` | 16px | Medium / SemiBold | 24px | Sub-heading, nama pengguna |
| `text.lg` | 18px | SemiBold / Bold | 28px | Section heading, judul kartu |
| `text.xl` | 20px | Bold | 30px | Page title, greeting |

### Penggunaan Umum

```js
// Contoh StyleSheet Typography
const typography = {
  pageTitle:   { fontSize: 20, fontFamily: 'Poppins_700Bold',     color: '#0F1923' },
  sectionHead: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: '#0F1923' },
  cardTitle:   { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: '#0F1923' },
  bodyText:    { fontSize: 14, fontFamily: 'Poppins_400Regular',  color: '#3B4A5A' },
  label:       { fontSize: 12, fontFamily: 'Poppins_500Medium',   color: '#6B7A8D' },
  caption:     { fontSize: 10, fontFamily: 'Poppins_400Regular',  color: '#6B7A8D' },
};
```

---

## 4. Spacing & Grid

Berbasis unit **4px**.

| Token | Value | Penggunaan |
|---|---|---|
| `space.1` | 4px | Gap ikon–teks, padding badge |
| `space.2` | 8px | Padding internal chip |
| `space.3` | 12px | Gap antar elemen dalam card |
| `space.4` | 16px | Padding card, padding screen horizontal |
| `space.5` | 20px | Gap antar section |
| `space.6` | 24px | Padding top section |
| `space.8` | 32px | Jarak besar antar blok |
| `space.10` | 40px | Padding bottom (safe area) |

**Screen Padding Horizontal:** `16px`
**Screen Padding Top:** `24px`

---

## 5. Border Radius

| Token | Value | Penggunaan |
|---|---|---|
| `radius.sm` | 6px | Badge, chip kecil |
| `radius.md` | 10px | Input field, button kecil |
| `radius.lg` | 14px | Card, modal bottom sheet |
| `radius.xl` | 20px | Card hero, scan area |
| `radius.full` | 9999px | Avatar, FAB, pill badge |

---

## 6. Iconography

**Library:** `lucide-react-native`

```
npm install lucide-react-native
```

### Ukuran Standar

| Konteks | Size | Color |
|---|---|---|
| Bottom tab (tidak aktif) | 22px | `#6B7A8D` |
| Bottom tab (aktif) | 22px | `#2880E3` |
| Dalam card / list item | 18px | `#2880E3` atau `#3B4A5A` |
| Dalam button | 16px | `#FFFFFF` |
| Caption / inline | 14px | `#6B7A8D` |

### Icon yang Digunakan

| Layar / Fungsi | Icon Lucide |
|---|---|
| Home | `Home` |
| Barcode / Scan | `ScanLine` |
| Absensi / Riwayat | `ClipboardList` |
| Profil / Lainnya | `LayoutGrid` |
| Notifikasi | `Bell` |
| Kalender | `CalendarDays` |
| Jam / Waktu | `Clock` |
| Lokasi | `MapPin` |
| Check-in | `LogIn` |
| Check-out | `LogOut` |
| Izin | `FileText` |
| Status hadir | `CircleCheck` |
| Status terlambat | `CircleAlert` |
| Status absen | `CircleX` |
| Pencarian | `Search` |
| Filter | `SlidersHorizontal` |
| Kembali | `ChevronLeft` |
| Lebih lanjut | `ChevronRight` |
| Pengaturan | `Settings` |
| Kamera | `Camera` |

---

## 7. Komponen

### 7.1 Bottom Navigation Bar

```
┌─────────────────────────────────────────┐
│  🏠 Home  │ 📷 Scan  │ 📋 Absensi │ ⋯  │
└─────────────────────────────────────────┘
```

- Background: `#FFFFFF`
- Border top: `1px solid #EEF2F6`
- Tinggi: `64px` + safe area bottom
- **Tab Aktif:** icon `#2880E3` + label `12px SemiBold #2880E3` + indikator titik `6px #2880E3`
- **Tab Tidak Aktif:** icon `#6B7A8D` + label `12px Regular #6B7A8D`
- Tidak ada shadow — gunakan border top sebagai pemisah

**Struktur Tab:**

| Index | Label | Icon | Route |
|---|---|---|---|
| 0 | Home | `Home` | `/home` |
| 1 | Scan | `ScanLine` | `/scan` |
| 2 | Absensi | `ClipboardList` | `/absensi` |
| 3 | Lainnya | `LayoutGrid` | `/more` |

---

### 7.2 Header / App Bar

```
┌─────────────────────────────────────────┐
│  ← [Judul Halaman]         [Aksi Icon]  │
└─────────────────────────────────────────┘
```

- Background: `#FFFFFF`
- Border bottom: `1px solid #EEF2F6`
- Tinggi: `56px`
- Title: `18px SemiBold #0F1923`
- Icon kembali: `ChevronLeft` 22px `#0F1923`
- Aksi kanan (opsional): icon 22px `#0F1923`

---

### 7.3 Card

```
┌─────────────────────────────┐
│  [Ikon]  Judul              │
│          Deskripsi          │
│                   [Aksi]   │
└─────────────────────────────┘
```

- Background: `#FFFFFF`
- Border: `1px solid #EEF2F6`
- Border radius: `14px`
- Padding: `16px`
- **Tidak ada shadow**

---

### 7.4 Status Badge

```
[ ● Hadir ]   [ ● Terlambat ]   [ ● Absen ]
```

```js
const badgeStyles = {
  hadir:     { bg: '#DCFCE7', text: '#16A34A', label: 'Hadir' },
  terlambat: { bg: '#FEF3C7', text: '#B45309', label: 'Terlambat' },
  absen:     { bg: '#FEE2E2', text: '#DC2626', label: 'Absen' },
  izin:      { bg: '#D6E8FB', text: '#1D6CC7', label: 'Izin' },
};
```

- Padding: `4px 10px`
- Border radius: `9999px` (pill)
- Font: `10px SemiBold`

---

### 7.5 Button

#### Primary

- Background: `#2880E3`
- Text: `16px SemiBold #FFFFFF`
- Border radius: `10px`
- Padding: `14px 24px`
- Pressed state: background `#4D95EA`
- Disabled: background `#B8C4D0`, text `#FFFFFF`

#### Secondary / Outline

- Background: `transparent`
- Border: `1.5px solid #2880E3`
- Text: `16px SemiBold #2880E3`
- Border radius: `10px`
- Padding: `14px 24px`

#### Ghost / Text Button

- Background: `transparent`
- Text: `14px Medium #2880E3`

---

### 7.6 Input Field

```
┌────────────────────────────────┐
│ [Icon]  Placeholder text       │
└────────────────────────────────┘
```

- Background: `#EEF2F6`
- Border: `1.5px solid transparent` (focused: `#2880E3`)
- Border radius: `10px`
- Padding: `12px 16px`
- Font: `14px Regular`
- Placeholder color: `#6B7A8D`
- Label atas: `12px Medium #6B7A8D`
- **Tidak ada shadow**

---

### 7.7 Avatar

- Shape: lingkaran (`border-radius: 9999px`)
- Ukuran S: `32px`, M: `40px`, L: `48px`, XL: `64px`
- Fallback (inisial): background `#D6E8FB`, text `#2880E3 SemiBold`
- Border: `2px solid #EEF2F6`

---

### 7.8 List Item Absensi

```
┌────────────────────────────────────────────┐
│ [Avatar/Ikon]  Nama Karyawan          [●]  │
│               Senin, 27 Jan · 08:02        │
└────────────────────────────────────────────┘
```

- Background: `#FFFFFF`
- Border bottom: `1px solid #EEF2F6`
- Padding: `12px 16px`
- Nama: `14px SemiBold #0F1923`
- Waktu: `12px Regular #6B7A8D`
- Badge status di kanan

---

### 7.9 Scan Area (Barcode)

```
┌────────────────────────────┐
│  ┌──────────────────────┐  │
│  │                      │  │
│  │   [Area Kamera/QR]   │  │
│  │                      │  │
│  └──────────────────────┘  │
│       [Teks Instruksi]     │
└────────────────────────────┘
```

- Overlay background: `rgba(15, 25, 35, 0.85)`
- Frame scan: border `2px solid #2880E3`, border radius `20px`
- Corner accent: `#2880E3` dengan lebar `24px`
- Teks: `14px Medium #FFFFFF`
- Animated scan line: `#2880E3` bergerak vertikal

---

### 7.10 Statistik / Summary Card

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   22        │  │    3        │  │    1        │
│   Hadir     │  │  Terlambat  │  │   Absen     │
└─────────────┘  └─────────────┘  └─────────────┘
```

- Background: masing-masing `#DCFCE7 / #FEF3C7 / #FEE2E2`
- Border: `1px solid success/warning/danger.200`
- Border radius: `14px`
- Angka: `20px Bold` warna semantik
- Label: `12px Medium` warna semantik
- **Tidak ada shadow**

---

## 8. Layar Utama

### 8.1 Home Screen

```
┌─────────────────────────────────┐
│  Selamat Pagi, Budi 👋    [🔔]  │  ← Greeting 20px Bold
│  Senin, 27 Januari 2025         │  ← 12px Regular neutral.500
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │  STATUS HARI INI           │  │  ← Card utama
│  │  08:02 WIB  ●  Hadir       │  │
│  │  [Belum Check-out]         │  │
│  │  [Tombol Check-out]        │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  Ringkasan Bulan Ini            │  ← 16px SemiBold
│  [ 22 Hadir ] [ 3 Terlambat ]  │
│  [  1 Absen ] [  2 Izin     ]  │
├─────────────────────────────────┤
│  Aktivitas Terbaru              │  ← 16px SemiBold
│  [List item absensi ...]        │
└─────────────────────────────────┘
```

---

### 8.2 Scan Barcode Screen

```
┌─────────────────────────────────┐
│  ← Scan Kehadiran               │  ← Header
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │     [Frame kamera]      │   │
│  │     ~~scan line~~       │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│   Arahkan kamera ke QR Code    │  ← 14px Medium white
│   atau barcode karyawan         │
│                                 │
│  [ Input Manual NIP ]           │
└─────────────────────────────────┘
```

---

### 8.3 Absensi Screen (Riwayat)

```
┌─────────────────────────────────┐
│  Riwayat Absensi        [Filter]│
├─────────────────────────────────┤
│  [Bulan: Januari 2025  ▾]       │  ← Dropdown bulan
├─────────────────────────────────┤
│  Ringkasan: [22H] [3T] [1A]     │
├─────────────────────────────────┤
│  Senin, 27 Jan                  │  ← Sticky date header 12px
│  ┌─────────────────────────┐   │
│  │  Masuk  08:02    Hadir  │   │
│  │  Keluar 17:05           │   │
│  └─────────────────────────┘   │
│  Senin, 26 Jan                  │
│  [ ... ]                        │
└─────────────────────────────────┘
```

---

### 8.4 More / Lainnya Screen

```
┌─────────────────────────────────┐
│  ┌──────────────────────────┐  │
│  │  [Avatar]  Budi Santoso  │  │  ← Profile card
│  │  NIP: 202401011          │  │
│  │  Divisi: Engineering     │  │
│  └──────────────────────────┘  │
├─────────────────────────────────┤
│  [📅]  Pengajuan Izin    →     │
│  [📋]  Slip Gaji         →     │
│  [🗓]  Jadwal Kerja      →     │
│  [🔔]  Notifikasi        →     │
│  [⚙]  Pengaturan        →     │
├─────────────────────────────────┤
│  [  Keluar  ]                   │  ← Tombol danger outline
└─────────────────────────────────┘
```

---

## 9. States & Feedback

| State | Visual |
|---|---|
| **Loading** | `ActivityIndicator` warna `#2880E3`, skeleton dengan `#EEF2F6` |
| **Empty State** | Ilustrasi + teks `16px Medium #6B7A8D` + CTA button |
| **Error** | Banner `danger.100` + ikon `CircleX` + pesan `14px #DC2626` |
| **Success** | Bottom sheet / toast `success.100` + ikon `CircleCheck` + `14px #16A34A` |
| **Offline** | Banner atas `warning.100` + `12px Medium #B45309` |

---

## 10. Aturan Tidak Boleh Dilanggar

```
✗  Jangan gunakan shadow / elevation apapun
✗  Jangan gunakan font selain Poppins
✗  Jangan gunakan font size di luar 10, 12, 14, 16, 18, 20
✗  Jangan gunakan icon selain lucide-react-native
✗  Jangan gunakan warna di luar token yang telah didefinisikan
✗  Jangan pakai border radius > 20px kecuali untuk pill / avatar
```

---

## 11. Implementasi Token (StyleSheet)

```js
// theme.js
export const Colors = {
  primary:  { 50:'#EBF4FE', 100:'#D6E8FB', 300:'#7DB3F0', 400:'#4D95EA', 500:'#2880E3' },
  neutral:  { 0:'#FFFFFF', 50:'#F7F9FB', 100:'#EEF2F6', 300:'#B8C4D0',
              500:'#6B7A8D', 700:'#3B4A5A', 900:'#0F1923' },
  success:  { 100:'#DCFCE7', 500:'#22C55E' },
  warning:  { 100:'#FEF3C7', 500:'#F59E0B' },
  danger:   { 100:'#FEE2E2', 500:'#EF4444' },
};

export const FontSize = { xs:10, sm:12, base:14, md:16, lg:18, xl:20 };

export const FontFamily = {
  regular:  'Poppins_400Regular',
  medium:   'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold:     'Poppins_700Bold',
};

export const Radius  = { sm:6, md:10, lg:14, xl:20, full:9999 };
export const Spacing = { 1:4, 2:8, 3:12, 4:16, 5:20, 6:24, 8:32, 10:40 };
```

---

*Design System versi 1.0 — Aplikasi Absensi Karyawan*