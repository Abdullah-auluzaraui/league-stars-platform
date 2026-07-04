import { prisma } from '@/core/lib/prisma';
import MatchesClient from './MatchesClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      select: {
        id: true,
        status: true,
        stage: true,
        groupName: true,
        venue: true,
        streamUrl: true,
        matchDate: true,
        homeScore: true,
        awayScore: true,
        homePenalty: true,
        awayPenalty: true,
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
  } catch (error) {
    console.error('Failed to load matches data', error);
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
    <div className="max-w-2xl mx-auto pb-20 md:max-w-none md:w-full md:pb-0">
      <div className="mb-5 md:mb-10 animate-fade-in-up md:flex md:items-end md:justify-between md:gap-8">
        <div>
        <div className="flex items-center gap-2.5 md:gap-3 mb-1.5 md:mb-2">
          <span className="section-accent-line" />
          <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-gold-gradient tracking-tight">
            المباريات والنتائج
          </h1>
        </div>
        <p className="text-white/55 text-xs sm:text-sm md:text-base font-medium pr-5 md:pr-6 md:max-w-2xl leading-5">
          متابعة حية للمباريات مع تفاصيل الأهداف والبطاقات
        </p>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-full border border-[#C9971A]/25 bg-[#C9971A]/10 px-4 py-2 text-xs font-black text-[#F0C040]">
          <span className="live-dot" />
          <span>تجربة متابعة مباشرة</span>
        </div>
      </div>

      <MatchesClient matches={matches} />
    </div>
  );
}
