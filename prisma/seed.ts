import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const demoTournamentNames = [
  'دوري نجوم الرياض 2026',
  'دوري نجوم الرياض - الموسم الأول',
  'دوري الفرسان الربيعي',
  'كأس النجوم الصيفية',
  'بطولة الشتاء التاريخية',
  'بطولة نجوم الدوري الرمضانية الأولى',
];

const demoTeamNames = [
  'النسور',
  'الأسود',
  'الصقور',
  'الوحوش',
  'الأبطال',
  'الرياح',
  'البرق',
  'الثعالب',
  'فرسان نجد',
  'صقور الرياض',
  'أسود القصيم',
  'نجوم الجنوب',
  'نمور المنطقة',
  'عقبان الغرب',
  'عميد الغربية',
  'أسود الشرقية',
  'زعيم الجنوب',
  'نجوم المدينة',
];

const demoSponsorNames = [
  'راعي النجوم',
  'الشريك الرياضي',
  'مجموعة الأبطال',
  'أرامكو السعودية',
  'روشن العقارية',
  'طيران الرياض',
  'مشاريع القدية',
  'صندوق الاستثمارات',
];

async function deleteDemoRecords() {
  const demoTeams = await prisma.team.findMany({
    where: { name: { in: demoTeamNames } },
    select: { id: true },
  });
  const demoTeamIds = demoTeams.map((team) => team.id);

  const demoTournaments = await prisma.tournament.findMany({
    where: { name: { in: demoTournamentNames } },
    select: { id: true },
  });
  const demoTournamentIds = demoTournaments.map((tournament) => tournament.id);

  await prisma.goalVote.deleteMany({
    where: {
      OR: [
        { votingRoundGoal: { goal: { teamId: { in: demoTeamIds } } } },
        { votingRoundGoal: { goal: { match: { tournamentId: { in: demoTournamentIds } } } } },
      ],
    },
  });

  await prisma.goal.deleteMany({
    where: {
      OR: [
        { teamId: { in: demoTeamIds } },
        { match: { tournamentId: { in: demoTournamentIds } } },
      ],
    },
  });

  await prisma.card.deleteMany({
    where: {
      OR: [
        { teamId: { in: demoTeamIds } },
        { match: { tournamentId: { in: demoTournamentIds } } },
      ],
    },
  });

  await prisma.match.deleteMany({
    where: {
      OR: [
        { tournamentId: { in: demoTournamentIds } },
        { homeTeamId: { in: demoTeamIds } },
        { awayTeamId: { in: demoTeamIds } },
      ],
    },
  });

  await prisma.tournamentTeam.deleteMany({
    where: {
      OR: [
        { tournamentId: { in: demoTournamentIds } },
        { teamId: { in: demoTeamIds } },
      ],
    },
  });

  await prisma.tournament.deleteMany({
    where: { id: { in: demoTournamentIds } },
  });

  await prisma.team.deleteMany({
    where: { id: { in: demoTeamIds } },
  });

  await prisma.sponsor.deleteMany({
    where: { name: { in: demoSponsorNames } },
  });

  await prisma.content.deleteMany({
    where: {
      OR: [
        { title: { contains: 'دوري نجوم الرياض' } },
        { title: { contains: 'نجوم الدوري' } },
      ],
    },
  });
}

async function ensureAdminUser() {
  const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (adminUser) return;

  const passwordHash = await bcrypt.hash('Admin@2026', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash,
      role: 'admin',
    },
  });
}

async function main() {
  console.log('تنظيف البيانات التجريبية المعروفة...');
  await deleteDemoRecords();
  await ensureAdminUser();
  console.log('تم تنظيف البيانات التجريبية. لم يتم إنشاء أي بطولات أو فرق أو لاعبين تجريبيين.');
}

main()
  .catch((error) => {
    console.error('فشل تنظيف البيانات التجريبية:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
