import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء تهيئة البيانات التجريبية...');

  // ═══ 1. تنظيف قاعدة البيانات ═══════════════════════════════════════════════
  await prisma.goalVote.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.card.deleteMany();
  await prisma.match.deleteMany();
  await prisma.tournamentTeam.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.content.deleteMany();

  // ═══ 2. المشرف الافتراضي ════════════════════════════════════════════════════
  const passwordHash = await bcrypt.hash('Admin@2026', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash,
      role: 'admin',
    },
  });
  console.log('✅ تم إنشاء المشرف: admin / Admin@2024');

  // ═══ 3. الفرق ════════════════════════════════════════════════════════════════
  const teamNames = [
    'النسور',
    'الأسود',
    'الصقور',
    'الوحوش',
    'الأبطال',
    'الرياح',
    'البرق',
    'الثعالب',
  ];

  const teams = await Promise.all(
    teamNames.map((name) =>
      prisma.team.create({ data: { name } })
    )
  );
  console.log(`✅ تم إنشاء ${teams.length} فرق`);

  // ═══ 4. اللاعبون ═════════════════════════════════════════════════════════════
  const playersByTeam: Record<string, { id: string }[]> = {};

  for (const team of teams) {
    const players = await Promise.all(
      Array.from({ length: 15 }, (_, i) =>
        prisma.player.create({
          data: {
            name: `لاعب ${i + 1} - ${team.name}`,
            jerseyNumber: i + 1,
            teamId: team.id,
          },
        })
      )
    );
    playersByTeam[team.id] = players;
  }
  console.log('✅ تم إنشاء اللاعبين (15 لاعب لكل فريق)');

  // ═══ 5. البطولة (مجموعتان) ═══════════════════════════════════════════════════
  const tournament = await prisma.tournament.create({
    data: {
      name: 'دوري نجوم الرياض 2026',
      type: 'group_stage',
      status: 'active',
      groupCount: 2,
      qualifyingTeams: 2,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
    },
  });
  console.log('✅ تم إنشاء البطولة');

  // ربط الفرق بالمجموعات
  // المجموعة A: النسور، الأسود، الصقور، الوحوش
  // المجموعة B: الأبطال، الرياح، البرق، الثعالب
  await Promise.all([
    prisma.tournamentTeam.create({ data: { tournamentId: tournament.id, teamId: teams[0].id, groupName: 'A' } }),
    prisma.tournamentTeam.create({ data: { tournamentId: tournament.id, teamId: teams[1].id, groupName: 'A' } }),
    prisma.tournamentTeam.create({ data: { tournamentId: tournament.id, teamId: teams[2].id, groupName: 'A' } }),
    prisma.tournamentTeam.create({ data: { tournamentId: tournament.id, teamId: teams[3].id, groupName: 'A' } }),
    prisma.tournamentTeam.create({ data: { tournamentId: tournament.id, teamId: teams[4].id, groupName: 'B' } }),
    prisma.tournamentTeam.create({ data: { tournamentId: tournament.id, teamId: teams[5].id, groupName: 'B' } }),
    prisma.tournamentTeam.create({ data: { tournamentId: tournament.id, teamId: teams[6].id, groupName: 'B' } }),
    prisma.tournamentTeam.create({ data: { tournamentId: tournament.id, teamId: teams[7].id, groupName: 'B' } }),
  ]);

  // ═══ 6. المباريات ════════════════════════════════════════════════════════════
  // --- المجموعة A ---
  // سيناريو كسر التعادل: النسور والأسود والصقور كلهم 4 نقاط
  // لكن المواجهات المباشرة تختلف

  const groupAMatches = [
    // الجولة 1
    { home: teams[0], away: teams[1], hs: 1, as: 1, groupName: 'A', matchDate: new Date('2024-01-07') }, // النسور 1-1 الأسود
    { home: teams[2], away: teams[3], hs: 2, as: 0, groupName: 'A', matchDate: new Date('2024-01-07') }, // الصقور 2-0 الوحوش
    // الجولة 2
    { home: teams[0], away: teams[2], hs: 1, as: 0, groupName: 'A', matchDate: new Date('2024-01-14') }, // النسور 1-0 الصقور
    { home: teams[1], away: teams[3], hs: 3, as: 0, groupName: 'A', matchDate: new Date('2024-01-14') }, // الأسود 3-0 الوحوش
    // الجولة 3
    { home: teams[0], away: teams[3], hs: 2, as: 0, groupName: 'A', matchDate: new Date('2024-01-21') }, // النسور 2-0 الوحوش
    { home: teams[1], away: teams[2], hs: 1, as: 2, groupName: 'A', matchDate: new Date('2024-01-21') }, // الأسود 1-2 الصقور
  ];

  // --- المجموعة B ---
  const groupBMatches = [
    { home: teams[4], away: teams[5], hs: 2, as: 1, groupName: 'B', matchDate: new Date('2024-01-08') },
    { home: teams[6], away: teams[7], hs: 0, as: 0, groupName: 'B', matchDate: new Date('2024-01-08') },
    { home: teams[4], away: teams[6], hs: 1, as: 1, groupName: 'B', matchDate: new Date('2024-01-15') },
    { home: teams[5], away: teams[7], hs: 2, as: 0, groupName: 'B', matchDate: new Date('2024-01-15') },
    { home: teams[4], away: teams[7], hs: 3, as: 1, groupName: 'B', matchDate: new Date('2024-01-22') },
    { home: teams[5], away: teams[6], hs: 0, as: 1, groupName: 'B', matchDate: new Date('2024-01-22') },
  ];

  const allMatchData = [...groupAMatches, ...groupBMatches];
  const createdMatches = [];

  for (const m of allMatchData) {
    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homeTeamId: m.home.id,
        awayTeamId: m.away.id,
        homeScore: m.hs,
        awayScore: m.as,
        status: 'finished',
        stage: 'group',
        groupName: m.groupName,
        venue: 'ملعب المدينة',
        matchDate: m.matchDate,
      },
    });
    createdMatches.push({ match, home: m.home, away: m.away, hs: m.hs, as: m.as });
  }
  console.log(`✅ تم إنشاء ${createdMatches.length} مباراة`);

  // ═══ 7. الأهداف ══════════════════════════════════════════════════════════════
  let goalCount = 0;
  for (const { match, home, away, hs, as: awayScore } of createdMatches) {
    const homePlayers = playersByTeam[home.id];
    const awayPlayers = playersByTeam[away.id];

    // أهداف الفريق المضيف
    for (let g = 0; g < hs; g++) {
      const player = homePlayers[g % homePlayers.length];
      await prisma.goal.create({
        data: {
          matchId: match.id,
          playerId: player.id,
          teamId: home.id,
          type: 'normal',
          minute: 20 + g * 15,
          isNominated: goalCount < 4, // أول 4 أهداف مرشحة للتصويت
        },
      });
      await prisma.player.update({
        where: { id: player.id },
        data: { goalsCount: { increment: 1 } },
      });
      goalCount++;
    }

    // أهداف الفريق الضيف
    for (let g = 0; g < awayScore; g++) {
      const player = awayPlayers[g % awayPlayers.length];
      await prisma.goal.create({
        data: {
          matchId: match.id,
          playerId: player.id,
          teamId: away.id,
          type: 'normal',
          minute: 30 + g * 20,
          isNominated: false,
        },
      });
      await prisma.player.update({
        where: { id: player.id },
        data: { goalsCount: { increment: 1 } },
      });
      goalCount++;
    }
  }
  console.log(`✅ تم إنشاء ${goalCount} هدف`);

  // ═══ 8. البطاقات (لاختبار نقاط اللعب النظيف) ════════════════════════════════
  const firstMatch = createdMatches[0];
  const homeP = playersByTeam[firstMatch.home.id];
  const awayP = playersByTeam[firstMatch.away.id];

  await prisma.card.createMany({
    data: [
      { matchId: firstMatch.match.id, playerId: homeP[3].id, teamId: firstMatch.home.id, type: 'yellow', minute: 35 },
      { matchId: firstMatch.match.id, playerId: homeP[4].id, teamId: firstMatch.home.id, type: 'yellow', minute: 67 },
      { matchId: firstMatch.match.id, playerId: awayP[2].id, teamId: firstMatch.away.id, type: 'red', minute: 55 },
    ],
  });
  console.log('✅ تم إنشاء البطاقات');

  // ═══ 9. الرعاة ═══════════════════════════════════════════════════════════════
  await prisma.sponsor.createMany({
    data: [
      { name: 'راعي النجوم', logoUrl: '/sponsors/s1.png', displayOrder: 1, isActive: true },
      { name: 'الشريك الرياضي', logoUrl: '/sponsors/s2.png', displayOrder: 2, isActive: true },
      { name: 'مجموعة الأبطال', logoUrl: '/sponsors/s3.png', displayOrder: 3, isActive: true },
    ],
  });
  console.log('✅ تم إنشاء الرعاة');

  // ═══ 10. الإعدادات الافتراضية ════════════════════════════════════════════════
  await prisma.setting.createMany({
    data: [
      { key: 'primaryColor', value: '#750722' },
      { key: 'accentColor', value: '#C92142' },
      { key: 'textColor', value: '#2c3e50' },
      { key: 'backgroundColor', value: '#f8f9fa' },
      { key: 'siteName', value: 'نجوم الدوري' },
      { key: 'logoUrl', value: '' },
      { key: 'facebookUrl', value: '' },
      { key: 'instagramUrl', value: '' },
      { key: 'twitterUrl', value: '' },
    ],
  });
  console.log('✅ تم إنشاء إعدادات النظام');

  // ═══ 11. المحتوى النصي ═══════════════════════════════════════════════════════
  await prisma.content.createMany({
    data: [
      {
        section: 'hero',
        title: 'دوري نجوم الرياض',
        body: 'تابع أهداف ونتائج وترتيب بطولتك المفضلة بالوقت الفعلي',
        imageUrl: '',
      },
      {
        section: 'about',
        title: 'من نحن',
        body: 'منصة رياضية متكاملة تهتم بالبطولات الكروية المحلية وتعرضها بأعلى مستويات الجودة والاحترافية',
        imageUrl: '',
      },
    ],
  });
  console.log('✅ تم إنشاء المحتوى النصي');

  console.log('\n🎉 اكتملت تهيئة البيانات بنجاح!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 بيانات الدخول:');
  console.log('   المستخدم: admin');
  console.log('   كلمة المرور: Admin@2024');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ خطأ في تهيئة البيانات:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
