export function generateSeedData() {
  // Tambahkan pengacak ekstra untuk menghindari bentrok milidetik jika worker paralel hidup lagi
  const ts = Date.now() + Math.floor(Math.random() * 10000);

  return {
    testAkun: {
      username: `testuser_${ts}`,
      email: `test_${ts}@gmail.com`,
      password: "password123",
      deviceID: `device-test-${ts}`,
    },
    testToko: {
      namaToko: `Toko Test ${ts}`,
    },
    testOwner: {
      nama: `owner_${ts}`,
      pin: "111111",
    },
    testRole: {
      namaRole: `Kasir_${ts}`,
      deskripsi: "Role kasir harian",
    }
  };
}