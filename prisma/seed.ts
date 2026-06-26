import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء تهيئة البيانات التجريبية بشكل دفاعي ومحمي...');

  const testTournamentNames = ['دوري نجوم الرياض 2026', 'دوري نجوم الرياض - الموسم الأول'];
  const teamNames = ['النسور', 'الأسود', 'الصقور', 'الوحوش', 'الأبطال', 'الرياح', 'البرق', 'الثعالب'];

  // ═══ 1. جلب معرفات الكيانات التجريبية الموجودة حالياً لتنظيفها بدقة ═══════════
  const existingTestTeams = await prisma.team.findMany({
    where: { name: { in: teamNames } },
    select: { id: true }
  });
  const testTeamIds = existingTestTeams.map(t => t.id);

  const existingTestTournaments = await prisma.tournament.findMany({
    where: { name: { in: testTournamentNames } },
    select: { id: true }
  });
  const testTournamentIds = existingTestTournaments.map(t => t.id);

  // ═══ 2. تنظيف السجلات المرتبطة بالبطولات والفرق التجريبية لمنع تعارض المفاتيح الخارجية ═══
  console.log('⏳ جاري تنظيف السجلات المرتبطة بالبطولات والفرق التجريبية...');
  
  // أ) حذف الأصوات المرتبطة بأهداف الفرق أو المباريات التجريبية
  await prisma.goalVote.deleteMany({
    where: {
      OR: [
        { goal: { teamId: { in: testTeamIds } } },
        { goal: { match: { tournamentId: { in: testTournamentIds } } } }
      ]
    }
  });

  // ب) حذف الأهداف المرتبطة بالفرق أو المباريات التجريبية
  await prisma.goal.deleteMany({
    where: {
      OR: [
        { teamId: { in: testTeamIds } },
        { match: { tournamentId: { in: testTournamentIds } } }
      ]
    }
  });

  // ج) حذف بطاقات اللعب النظيف المرتبطة بالفرق أو المباريات التجريبية
  await prisma.card.deleteMany({
    where: {
      OR: [
        { teamId: { in: testTeamIds } },
        { match: { tournamentId: { in: testTournamentIds } } }
      ]
    }
  });

  // د) حذف جميع المباريات التي تشارك فيها الفرق التجريبية أو تنتمي للبطولات التجريبية
  await prisma.match.deleteMany({
    where: {
      OR: [
        { tournamentId: { in: testTournamentIds } },
        { homeTeamId: { in: testTeamIds } },
        { awayTeamId: { in: testTeamIds } }
      ]
    }
  });

  // هـ) حذف مشاركات الفرق في البطولات التجريبية
  await prisma.tournamentTeam.deleteMany({
    where: {
      OR: [
        { tournamentId: { in: testTournamentIds } },
        { teamId: { in: testTeamIds } }
      ]
    }
  });

  // و) حذف البطولات التجريبية نفسها
  await prisma.tournament.deleteMany({
    where: { id: { in: testTournamentIds } }
  });

  // ز) حذف الفرق التجريبية (وهذا سيتكفل بحذف لاعبيهم تلقائياً بسبب onDelete: Cascade بين اللاعب والفريق)
  await prisma.team.deleteMany({
    where: { id: { in: testTeamIds } }
  });

  console.log('✅ تم تنظيف السجلات التجريبية القديمة بنجاح ودون التأثير على البيانات المخصصة.');

  // ═══ 3. المشرف الافتراضي (بشكل دفاعي - لا يمسح المشرفين الحاليين) ═══════════
  const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!adminUser) {
    const passwordHash = await bcrypt.hash('Admin@2026', 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
        role: 'admin',
      },
    });
    console.log('✅ تم إنشاء المشرف الافتراضي: admin / Admin@2026');
  } else {
    console.log('ℹ️ المشرف admin موجود مسبقاً، تم تخطي الإنشاء لحماية الجلسة.');
  }

  // ═══ 4. الفرق التجريبية الجديدة ════════════════════════════════════════════
  const teams = await Promise.all(
    teamNames.map((name) =>
      prisma.team.create({ data: { name } })
    )
  );
  console.log(`✅ تم إنشاء ${teams.length} فرق تجريبية جديدة`);

  // ═══ 5. اللاعبون الجدد ═════════════════════════════════════════════════════
  const playersByTeam: Record<string, { id: string; name: string }[]> = {};

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
  console.log('✅ تم إنشاء اللاعبين (15 لاعب لكل فريق تجريبي)');

  // ═══ 6. البطولات الجديدة (نشطة + مؤرشفة) ══════════════════════════════════
  
  // أ) البطولة النشطة الحالية
  const activeTournament = await prisma.tournament.create({
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

  // ب) البطولة المؤرشفة المنتهية (لغرض معرض البطولات)
  const archivedTournament = await prisma.tournament.create({
    data: {
      name: 'دوري نجوم الرياض - الموسم الأول',
      type: 'group_stage',
      status: 'completed',
      groupCount: 1,
      qualifyingTeams: 2,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-02-15'),
      archivedAt: new Date('2025-02-15'),
    },
  });
  console.log('✅ تم إنشاء البطولتين (نشطة + مؤرشفة)');

  // ربط الفرق بالبطولة النشطة (مجموعتان A و B)
  await Promise.all([
    prisma.tournamentTeam.create({ data: { tournamentId: activeTournament.id, teamId: teams[0].id, groupName: 'A' } }),
    prisma.tournamentTeam.create({ data: { tournamentId: activeTournament.id, teamId: teams[1].id, groupName: 'A' } }),
    prisma.tournamentTeam.create({ data: { tournamentId: activeTournament.id, teamId: teams[2].id, groupName: 'A' } }),
    prisma.tournamentTeam.create({ data: { tournamentId: activeTournament.id, teamId: teams[3].id, groupName: 'A' } }),
    prisma.tournamentTeam.create({ data: { tournamentId: activeTournament.id, teamId: teams[4].id, groupName: 'B' } }),
    prisma.tournamentTeam.create({ data: { tournamentId: activeTournament.id, teamId: teams[5].id, groupName: 'B' } }),
    prisma.tournamentTeam.create({ data: { tournamentId: activeTournament.id, teamId: teams[6].id, groupName: 'B' } }),
    prisma.tournamentTeam.create({ data: { tournamentId: activeTournament.id, teamId: teams[7].id, groupName: 'B' } }),
  ]);

  // ربط الفرق بالبطولة المؤرشفة (مجموعة واحدة شاملة)
  await Promise.all(
    teams.map((t) =>
      prisma.tournamentTeam.create({
        data: { tournamentId: archivedTournament.id, teamId: t.id, groupName: 'المجموعة العامة' }
      })
    )
  );
  console.log('✅ تم ربط الفرق بالمجموعات للبطولتين');

  // ═══ 7. مباريات البطولة النشطة 2026 ═════════════════════════════════════════
  const groupAMatches = [
    { home: teams[0], away: teams[1], hs: 1, as: 1, groupName: 'A', matchDate: new Date('2026-01-07T18:00:00Z') },
    { home: teams[2], away: teams[3], hs: 2, as: 0, groupName: 'A', matchDate: new Date('2026-01-07T20:30:00Z') },
    { home: teams[0], away: teams[2], hs: 1, as: 0, groupName: 'A', matchDate: new Date('2026-01-14T18:00:00Z') },
    { home: teams[1], away: teams[3], hs: 3, as: 0, groupName: 'A', matchDate: new Date('2026-01-14T20:30:00Z') },
    { home: teams[0], away: teams[3], hs: 2, as: 0, groupName: 'A', matchDate: new Date('2026-01-21T18:00:00Z') },
    { home: teams[1], away: teams[2], hs: 1, as: 2, groupName: 'A', matchDate: new Date('2026-01-21T20:30:00Z') },
  ];

  const groupBMatches = [
    { home: teams[4], away: teams[5], hs: 2, as: 1, groupName: 'B', matchDate: new Date('2026-01-08T18:00:00Z') },
    { home: teams[6], away: teams[7], hs: 0, as: 0, groupName: 'B', matchDate: new Date('2026-01-08T20:30:00Z') },
    { home: teams[4], away: teams[6], hs: 1, as: 1, groupName: 'B', matchDate: new Date('2026-01-15T18:00:00Z') },
    { home: teams[5], away: teams[7], hs: 2, as: 0, groupName: 'B', matchDate: new Date('2026-01-15T20:30:00Z') },
    { home: teams[4], away: teams[7], hs: 3, as: 1, groupName: 'B', matchDate: new Date('2026-01-22T18:00:00Z') },
    { home: teams[5], away: teams[6], hs: 0, as: 1, groupName: 'B', matchDate: new Date('2026-01-22T20:30:00Z') },
  ];

  const activeMatchesData = [...groupAMatches, ...groupBMatches];
  const createdActiveMatches = [];

  for (const m of activeMatchesData) {
    const match = await prisma.match.create({
      data: {
        tournamentId: activeTournament.id,
        homeTeamId: m.home.id,
        awayTeamId: m.away.id,
        homeScore: m.hs,
        awayScore: m.as,
        status: 'finished',
        stage: 'group',
        groupName: m.groupName,
        venue: 'ملعب النجوم الرئيسي',
        matchDate: m.matchDate,
      },
    });
    createdActiveMatches.push({ match, home: m.home, away: m.away, hs: m.hs, as: m.as });
  }

  // مباريات إضافية مجدولة ومباشرة (للصفحة الرئيسية والمباريات الحية)
  const liveMatch = await prisma.match.create({
    data: {
      tournamentId: activeTournament.id,
      homeTeamId: teams[0].id, // النسور
      awayTeamId: teams[4].id, // الأبطال
      homeScore: 2,
      awayScore: 1,
      status: 'live',
      stage: 'quarter',
      venue: 'ملعب النجوم الرئيسي',
      matchDate: new Date(), // حالياً مباشرة
    }
  });
  createdActiveMatches.push({ match: liveMatch, home: teams[0], away: teams[4], hs: 2, as: 1 });

  const scheduledMatch = await prisma.match.create({
    data: {
      tournamentId: activeTournament.id,
      homeTeamId: teams[1].id, // الأسود
      awayTeamId: teams[5].id, // الرياح
      status: 'scheduled',
      stage: 'quarter',
      venue: 'ملعب العاصمة',
      matchDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // بعد يومين
    }
  });

  // ═══ 8. مباريات البطولة المؤرشفة 2025 ════════════════════════════════════════
  const archivedMatchesData = [
    { home: teams[0], away: teams[2], hs: 3, as: 2, matchDate: new Date('2025-01-10T18:00:00Z') },
    { home: teams[1], away: teams[3], hs: 0, as: 1, matchDate: new Date('2025-01-12T18:00:00Z') },
    { home: teams[4], away: teams[6], hs: 2, as: 2, matchDate: new Date('2025-01-15T18:00:00Z') },
    { home: teams[5], away: teams[7], hs: 1, as: 0, matchDate: new Date('2025-01-18T18:00:00Z') },
    // النهائي المؤرشف
    { home: teams[0], away: teams[5], hs: 2, as: 0, matchDate: new Date('2025-02-15T20:00:00Z') },
  ];

  const createdArchivedMatches = [];
  for (const m of archivedMatchesData) {
    const match = await prisma.match.create({
      data: {
        tournamentId: archivedTournament.id,
        homeTeamId: m.home.id,
        awayTeamId: m.away.id,
        homeScore: m.hs,
        awayScore: m.as,
        status: 'finished',
        stage: m.home === teams[0] && m.away === teams[5] ? 'final' : 'group',
        groupName: 'المجموعة العامة',
        venue: 'ملعب الصداقة القديم',
        matchDate: m.matchDate,
      },
    });
    createdArchivedMatches.push({ match, home: m.home, away: m.away, hs: m.hs, as: m.as });
  }
  console.log(`✅ تم إنشاء ${createdActiveMatches.length + createdArchivedMatches.length} مباراة للبطولتين`);

  // ═══ 9. أهداف وتتويج هدافي البطولتين ═════════════════════════════════════════
  let goalCount = 0;
  const allCreatedMatches = [...createdActiveMatches, ...createdArchivedMatches];

  for (const { match, home, away, hs, as: awayScore } of allCreatedMatches) {
    if (hs === undefined || awayScore === undefined) continue;

    const homePlayers = playersByTeam[home.id];
    const awayPlayers = playersByTeam[away.id];

    // أهداف المضيف
    for (let g = 0; g < hs; g++) {
      const player = homePlayers[g % homePlayers.length];
      await prisma.goal.create({
        data: {
          matchId: match.id,
          playerId: player.id,
          teamId: home.id,
          type: 'normal',
          minute: 15 + g * 22,
          isNominated: match.tournamentId === activeTournament.id && goalCount < 4, // ترشيح أول 4 أهداف بالبطولة النشطة فقط
        },
      });
      await prisma.player.update({
        where: { id: player.id },
        data: { goalsCount: { increment: 1 } },
      });
      goalCount++;
    }

    // أهداف الضيف
    for (let g = 0; g < awayScore; g++) {
      const player = awayPlayers[g % awayPlayers.length];
      await prisma.goal.create({
        data: {
          matchId: match.id,
          playerId: player.id,
          teamId: away.id,
          type: 'normal',
          minute: 25 + g * 20,
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
  console.log(`✅ تم تسجيل ${goalCount} هدف وتحديث عدادات الهدافين للبطولتين`);

  // ═══ 10. البطاقات (لاختبار اللعب النظيف) ════════════════════════════════════
  const sampleActiveMatch = createdActiveMatches[0].match;
  const hPlayers = playersByTeam[createdActiveMatches[0].home.id];
  const aPlayers = playersByTeam[createdActiveMatches[0].away.id];

  await prisma.card.createMany({
    data: [
      { matchId: sampleActiveMatch.id, playerId: hPlayers[2].id, teamId: createdActiveMatches[0].home.id, type: 'yellow', minute: 18 },
      { matchId: sampleActiveMatch.id, playerId: hPlayers[5].id, teamId: createdActiveMatches[0].home.id, type: 'yellow', minute: 55 },
      { matchId: sampleActiveMatch.id, playerId: aPlayers[3].id, teamId: createdActiveMatches[0].away.id, type: 'red', minute: 72 },
    ],
  });
  console.log('✅ تم إدراج بطاقات اللعب النظيف للمباريات النشطة');

  // ═══ 11. الرعاة (دفاعي - إدراج فقط في حال عدم وجود رعاة) ═══════════════════
  const sponsorCount = await prisma.sponsor.count();
  if (sponsorCount === 0) {
    await prisma.sponsor.createMany({
      data: [
        { name: 'راعي النجوم', logoUrl: '/sponsors/s1.png', displayOrder: 1, isActive: true },
        { name: 'الشريك الرياضي', logoUrl: '/sponsors/s2.png', displayOrder: 2, isActive: true },
        { name: 'مجموعة الأبطال', logoUrl: '/sponsors/s3.png', displayOrder: 3, isActive: true },
      ],
    });
    console.log('✅ تم إنشاء الرعاة الافتراضيين');
  } else {
    console.log('ℹ️ الرعاة موجودون مسبقاً، تم تخطي التوليد لحماية الشعارات الحالية.');
  }

  // ═══ 12. الإعدادات الافتراضية (دفاعي - إدراج المفقود فقط) ═══════════════════
  const defaultSettings = [
    { key: 'primaryColor', value: '#750722' },
    { key: 'accentColor', value: '#C92142' },
    { key: 'textColor', value: '#2c3e50' },
    { key: 'backgroundColor', value: '#f8f9fa' },
    { key: 'siteName', value: 'نجوم الدوري' },
    { key: 'logoUrl', value: '' },
    { key: 'facebookUrl', value: '' },
    { key: 'instagramUrl', value: '' },
    { key: 'twitterUrl', value: '' },
  ];
  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {}, // لا نحدث القيم الحالية لحماية ألوان وهوية الموقع المخصصة من الإداري
      create: s,
    });
  }
  console.log('✅ تم التحقق من الإعدادات الافتراضية وإضافة المفقود منها بنجاح');

  // ═══ 13. المحتوى النصي (دفاعي - إدراج المفقود فقط) ════════════════════════
  const defaultContents = [
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
  ];
  for (const c of defaultContents) {
    await prisma.content.upsert({
      where: { section: c.section },
      update: {}, // لا نعدل المحتوى الحالي لحماية نصوص من نحن وقسم البطل
      create: c,
    });
  }
  console.log('✅ تم التحقق من المحتويات الافتراضية وإضافة المفقود منها بنجاح');

  console.log('\n🎉 اكتملت تهيئة البيانات الدفاعية بنجاح بنسبة 100%!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 بيانات الدخول:');
  console.log('   المستخدم: admin');
  console.log('   كلمة المرور: Admin@2026 (في حال عدم تغييرها مسبقاً)');
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
