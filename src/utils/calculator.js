import { supabase } from '../supabaseClient';

// ============================================================================
// HELPER: CORE ENGINE KALKULASI KUARTALAN
// ============================================================================
const computeQuarterData = (users, assessments, attendance) => {
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

    return { 
      ...user, 
      attendanceScore: uAttend, 
      qualitativeScore: avgQualitative, 
      avgAttitude: avg.attitude,
      avgDiscipline: avg.discipline,
      avgActive: avg.active,
      avgAgility: avg.agility,
      avgCheerful: avg.cheerful,
      theReliableOne, 
      theHighAchiever, 
      theSpark, 
      theUltimateMVP 
    };
  });

  // Kalkulasi Best Dept Kuartalan (KEMBALI KE ATURAN ASLI: Rata-Rata Per Kapita MVP)
  const deptMap = {};
  results.forEach(r => {
    if (r.dept && r.dept !== 'General' && r.dept !== '-') {
      if (!deptMap[r.dept]) {
        deptMap[r.dept] = { 
          totalMVP: 0, totalAttend: 0, totalDiscipline: 0, totalAgility: 0, totalActive: 0, count: 0 
        };
      }
      deptMap[r.dept].totalMVP += r.theUltimateMVP;
      deptMap[r.dept].totalAttend += r.attendanceScore;
      deptMap[r.dept].totalDiscipline += r.avgDiscipline;
      deptMap[r.dept].totalAgility += r.avgAgility;
      deptMap[r.dept].totalActive += r.avgActive;
      deptMap[r.dept].count += 1;
    }
  });

  const deptResults = Object.keys(deptMap).map(dept => {
    const count = deptMap[dept].count > 0 ? deptMap[dept].count : 1;
    return {
      dept, 
      score: deptMap[dept].totalMVP / count, // Nilai Utama = Rata-rata The Ultimate MVP
      avgAttend: deptMap[dept].totalAttend / count,
      avgDiscipline: deptMap[dept].totalDiscipline / count,
      avgAgility: deptMap[dept].totalAgility / count,
      avgActive: deptMap[dept].totalActive / count
    };
  });

  // =======================================================
  // ENGINE TIE-BREAKER KUARTALAN (Sesuai Aturan Final)
  // =======================================================
  const getQuarterlyWinner = (arr, scoreKey, awardType) => {
    const sorted = [...arr].sort((a, b) => {
      // 0. Filter Utama
      if (b[scoreKey] !== a[scoreKey]) return b[scoreKey] - a[scoreKey];

      // 1-4. Filter Tie-Breaker Berlapis Mutlak
      if (awardType === 'RELIABLE') {
        if (b.attendanceScore !== a.attendanceScore) return b.attendanceScore - a.attendanceScore;
        if (b.avgDiscipline !== a.avgDiscipline) return b.avgDiscipline - a.avgDiscipline;
        if (b.qualitativeScore !== a.qualitativeScore) return b.qualitativeScore - a.qualitativeScore;
        if (b.avgActive !== a.avgActive) return b.avgActive - a.avgActive;
      } 
      else if (awardType === 'ACHIEVER') {
        if (b.avgAgility !== a.avgAgility) return b.avgAgility - a.avgAgility;
        if (b.avgActive !== a.avgActive) return b.avgActive - a.avgActive;
        if (b.attendanceScore !== a.attendanceScore) return b.attendanceScore - a.attendanceScore;
        if (b.qualitativeScore !== a.qualitativeScore) return b.qualitativeScore - a.qualitativeScore;
      } 
      else if (awardType === 'SPARK') {
        if (b.avgCheerful !== a.avgCheerful) return b.avgCheerful - a.avgCheerful;
        if (b.avgAttitude !== a.avgAttitude) return b.avgAttitude - a.avgAttitude;
        if (b.attendanceScore !== a.attendanceScore) return b.attendanceScore - a.attendanceScore;
        if (b.qualitativeScore !== a.qualitativeScore) return b.qualitativeScore - a.qualitativeScore;
      } 
      else if (awardType === 'MVP') {
        if (b.attendanceScore !== a.attendanceScore) return b.attendanceScore - a.attendanceScore;
        if (b.avgAgility !== a.avgAgility) return b.avgAgility - a.avgAgility;
        if (b.avgActive !== a.avgActive) return b.avgActive - a.avgActive; 
        if (b.avgDiscipline !== a.avgDiscipline) return b.avgDiscipline - a.avgDiscipline;
      }
      else if (awardType === 'DEPT') {
        if (b.avgAttend !== a.avgAttend) return b.avgAttend - a.avgAttend;
        if (b.avgDiscipline !== a.avgDiscipline) return b.avgDiscipline - a.avgDiscipline;
        if (b.avgAgility !== a.avgAgility) return b.avgAgility - a.avgAgility;
        if (b.avgActive !== a.avgActive) return b.avgActive - a.avgActive;
      }

      // 5. FAILSAFE MUTLAK: Abjad Nama
      const nameA = a.full_name || a.dept || '';
      const nameB = b.full_name || b.dept || '';
      return nameA.localeCompare(nameB);
    });

    return sorted.length > 0 && sorted[0][scoreKey] > 0 ? sorted[0] : null;
  };

  return {
    reliable: getQuarterlyWinner(results, 'theReliableOne', 'RELIABLE'),
    achiever: getQuarterlyWinner(results, 'theHighAchiever', 'ACHIEVER'),
    spark: getQuarterlyWinner(results, 'theSpark', 'SPARK'),
    mvp: getQuarterlyWinner(results, 'theUltimateMVP', 'MVP'),
    bestDept: getQuarterlyWinner(deptResults, 'score', 'DEPT'),
    allScores: results,
    allDeptScores: deptResults 
  };
};

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

    return computeQuarterData(usersRes.data || [], assessRes.data || [], attendRes.data || []);
  } catch (error) {
    console.error("Quarterly Engine Error:", error);
    return null;
  }
};


