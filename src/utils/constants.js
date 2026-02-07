// Daftar Role sesuai Database
export const ROLES = {
  ADMIN: 'admin',
  BPH: 'bph',
  ADVISORY: 'advisory',
  KADEP: 'kadep', // Termasuk Wakadep & Kadiv
  MEMBER: 'member'
};

// Kelompok Role untuk Logika Izin Akses
export const PERMISSIONS = {
  // Siapa yang boleh melihat hasil Real-time (Tanpa nunggu publish)
  CAN_VIEW_REALTIME_RESULTS: ['admin', 'bph', 'advisory'],
  
  // Siapa yang tugasnya menilai General Attitude (Semua Pengurus Inti)
  CAN_JUDGE_ATTITUDE: ['bph', 'advisory', 'kadep'],
  
  // Siapa yang tugasnya menilai Kinerja Tim (Hanya Leader)
  CAN_JUDGE_TEAM: ['kadep']
};