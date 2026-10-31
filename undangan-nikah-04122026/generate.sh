#!/bin/bash
# =====================================================================
# generate.sh - membuat halaman undangan per tamu dari template.html
#
# Cara pakai (jalankan dari folder yang berisi template.html):
#   bash generate.sh
#
# Hasil: undangan-nikah-04122026/<nama-folder>/index.html untuk setiap tamu.
# Yang diunggah ke GitHub: folder undangan-nikah-04122026 (bersama
# index.html, style.css, script.js, assets, CNAME di root).
# JANGAN unggah template.html dan generate.sh: keduanya memuat daftar tamu
# dan isi template yang tidak perlu bisa dibuka publik.
# =====================================================================

set -u

# Daftar nama folder dan nama tamu yang diinginkan
# Format: "nama-folder|Nama Tamu yang Tampil"
# nama-folder: huruf kecil, angka, dan tanda hubung saja.
DAFTAR_TAMU=(
  "nisram-beserta-pasangan|Nisram beserta Pasangan"
  "afiifa|Afiifa"
  "zaidan|Zaidan"
  "wulan-beserta-pasangan|Wulan beserta Pasangan"
  "keluarga-besar-mbah-bawi|Keluarga Besar Mbah Bawi"
  "keluarga-besar-mbah-soeroredjo|Keluarga Besar Mbah Soeroredjo"
  "warga-besar-rt-011|Warga Besar RT 011"
  "keluarga-besar-opung|Keluarga Besar Opung"
  "om-ucok-beserta-istri|Om Ucok beserta Istri"
  "mas-rikie-beserta-istri|Mas Rikie beserta Istri"
  "mas-teguh-dan-istri|Mas Teguh beserta Istri"
  "fachri-dan-istri|Fachri beserta Istri"
  "aji-dan-istri|Aji beserta Istri"
  "ario-dan-istri|Ario beserta Istri"
  # Tambahkan baris lain di sini sesuai kebutuhan
)

# Nama file template
TEMPLATE="template.html"
# Folder tujuan utama
TARGET_DIR="undangan-nikah-04122026"
# Alamat situs (untuk daftar link di akhir)
BASE_URL="https://thasyaanggawedding.web.id"
# Halaman umum tanpa nama tamu: /undangan-nikah-04122026/  ("ya" atau "tidak")
BUAT_HALAMAN_UMUM="ya"
NAMA_HALAMAN_UMUM="Tamu Undangan"

PLACEHOLDER="TAMU_UNDANGAN"

# Hapus dulu folder hasil generate LOKAL sebelum membuat ulang, agar tidak ada
# sisa halaman lama di komputer ("ya" atau "tidak"). Tidak menyentuh GitHub.
HAPUS_FOLDER_LAMA="ya"
# File daftar link untuk dikirim ke tamu (dibuat di folder ini, JANGAN diunggah)
FILE_DAFTAR_LINK="daftar-link.txt"

# ---------------------------------------------------------------------
# Pemeriksaan awal
# ---------------------------------------------------------------------
if [ ! -f "$TEMPLATE" ]; then
  echo "GAGAL: $TEMPLATE tidak ditemukan di folder ini ($(pwd))."
  exit 1
fi

JUMLAH_PLACEHOLDER=$(grep -c "$PLACEHOLDER" "$TEMPLATE")
if [ "$JUMLAH_PLACEHOLDER" -ne 1 ]; then
  echo "GAGAL: $TEMPLATE harus memuat tepat satu teks $PLACEHOLDER (ditemukan: $JUMLAH_PLACEHOLDER)."
  echo "       Letakkan di: <strong id=\"guestName\">$PLACEHOLDER</strong>"
  exit 1
fi

# Escape teks agar aman sebagai HTML, lalu aman sebagai pengganti di sed
html_escape() {
  printf '%s' "$1" | sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' -e 's/"/\&quot;/g'
}
sed_escape() {
  printf '%s' "$1" | sed -e 's/[\\/&|]/\\&/g'
}

buat_halaman() {
  local folder_path="$1" nama="$2"
  local aman
  aman=$(sed_escape "$(html_escape "$nama")")
  local stempel
  stempel="<!-- generate.sh | folder: ${folder_path#$TARGET_DIR} | $(date '+%Y-%m-%d %H:%M') -->"
  mkdir -p "$folder_path"
  # Ganti placeholder, lalu sisipkan stempel setelah <head> (untuk mengecek versi file di GitHub)
  sed "s|$PLACEHOLDER|$aman|g" "$TEMPLATE" | awk -v s="$stempel" '{ print } !d && /<head>/ { print "  " s; d = 1 }' > "$folder_path/index.html"
  if grep -q "$PLACEHOLDER" "$folder_path/index.html"; then
    echo "GAGAL: placeholder masih tersisa di $folder_path/index.html"
    exit 1
  fi
}

