/**
 * Path kanonik endpoint backend, relatif terhadap /api.
 *
 * Mount path backend dibentuk dari nama file route: akhiran Route.js
 * atau Routes.js dibuang lalu di-lowercase (routes/index.js). Express
 * tidak membedakan huruf besar kecil, tetapi frontend memakai satu
 * bentuk kanonik agar tidak ada lagi variasi penulisan yang tersebar.
 *
 * Sumber: docs/kontrak/endpoint.md bagian 3.
 */

export const EP = {
  akun: {
    login: "/akun/auth/login",
    logout: "/akun/auth/logout",
    refresh: "/akun/auth/refreshtoken",
  },
  pengguna: {
    list: "/pengguna",
    detail: (id: string) => `/pengguna/${id}`,
    pinLogin: "/pengguna/pin-login",
    pinLogout: "/pengguna/pin-logout",
    pinRefresh: "/pengguna/pin-refresh",
    register: "/pengguna/register-pengguna",
  },
  role: {
    list: "/role",
    detail: (id: string) => `/role/${id}`,
  },
  permission: {
    list: "/permission",
  },

  produk: {
    list: "/produk",
    detail: (id: string) => `/produk/${id}`,
  },
  kategori: {
    list: "/kategori",
    detail: (id: string) => `/kategori/${id}`,
  },
  bahanBaku: {
    list: "/bahanbaku",
    detail: (id: string) => `/bahanbaku/${id}`,
  },
  produkPajak: {
    list: "/produkpajak",
    byTarget: (targetId: string) => `/produkpajak/${targetId}`,
    detail: (id: string) => `/produkpajak/${id}`,
  },
  pajak: {
    list: "/pajak",
    detail: (id: string) => `/pajak/${id}`,
  },
  diskon: {
    list: "/diskon",
    detail: (id: string) => `/diskon/${id}`,
  },

  penjualan: {
    list: "/penjualan",
    detail: (id: string) => `/penjualan/${id}`,
  },
  pembayaran: "/pembayaran",
  metodePembayaran: {
    list: "/metodepembayaran",
    detail: (id: string) => `/metodepembayaran/${id}`,
  },
  akunKas: "/akunkas",
  pelanggan: {
    list: "/pelanggan",
    detail: (id: string) => `/pelanggan/${id}`,
  },

  aset: {
    list: "/aset",
    detail: (id: string) => `/aset/${id}`,
  },
  tipeAset: {
    list: "/tipeaset",
    detail: (id: string) => `/tipeaset/${id}`,
  },
  tarif: {
    list: "/tarif",
    detail: (id: string) => `/tarif/${id}`,
  },
  sesiBooking: "/sesibooking",

  location: {
    list: "/location",
    current: "/location/current",
  },
  inventory: {
    list: "/inventory",
    minimumStok: (id: string) => `/inventory/${id}/minimum-stok`,
    opname: (id: string) => `/inventory/${id}/opname`,
  },
  jurnalStok: "/jurnalstok",
  stockOpname: {
    list: "/stockopname",
    detail: (id: string) => `/stockopname/${id}`,
    adjustments: "/stockopname/adjustments",
    adjustmentDetail: (id: string) => `/stockopname/adjustments/${id}`,
    items: (id: string) => `/stockopname/${id}/items`,
    submit: (id: string) => `/stockopname/${id}/submit`,
    approve: (id: string) => `/stockopname/${id}/approve`,
    reject: (id: string) => `/stockopname/${id}/reject`,
    cancel: (id: string) => `/stockopname/${id}/cancel`,
  },
  pengajuanStok: {
    list: "/pengajuanstok",
    detail: (id: string) => `/pengajuanstok/${id}`,
    submit: (id: string) => `/pengajuanstok/${id}/submit`,
    approve: (id: string) => `/pengajuanstok/${id}/approve`,
    reject: (id: string) => `/pengajuanstok/${id}/reject`,
  },
  transferStok: {
    list: "/transferstok",
    detail: (id: string) => `/transferstok/${id}`,
    kirim: (id: string) => `/transferstok/${id}/kirim`,
    terima: (id: string) => `/transferstok/${id}/terima`,
    batal: (id: string) => `/transferstok/${id}/batal`,
  },

  shift: {
    list: "/shift",
    detail: (id: string) => `/shift/${id}`,
  },
  polaRoster: {
    list: "/polaroster",
    detail: (id: string) => `/polaroster/${id}`,
  },
  jadwalShift: {
    list: "/jadwalshift",
    detail: (id: string) => `/jadwalshift/${id}`,
    bulk: "/jadwalshift/bulk",
  },
  absensi: {
    monitoring: "/absensi/monitoring",
  },

  laporan: {
    labaRugi: "/laporan/laba-rugi",
  },
} as const;