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
# JANGAN unggah template.html, generate.sh, tidak-tersedia.html, dan daftar-link.txt:
# semuanya hanya untuk komputer Anda (memuat daftar tamu).
# =====================================================================

set -u

# Daftar nama folder dan nama tamu yang diinginkan
# Format: "nama-folder|Nama Tamu yang Tampil"
# nama-folder: huruf kecil, angka, dan tanda hubung saja.
DAFTAR_TAMU=(
  # --- Tamu Thasya (39 Tamu) ---
  "nisram-beserta-pasangan|Nisram beserta Pasangan"
  "afiifa-muharani|Afiifa Muharani"
  "zaidan|Zaidan"
  "wulan-beserta-pasangan|Wulan beserta Pasangan"
  "fifi-beserta-pasangan|Fifi beserta Pasangan"
  "dillast-primulyo|Dillast Primulyo"
  "citra-beserta-suami|Citra beserta Suami"
  "arini-beserta-pasangan|Arini beserta Pasangan"
  "kak-ayu-beserta-suami|Kak Ayu beserta Suami"
  "vevi-beserta-suami|Vevi beserta Suami"
  "alfrida-febriana|Alfrida Febriana"
  "ghaida-beserta-pasangan|Ghaida beserta Pasangan"
  "sofi-beserta-suami|Sofi beserta Suami"
  "elfira-beserta-pasangan|Elfira beserta Pasangan"
  "wanda-beserta-pasangan|Wanda beserta Pasangan"
  "hera-beserta-suami|Hera beserta Suami"
  "nadya-beserta-pasangan|Nadya beserta Pasangan"
  # --- Tamu Mama Angga (39 Tamu) ---
  "keluarga-besar-mbah-bawi|Keluarga Besar Mbah Bawi"
  "keluarga-besar-mbah-soeroredjo|Keluarga Besar Mbah Soeroredjo"
  "warga-besar-rt-011|Warga Besar RT 011"
  "keluarga-besar-opung|Keluarga Besar Opung"
  "om-ucok-beserta-istri|Om Ucok beserta Istri"
 # --- Tamu Mama Thasya (39 Tamu) ---
    "ibu-hj-asnil-beserta-suami|Ibu Hj Asnil beserta Suami"
    "bapak-dedy-beserta-istri|Bapak Dedy beserta Istri"
    "ibu-icah|Ibu Icah"
    "ibu-hj-nana-nurhasanah|Ibu Hj Nana Nurhasanah"
    "ibu-hj-mulyawati|Ibu Hj Mulyawati"
    "bapak-bobby-beserta-istri|Bapak Bobby beserta Istri"
    "bapak-ary-beserta-istri|Bapak Ary beserta Istri"
    "bapak-dadang-beserta-istri|Bapak Dadang beserta Istri"
    "bapak-irfan-beserta-istri|Bapak Irfan beserta Istri"
    "ibu-giska-beserta-suami|Ibu Giska beserta Suami"
    "ibu-tiara-beserta-suami|Ibu Tiara beserta Suami"
    "bapak-hanif-beserta-istri|Bapak Hanif beserta Istri"
    "rifki-beserta-partner|Rifki beserta Partner"
    "ibu-yola-beserta-suami|Ibu Yola beserta Suami"
    "bapak-adi-beserta-istri|Bapak Adi beserta Istri"
    "ibu-tia-beserta-suami|Ibu Tia beserta Suami"
    "bapak-dady-beserta-istri|Bapak Dady beserta Istri"
    "meli-beserta-partner|Meli beserta Partner"
    "septi-beserta-partner|Septi beserta Partner"
    "irfan-beserta-partner|Irfan beserta Partner"
    "ibu-hj-ai|Ibu Hj Ai"
    "bapak-iman-beserta-istri|Bapak Iman beserta Istri"
    "bapak-deny-beserta-istri|Bapak Deny beserta Istri"
    "ibu-mira-beserta-suami|Ibu Mira beserta Suami"
    "ibu-ria|Ibu Ria"
    "bapak-deden-beserta-istri|Bapak Deden beserta Istri"
    "bapak-mamat-beserta-istri|Bapak Mamat beserta Istri"
    "bapak-usuf-beserta-istri|Bapak Usuf beserta Istri"
    "ibu-ipa-beserta-suami|Ibu Ipa beserta Suami"
    "ibu-irma-beserta-suami|Ibu Irma beserta Suami"
    "bapak-sidik|Bapak Sidik"
    "bapak-muji-beserta-istri|Bapak Muji beserta Istri"
    "nok|Nok"
    "ibu-ade-juji-beserta-suami|Ibu Ade Juji beserta Suami"
    "ibu-anggie-beserta-suami|Ibu Anggie beserta Suami"
    "bapak-wawan-beserta-istri|Bapak Wawan beserta Istri"
    "mama-widi|Mama Widi"
    "bapak-diden-beserta-istri|Bapak Diden beserta Istri"
    "bapak-alip-beserta-istri|Bapak Alip beserta Istri"
    "bapak-yusuf-beserta-istri|Bapak Yusuf beserta Istri"
    "bapak-hilman-beserta-istri|Bapak Hilman beserta Istri"
    "ibu-melati-tampubolon|Ibu Melati Tampubolon"
    "ibu-dimas-beserta-suami|Ibu Dimas beserta Suami"
    "bapak-sodiq-beserta-istri|Bapak Sodiq beserta Istri"
    "ibu-evie-kurniawati|Ibu Evie Kurniawati"
  # --- Tamu Angga (33 Tamu) ---
  "yoanita-beserta-suami|Yoanita beserta Suami"
  "angga-beserta-istri|Angga beserta Istri"
  "george-beserta-pasangan|George beserta Pasangan"
  "muhammad-gibran|Muhammad Gibran"
  "arif-fauzi-jasminto|Arif Fauzi Jasminto"
  "m-sadam-rizky-bastari|M. Sadam Rizky Bastari"
  "muhammad-daris-mulkiyah|Muhammad Daris Mulkiyah"
  "sarah-fanny|Sarah Fanny"
  "akbar-beserta-istri|Akbar beserta Istri"
  "livia-beserta-suami|Livia beserta Suami"
  "igo-beserta-istri|Igo beserta Istri"
  "om-yudi-beserta-istri|Om Yudi beserta Istri"
  "mas-rikie-beserta-istri|Mas Rikie beserta Istri"
  "mas-teguh-dan-istri|Mas Teguh beserta Istri"
  "fachri-dan-istri|Fachri beserta Istri"
  "aji-dan-istri|Aji beserta Istri"
  "ario-dan-istri|Ario beserta Istri"
  "om-joni-dan-tante-maya|Om Joni dan Tante Maya"
  # Tambahkan baris lain di sini sesuai kebutuhan
)

