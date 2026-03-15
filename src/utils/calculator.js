import { supabase } from '../supabaseClient';

export const calculateQuarterlyResults = async (quarter) => {
  try {
    // 1. DATA FETCHING: Eksekusi Pararel (O(1) Network Call)
    // Menarik data User (Hanya Staff/TL Aktif), Penilaian EB, dan Absensi Sekretaris
    const [usersRes, assessRes, attendRes] = await Promise.all([
      supabase.from('users')
        .select('id, full_name, dept, role, division, position, cohort, photo_url')
        .eq('role', 5)
        .eq('is_active', true),
      supabase.from('assessments').select('*').eq('quarter', quarter),
      supabase.from('attendance').select('*').eq('quarter', quarter)
    ]);

    if (usersRes.error) throw usersRes.error;
    if (assessRes.error) throw assessRes.error;
    if (attendRes.error) throw attendRes.error;

    const users = usersRes.data || [];
    const assessments = assessRes.data || [];
    const attendance = attendRes.data || [];

    // 2. HASH MAPPING: Akses Cepat O(1) untuk Absensi
    const attendMap = {};
    attendance.forEach(a => {
      const present = a.total_present || 0;
      const total = a.total_events || 0;
      // Konversi ke persentase (Mencegah NaN jika pembagian 0)
      attendMap[a.target_id] = total > 0 ? (present / total) * 100 : 0;
    });

    // 3. AGREGASI DATA KUALITATIF: Rata-rata Penilaian EB (O(M))
    // Jika ada 2 Kadiv/Kadep yang menilai 1 Staff, nilainya harus dirata-ratakan
    const assessMap = {};
    assessments.forEach(a => {
      if (!assessMap[a.target_id]) {
        assessMap[a.target_id] = { count: 0, attitude: 0, discipline: 0, active: 0, agility: 0, cheerful: 0 };
      }
      // Asumsi: Nilai di DB sudah dikonversi skala 20-100 saat submit
      assessMap[a.target_id].attitude += a.attitude;
      assessMap[a.target_id].discipline += a.discipline;
      assessMap[a.target_id].active += a.active;
      assessMap[a.target_id].agility += a.agility;
      assessMap[a.target_id].cheerful += a.cheerful;
      assessMap[a.target_id].count += 1;
    });

    // 4. KALKULASI BLUEPRINT MUTLAK (O(N))
    const results = users.map(user => {
      const uAttend = attendMap[user.id] || 0; // Metrik Kuantitatif
      const uAssess = assessMap[user.id];

      // Kalkulasi Rata-rata dari EB. Jika belum dinilai, fallback ke 0.
      const avg = uAssess ? {
        attitude: uAssess.attitude / uAssess.count,
        discipline: uAssess.discipline / uAssess.count,
        active: uAssess.active / uAssess.count,
        agility: uAssess.agility / uAssess.count,
        cheerful: uAssess.cheerful / uAssess.count,
      } : { attitude: 0, discipline: 0, active: 0, agility: 0, cheerful: 0 };

      // ==========================================
      // RUMUS MATEMATIKA BLUEPRINT TSA USU 2026
      // ==========================================
      const theReliableOne = (0.50 * uAttend) + (0.50 * avg.discipline);
      const theHighAchiever = (0.60 * avg.agility) + (0.40 * avg.active);
      const theSpark = (0.60 * avg.cheerful) + (0.40 * avg.attitude);
      
      const avgQualitative = (avg.attitude + avg.discipline + avg.active + avg.agility + avg.cheerful) / 5;
      const theUltimateMVP = (0.75 * avgQualitative) + (0.25 * uAttend);

      return {
        ...user,
        attendanceScore: uAttend,
        qualitativeScore: avgQualitative,
        theReliableOne,
        theHighAchiever,
        theSpark,
        theUltimateMVP
      };
    });

    // 5. KALKULASI BEST DEPARTMENT (Rata-rata MVP per Kapita)
    const deptMap = {};
    results.forEach(r => {
      // General dept di-skip agar tidak merusak metrik departemen resmi
      if (r.dept && r.dept !== 'General' && r.dept !== '-') {
        if (!deptMap[r.dept]) deptMap[r.dept] = { totalMVP: 0, count: 0 };
        deptMap[r.dept].totalMVP += r.theUltimateMVP;
        deptMap[r.dept].count += 1;
      }
    });

    const deptResults = Object.keys(deptMap).map(dept => ({
      dept,
      score: deptMap[dept].totalMVP / deptMap[dept].count
    }));

    // 6. SORTING & OUTPUT (Mencari Nilai Tertinggi dengan Syarat > 0)
    
    // Helper function: Hanya ambil juara pertama JIKA skornya lebih dari 0
    const getWinner = (arr, scoreKey) => {
      const sorted = [...arr].sort((a, b) => b[scoreKey] - a[scoreKey]);
      return sorted.length > 0 && sorted[0][scoreKey] > 0 ? sorted[0] : null;
    };

    return {
      reliable: getWinner(results, 'theReliableOne'),
      achiever: getWinner(results, 'theHighAchiever'),
      spark: getWinner(results, 'theSpark'),
      mvp: getWinner(results, 'theUltimateMVP'),
      bestDept: getWinner(deptResults, 'score'),
      allScores: results // Data mentah ini akan dipakai untuk Report Pribadi Staff & Export CSV
    };

  } catch (error) {
    console.error("Calculator Engine Error:", error);
    return null;
  }
};