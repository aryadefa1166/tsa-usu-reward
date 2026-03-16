import { supabase } from '../supabaseClient';

// ============================================================================
// 1. MESIN KALKULASI KUARTALAN (Q1 - Q4)
// ============================================================================
export const calculateQuarterlyResults = async (quarter) => {
  try {
    const [usersRes, assessRes, attendRes] = await Promise.all([
      supabase.from('users').select('id, full_name, dept, role, division, position, cohort, photo_url').eq('role', 5).eq('is_active', true),
      supabase.from('assessments').select('*').eq('quarter', quarter),
      supabase.from('attendance').select('*').eq('quarter', quarter)
    ]);

    if (usersRes.error) throw usersRes.error;
    if (assessRes.error) throw assessRes.error;
    if (attendRes.error) throw attendRes.error;

    const users = usersRes.data || [];
    const assessments = assessRes.data || [];
    const attendance = attendRes.data || [];

    // O(1) Akses Absensi
    const attendMap = {};
    attendance.forEach(a => {
      const present = a.total_present || 0;
      const total = a.total_events || 0;
      attendMap[a.target_id] = total > 0 ? (present / total) * 100 : 0;
    });

    // O(M) Agregasi Data EB
    const assessMap = {};
    assessments.forEach(a => {
      if (!assessMap[a.target_id]) {
        assessMap[a.target_id] = { count: 0, attitude: 0, discipline: 0, active: 0, agility: 0, cheerful: 0 };
      }
      assessMap[a.target_id].attitude += a.attitude;
      assessMap[a.target_id].discipline += a.discipline;
      assessMap[a.target_id].active += a.active;
      assessMap[a.target_id].agility += a.agility;
      assessMap[a.target_id].cheerful += a.cheerful;
      assessMap[a.target_id].count += 1;
    });

    // O(N) Kalkulasi Blueprint
    const results = users.map(user => {
      const uAttend = attendMap[user.id] || 0;
      const uAssess = assessMap[user.id];

      const avg = uAssess ? {
        attitude: uAssess.attitude / uAssess.count,
        discipline: uAssess.discipline / uAssess.count,
        active: uAssess.active / uAssess.count,
        agility: uAssess.agility / uAssess.count,
        cheerful: uAssess.cheerful / uAssess.count,
      } : { attitude: 0, discipline: 0, active: 0, agility: 0, cheerful: 0 };

      const theReliableOne = (0.50 * uAttend) + (0.50 * avg.discipline);
      const theHighAchiever = (0.60 * avg.agility) + (0.40 * avg.active);
      const theSpark = (0.60 * avg.cheerful) + (0.40 * avg.attitude);
      
      const avgQualitative = (avg.attitude + avg.discipline + avg.active + avg.agility + avg.cheerful) / 5;
      const theUltimateMVP = (0.75 * avgQualitative) + (0.25 * uAttend);

      return { ...user, attendanceScore: uAttend, qualitativeScore: avgQualitative, theReliableOne, theHighAchiever, theSpark, theUltimateMVP };
    });

    // Kalkulasi Best Dept
    const deptMap = {};
    results.forEach(r => {
      if (r.dept && r.dept !== 'General' && r.dept !== '-') {
        if (!deptMap[r.dept]) deptMap[r.dept] = { totalMVP: 0, count: 0 };
        deptMap[r.dept].totalMVP += r.theUltimateMVP;
        deptMap[r.dept].count += 1;
      }
    });

    const deptResults = Object.keys(deptMap).map(dept => ({
      dept, score: deptMap[dept].totalMVP / deptMap[dept].count
    }));

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
      allScores: results,
      allDeptScores: deptResults // DITAMBAHKAN UNTUK TARIKAN DATA END OF TERM
    };

  } catch (error) {
    console.error("Quarterly Engine Error:", error);
    return null;
  }
};


