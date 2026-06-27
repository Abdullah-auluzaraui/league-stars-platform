/**
 * standings-engine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * محرك حساب ترتيب الفرق في مرحلة الدوري مع خوارزمية كسر التعادل بـ 7 مستويات.
 *
 * المستويات (بالترتيب):
 *  1. النقاط الإجمالية          (فوز=3 | تعادل=1 | خسارة=0)
 *  2. نقاط المواجهات المباشرة   (H2H Points)
 *  3. فارق أهداف المواجهات المباشرة (H2H Goal Difference)
 *  4. فارق الأهداف الإجمالي    (Overall GD = مسجّلة − مستقبَلة)
 *  5. الأهداف المسجّلة إجمالاً  (Goals Scored)
 *  6. نقاط اللعب النظيف         (أصفر=−1 | أحمر=−4 | أصفر_ثانٍ=−3)
 *  7. القرعة                    (المشرف يرتب يدوياً — قيمة manualRank)
 */

// ─── أنواع البيانات الواردة من Prisma ─────────────────────────────────────────
export interface MatchRow {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string; // 'finished' فقط يُحسب
  groupName: string | null;
  stage: string;
}

export interface CardRow {
  teamId: string;
  type: string; // 'yellow' | 'red' | 'second_yellow'
}

// ─── سجل الفريق في الترتيب ────────────────────────────────────────────────────
export interface TeamStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  fairPlayPoints: number; // سلبي دائماً (صافي الخصومات)
  manualRank?: number;    // للقرعة — المرحلة 7
}

// ─── حساب نقاط اللعب النظيف ──────────────────────────────────────────────────
const CARD_POINTS: Record<string, number> = {
  yellow: -1,
  red: -4,
  second_yellow: -3,
};

// ─── الدالة الرئيسية ──────────────────────────────────────────────────────────
/**
 * تحسب الترتيب لمجموعة من الفرق بناءً على المباريات المنتهية والبطاقات.
 *
 * @param teamIds   - معرّفات الفرق المشاركة في هذه المجموعة/البطولة
 * @param matches   - جميع المباريات (مُصفاة مسبقاً على المجموعة أو البطولة)
 * @param cards     - جميع البطاقات الصادرة في هذه المباريات
 * @param manualRanks - خريطة اختيارية {teamId → rank} للقرعة اليدوية
 */
export function computeStandings(
  teamIds: string[],
  matches: MatchRow[],
  cards: CardRow[],
  manualRanks: Record<string, number> = {}
): TeamStanding[] {
  // ── بناء السجلات الأولية ─────────────────────────────────────────────────
  const records = new Map<string, TeamStanding>();
  for (const id of teamIds) {
    records.set(id, {
      teamId: id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      fairPlayPoints: 0,
      manualRank: manualRanks[id],
    });
  }

  // ── المباريات المنتهية فقط ────────────────────────────────────────────────
  const finished = matches.filter(
    (m) =>
      m.status === 'finished' &&
      m.homeScore !== null &&
      m.awayScore !== null
  );

  // ── تجميع إحصائيات كل مباراة ─────────────────────────────────────────────
  for (const match of finished) {
    const home = records.get(match.homeTeamId);
    const away = records.get(match.awayTeamId);
    if (!home || !away) continue;

    const hg = match.homeScore!;
    const ag = match.awayScore!;

    home.played++;
    away.played++;
    home.goalsFor += hg;
    home.goalsAgainst += ag;
    away.goalsFor += ag;
    away.goalsAgainst += hg;

    if (hg > ag) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (hg < ag) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  }

  // ── فارق الأهداف ──────────────────────────────────────────────────────────
  for (const [, r] of records) {
    r.goalDifference = r.goalsFor - r.goalsAgainst;
  }

  // ── نقاط اللعب النظيف ────────────────────────────────────────────────────
  for (const card of cards) {
    const r = records.get(card.teamId);
    if (r) {
      r.fairPlayPoints += CARD_POINTS[card.type] ?? 0;
    }
  }

  // ── الترتيب مع خوارزمية كسر التعادل ─────────────────────────────────────
  const standings = Array.from(records.values());
  return standings.sort((a, b) => compareTeams(a, b, finished));
}

