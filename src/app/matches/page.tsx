import { prisma } from '@/core/lib/prisma';
import MatchesClient from './MatchesClient';

// ─── Types ──────────────────────────────────────────────────────────────────

export type MatchWithEvents = {
  id: string;
  status: string;
  stage: string;
  groupName: string | null;
  venue: string | null;
  matchDate: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalty: number | null;
  awayPenalty: number | null;
  homeTeam: { id: string; name: string; logoUrl: string | null };
  awayTeam: { id: string; name: string; logoUrl: string | null };
  goals: {
    id: string;
    minute: number;
    type: string;
    teamId: string;
    player: { name: string };
    team: { name: string };
  }[];
  cards: {
    id: string;
    minute: number;
    type: string;
    teamId: string;
    player: { name: string };
    team: { name: string };
  }[];
};

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_MATCHES: MatchWithEvents[] = [
  {
    id: 'm1',
    status: 'live',
    stage: 'group',
    groupName: 'A',
    venue: 'ملعب الجوهرة',
    matchDate: new Date().toISOString(),
    homeScore: 2,
    awayScore: 1,
    homePenalty: null,
    awayPenalty: null,
    homeTeam: { id: 't1', name: 'فرسان نجد', logoUrl: null },
    awayTeam: { id: 't2', name: 'صقور الرياض', logoUrl: null },
    goals: [
      { id: 'g1', minute: 12, type: 'normal', teamId: 't1', player: { name: 'محمد السهلاوي' }, team: { name: 'فرسان نجد' } },
      { id: 'g2', minute: 35, type: 'penalty', teamId: 't2', player: { name: 'ياسر القحطاني' }, team: { name: 'صقور الرياض' } },
      { id: 'g3', minute: 67, type: 'free_kick', teamId: 't1', player: { name: 'نايف هزازي' }, team: { name: 'فرسان نجد' } },
    ],
    cards: [
      { id: 'c1', minute: 28, type: 'yellow', teamId: 't2', player: { name: 'تيسير الجاسم' }, team: { name: 'صقور الرياض' } },
      { id: 'c2', minute: 71, type: 'red', teamId: 't2', player: { name: 'علي الشهراني' }, team: { name: 'صقور الرياض' } },
    ],
  },
  {
    id: 'm2',
    status: 'finished',
    stage: 'group',
    groupName: 'B',
    venue: 'ملعب الأمير فيصل',
    matchDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    homeScore: 3,
    awayScore: 0,
    homePenalty: null,
    awayPenalty: null,
    homeTeam: { id: 't3', name: 'زعيم الجنوب', logoUrl: null },
    awayTeam: { id: 't4', name: 'نجوم المدينة', logoUrl: null },
    goals: [
      { id: 'g4', minute: 8, type: 'normal', teamId: 't3', player: { name: 'يوسف السالم' }, team: { name: 'زعيم الجنوب' } },
      { id: 'g5', minute: 44, type: 'normal', teamId: 't3', player: { name: 'يوسف السالم' }, team: { name: 'زعيم الجنوب' } },
      { id: 'g6', minute: 88, type: 'own_goal', teamId: 't3', player: { name: 'فهد المطيري' }, team: { name: 'نجوم المدينة' } },
    ],
    cards: [
      { id: 'c3', minute: 55, type: 'yellow', teamId: 't4', player: { name: 'سالم الدوسري' }, team: { name: 'نجوم المدينة' } },
    ],
  },
  {
    id: 'm3',
    status: 'finished',
    stage: 'group',
    groupName: 'A',
    venue: 'ملعب الجنوب',
    matchDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    homeScore: 1,
    awayScore: 1,
    homePenalty: 4,
    awayPenalty: 3,
    homeTeam: { id: 't2', name: 'صقور الرياض', logoUrl: null },
    awayTeam: { id: 't5', name: 'عميد الغربية', logoUrl: null },
    goals: [
      { id: 'g7', minute: 22, type: 'normal', teamId: 't2', player: { name: 'ياسر القحطاني' }, team: { name: 'صقور الرياض' } },
      { id: 'g8', minute: 79, type: 'penalty', teamId: 't5', player: { name: 'وليد عبدالله' }, team: { name: 'عميد الغربية' } },
    ],
    cards: [],
  },
  {
    id: 'm4',
    status: 'scheduled',
    stage: 'group',
    groupName: 'B',
    venue: 'الملعب الرئيسي',
    matchDate: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    homeScore: null,
    awayScore: null,
    homePenalty: null,
    awayPenalty: null,
    homeTeam: { id: 't5', name: 'عميد الغربية', logoUrl: null },
    awayTeam: { id: 't6', name: 'أسود الشرقية', logoUrl: null },
    goals: [],
    cards: [],
  },
  {
    id: 'm5',
    status: 'scheduled',
    stage: 'semi',
    groupName: null,
    venue: 'ملعب الجوهرة',
    matchDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    homeScore: null,
    awayScore: null,
    homePenalty: null,
    awayPenalty: null,
    homeTeam: { id: 't1', name: 'فرسان نجد', logoUrl: null },
    awayTeam: { id: 't3', name: 'زعيم الجنوب', logoUrl: null },
    goals: [],
    cards: [],
  },
];

// ─── Data Fetching ──────────────────────────────────────────────────────────

async function getMatchesData(): Promise<MatchWithEvents[]> {
  try {
    const matches = await prisma.match.findMany({
      orderBy: [{ matchDate: 'desc' }],
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
        goals: {
          orderBy: { minute: 'asc' },
          include: {
            player: { select: { name: true } },
            team: { select: { name: true } },
          },
        },
        cards: {
          orderBy: { minute: 'asc' },
          include: {
            player: { select: { name: true } },
            team: { select: { name: true } },
          },
        },
      },
    });

    if (matches.length === 0) return MOCK_MATCHES;

    return matches.map((m) => ({
      ...m,
      matchDate: m.matchDate.toISOString(),
    })) as MatchWithEvents[];
  } catch {
    return MOCK_MATCHES;
  }
}

// ─── Metadata ───────────────────────────────────────────────────────────────

export const metadata = {
  title: 'المباريات والنتائج | League Stars',
  description:
    'تابع جميع مباريات البطولة — الحية، القادمة، والمنتهية — مع تفاصيل الأهداف والبطاقات.',
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function MatchesPage() {
  const matches = await getMatchesData();

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Page Header ── */}
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-2">
          <span className="section-accent-line" />
          <h1 className="text-2xl sm:text-3xl font-black text-gold-gradient tracking-tight">
            المباريات والنتائج
          </h1>
        </div>
        <p className="text-white/40 text-sm font-medium pr-6">
          متابعة حية للمباريات مع تفاصيل الأهداف والبطاقات
        </p>
      </div>

      {/* ── Interactive Client Component ── */}
      <MatchesClient matches={matches} />
    </div>
  );
}
