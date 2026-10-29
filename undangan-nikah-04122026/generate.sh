#!/bin/bash

# Daftar nama folder dan nama tamu yang diinginkan
# Format: "nama-folder|Nama Tamu yang Tampil"
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

# Pastikan folder tujuan ada
mkdir -p "$TARGET_DIR"

# Loop melalui daftar tamu
for item in "${DAFTAR_TAMU[@]}"; do
  # Pisahkan nama folder dan nama tamu berdasarkan karakter '|'
  FOLDER_NAME="${item%%|*}"
  GUEST_NAME="${item##*|}"
  
  # Buat folder tamu
  mkdir -p "$TARGET_DIR/$FOLDER_NAME"
  
  # Salin template dan ganti teks TAMU_UNDANGAN dengan nama tamu
  # Menggunakan '|' sebagai delimiter sed -i agar aman untuk string dengan spasi
  sed "s|TAMU_UNDANGAN|$GUEST_NAME|g" "$TEMPLATE" > "$TARGET_DIR/$FOLDER_NAME/index.html"
  
  echo "Berhasil membuat: $TARGET_DIR/$FOLDER_NAME/index.html untuk $GUEST_NAME"
done

echo "Selesai! Semua folder tamu telah dibuat."