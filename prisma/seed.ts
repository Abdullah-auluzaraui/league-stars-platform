import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// أسماء عربية واقعية للاعبين
const firstNames = ['خالد', 'محمد', 'عبدالرحمن', 'سعد', 'ياسر', 'سلطان', 'فهد', 'عبدالله', 'سلمان', 'علي', 'عمر', 'فيصل', 'صالح', 'أحمد', 'عبدالعزيز'];
const lastNames = ['الدوسري', 'العتيبي', 'الشمري', 'القحطاني', 'الشهري', 'العنزي', 'المطيري', 'الحربي', 'الغامدي', 'الزهراني', 'المالكي', 'البقمي'];

function getRandomArabicName() {
  const f = firstNames[Math.floor(Math.random() * firstNames.length)];
  const l = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${f} ${l}`;
}

async function cleanDatabase() {
  console.log('تنظيف قاعدة البيانات...');
  
  // حذف السجلات بالترتيب الصحيح لتفادي قيود العلاقات ForeignKey Constraints
  await prisma.goalVote.deleteMany({});
  await prisma.votingRoundGoal.deleteMany({});
  await prisma.votingRound.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.card.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.tournamentTeam.deleteMany({});
  await prisma.player.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.tournament.deleteMany({});
  await prisma.sponsor.deleteMany({});
  await prisma.content.deleteMany({});
  await prisma.setting.deleteMany({});
  
  console.log('اكتمل تنظيف قاعدة البيانات.');
}

async function seed() {
  // 1. المشرف الافتراضي
  console.log('إنشاء المشرف الافتراضي...');
  const passwordHash = await bcrypt.hash('Admin@2026', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash },
    create: {
      username: 'admin',
      passwordHash,
      role: 'admin',
    },
  });

  // 2. المحتوى الترحيبي (Hero Section)
  console.log('تهيئة المحتوى النصي...');
  await prisma.content.create({
    data: {
      section: 'hero',
      title: 'دوري نجوم الرياض',
      body: 'البطولة الرمضانية الأكبر والأقوى لفرق الهواة في منطقة الرياض، حيث تتنافس نخبة الفرق المحلية على اللقب الأغلى وسط حضور جماهيري وتغطية إعلامية متميزة.',
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
    },
  });

  // 3. الرعاة الرسميون
  console.log('إضافة الرعاة...');
  const sponsorsData = [
    {
      name: 'روشن العقارية',
      logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Roshn&backgroundColor=b91c1c',
      websiteUrl: 'https://www.roshn.sa',
      displayOrder: 1,
    },
    {
      name: 'طيران الرياض',
      logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=RiyadhAir&backgroundColor=4338ca',
      websiteUrl: 'https://www.riyadhair.com',
      displayOrder: 2,
    },
    {
      name: 'مشاريع القدية',
      logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Qiddiya&backgroundColor=059669',
      websiteUrl: 'https://qiddiya.com',
      displayOrder: 3,
    },
    {
      name: 'الشريك الرياضي للملابس',
      logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=SportStore&backgroundColor=d97706',
      websiteUrl: null,
      displayOrder: 4,
    },
  ];

  for (const s of sponsorsData) {
    await prisma.sponsor.create({ data: s });
  }

  // 4. البطولات
  console.log('إنشاء البطولات...');
  const activeTournament = await prisma.tournament.create({
    data: {
      name: 'دوري نجوم الرياض 2026',
      type: 'group_stage',
      status: 'active',
      groupCount: 2,
      qualifyingTeams: 2,
      startDate: new Date('2026-03-01T20:00:00Z'),
      endDate: new Date('2026-04-01T22:00:00Z'),
    },
  });

  const upcomingTournament = await prisma.tournament.create({
    data: {
      name: 'كأس النجوم الصيفية 2026',
      type: 'knockout',
      status: 'upcoming',
      groupCount: 1,
      qualifyingTeams: 1,
      startDate: new Date('2026-07-15T18:00:00Z'),
      endDate: new Date('2026-08-15T21:00:00Z'),
    },
  });

  // 5. الفرق والمجموعات
  console.log('إنشاء الفرق واللاعبين...');
  const groupATeamNames = ['النسور', 'الأسود', 'الصقور', 'الوحوش'];
  const groupBTeamNames = ['الأبطال', 'الرياح', 'البرق', 'الثعالب'];

  const allTeams: any[] = [];
  
  // دالة مساعدة لإنشاء فريق ولاعبيه
  const createTeamWithPlayers = async (name: string, groupName: string) => {
    // إنشاء الفريق
    const team = await prisma.team.create({
      data: {
        name,
        logoUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}&backgroundColor=0e0e12`,
      },
    });

    // ربطه بالبطولة النشطة في مجموعته
    await prisma.tournamentTeam.create({
      data: {
        tournamentId: activeTournament.id,
        teamId: team.id,
        groupName,
        status: 'active',
      },
    });

    // إنشاء 5 لاعبين بمراكز محددة لتجنب تعارض أرقام القمصان
    const playerPositions = [
      { pos: 'goalkeeper', num: 1 },
      { pos: 'defender', num: 4 },
      { pos: 'midfielder', num: 8 },
      { pos: 'midfielder', num: 10 },
      { pos: 'forward', num: 9 },
    ];

    const players: any[] = [];
    for (const pInfo of playerPositions) {
      const player = await prisma.player.create({
        data: {
          name: getRandomArabicName(),
          jerseyNumber: pInfo.num,
          position: pInfo.pos,
          teamId: team.id,
          photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name + pInfo.num)}`,
        },
      });
      players.push(player);
    }

    return { team, players };
  };

  const groupAData: any[] = [];
  const groupBData: any[] = [];

  for (const name of groupATeamNames) {
    const data = await createTeamWithPlayers(name, 'A');
    groupAData.push(data);
    allTeams.push(data.team);
  }

  for (const name of groupBTeamNames) {
    const data = await createTeamWithPlayers(name, 'B');
    groupBData.push(data);
    allTeams.push(data.team);
  }

  // 6. مباريات المجموعة A (مباراتين منتهية، مباراة جارية، ومباراة مجدولة)
  console.log('إنشاء مباريات وأحداث المجموعة A...');
  
  // مباراة 1: النسور ضد الأسود (منتهية: 3 - 1)
  const matchA1 = await prisma.match.create({
    data: {
      tournamentId: activeTournament.id,
      homeTeamId: groupAData[0].team.id, // النسور
      awayTeamId: groupAData[1].team.id, // الأسود
      homeScore: 3,
      awayScore: 1,
      status: 'finished',
      stage: 'group',
      groupName: 'A',
      venue: 'ملعب النجوم الفرعي 1',
      matchDate: new Date('2026-03-05T20:00:00Z'),
    },
  });

  // تسجيل أهداف لمباراة 1
  // هدافو النسور (اللاعب ذو الرقم 9 أحرز هدفين، والرقم 10 أحرز هدف)
  const goalA1_1 = await prisma.goal.create({
    data: {
      matchId: matchA1.id,
      playerId: groupAData[0].players[4].id, // مهاجم النسور (رقم 9)
      teamId: groupAData[0].team.id,
      minute: 15,
      type: 'normal',
    },
  });

  const goalA1_2 = await prisma.goal.create({
    data: {
      matchId: matchA1.id,
      playerId: groupAData[0].players[4].id, // مهاجم النسور (رقم 9)
      teamId: groupAData[0].team.id,
      minute: 42,
      type: 'normal',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', // فيديو تجريبي
    },
  });

  const goalA1_3 = await prisma.goal.create({
    data: {
      matchId: matchA1.id,
      playerId: groupAData[0].players[3].id, // وسط النسور (رقم 10)
      teamId: groupAData[0].team.id,
      minute: 73,
      type: 'penalty',
    },
  });

  // هداف الأسود (اللاعب ذو الرقم 9 أحرز هدف)
  const goalA1_4 = await prisma.goal.create({
    data: {
      matchId: matchA1.id,
      playerId: groupAData[1].players[4].id, // مهاجم الأسود (رقم 9)
      teamId: groupAData[1].team.id,
      minute: 88,
      type: 'normal',
      videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    },
  });

  // تسجيل بطاقات لمباراة 1
  await prisma.card.create({
    data: {
      matchId: matchA1.id,
      playerId: groupAData[0].players[1].id, // مدافع النسور
      teamId: groupAData[0].team.id,
      type: 'yellow',
      minute: 34,
    },
  });

  await prisma.card.create({
    data: {
      matchId: matchA1.id,
      playerId: groupAData[1].players[2].id, // وسط الأسود
      teamId: groupAData[1].team.id,
      type: 'yellow',
      minute: 60,
    },
  });

  // مباراة 2: الصقور ضد الوحوش (منتهية: 0 - 2)
  const matchA2 = await prisma.match.create({
    data: {
      tournamentId: activeTournament.id,
      homeTeamId: groupAData[2].team.id, // الصقور
      awayTeamId: groupAData[3].team.id, // الوحوش
      homeScore: 0,
      awayScore: 2,
      status: 'finished',
      stage: 'group',
      groupName: 'A',
      venue: 'ملعب النجوم الفرعي 2',
      matchDate: new Date('2026-03-05T22:00:00Z'),
    },
  });

  const goalA2_1 = await prisma.goal.create({
    data: {
      matchId: matchA2.id,
      playerId: groupAData[3].players[4].id, // مهاجم الوحوش (رقم 9)
      teamId: groupAData[3].team.id,
      minute: 30,
      type: 'normal',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
  });

  const goalA2_2 = await prisma.goal.create({
    data: {
      matchId: matchA2.id,
      playerId: groupAData[3].players[3].id, // وسط الوحوش (رقم 10)
      teamId: groupAData[3].team.id,
      minute: 65,
      type: 'normal',
    },
  });

  // مباراة 3: النسور ضد الصقور (مباشرة الآن: 1 - 1)
  const matchA3 = await prisma.match.create({
    data: {
      tournamentId: activeTournament.id,
      homeTeamId: groupAData[0].team.id, // النسور
      awayTeamId: groupAData[2].team.id, // الصقور
      homeScore: 1,
      awayScore: 1,
      status: 'live',
      stage: 'group',
      groupName: 'A',
      venue: 'ملعب النجوم الرئيسي',
      matchDate: new Date(), // الآن
    },
  });

  // أهداف المباراة المباشرة
  await prisma.goal.create({
    data: {
      matchId: matchA3.id,
      playerId: groupAData[0].players[4].id, // مهاجم النسور
      teamId: groupAData[0].team.id,
      minute: 12,
      type: 'normal',
    },
  });

  await prisma.goal.create({
    data: {
      matchId: matchA3.id,
      playerId: groupAData[2].players[4].id, // مهاجم الصقور
      teamId: groupAData[2].team.id,
      minute: 55,
      type: 'normal',
    },
  });

  // مباراة 4: الأسود ضد الوحوش (مجدولة/قادمة)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(20, 0, 0, 0);

  await prisma.match.create({
    data: {
      tournamentId: activeTournament.id,
      homeTeamId: groupAData[1].team.id, // الأسود
      awayTeamId: groupAData[3].team.id, // الوحوش
      status: 'scheduled',
      stage: 'group',
      groupName: 'A',
      venue: 'ملعب النجوم الرئيسي',
      matchDate: tomorrow,
    },
  });

  // 7. مباريات المجموعة B (مباراتين منتهية، ومباراتين مجدولتين)
  console.log('إنشاء مباريات وأحداث المجموعة B...');
  
  // مباراة 5: الأبطال ضد الرياح (منتهية: 2 - 2)
  const matchB1 = await prisma.match.create({
    data: {
      tournamentId: activeTournament.id,
      homeTeamId: groupBData[0].team.id, // الأبطال
      awayTeamId: groupBData[1].team.id, // الرياح
      homeScore: 2,
      awayScore: 2,
      status: 'finished',
      stage: 'group',
      groupName: 'B',
      venue: 'ملعب النجوم الفرعي 1',
      matchDate: new Date('2026-03-06T20:00:00Z'),
    },
  });

  await prisma.goal.create({
    data: {
      matchId: matchB1.id,
      playerId: groupBData[0].players[4].id, // مهاجم الأبطال
      teamId: groupBData[0].team.id,
      minute: 24,
      type: 'normal',
    },
  });

  await prisma.goal.create({
    data: {
      matchId: matchB1.id,
      playerId: groupBData[0].players[3].id, // وسط الأبطال
      teamId: groupBData[0].team.id,
      minute: 68,
      type: 'free_kick',
    },
  });

  const goalB1_3 = await prisma.goal.create({
    data: {
      matchId: matchB1.id,
      playerId: groupBData[1].players[4].id, // مهاجم الرياح (رقم 9)
      teamId: groupBData[1].team.id,
      minute: 39,
      type: 'normal',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
  });

  await prisma.goal.create({
    data: {
      matchId: matchB1.id,
      playerId: groupBData[1].players[3].id, // وسط الرياح
      teamId: groupBData[1].team.id,
      minute: 82,
      type: 'normal',
    },
  });

  // مباراة 6: البرق ضد الثعالب (منتهية: 1 - 0)
  const matchB2 = await prisma.match.create({
    data: {
      tournamentId: activeTournament.id,
      homeTeamId: groupBData[2].team.id, // البرق
      awayTeamId: groupBData[3].team.id, // الثعالب
      homeScore: 1,
      awayScore: 0,
      status: 'finished',
      stage: 'group',
      groupName: 'B',
      venue: 'ملعب النجوم الفرعي 2',
      matchDate: new Date('2026-03-06T22:00:00Z'),
    },
  });

  await prisma.goal.create({
    data: {
      matchId: matchB2.id,
      playerId: groupBData[2].players[4].id, // مهاجم البرق
      teamId: groupBData[2].team.id,
      minute: 50,
      type: 'normal',
    },
  });

  // مباراتان مجدولتان للمجموعة B
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  dayAfterTomorrow.setHours(20, 0, 0, 0);

  await prisma.match.create({
    data: {
      tournamentId: activeTournament.id,
      homeTeamId: groupBData[0].team.id,
      awayTeamId: groupBData[2].team.id,
      status: 'scheduled',
      stage: 'group',
      groupName: 'B',
      venue: 'ملعب النجوم الفرعي 1',
      matchDate: dayAfterTomorrow,
    },
  });

  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  threeDaysLater.setHours(22, 0, 0, 0);

  await prisma.match.create({
    data: {
      tournamentId: activeTournament.id,
      homeTeamId: groupBData[1].team.id,
      awayTeamId: groupBData[3].team.id,
      status: 'scheduled',
      stage: 'group',
      groupName: 'B',
      venue: 'ملعب النجوم الفرعي 2',
      matchDate: threeDaysLater,
    },
  });

  // 8. تحديث عدادات أهداف اللاعبين يدوياً لتزامن الإحصائيات (الهدافين)
  console.log('تحديث إحصائيات الهدافين...');
  
  // حساب عدد أهداف كل لاعب وتحديثه
  const allPlayers = [
    ...groupAData.flatMap(d => d.players),
    ...groupBData.flatMap(d => d.players),
  ];

  for (const p of allPlayers) {
    const goalsCount = await prisma.goal.count({ where: { playerId: p.id } });
    if (goalsCount > 0) {
      await prisma.player.update({
        where: { id: p.id },
        data: { goalsCount },
      });
    }
  }

  // 9. إنشاء جولات التصويت (Voting Round) وتصويت لأهداف الجولة
  console.log('إنشاء جولة التصويت النشطة وتوليد تصويتات...');
  
  const votingRound = await prisma.votingRound.create({
    data: {
      title: 'تصويت أفضل هدف - الجولة الأولى',
      description: 'صوّت لهدفك المفضل من بين أجمل أهداف مباريات الجولة الأولى في دوري نجوم الرياض 2026.',
      status: 'active',
      tournamentId: activeTournament.id,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // بعد 7 أيام
    },
  });

  // ربط الأهداف المختارة بجولة التصويت
  const vrGoal1 = await prisma.votingRoundGoal.create({
    data: {
      roundId: votingRound.id,
      goalId: goalA1_2.id, // هدف مهاجم النسور (رقم 9) الدقيقة 42
      sortOrder: 1,
      videoUrl: goalA1_2.videoUrl,
    },
  });

  const vrGoal2 = await prisma.votingRoundGoal.create({
    data: {
      roundId: votingRound.id,
      goalId: goalA1_4.id, // هدف مهاجم الأسود (رقم 9) الدقيقة 88
      sortOrder: 2,
      videoUrl: goalA1_4.videoUrl,
    },
  });

  const vrGoal3 = await prisma.votingRoundGoal.create({
    data: {
      roundId: votingRound.id,
      goalId: goalB1_3.id, // هدف مهاجم الرياح (رقم 9) الدقيقة 39
      sortOrder: 3,
      videoUrl: goalB1_3.videoUrl,
    },
  });

  // توليد أصوات تجريبية بنسب متباينة لعرض النتائج بوضوح
  // الهدف الأول (vrGoal1): 45 صوت
  for (let i = 0; i < 45; i++) {
    await prisma.goalVote.create({
      data: {
        votingRoundGoalId: vrGoal1.id,
        visitorIp: `192.168.1.${i + 10}`,
        fingerprint: `fingerprint-seed-vr1-goal1-${i}`,
      },
    }).catch(() => {});
  }

  // الهدف الثاني (vrGoal2): 30 صوت
  for (let i = 0; i < 30; i++) {
    await prisma.goalVote.create({
      data: {
        votingRoundGoalId: vrGoal2.id,
        visitorIp: `192.168.2.${i + 10}`,
        fingerprint: `fingerprint-seed-vr1-goal2-${i}`,
      },
    }).catch(() => {});
  }

  // الهدف الثالث (vrGoal3): 15 صوت
  for (let i = 0; i < 15; i++) {
    await prisma.goalVote.create({
      data: {
        votingRoundGoalId: vrGoal3.id,
        visitorIp: `192.168.3.${i + 10}`,
        fingerprint: `fingerprint-seed-vr1-goal3-${i}`,
      },
    }).catch(() => {});
  }

  console.log('تم إدخال كافة البيانات التجريبية بنجاح!');
}

main()
  .catch((error) => {
    console.error('فشلت عملية تغذية قاعدة البيانات:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

async function main() {
  await cleanDatabase();
  await seed();
}
