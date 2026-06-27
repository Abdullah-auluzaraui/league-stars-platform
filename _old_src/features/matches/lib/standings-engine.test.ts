/**
 * اختبارات وحدوية لمحرك الترتيب — تُشغَّل بـ: node --loader ts-node/esm
 *
 * الحالات المُختبرة:
 *  A. ترتيب بسيط بالنقاط
 *  B. كسر تعادل بالمواجهات المباشرة (H2H)
 *  C. كسر تعادل بفارق الأهداف الإجمالي
 *  D. كسر تعادل بنقاط اللعب النظيف
 */

import { computeStandings } from './standings-engine';
import type { MatchRow, CardRow } from './standings-engine';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    failed++;
  }
}

// ─── الحالة A: ترتيب بسيط بالنقاط ────────────────────────────────────────────
console.log('\nA. ترتيب بسيط بالنقاط');
{
  const teams = ['team1', 'team2', 'team3'];
  const matches: MatchRow[] = [
    { id: 'm1', homeTeamId: 'team1', awayTeamId: 'team2', homeScore: 2, awayScore: 0, status: 'finished', groupName: null, stage: 'group' },
    { id: 'm2', homeTeamId: 'team2', awayTeamId: 'team3', homeScore: 1, awayScore: 1, status: 'finished', groupName: null, stage: 'group' },
    { id: 'm3', homeTeamId: 'team1', awayTeamId: 'team3', homeScore: 0, awayScore: 1, status: 'finished', groupName: null, stage: 'group' },
  ];
  const standings = computeStandings(teams, matches, []);

  assert(standings[0].teamId === 'team1', 'الأول: team1 (6 نقاط)');
  assert(standings[1].teamId === 'team3', 'الثاني: team3 (4 نقاط)');
  assert(standings[2].teamId === 'team2', 'الثالث: team2 (1 نقطة)');
  assert(standings[0].points === 6, 'team1 لديه 6 نقاط');
  assert(standings[1].points === 4, 'team3 لديه 4 نقاط');
}

// ─── الحالة B: كسر تعادل بالمواجهات المباشرة ─────────────────────────────────
console.log('\nB. كسر تعادل بالمواجهات المباشرة (H2H)');
{
  const teams = ['teamA', 'teamB', 'teamC'];
  const matches: MatchRow[] = [
    // A vs B: A يفوز في المواجه المباشرة
    { id: 'm1', homeTeamId: 'teamA', awayTeamId: 'teamB', homeScore: 1, awayScore: 0, status: 'finished', groupName: null, stage: 'group' },
    // A vs C: تعادل
    { id: 'm2', homeTeamId: 'teamA', awayTeamId: 'teamC', homeScore: 1, awayScore: 1, status: 'finished', groupName: null, stage: 'group' },
    // B vs C: B يفوز
    { id: 'm3', homeTeamId: 'teamB', awayTeamId: 'teamC', homeScore: 2, awayScore: 0, status: 'finished', groupName: null, stage: 'group' },
    // النقاط: A=4, B=4, C=0 — A و B متعادلان في النقاط
  ];
  const standings = computeStandings(teams, matches, []);

  // A يفوز B في المواجهة المباشرة → A أولاً
  assert(standings[0].teamId === 'teamA', 'الأول: teamA (فاز في H2H ضد B)');
  assert(standings[1].teamId === 'teamB', 'الثاني: teamB');
  assert(standings[0].points === standings[1].points, 'A و B لديهما نقاط متساوية');
}

// ─── الحالة C: كسر تعادل بفارق الأهداف الإجمالي ──────────────────────────────
console.log('\nC. كسر تعادل بفارق الأهداف الإجمالي');
{
  const teams = ['teamX', 'teamY'];
  const matches: MatchRow[] = [
    { id: 'm1', homeTeamId: 'teamX', awayTeamId: 'teamY', homeScore: 1, awayScore: 1, status: 'finished', groupName: null, stage: 'group' },
    // مباراة ثالثة لتوليد فارق في الأهداف الإجمالي
    { id: 'm2', homeTeamId: 'teamX', awayTeamId: 'teamY', homeScore: 3, awayScore: 1, status: 'finished', groupName: null, stage: 'group' },
  ];
  const standings = computeStandings(teams, matches, []);

  assert(standings[0].teamId === 'teamX', 'الأول: teamX (فارق أهداف أفضل)');
  assert(standings[0].goalDifference > standings[1].goalDifference, 'teamX فارق أهداف أعلى');
}

// ─── الحالة D: كسر تعادل بنقاط اللعب النظيف ─────────────────────────────────
console.log('\nD. كسر تعادل بنقاط اللعب النظيف');
{
  const teams = ['teamP', 'teamQ'];
  const matches: MatchRow[] = [
    { id: 'm1', homeTeamId: 'teamP', awayTeamId: 'teamQ', homeScore: 1, awayScore: 1, status: 'finished', groupName: null, stage: 'group' },
  ];
  const cards: CardRow[] = [
    { teamId: 'teamQ', type: 'yellow' }, // Q يحصل على بطاقة صفراء = −1
  ];
  const standings = computeStandings(teams, matches, cards);

  assert(standings[0].teamId === 'teamP', 'الأول: teamP (لعب نظيف أفضل)');
  assert(standings[1].fairPlayPoints === -1, 'teamQ لديه -1 في اللعب النظيف');
}

// ─── النتيجة ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`النتائج: ${passed} نجح | ${failed} فشل`);
if (failed === 0) {
  console.log('🎉 جميع الاختبارات نجحت!');
  process.exit(0);
} else {
  console.error('⚠️ بعض الاختبارات فشلت!');
  process.exit(1);
}
