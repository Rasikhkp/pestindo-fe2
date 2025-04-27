// Service report types
export const SERVICE_REPORT_TYPES = [
    { value: "Initial", label: "Initial", description: "Service report inisialisasi" },
    { value: "Regular", label: "Regular", description: "Service report rutin" },
    { value: "Extra", label: "Extra", description: "Service report tambahan" },
]

// Location options
export const LOCATION_OPTIONS = [
    { value: "all_area_taman", label: "All area taman" },
    { value: "garasi", label: "Garasi" },
    { value: "ruang_tamu", label: "Ruang Tamu" },
    { value: "ruang_keluarga", label: "Ruang Keluarga" },
    { value: "kamar_tidur", label: "Kamar Tidur" },
    { value: "kamar_mandi", label: "Kamar mandi / Toilet" },
    { value: "dapur", label: "Dapur / Kitchen" },
    { value: "ruang_makan", label: "Ruang Makan / Dinning Room" },
    { value: "bawah_tangga", label: "Bawah Tangga" },
    { value: "gudang", label: "Gudang" },
    { value: "all_lt_1", label: "All Lt 1" },
    { value: "all_lt_2", label: "All Lt 2" },
    { value: "tempat_sampah", label: "Tempat Sampah" },
    { value: "bak_kontrol", label: "Bak Kontrol" },
    { value: "mushola", label: "Mushola" },
    { value: "office", label: "Office" },
    { value: "cashier", label: "Cashier" },
    { value: "parkiran", label: "Parkiran" },
    { value: "area_cuci", label: "Area Cuci" },
    { value: "bar", label: "Bar" },
    { value: "dapur_kotor", label: "Dapur Kotor" },
    { value: "dapur_bersih", label: "Dapur Bersih" },
    { value: "sisi_dalam_pagar", label: "Sisi dalam pagar" },
    { value: "tambah", label: "Tambah jika tidak ada" },
]

// Pest options
export const PEST_OPTIONS = [
    { value: "RT", label: "Rayap Tanah (RT)" },
    { value: "RK", label: "Rayap Kayu (RK)" },
    { value: "SK", label: "Sesrek (SK)" },
    { value: "KK", label: "Kumbang Kayu (KK)" },
    { value: "TR", label: "Tikus Rumah (TR)" },
    { value: "TG", label: "Tikus Got (TG)" },
    { value: "TA", label: "Tikus Atap (TA)" },
    { value: "N", label: "Nyamuk (N)" },
    { value: "K", label: "Kecoa (K)" },
    { value: "S", label: "Semut (S)" },
]

// Action options
export const ACTION_OPTIONS = [
    { value: "B", label: "B - Baiting" },
    { value: "SP", label: "SP - Spraying" },
    { value: "IJ", label: "IJ - Injeksi" },
    { value: "ST", label: "ST - Spot Treatmeat" },
    { value: "MT", label: "MT - Misting" },
]

// Equipment options
export const EQUIPMENT_OPTIONS = [
    { value: "IG", label: "IG - In Ground" },
    { value: "PBS", label: "PBS - Pestindo Bait Station" },
    { value: "PS", label: "PS - Power Sprayer" },
    { value: "PIT", label: "PIT - Pestindo Insect Trap" },
    { value: "SC", label: "SC - Sticky Pad" },
    { value: "GT", label: "GT - Glue Trap" },
    { value: "BR", label: "BR - Bar" },
    { value: "MB", label: "MB - Misting Blower" },
    { value: "HF", label: "HF - Hot Fogger" },
    { value: "CF", label: "CF - Cold Fogger" },
    { value: "AG", label: "AG - Above Ground" },
    { value: "PTS", label: "PTS - Pestindo Trap Station" },
    { value: "PTM", label: "PTM - Pestindo Termite Monitoring" },
    { value: "HS", label: "HS - Hand Sprayer" },
]

// Chemical options
export const CHEMICAL_OPTIONS = [
    { value: "Imidacropid", label: "Imidacropid", unit: "ml/L air" },
    { value: "Fipronil", label: "Fipronil", unit: "ml/L air" },
    { value: "Sipermethrin", label: "Sipermethrin", unit: "ml/Lt air" },
    { value: "Brodifakum", label: "Brodifakum", unit: "gr/Station" },
    { value: "Lem", label: "Lem", unit: "ml/Station" },
    { value: "Sipermethrin Solar", label: "Sipermethrin", unit: "ml/Lt Solar" },
    { value: "Gel Kecoa", label: "Gel Kecoa", unit: "" },
    { value: "Gel Semut", label: "Gel Semut", unit: "" },
    { value: "Agita Musca", label: "Agita Musca", unit: "" },
    { value: "Down", label: "Down", unit: "" },
    { value: "Play Bait", label: "Play Bait", unit: "" },
    { value: "Tenopa", label: "Tenopa", unit: "ml/Lt air" },
]

// Bill chemical options
export const BILL_CHEMICAL_OPTIONS = [
    { value: "imidacropid_0.5", label: "Imidacropid 0,5ml/L air" },
    { value: "fipronil_2.5", label: "Fipronil 2,5ml/L air" },
    { value: "sipermethrin_20", label: "Sipermethrin 20ml/Lt air" },
    { value: "brodifakum_10", label: "Brodifakum 10gr/Station" },
    { value: "lem_20", label: "Lem 20ml/Station" },
    { value: "sipermethrin_20_solar", label: "Sipermethrin 20ml/Lt Solar" },
    { value: "gel_kecoa", label: "Gel Kecoa" },
    { value: "gel_semut", label: "Gel Semut" },
    { value: "agita_musca", label: "Agita Musca" },
    { value: "down", label: "Down" },
    { value: "play_bait", label: "Play Bait" },
    { value: "tenopa_5", label: "Tenopa 5ml/Lt air" },
    { value: "tenopa_10", label: "Tenopa 10ml/Lt air" },
    { value: "tenopa_20", label: "Tenopa 20ml/Lt air" },
]
