import { prisma } from '@/core/lib/prisma';
import MatchesClient from './MatchesClient';

export type MatchWithEvents = {
  id: string;
  status: string;
  stage: string;
  groupName: string | null;
  venue: string | null;
  streamUrl: string | null;
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

    return matches.map((match) => ({
      ...match,
      matchDate: match.matchDate.toISOString(),
    })) as MatchWithEvents[];
  } catch {
    return [];
  }
}

export const metadata = {
  title: 'المباريات والنتائج | League Stars',
  description: 'تابع جميع مباريات البطولة الحية، القادمة، والمنتهية مع تفاصيل الأهداف والبطاقات.',
};

export default async function MatchesPage() {
  const matches = await getMatchesData();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-2">
          <span className="section-accent-line" />
          <h1 className="text-2xl sm:text-3xl font-black text-gold-gradient tracking-tight">
            المباريات والنتائج
          </h1>
        </div>
        <p className="text-white/60 text-sm font-medium pr-6">
          متابعة حية للمباريات مع تفاصيل الأهداف والبطاقات
        </p>
      </div>

      <MatchesClient matches={matches} />
    </div>
  );
}