// ============================================================================
// 2. MESIN KALKULASI END OF TERM (HALL OF FAME 2026)
// ============================================================================
export const calculateEndOfTermResults = async () => {
  try {
    // 1. Eksekusi Tarikan Data Mutlak (Paralel)
    const [q1, q2, q3, q4, votesRes, projectsRes, usersRes] = await Promise.all([
      calculateQuarterlyResults('Q1'),
      calculateQuarterlyResults('Q2'),
      calculateQuarterlyResults('Q3'),
      calculateQuarterlyResults('Q4'),
      supabase.from('end_of_term_votes').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('users').select('*').neq('role', 1).eq('is_active', true)
    ]);

    const votes = votesRes.data || [];
    const projects = projectsRes.data || [];
    const users = usersRes.data || [];

    const quarters = [q1, q2, q3, q4];

    // ==========================================
    // A. AGREGASI RATA-RATA SISTEM (Q1-Q4)
    // ==========================================
    const userSystemAvg = {};
    const deptSystemAvg = {};

    users.forEach(u => userSystemAvg[u.id] = { total: 0, count: 0 });
    const ALL_DEPTS = ['ERBD', 'MD', 'STD'];
    ALL_DEPTS.forEach(d => deptSystemAvg[d] = { total: 0, count: 0 });

    quarters.forEach(q => {
      if (q) {
        // Ambil riwayat MVP Staff
        if (q.allScores) {
          q.allScores.forEach(u => {
            if (userSystemAvg[u.id] && u.theUltimateMVP > 0) {
              userSystemAvg[u.id].total += u.theUltimateMVP;
              userSystemAvg[u.id].count += 1;
            }
          });
        }
        // Ambil riwayat Best Dept
        if (q.allDeptScores) {
          q.allDeptScores.forEach(d => {
            if (deptSystemAvg[d.dept] && d.score > 0) {
              deptSystemAvg[d.dept].total += d.score;
              deptSystemAvg[d.dept].count += 1;
            }
          });
        }
      }
    });

    // ==========================================
    // B. PENGHITUNGAN & NORMALISASI VOTING RCV
    // ==========================================
    const votePoints = { MVP: {}, ROOKIE: {}, PROJECT: {}, FAV_EB: {} };
    const evalStars = { DEPT: {}, PROJECT: {} };
    const voterCounts = { MVP: new Set(), ROOKIE: new Set(), PROJECT: new Set(), FAV_EB: new Set() };

    votes.forEach(v => {
      // 1. Rekap Evaluasi BPH (1-5 Bintang)
      if (v.category === 'EVAL_DEPT') {
        if (!evalStars.DEPT[v.target_id]) evalStars.DEPT[v.target_id] = { total: 0, count: 0 };
        evalStars.DEPT[v.target_id].total += v.evaluation_score;
        evalStars.DEPT[v.target_id].count += 1;
      } 
      else if (v.category === 'EVAL_PROJECT') {
        if (!evalStars.PROJECT[v.target_id]) evalStars.PROJECT[v.target_id] = { total: 0, count: 0 };
        evalStars.PROJECT[v.target_id].total += v.evaluation_score;
        evalStars.PROJECT[v.target_id].count += 1;
      }
      // 2. Rekap Ranked Choice Voting
      else {
        voterCounts[v.category].add(v.voter_id);
        const mapPoints = (targetId, points) => {
          if (targetId) {
            if (!votePoints[v.category][targetId]) votePoints[v.category][targetId] = 0;
            votePoints[v.category][targetId] += points;
          }
        };

        if (v.category === 'MVP' || v.category === 'FAV_EB') {
          mapPoints(v.rank_1, 5); mapPoints(v.rank_2, 4); mapPoints(v.rank_3, 3); mapPoints(v.rank_4, 2); mapPoints(v.rank_5, 1);
        } else if (v.category === 'ROOKIE' || v.category === 'PROJECT') {
          mapPoints(v.rank_1, 3); mapPoints(v.rank_2, 2); mapPoints(v.rank_3, 1);
        }
      }
    });

    // Helper Normalisasi RCV (Mencari % dari Max Theoretical Points)
    const normalizeVoting = (rawPoints, totalVoters, maxPointPerVote) => {
      const maxTheoretical = totalVoters * maxPointPerVote;
      return maxTheoretical > 0 ? (rawPoints / maxTheoretical) * 100 : 0;
    };

    // Helper Normalisasi Bintang (Nilai Bintang * 20)
    const normalizeEval = (totalStars, count) => {
      const avgStar = count > 0 ? (totalStars / count) : 0;
      return avgStar * 20; // 5 Bintang = 100
    };

    // ==========================================
    // C. KALKULASI FINAL BLUEPRINT (80:20 / 50:50)
    // ==========================================
    
    // 1 & 2 & 5. Kalkulasi User (MVP, Rookie, Fav EB)
    const userFinalScores = users.map(user => {
      // System Rata-rata
      const sysAvg = userSystemAvg[user.id].count > 0 ? (userSystemAvg[user.id].total / userSystemAvg[user.id].count) : 0;
      
      // Normalisasi Vote
      const mvpVoteScore = normalizeVoting(votePoints.MVP[user.id] || 0, voterCounts.MVP.size, 5);
      const rookieVoteScore = normalizeVoting(votePoints.ROOKIE[user.id] || 0, voterCounts.ROOKIE.size, 3);
      const favEbVoteScore = normalizeVoting(votePoints.FAV_EB[user.id] || 0, voterCounts.FAV_EB.size, 5);

      // Rumus Final
      const mvpFinal = (0.80 * sysAvg) + (0.20 * mvpVoteScore);
      const rookieFinal = (0.80 * sysAvg) + (0.20 * rookieVoteScore);

      return { ...user, mvpFinal, rookieFinal, favEbFinal: favEbVoteScore };
    });

    // 3. Kalkulasi Best Dept
    const deptFinalScores = ALL_DEPTS.map(dept => {
      const sysAvg = deptSystemAvg[dept].count > 0 ? (deptSystemAvg[dept].total / deptSystemAvg[dept].count) : 0;
      const evalScore = evalStars.DEPT[dept] ? normalizeEval(evalStars.DEPT[dept].total, evalStars.DEPT[dept].count) : 0;
      
      const finalScore = (0.80 * sysAvg) + (0.20 * evalScore);
      return { dept, finalScore };
    });

    // 4. Kalkulasi Best Project
    const projectFinalScores = projects.map(proj => {
      const rcvScore = normalizeVoting(votePoints.PROJECT[proj.id] || 0, voterCounts.PROJECT.size, 3);
      const evalScore = evalStars.PROJECT[proj.id] ? normalizeEval(evalStars.PROJECT[proj.id].total, evalStars.PROJECT[proj.id].count) : 0;
      
      const finalScore = (0.50 * rcvScore) + (0.50 * evalScore);
      return { ...proj, finalScore };
    });

    // ==========================================
    // D. SORTING & OUTPUT MENCARI JUARA
    // ==========================================
    
    // Filter Rookie (Hanya TLD 26) & EB (Hanya BPH/ADV/Kadep/Kadiv)
    const rookieList = userFinalScores.filter(u => u.cohort.includes('26') && u.role === 5);
    const ebList = userFinalScores.filter(u => u.role >= 2 && u.role <= 4);
    
    // Filter MVP (Hanya Staff)
    const mvpList = userFinalScores.filter(u => u.role === 5);

    const getFirst = (arr, key) => {
      const sorted = [...arr].sort((a,b) => b[key] - a[key]);
      return sorted.length > 0 && sorted[0][key] > 0 ? sorted[0] : null;
    };

    return {
      mvpOfYear: getFirst(mvpList, 'mvpFinal'),
      rookieOfYear: getFirst(rookieList, 'rookieFinal'),
      favEb: getFirst(ebList, 'favEbFinal'),
      bestDeptOfYear: getFirst(deptFinalScores, 'finalScore'),
      bestProjectOfYear: getFirst(projectFinalScores, 'finalScore'),
      _meta: { totalVotersMVP: voterCounts.MVP.size, totalVotersRookie: voterCounts.ROOKIE.size } // Opsional utk debug
    };

  } catch (error) {
    console.error("End of Term Engine Error:", error);
    return null;
  }
};