# ---------------------------------------------------------------------
# Periksa daftar tamu sebelum membuat apa pun
# ---------------------------------------------------------------------
SUDAH_ADA="|"   # daftar folder yang sudah dipakai (kompatibel bash 3.2 di macOS)
GALAT=0
for item in "${DAFTAR_TAMU[@]}"; do
  item="${item%$'\r'}"
  if [[ "$item" != *"|"* ]]; then
    echo "GAGAL: baris tanpa tanda '|': $item"; GALAT=1; continue
  fi
  folder="${item%%|*}"
  nama="${item#*|}"
  if [[ ! "$folder" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
    echo "GAGAL: nama folder tidak valid (hanya huruf kecil, angka, tanda hubung): '$folder'"; GALAT=1
  fi
  if [ -z "${nama// /}" ]; then
    echo "GAGAL: nama tamu kosong untuk folder '$folder'"; GALAT=1
  fi
  if [[ "$SUDAH_ADA" == *"|$folder|"* ]]; then
    echo "GAGAL: nama folder ganda: '$folder'"; GALAT=1
  fi
  SUDAH_ADA="$SUDAH_ADA$folder|"
done
if [ "$GALAT" -ne 0 ]; then
  echo "Perbaiki daftar tamu di atas, lalu jalankan ulang. Tidak ada file yang dibuat."
  exit 1
fi

# ---------------------------------------------------------------------
# Buat halaman
# ---------------------------------------------------------------------
if [ "$HAPUS_FOLDER_LAMA" = "ya" ] && [ -d "$TARGET_DIR" ]; then
  if [[ "$TARGET_DIR" =~ ^[A-Za-z0-9._-]+$ ]] && [ "$TARGET_DIR" != "." ] && [ "$TARGET_DIR" != ".." ]; then
    rm -rf "./$TARGET_DIR"
    echo "Folder lokal lama dihapus: $TARGET_DIR (hasil generate sebelumnya)"
  else
    echo "GAGAL: TARGET_DIR tidak aman untuk dihapus: '$TARGET_DIR'"; exit 1
  fi
fi

mkdir -p "$TARGET_DIR"

if [ "$BUAT_HALAMAN_UMUM" = "ya" ]; then
  buat_halaman "$TARGET_DIR" "$NAMA_HALAMAN_UMUM"
  echo "Berhasil membuat: $TARGET_DIR/index.html (halaman umum: $NAMA_HALAMAN_UMUM)"
fi

JUMLAH=0
for item in "${DAFTAR_TAMU[@]}"; do
  item="${item%$'\r'}"
  folder="${item%%|*}"
  nama="${item#*|}"
  buat_halaman "$TARGET_DIR/$folder" "$nama"
  echo "Berhasil membuat: $TARGET_DIR/$folder/index.html untuk $nama"
  JUMLAH=$((JUMLAH + 1))
done

echo ""
echo "Memeriksa hasil..."
GALAT=0
periksa() {
  local file="$1" nama="$2" aman
  aman=$(html_escape "$nama")
  if [ ! -f "$file" ]; then
    echo "  SALAH: $file tidak ada"; GALAT=1; return
  fi
  if ! grep -qF "<strong id=\"guestName\">$aman</strong>" "$file"; then
    echo "  SALAH: nama di $file tidak sesuai (seharusnya: $nama)"; GALAT=1
  fi
}
if [ "$BUAT_HALAMAN_UMUM" = "ya" ]; then
  periksa "$TARGET_DIR/index.html" "$NAMA_HALAMAN_UMUM"
fi
for item in "${DAFTAR_TAMU[@]}"; do
  item="${item%$'\r'}"
  periksa "$TARGET_DIR/${item%%|*}/index.html" "${item#*|}"
done
if [ "$GALAT" -ne 0 ]; then
  echo "Ada halaman yang tidak sesuai. Jangan unggah sebelum diperbaiki."
  exit 1
fi
echo "  OK: semua halaman memuat nama tamu yang benar."

echo ""
echo "Selesai! $JUMLAH halaman tamu telah dibuat."
echo ""
echo "Daftar link:"
: > "$FILE_DAFTAR_LINK"
for item in "${DAFTAR_TAMU[@]}"; do
  item="${item%$'\r'}"
  folder="${item%%|*}"
  nama="${item#*|}"
  echo "  $nama -> $BASE_URL/$TARGET_DIR/$folder/"
  echo "$nama -> $BASE_URL/$TARGET_DIR/$folder/" >> "$FILE_DAFTAR_LINK"
done
echo ""
echo "Daftar link juga disimpan di: $FILE_DAFTAR_LINK (jangan diunggah ke GitHub)."
echo ""
echo "LANGKAH BERIKUTNYA:"
echo "  1. Unggah folder $TARGET_DIR ke repositori GitHub (timpa file lama)."
echo "  2. Hapus di GitHub folder tamu lama yang tidak ada di daftar di atas."
echo "  3. Tunggu workflow 'pages build and deployment' hijau, uji di incognito."
echo "  4. Cek versi file di GitHub: buka index.html tamu, cari baris 'generate.sh | folder:'."