// ─── مقارنة فريقين (7 مستويات) ───────────────────────────────────────────────
function compareTeams(a: TeamStanding, b: TeamStanding, matches: MatchRow[]): number {
  // المستوى 1: النقاط الإجمالية
  if (b.points !== a.points) return b.points - a.points;

  // المستوى 2 & 3: المواجهات المباشرة
  const h2h = computeH2H(a.teamId, b.teamId, matches);
  if (h2h.pointsDiff !== 0) return -h2h.pointsDiff; // سالب لأن أكبر = أفضل
  if (h2h.goalDiffDiff !== 0) return -h2h.goalDiffDiff;

  // المستوى 4: فارق الأهداف الإجمالي
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;

  // المستوى 5: الأهداف المسجّلة
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

  // المستوى 6: اللعب النظيف (أقل خصومات = أفضل)
  if (b.fairPlayPoints !== a.fairPlayPoints) return b.fairPlayPoints - a.fairPlayPoints;

  // المستوى 7: القرعة اليدوية
  const rankA = a.manualRank ?? 9999;
  const rankB = b.manualRank ?? 9999;
  return rankA - rankB;
}

// ─── حساب نقاط وفارق أهداف المواجهات المباشرة ───────────────────────────────
interface H2HResult {
  /** نقاط A في المواجهات ضد B — يُقارن مع نقاط B */
  pointsDiff: number;
  /** (فارق أهداف A ضد B) − (فارق أهداف B ضد A) */
  goalDiffDiff: number;
}

function computeH2H(
  teamAId: string,
  teamBId: string,
  matches: MatchRow[]
): H2HResult {
  const h2hMatches = matches.filter(
    (m) =>
      (m.homeTeamId === teamAId && m.awayTeamId === teamBId) ||
      (m.homeTeamId === teamBId && m.awayTeamId === teamAId)
  );

  let aPoints = 0;
  let bPoints = 0;
  let aGF = 0; // goals for A in H2H
  let aGA = 0; // goals against A in H2H

  for (const m of h2hMatches) {
    const hg = m.homeScore!;
    const ag = m.awayScore!;

    if (m.homeTeamId === teamAId) {
      aGF += hg;
      aGA += ag;
      if (hg > ag) aPoints += 3;
      else if (hg === ag) { aPoints++; bPoints++; }
      else bPoints += 3;
    } else {
      aGF += ag;
      aGA += hg;
      if (ag > hg) aPoints += 3;
      else if (ag === hg) { aPoints++; bPoints++; }
      else bPoints += 3;
    }
  }

  return {
    pointsDiff: aPoints - bPoints,
    goalDiffDiff: (aGF - aGA) - (aGA - aGF), // فارق الفارق!
  };
}

// ─── مساعد: تقسيم الترتيب حسب المجموعات ─────────────────────────────────────
/**
 * يُعيد ترتيباً مُجمَّعاً { groupName → TeamStanding[] }
 * لبطولات مرحلة الدوري متعددة المجموعات.
 */
export function computeGroupStandings(
  teams: { id: string; groupName: string | null }[],
  matches: MatchRow[],
  cards: CardRow[],
  manualRanks: Record<string, number> = {}
): Record<string, TeamStanding[]> {
  const groups = new Map<string, string[]>();

  for (const t of teams) {
    const g = t.groupName ?? 'A';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(t.id);
  }

  const result: Record<string, TeamStanding[]> = {};

  for (const [groupName, groupTeamIds] of groups) {
    const groupMatches = matches.filter(
      (m) =>
        m.groupName === groupName ||
        (groupTeamIds.includes(m.homeTeamId) && groupTeamIds.includes(m.awayTeamId))
    );
    const groupCards = cards.filter((c) => groupTeamIds.includes(c.teamId));
    result[groupName] = computeStandings(groupTeamIds, groupMatches, groupCards, manualRanks);
  }

  return result;
}