# Nama file template
TEMPLATE="template.html"
# Folder tujuan utama
TARGET_DIR="undangan-nikah-04122026"
# Alamat situs (untuk daftar link di akhir)
BASE_URL="https://thasyaanggawedding.web.id"
# Isi alamat tanpa nama tamu: /undangan-nikah-04122026/
#   "tidak-tersedia" = tampil "Halaman Tidak Tersedia" (undangan hanya bisa dibuka lewat link tamu)  <- disarankan
#   "tamu"           = tampil undangan dengan nama NAMA_HALAMAN_UMUM
#   "tidak"          = tidak membuat halaman (GitHub menampilkan 404)
HALAMAN_UMUM="tidak-tersedia"
NAMA_HALAMAN_UMUM="Tamu Undangan"
# File halaman "Halaman Tidak Tersedia" (harus berada di folder yang sama dengan generate.sh)
FILE_TIDAK_TERSEDIA="tidak-tersedia.html"

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

case "$HALAMAN_UMUM" in
  tamu|tidak-tersedia|tidak) ;;
  *) echo "GAGAL: HALAMAN_UMUM harus 'tidak-tersedia', 'tamu', atau 'tidak' (sekarang: '$HALAMAN_UMUM')."; exit 1 ;;
esac
if [ "$HALAMAN_UMUM" = "tidak-tersedia" ]; then
  if [ ! -f "$FILE_TIDAK_TERSEDIA" ]; then
    echo "GAGAL: $FILE_TIDAK_TERSEDIA tidak ditemukan di folder ini ($(pwd))."
    echo "       Letakkan file 'Halaman Tidak Tersedia' di sini, atau ubah HALAMAN_UMUM."
    exit 1
  fi
  if ! grep -q "Halaman Tidak Tersedia" "$FILE_TIDAK_TERSEDIA" || grep -q "guestName" "$FILE_TIDAK_TERSEDIA"; then
    echo "GAGAL: $FILE_TIDAK_TERSEDIA bukan halaman 'Halaman Tidak Tersedia' yang benar."
    echo "       (Mungkin file undangan tamu yang tertukar.)"
    exit 1
  fi
fi

# Template lama masih memuat penulisan tanggal tidak formal ("Jum'at", "04 Desember").
# Hentikan agar halaman tamu tidak dibuat dari template yang salah.
PERIKSA_TANGGAL_FORMAL="ya"
if [ "$PERIKSA_TANGGAL_FORMAL" = "ya" ]; then
  if grep -q "Jum'at" "$TEMPLATE" || grep -q "04 Desember" "$TEMPLATE" || grep -q "<span>04</span>" "$TEMPLATE"; then
    echo "GAGAL: $TEMPLATE masih memuat penulisan tanggal lama (Jum'at / 04 Desember)."
    echo "       Ganti dengan template.html terbaru (penulisan: Jumat, 4 Desember 2026)."
    exit 1
  fi
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

buat_halaman_tidak_tersedia() {
  local stempel
  stempel="<!-- generate.sh | halaman umum: tidak tersedia | $(date '+%Y-%m-%d %H:%M') -->"
  mkdir -p "$TARGET_DIR"
  awk -v s="$stempel" '{ print } !d && /<head>/ { print "  " s; d = 1 }' "$FILE_TIDAK_TERSEDIA" > "$TARGET_DIR/index.html"
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

if [ "$HALAMAN_UMUM" = "tamu" ]; then
  buat_halaman "$TARGET_DIR" "$NAMA_HALAMAN_UMUM"
  echo "Berhasil membuat: $TARGET_DIR/index.html (halaman umum: $NAMA_HALAMAN_UMUM)"
elif [ "$HALAMAN_UMUM" = "tidak-tersedia" ]; then
  buat_halaman_tidak_tersedia
  echo "Berhasil membuat: $TARGET_DIR/index.html (Halaman Tidak Tersedia)"
else
  echo "Halaman umum tidak dibuat (HALAMAN_UMUM=tidak)."
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
if [ "$HALAMAN_UMUM" = "tamu" ]; then
  periksa "$TARGET_DIR/index.html" "$NAMA_HALAMAN_UMUM"
elif [ "$HALAMAN_UMUM" = "tidak-tersedia" ]; then
  if [ ! -f "$TARGET_DIR/index.html" ] || ! grep -q "Halaman Tidak Tersedia" "$TARGET_DIR/index.html" || grep -q "guestName" "$TARGET_DIR/index.html"; then
    echo "  SALAH: $TARGET_DIR/index.html bukan 'Halaman Tidak Tersedia'"; GALAT=1
  fi
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