// ============================================================================
// 2. MESIN KALKULASI END OF TERM (HALL OF FAME 2026) -> SMART DYNAMIC WEIGHTING
// ============================================================================
export const calculateEndOfTermResults = async () => {
  try {
    const [usersRes, assessRes, attendRes, votesRes, projectsRes] = await Promise.all([
      supabase.from('users').select('*').neq('role', 1).eq('is_active', true),
      supabase.from('assessments').select('*'),
      supabase.from('attendance').select('*'),
      supabase.from('end_of_term_votes').select('*'),
      supabase.from('projects').select('*')
    ]);

    const allUsers = usersRes.data || [];
    const assessments = assessRes.data || [];
    const attendance = attendRes.data || [];
    const votes = votesRes.data || [];
    const projects = projectsRes.data || [];

    const staffUsers = allUsers.filter(u => u.role === 5);

    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
      const qAssess = assessments.filter(a => a.quarter === q);
      const qAttend = attendance.filter(a => a.quarter === q);
      return computeQuarterData(staffUsers, qAssess, qAttend);
    });

    // ==========================================
    // A. AGREGASI RATA-RATA SISTEM (Q1-Q4)
    // ==========================================
    const userSystemAvg = {};
    const deptSystemAvg = {};

    // Merekam komponen kualitatif untuk Failsafe Tie-Breaker EoT
    allUsers.forEach(u => userSystemAvg[u.id] = { 
      total: 0, count: 0, totalAttend: 0, totalAgility: 0, totalActive: 0, totalDiscipline: 0 
    });
    
    const ALL_DEPTS = ['ERBD', 'MD', 'STD'];
    ALL_DEPTS.forEach(d => deptSystemAvg[d] = { total: 0, count: 0, totalAttend: 0 });

    quarters.forEach(q => {
      if (q) {
        if (q.allScores) {
          q.allScores.forEach(u => {
            if (userSystemAvg[u.id] && u.theUltimateMVP > 0) {
              userSystemAvg[u.id].total += u.theUltimateMVP;
              userSystemAvg[u.id].count += 1;
              userSystemAvg[u.id].totalAttend += u.attendanceScore;
              userSystemAvg[u.id].totalAgility += u.avgAgility;
              userSystemAvg[u.id].totalActive += u.avgActive;
              userSystemAvg[u.id].totalDiscipline += u.avgDiscipline;
            }
          });
        }
        if (q.allDeptScores) {
          q.allDeptScores.forEach(d => {
            if (deptSystemAvg[d.dept] && d.score > 0) {
              deptSystemAvg[d.dept].total += d.score; // Score ini adalah rata-rata MVP per kapita departemen di kuartal tersebut
              deptSystemAvg[d.dept].totalAttend += d.avgAttend;
              deptSystemAvg[d.dept].count += 1;
            }
          });
        }
      }
    });

    // ==========================================
    // B. PENGHITUNGAN & NORMALISASI VOTING RCV
    // ==========================================
    const voteStats = { MVP: {}, ROOKIE: {}, PROJECT: {}, FAV_EB: {} };
    const evalStars = { DEPT: {}, PROJECT: {} };
    const voterCounts = { MVP: new Set(), ROOKIE: new Set(), PROJECT: new Set(), FAV_EB: new Set() };

    const initVoteStat = (cat, id) => {
      if (id && !voteStats[cat][id]) voteStats[cat][id] = { points: 0, rank1: 0, voters: 0 };
    };

    votes.forEach(v => {
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
      else {
        voterCounts[v.category].add(v.voter_id);
        const mapVote = (targetId, points, isRank1) => {
          if (targetId) {
            initVoteStat(v.category, targetId);
            voteStats[v.category][targetId].points += points;
            voteStats[v.category][targetId].voters += 1;
            if (isRank1) voteStats[v.category][targetId].rank1 += 1;
          }
        };

        if (v.category === 'MVP' || v.category === 'FAV_EB') {
          mapVote(v.rank_1, 5, true); mapVote(v.rank_2, 4, false); mapVote(v.rank_3, 3, false); mapVote(v.rank_4, 2, false); mapVote(v.rank_5, 1, false);
        } else if (v.category === 'ROOKIE' || v.category === 'PROJECT') {
          mapVote(v.rank_1, 3, true); mapVote(v.rank_2, 2, false); mapVote(v.rank_3, 1, false);
        }
      }
    });

    const normalizeVoting = (rawPoints, totalVoters, maxPointPerVote) => {
      const maxTheoretical = totalVoters * maxPointPerVote;
      return maxTheoretical > 0 ? (rawPoints / maxTheoretical) * 100 : 0;
    };

    const normalizeEval = (totalScoreFromDB, count) => {
      return count > 0 ? (totalScoreFromDB / count) : 0;
    };

    // ==========================================
    // C. KALKULASI FINAL BLUEPRINT (DYNAMIC WEIGHTING)
    // ==========================================
    
    const userFinalScores = allUsers.map(user => {
      const uData = userSystemAvg[user.id];
      const count = uData.count > 0 ? uData.count : 1;
      
      const sysAvg = uData.total / count;
      const avgAttendYear = uData.totalAttend / count;
      const avgAgilityYear = uData.totalAgility / count;
      const avgActiveYear = uData.totalActive / count;
      const avgDisciplineYear = uData.totalDiscipline / count;
      
      const mvpStats = voteStats.MVP[user.id] || { points: 0, rank1: 0, voters: 0 };
      const mvpVoteScore = normalizeVoting(mvpStats.points, voterCounts.MVP.size, 5);

      const rookieStats = voteStats.ROOKIE[user.id] || { points: 0, rank1: 0, voters: 0 };
      const rookieVoteScore = normalizeVoting(rookieStats.points, voterCounts.ROOKIE.size, 3);

      const favEbStats = voteStats.FAV_EB[user.id] || { points: 0, rank1: 0, voters: 0 };
      const favEbVoteScore = normalizeVoting(favEbStats.points, voterCounts.FAV_EB.size, 5);

      // JIKA VOTING KOSONG, SKOR = 100% SYS AVG. JIKA ADA, 80% SYS AVG + 20% VOTING.
      const hasMvpVotes = voterCounts.MVP.size > 0;
      const mvpFinal = hasMvpVotes ? (0.80 * sysAvg) + (0.20 * mvpVoteScore) : sysAvg;
      
      const hasRookieVotes = voterCounts.ROOKIE.size > 0;
      const rookieFinal = hasRookieVotes ? (0.80 * sysAvg) + (0.20 * rookieVoteScore) : sysAvg;

      return { 
        ...user, 
        sysAvg, 
        avgAttendYear, avgAgilityYear, avgActiveYear, avgDisciplineYear,
        mvpFinal, mvpVotePoints: mvpStats.points, mvpRank1: mvpStats.rank1, mvpVoters: mvpStats.voters,
        rookieFinal, rookieVotePoints: rookieStats.points, rookieRank1: rookieStats.rank1, rookieVoters: rookieStats.voters,
        favEbFinal: favEbVoteScore, favEbVotePoints: favEbStats.points, favEbRank1: favEbStats.rank1, favEbVoters: favEbStats.voters
      };
    });

    const deptFinalScores = ALL_DEPTS.map(dept => {
      const count = deptSystemAvg[dept].count > 0 ? deptSystemAvg[dept].count : 1;
      const sysAvg = deptSystemAvg[dept].total / count; 
      const avgAttendYear = deptSystemAvg[dept].totalAttend / count;
      
      const hasEvals = evalStars.DEPT[dept] && evalStars.DEPT[dept].count > 0;
      const evalScore = hasEvals ? normalizeEval(evalStars.DEPT[dept].total, evalStars.DEPT[dept].count) : 0;
      
      // Dynamic Weighting Dept
      const finalScore = hasEvals ? (0.80 * sysAvg) + (0.20 * evalScore) : sysAvg;
      return { dept, sysAvg, evalScore, finalScore, avgAttendYear };
    });

    const projectFinalScores = projects.map(proj => {
      const projStats = voteStats.PROJECT[proj.id] || { points: 0, rank1: 0, voters: 0 };
      const hasVotes = voterCounts.PROJECT.size > 0;
      const rcvScore = normalizeVoting(projStats.points, voterCounts.PROJECT.size, 3);
      
      const hasEvals = evalStars.PROJECT[proj.id] && evalStars.PROJECT[proj.id].count > 0;
      const evalScore = hasEvals ? normalizeEval(evalStars.PROJECT[proj.id].total, evalStars.PROJECT[proj.id].count) : 0;
      
      let finalScore = 0;
      if (hasVotes && hasEvals) finalScore = (0.50 * rcvScore) + (0.50 * evalScore);
      else if (hasVotes) finalScore = rcvScore;
      else if (hasEvals) finalScore = evalScore;

      return { 
        ...proj, 
        evalScore,
        votePoints: projStats.points, 
        rank1: projStats.rank1, 
        voters: projStats.voters,
        finalScore 
      };
    });

    // ==========================================
    // D. SORTING (DEEP WATERFALL TIE-BREAKER)
    // ==========================================
    
    const rookieList = userFinalScores.filter(u => u.cohort && u.cohort.includes('26') && u.role === 5);
    const ebList = userFinalScores.filter(u => u.role >= 2 && u.role <= 4);
    const mvpList = userFinalScores.filter(u => u.role === 5);

    const getEoTWinner = (arr, scoreKey, awardType) => {
      const sorted = [...arr].sort((a, b) => {
        // 0. Filter Utama
        if (b[scoreKey] !== a[scoreKey]) return b[scoreKey] - a[scoreKey];

        // 1-5. Tie-Breaker Akhir Tahun
        if (awardType === 'MVP' || awardType === 'ROOKIE') {
            const pfx = awardType === 'MVP' ? 'mvp' : 'rookie';
            if (b.sysAvg !== a.sysAvg) return b.sysAvg - a.sysAvg;
            if (b[`${pfx}VotePoints`] !== a[`${pfx}VotePoints`]) return b[`${pfx}VotePoints`] - a[`${pfx}VotePoints`];
            if (b[`${pfx}Rank1`] !== a[`${pfx}Rank1`]) return b[`${pfx}Rank1`] - a[`${pfx}Rank1`];
            if (b[`${pfx}Voters`] !== a[`${pfx}Voters`]) return b[`${pfx}Voters`] - a[`${pfx}Voters`];
            if (b.avgAttendYear !== a.avgAttendYear) return b.avgAttendYear - a.avgAttendYear;
            
            // Failsafe Rahasia jika Voting 0: Pakai aturan Tie-Breaker Q1 (Active)
            if (b.avgAgilityYear !== a.avgAgilityYear) return b.avgAgilityYear - a.avgAgilityYear;
            if (b.avgActiveYear !== a.avgActiveYear) return b.avgActiveYear - a.avgActiveYear; 
            if (b.avgDisciplineYear !== a.avgDisciplineYear) return b.avgDisciplineYear - a.avgDisciplineYear;
        } 
        else if (awardType === 'FAV_EB') {
            if (b.favEbRank1 !== a.favEbRank1) return b.favEbRank1 - a.favEbRank1;
            if (b.favEbVoters !== a.favEbVoters) return b.favEbVoters - a.favEbVoters;
        } 
        else if (awardType === 'PROJECT') {
            if (b.evalScore !== a.evalScore) return b.evalScore - a.evalScore;
            if (b.votePoints !== a.votePoints) return b.votePoints - a.votePoints;
            if (b.rank1 !== a.rank1) return b.rank1 - a.rank1;
            if (b.voters !== a.voters) return b.voters - a.voters;
        } 
        else if (awardType === 'DEPT') {
            if (b.sysAvg !== a.sysAvg) return b.sysAvg - a.sysAvg;
            if (b.evalScore !== a.evalScore) return b.evalScore - a.evalScore;
            if (b.avgAttendYear !== a.avgAttendYear) return b.avgAttendYear - a.avgAttendYear;
        }

        // Failsafe Mutlak Terakhir: Abjad
        const nameA = a.full_name || a.title || a.dept || '';
        const nameB = b.full_name || b.title || b.dept || '';
        return nameA.localeCompare(nameB);
      });
      return sorted.length > 0 && sorted[0][scoreKey] > 0 ? sorted[0] : null;
    };

    return {
      mvpOfYear: getEoTWinner(mvpList, 'mvpFinal', 'MVP'),
      rookieOfYear: getEoTWinner(rookieList, 'rookieFinal', 'ROOKIE'),
      favEb: getEoTWinner(ebList, 'favEbFinal', 'FAV_EB'),
      bestDeptOfYear: getEoTWinner(deptFinalScores, 'finalScore', 'DEPT'),
      bestProjectOfYear: getEoTWinner(projectFinalScores, 'finalScore', 'PROJECT'),
      _meta: { totalVotersMVP: voterCounts.MVP.size, totalVotersRookie: voterCounts.ROOKIE.size }
    };

  } catch (error) {
    console.error("End of Term Engine Error:", error);
    return null;
  }
};