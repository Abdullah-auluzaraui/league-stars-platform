import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// أسماء واقعية للاعبين
const firstNames = [
  'محمد', 'عبدالله', 'سلطان', 'خالد', 'فهد', 'عبدالرحمن', 'سعود', 'ياسر',
  'فيصل', 'عمر', 'سلمان', 'علي', 'تركي', 'عبدالعزيز', 'سعد', 'نواف'
];
const lastNames = [
  'الدوسري', 'القحطاني', 'العتيبي', 'الشمري', 'الشهري', 'العنزي', 'المطيري',
  'الحربي', 'الغامدي', 'الزهراني', 'المالكي', 'السبيعي', 'الرويلي', 'البقمي'
];

function getRandomName(seedIndex: number): string {
  const f = firstNames[seedIndex % firstNames.length];
  const l = lastNames[(seedIndex * 3) % lastNames.length];
  return `${f} ${l}`;
}

async function cleanDatabase() {
  console.log('🧹 تنظيف قاعدة البيانات...');
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
  console.log('✅ تم تفريغ الجداول بنجاح.');
}

async function seed() {
  // ─────────────────────────────────────────────────────────────
  // 1. المشرف الافتراضي
  // ─────────────────────────────────────────────────────────────
  console.log('👤 إنشاء حساب المشرف...');
  const passwordHash = await bcrypt.hash('demo123456', 10);
  await prisma.user.upsert({
    where: { username: 'demo-admin' },
    update: { passwordHash, role: 'admin' },
    create: {
      username: 'demo-admin',
      passwordHash,
      role: 'admin',
    },
  });

  // ─────────────────────────────────────────────────────────────
  // 2. المحتوى العام والإعدادات
  // ─────────────────────────────────────────────────────────────
  console.log('⚙️ إعداد المحتوى النصي والإعدادات العامة...');
  
  await prisma.content.create({
    data: {
      section: 'hero',
      title: 'دوري نجوم الرياض',
      body: 'البطولة الرمضانية الأكبر والأقوى لفرق الهواة في منطقة الرياض، حيث تتنافس نخبة الفرق المحلية على اللقب الأغلى وسط حضور جماهيري وتغطية إعلامية متميزة.',
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
    },
  });

  await prisma.content.create({
    data: {
      section: 'about',
      title: 'عن البطولة',
      body: 'انطلقت بطولة نجوم الرياض لتجمع صفوة الرياضيين والفرق في منافسة شريفة تسعى لتطوير الرياضة المجتمعية وإبراز المواهب الكروية الشابة.',
    },
  });

  await prisma.content.create({
    data: {
      section: 'vision',
      title: 'رؤيتنا',
      body: 'المساهمة في تحقيق مستهدفات رؤية 2030 الرياضية عبر نشر ممارسة كرة القدم وتعزيز التنافسية الرياضية بين شباب الوطن.',
    },
  });

  const defaultSettings = [
    { key: 'tournament_name', value: 'دوري نجوم الرياض 2026' },
    { key: 'voting_enabled', value: 'true' },
    { key: 'site_title', value: 'League Stars | بطولة نجوم الدوري' },
    { key: 'contact_email', value: 'contact@leaguestars.sa' },
    { key: 'contact_phone', value: '+966500000000' },
    { key: 'social_twitter', value: 'https://x.com' },
    { key: 'social_instagram', value: 'https://instagram.com' },
    { key: 'social_tiktok', value: 'https://tiktok.com' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.create({ data: s });
  }

  // ─────────────────────────────────────────────────────────────
  // 3. الرعاة الرسميون
  // ─────────────────────────────────────────────────────────────
  console.log('🤝 إضافة الرعاة الرسميين...');
  const sponsors = [
    {
      name: 'آفاق الرياضة (تجريبي)',
      logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=DemoSport&backgroundColor=991b1b',
      websiteUrl: 'https://example.com',
      displayOrder: 1,
    },
    {
      name: 'مسارات النجوم (تجريبي)',
      logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=DemoRoutes&backgroundColor=312e81',
      websiteUrl: 'https://example.com',
      displayOrder: 2,
    },
    {
      name: 'ملاعب الغد (تجريبي)',
      logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=DemoFields&backgroundColor=065f46',
      websiteUrl: 'https://example.com',
      displayOrder: 3,
    },
    {
      name: 'طاقة الفريق (تجريبي)',
      logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=DemoEnergy&backgroundColor=1e3a8a',
      websiteUrl: 'https://example.com',
      displayOrder: 4,
    },
  ];

  for (const sp of sponsors) {
    await prisma.sponsor.create({ data: sp });
  }

  // ─────────────────────────────────────────────────────────────
  // 4. إنشاء الفرق واللاعبين (8 فرق متميزة)
  // ─────────────────────────────────────────────────────────────
  console.log('🛡️ إنشاء الفرق واللاعبين...');
  const teamDefs = [
    { name: 'نجوم اليرموك', color: 'b45309' },
    { name: 'صقور العاصمة', color: '1e40af' },
    { name: 'أسود طويق', color: '991b1b' },
    { name: 'شعلة النخيل', color: 'c2410c' },
    { name: 'درع الصحراء', color: '3f6212' },
    { name: 'فهود نجد', color: '854d0e' },
    { name: 'أمل المروج', color: '0f766e' },
    { name: 'فرسان الملز', color: '4338ca' },
  ];

  type CreatedTeam = {
    team: any;
    players: any[];
  };

  const teamsData: CreatedTeam[] = [];
  let playerCounter = 0;

  for (const tDef of teamDefs) {
    const team = await prisma.team.create({
      data: {
        name: tDef.name,
        logoUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(tDef.name)}&backgroundColor=${tDef.color}`,
      },
    });

    const positions = [
      { pos: 'goalkeeper', num: 1 },
      { pos: 'defender', num: 4 },
      { pos: 'midfielder', num: 6 },
      { pos: 'midfielder', num: 8 },
      { pos: 'forward', num: 10 },
    ];

    const players = [];
    for (const p of positions) {
      playerCounter++;
      const playerName = getRandomName(playerCounter);
      const createdPlayer = await prisma.player.create({
        data: {
          name: playerName,
          jerseyNumber: p.num,
          position: p.pos,
          teamId: team.id,
          photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(playerName)}`,
        },
      });
      players.push(createdPlayer);
    }

    teamsData.push({ team, players });
  }

  // مسميات الفرق للتسهيل
  const [
    yarmouk,   // نجوم اليرموك
    suqoor,    // صقور العاصمة
    tuwaiq,    // أسود طويق
    nakheel,   // شعلة النخيل
    sahraa,    // درع الصحراء
    najd,      // فهود نجد
    murooj,    // أمل المروج
    malaz,     // فرسان الملز
  ] = teamsData;

  // ─────────────────────────────────────────────────────────────
  // 5. البطولة المكتملة: "كأس نجوم الدوري 2025" (Knockout Cup)
  // ─────────────────────────────────────────────────────────────
  console.log('🏆 إنشاء البطولة المكتملة (كأس نجوم الدوري 2025)...');
  const pastCup = await prisma.tournament.create({
    data: {
      name: 'كأس نجوم الدوري 2025',
      type: 'knockout',
      status: 'completed',
      groupCount: 1,
      qualifyingTeams: 1,
      startDate: new Date('2025-10-15T18:00:00Z'),
      endDate: new Date('2025-11-05T21:30:00Z'),
    },
  });

  // ربط جميع الفرق الـ 8 ببطولة الكأس
  for (const td of teamsData) {
    await prisma.tournamentTeam.create({
      data: {
        tournamentId: pastCup.id,
        teamId: td.team.id,
        status: 'active',
      },
    });
  }

  // مباريات ربع النهائي (Quarter-finals) - 4 مباريات
  // 1. نجوم اليرموك 3 - 1 فرسان الملز
  const qf1 = await prisma.match.create({
    data: {
      tournamentId: pastCup.id,
      homeTeamId: yarmouk.team.id,
      awayTeamId: malaz.team.id,
      homeScore: 3,
      awayScore: 1,
      status: 'finished',
      stage: 'quarter',
      venue: 'استاد النجوم الرئيسي',
      matchDate: new Date('2025-10-20T18:00:00Z'),
    },
  });
  await prisma.goal.create({ data: { matchId: qf1.id, playerId: yarmouk.players[4].id, teamId: yarmouk.team.id, minute: 19, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: qf1.id, playerId: yarmouk.players[4].id, teamId: yarmouk.team.id, minute: 54, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: qf1.id, playerId: yarmouk.players[3].id, teamId: yarmouk.team.id, minute: 76, type: 'penalty' } });
  await prisma.goal.create({ data: { matchId: qf1.id, playerId: malaz.players[4].id, teamId: malaz.team.id, minute: 82, type: 'normal' } });

  // 2. أسود طويق 2 - 1 فهود نجد
  const qf2 = await prisma.match.create({
    data: {
      tournamentId: pastCup.id,
      homeTeamId: tuwaiq.team.id,
      awayTeamId: najd.team.id,
      homeScore: 2,
      awayScore: 1,
      status: 'finished',
      stage: 'quarter',
      venue: 'ملعب النجوم الفرعي 1',
      matchDate: new Date('2025-10-20T20:30:00Z'),
    },
  });
  await prisma.goal.create({ data: { matchId: qf2.id, playerId: tuwaiq.players[4].id, teamId: tuwaiq.team.id, minute: 31, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: qf2.id, playerId: tuwaiq.players[3].id, teamId: tuwaiq.team.id, minute: 68, type: 'free_kick' } });
  await prisma.goal.create({ data: { matchId: qf2.id, playerId: najd.players[4].id, teamId: najd.team.id, minute: 79, type: 'normal' } });

  // 3. صقور العاصمة 2 - 0 أمل المروج
  const qf3 = await prisma.match.create({
    data: {
      tournamentId: pastCup.id,
      homeTeamId: suqoor.team.id,
      awayTeamId: murooj.team.id,
      homeScore: 2,
      awayScore: 0,
      status: 'finished',
      stage: 'quarter',
      venue: 'استاد النجوم الرئيسي',
      matchDate: new Date('2025-10-21T18:00:00Z'),
    },
  });
  await prisma.goal.create({ data: { matchId: qf3.id, playerId: suqoor.players[4].id, teamId: suqoor.team.id, minute: 25, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: qf3.id, playerId: suqoor.players[4].id, teamId: suqoor.team.id, minute: 60, type: 'normal' } });

  // 4. شعلة النخيل 1 - 0 درع الصحراء
  const qf4 = await prisma.match.create({
    data: {
      tournamentId: pastCup.id,
      homeTeamId: nakheel.team.id,
      awayTeamId: sahraa.team.id,
      homeScore: 1,
      awayScore: 0,
      status: 'finished',
      stage: 'quarter',
      venue: 'ملعب النجوم الفرعي 1',
      matchDate: new Date('2025-10-21T20:30:00Z'),
    },
  });
  await prisma.goal.create({ data: { matchId: qf4.id, playerId: nakheel.players[4].id, teamId: nakheel.team.id, minute: 44, type: 'normal' } });

  // نصف النهائي (Semi-finals) - مباراتان
  // 5. نجوم اليرموك 2 - 1 أسود طويق
  const sf1 = await prisma.match.create({
    data: {
      tournamentId: pastCup.id,
      homeTeamId: yarmouk.team.id,
      awayTeamId: tuwaiq.team.id,
      homeScore: 2,
      awayScore: 1,
      status: 'finished',
      stage: 'semi',
      venue: 'استاد النجوم الرئيسي',
      matchDate: new Date('2025-10-28T19:00:00Z'),
    },
  });
  await prisma.goal.create({ data: { matchId: sf1.id, playerId: yarmouk.players[4].id, teamId: yarmouk.team.id, minute: 15, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: sf1.id, playerId: tuwaiq.players[4].id, teamId: tuwaiq.team.id, minute: 40, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: sf1.id, playerId: yarmouk.players[3].id, teamId: yarmouk.team.id, minute: 88, type: 'normal' } });

  // 6. صقور العاصمة 3 - 2 شعلة النخيل
  const sf2 = await prisma.match.create({
    data: {
      tournamentId: pastCup.id,
      homeTeamId: suqoor.team.id,
      awayTeamId: nakheel.team.id,
      homeScore: 3,
      awayScore: 2,
      status: 'finished',
      stage: 'semi',
      venue: 'استاد النجوم الرئيسي',
      matchDate: new Date('2025-10-29T19:00:00Z'),
    },
  });
  await prisma.goal.create({ data: { matchId: sf2.id, playerId: suqoor.players[4].id, teamId: suqoor.team.id, minute: 10, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: sf2.id, playerId: nakheel.players[4].id, teamId: nakheel.team.id, minute: 22, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: sf2.id, playerId: suqoor.players[3].id, teamId: suqoor.team.id, minute: 58, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: sf2.id, playerId: nakheel.players[3].id, teamId: nakheel.team.id, minute: 71, type: 'penalty' } });
  await prisma.goal.create({ data: { matchId: sf2.id, playerId: suqoor.players[4].id, teamId: suqoor.team.id, minute: 85, type: 'normal' } });

  // النهائي الكبير (Final)
  // 7. نجوم اليرموك 3 - 2 صقور العاصمة (تتويج نجوم اليرموك)
  const finalMatch = await prisma.match.create({
    data: {
      tournamentId: pastCup.id,
      homeTeamId: yarmouk.team.id,
      awayTeamId: suqoor.team.id,
      homeScore: 3,
      awayScore: 2,
      status: 'finished',
      stage: 'final',
      venue: 'استاد النجوم الرئيسي (النهائي الكبير)',
      matchDate: new Date('2025-11-05T20:00:00Z'),
    },
  });
  const finalGoal1 = await prisma.goal.create({ data: { matchId: finalMatch.id, playerId: yarmouk.players[4].id, teamId: yarmouk.team.id, minute: 18, type: 'normal', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' } });
  await prisma.goal.create({ data: { matchId: finalMatch.id, playerId: suqoor.players[4].id, teamId: suqoor.team.id, minute: 34, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: finalMatch.id, playerId: yarmouk.players[3].id, teamId: yarmouk.team.id, minute: 52, type: 'free_kick', videoUrl: 'https://www.w3schools.com/html/movie.mp4' } });
  await prisma.goal.create({ data: { matchId: finalMatch.id, playerId: suqoor.players[3].id, teamId: suqoor.team.id, minute: 69, type: 'normal' } });
  const finalGoal5 = await prisma.goal.create({ data: { matchId: finalMatch.id, playerId: yarmouk.players[4].id, teamId: yarmouk.team.id, minute: 89, type: 'normal', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' } });

  await prisma.card.create({ data: { matchId: finalMatch.id, playerId: suqoor.players[1].id, teamId: suqoor.team.id, type: 'yellow', minute: 42 } });
  await prisma.card.create({ data: { matchId: finalMatch.id, playerId: yarmouk.players[1].id, teamId: yarmouk.team.id, type: 'yellow', minute: 75 } });

  // ─────────────────────────────────────────────────────────────
  // 6. البطولة الحالية: "دوري نجوم الرياض 2026" (Active League)
  // ─────────────────────────────────────────────────────────────
  console.log('⚽ إنشاء البطولة النشطة (دوري نجوم الرياض 2026)...');
  const activeLeague = await prisma.tournament.create({
    data: {
      name: 'دوري نجوم الرياض 2026',
      type: 'group_stage',
      status: 'active',
      groupCount: 2,
      qualifyingTeams: 2,
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  // ربط المجموعتين:
  // المجموعة A: نجوم اليرموك، أسود طويق، شعلة النخيل، درع الصحراء
  const groupATeams = [yarmouk, tuwaiq, nakheel, sahraa];
  for (const t of groupATeams) {
    await prisma.tournamentTeam.create({
      data: {
        tournamentId: activeLeague.id,
        teamId: t.team.id,
        groupName: 'A',
        status: 'active',
      },
    });
  }

  // المجموعة B: صقور العاصمة، فهود نجد، أمل المروج، فرسان الملز
  const groupBTeams = [suqoor, najd, murooj, malaz];
  for (const t of groupBTeams) {
    await prisma.tournamentTeam.create({
      data: {
        tournamentId: activeLeague.id,
        teamId: t.team.id,
        groupName: 'B',
        status: 'active',
      },
    });
  }

  // ── مباريات المجموعة A (5 منتهية + 1 جارية مباشرة الآن) ──
  // مباراة 1: نجوم اليرموك 3 - 1 أسود طويق (منتهية)
  const a1 = await prisma.match.create({
    data: {
      tournamentId: activeLeague.id,
      homeTeamId: yarmouk.team.id,
      awayTeamId: tuwaiq.team.id,
      homeScore: 3,
      awayScore: 1,
      status: 'finished',
      stage: 'group',
      groupName: 'A',
      venue: 'ملعب النجوم الفرعي 1',
      matchDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.goal.create({ data: { matchId: a1.id, playerId: yarmouk.players[4].id, teamId: yarmouk.team.id, minute: 23, type: 'normal' } });
  const a1Goal2 = await prisma.goal.create({ data: { matchId: a1.id, playerId: yarmouk.players[3].id, teamId: yarmouk.team.id, minute: 45, type: 'free_kick', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' } });
  await prisma.goal.create({ data: { matchId: a1.id, playerId: yarmouk.players[4].id, teamId: yarmouk.team.id, minute: 67, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: a1.id, playerId: tuwaiq.players[4].id, teamId: tuwaiq.team.id, minute: 80, type: 'penalty' } });

  // مباراة 2: شعلة النخيل 2 - 0 درع الصحراء (منتهية)
  const a2 = await prisma.match.create({
    data: {
      tournamentId: activeLeague.id,
      homeTeamId: nakheel.team.id,
      awayTeamId: sahraa.team.id,
      homeScore: 2,
      awayScore: 0,
      status: 'finished',
      stage: 'group',
      groupName: 'A',
      venue: 'ملعب النجوم الفرعي 2',
      matchDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.goal.create({ data: { matchId: a2.id, playerId: nakheel.players[4].id, teamId: nakheel.team.id, minute: 35, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: a2.id, playerId: nakheel.players[3].id, teamId: nakheel.team.id, minute: 78, type: 'normal' } });

  // مباراة 3: نجوم اليرموك 2 - 2 شعلة النخيل (منتهية)
  const a3 = await prisma.match.create({
    data: {
      tournamentId: activeLeague.id,
      homeTeamId: yarmouk.team.id,
      awayTeamId: nakheel.team.id,
      homeScore: 2,
      awayScore: 2,
      status: 'finished',
      stage: 'group',
      groupName: 'A',
      venue: 'ملعب النجوم الفرعي 1',
      matchDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.goal.create({ data: { matchId: a3.id, playerId: yarmouk.players[4].id, teamId: yarmouk.team.id, minute: 14, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: a3.id, playerId: nakheel.players[4].id, teamId: nakheel.team.id, minute: 39, type: 'normal' } });
  const a3Goal3 = await prisma.goal.create({ data: { matchId: a3.id, playerId: nakheel.players[3].id, teamId: nakheel.team.id, minute: 61, type: 'normal', videoUrl: 'https://www.w3schools.com/html/movie.mp4' } });
  await prisma.goal.create({ data: { matchId: a3.id, playerId: yarmouk.players[3].id, teamId: yarmouk.team.id, minute: 84, type: 'normal' } });

  // مباراة 4: أسود طويق 1 - 0 درع الصحراء (منتهية)
  const a4 = await prisma.match.create({
    data: {
      tournamentId: activeLeague.id,
      homeTeamId: tuwaiq.team.id,
      awayTeamId: sahraa.team.id,
      homeScore: 1,
      awayScore: 0,
      status: 'finished',
      stage: 'group',
      groupName: 'A',
      venue: 'ملعب النجوم الفرعي 2',
      matchDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.goal.create({ data: { matchId: a4.id, playerId: tuwaiq.players[4].id, teamId: tuwaiq.team.id, minute: 52, type: 'normal' } });

  // مباراة 5: درع الصحراء 1 - 3 نجوم اليرموك (منتهية)
  const a5 = await prisma.match.create({
    data: {
      tournamentId: activeLeague.id,
      homeTeamId: sahraa.team.id,
      awayTeamId: yarmouk.team.id,
      homeScore: 1,
      awayScore: 3,
      status: 'finished',
      stage: 'group',
      groupName: 'A',
      venue: 'ملعب النجوم الفرعي 1',
      matchDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.goal.create({ data: { matchId: a5.id, playerId: yarmouk.players[4].id, teamId: yarmouk.team.id, minute: 18, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: a5.id, playerId: sahraa.players[4].id, teamId: sahraa.team.id, minute: 44, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: a5.id, playerId: yarmouk.players[4].id, teamId: yarmouk.team.id, minute: 70, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: a5.id, playerId: yarmouk.players[2].id, teamId: yarmouk.team.id, minute: 86, type: 'normal' } });

  // مباراة 6: أسود طويق 2 - 1 شعلة النخيل (مباشرة الآن - LIVE!)
  // ملاحظة هامة: لا يظهر تاريخ للمباراة المباشرة في الواجهة، ونستخدم التاريخ الحالي فقط لمتطلبات قاعدة البيانات.
  const a6Live = await prisma.match.create({
    data: {
      tournamentId: activeLeague.id,
      homeTeamId: tuwaiq.team.id,
      awayTeamId: nakheel.team.id,
      homeScore: 2,
      awayScore: 1,
      status: 'live',
      stage: 'group',
      groupName: 'A',
      venue: 'استاد النجوم الرئيسي',
      matchDate: new Date(),
    },
  });
  await prisma.goal.create({ data: { matchId: a6Live.id, playerId: tuwaiq.players[4].id, teamId: tuwaiq.team.id, minute: 14, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: a6Live.id, playerId: nakheel.players[4].id, teamId: nakheel.team.id, minute: 38, type: 'normal' } });
  const liveGoal3 = await prisma.goal.create({ data: { matchId: a6Live.id, playerId: tuwaiq.players[3].id, teamId: tuwaiq.team.id, minute: 62, type: 'normal', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' } });

  await prisma.card.create({ data: { matchId: a6Live.id, playerId: tuwaiq.players[1].id, teamId: tuwaiq.team.id, type: 'yellow', minute: 41 } });

  // ── مباريات المجموعة B (جميع المباريات الـ 6 منتهية) ──
  // مباراة 1: صقور العاصمة 2 - 1 فهود نجد (منتهية)
  const b1 = await prisma.match.create({
    data: {
      tournamentId: activeLeague.id,
      homeTeamId: suqoor.team.id,
      awayTeamId: najd.team.id,
      homeScore: 2,
      awayScore: 1,
      status: 'finished',
      stage: 'group',
      groupName: 'B',
      venue: 'ملعب النجوم الفرعي 1',
      matchDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.goal.create({ data: { matchId: b1.id, playerId: suqoor.players[4].id, teamId: suqoor.team.id, minute: 28, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: b1.id, playerId: najd.players[4].id, teamId: najd.team.id, minute: 55, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: b1.id, playerId: suqoor.players[3].id, teamId: suqoor.team.id, minute: 82, type: 'normal' } });

  // مباراة 2: أمل المروج 0 - 0 فرسان الملز (منتهية)
  await prisma.match.create({
    data: {
      tournamentId: activeLeague.id,
      homeTeamId: murooj.team.id,
      awayTeamId: malaz.team.id,
      homeScore: 0,
      awayScore: 0,
      status: 'finished',
      stage: 'group',
      groupName: 'B',
      venue: 'ملعب النجوم الفرعي 2',
      matchDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    },
  });

  // مباراة 3: صقور العاصمة 3 - 1 أمل المروج (منتهية)
  const b3 = await prisma.match.create({
    data: {
      tournamentId: activeLeague.id,
      homeTeamId: suqoor.team.id,
      awayTeamId: murooj.team.id,
      homeScore: 3,
      awayScore: 1,
      status: 'finished',
      stage: 'group',
      groupName: 'B',
      venue: 'ملعب النجوم الفرعي 1',
      matchDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.goal.create({ data: { matchId: b3.id, playerId: suqoor.players[4].id, teamId: suqoor.team.id, minute: 12, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: b3.id, playerId: murooj.players[4].id, teamId: murooj.team.id, minute: 37, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: b3.id, playerId: suqoor.players[4].id, teamId: suqoor.team.id, minute: 59, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: b3.id, playerId: suqoor.players[2].id, teamId: suqoor.team.id, minute: 74, type: 'normal' } });

  // مباراة 4: فهود نجد 2 - 1 فرسان الملز (منتهية)
  const b4 = await prisma.match.create({
    data: {
      tournamentId: activeLeague.id,
      homeTeamId: najd.team.id,
      awayTeamId: malaz.team.id,
      homeScore: 2,
      awayScore: 1,
      status: 'finished',
      stage: 'group',
      groupName: 'B',
      venue: 'ملعب النجوم الفرعي 2',
      matchDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.goal.create({ data: { matchId: b4.id, playerId: najd.players[4].id, teamId: najd.team.id, minute: 30, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: b4.id, playerId: malaz.players[4].id, teamId: malaz.team.id, minute: 61, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: b4.id, playerId: najd.players[3].id, teamId: najd.team.id, minute: 88, type: 'normal' } });

  // مباراة 5: فرسان الملز 0 - 2 صقور العاصمة (منتهية)
  const b5 = await prisma.match.create({
    data: {
      tournamentId: activeLeague.id,
      homeTeamId: malaz.team.id,
      awayTeamId: suqoor.team.id,
      homeScore: 0,
      awayScore: 2,
      status: 'finished',
      stage: 'group',
      groupName: 'B',
      venue: 'ملعب النجوم الفرعي 1',
      matchDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.goal.create({ data: { matchId: b5.id, playerId: suqoor.players[4].id, teamId: suqoor.team.id, minute: 40, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: b5.id, playerId: suqoor.players[3].id, teamId: suqoor.team.id, minute: 73, type: 'normal' } });

  // مباراة 6: فهود نجد 1 - 1 أمل المروج (منتهية)
  const b6 = await prisma.match.create({
    data: {
      tournamentId: activeLeague.id,
      homeTeamId: najd.team.id,
      awayTeamId: murooj.team.id,
      homeScore: 1,
      awayScore: 1,
      status: 'finished',
      stage: 'group',
      groupName: 'B',
      venue: 'ملعب النجوم الفرعي 2',
      matchDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.goal.create({ data: { matchId: b6.id, playerId: najd.players[4].id, teamId: najd.team.id, minute: 22, type: 'normal' } });
  await prisma.goal.create({ data: { matchId: b6.id, playerId: murooj.players[4].id, teamId: murooj.team.id, minute: 65, type: 'penalty' } });

  // ─────────────────────────────────────────────────────────────
  // 7. تحديث إحصائيات الهدافين بدقة
  // ─────────────────────────────────────────────────────────────
  console.log('📈 مزامنة إحصائيات هدافي البطولة...');
  const allPlayers = teamsData.flatMap(t => t.players);
  for (const p of allPlayers) {
    const goalsCount = await prisma.goal.count({ where: { playerId: p.id } });
    if (goalsCount > 0) {
      await prisma.player.update({
        where: { id: p.id },
        data: { goalsCount },
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 8. جولات التصويت (أرشيفية مكتملة + حالية نشطة لا تنتهي)
  // ─────────────────────────────────────────────────────────────
  console.log('🗳️ إنشاء جولات التصويت والأصوات...');

  // جولة 1: تصويت مكتمل ومؤرشف مع إعلان الفائز
  const closedRound = await prisma.votingRound.create({
    data: {
      title: 'أفضل هدف في ختام كأس 2025',
      description: 'تصويت الجمهور لأجمل هدف في الأدوار النهائية لبطولة كأس نجوم الدوري 2025.',
      status: 'closed',
      tournamentId: pastCup.id,
      startsAt: new Date('2025-11-06T12:00:00Z'),
      endsAt: new Date('2025-11-12T23:59:00Z'),
      closedAt: new Date('2025-11-13T00:00:00Z'),
      winnerGoalId: finalGoal5.id, // هدف الحسم الدقيقة 89
      showResultsMode: 'live',
    },
  });

  const crGoal1 = await prisma.votingRoundGoal.create({
    data: { roundId: closedRound.id, goalId: finalGoal1.id, sortOrder: 1, videoUrl: finalGoal1.videoUrl },
  });
  const crGoal2 = await prisma.votingRoundGoal.create({
    data: { roundId: closedRound.id, goalId: finalGoal5.id, sortOrder: 2, videoUrl: finalGoal5.videoUrl },
  });

  // أصوات الجولة المؤرشفة
  for (let i = 0; i < 48; i++) {
    await prisma.goalVote.create({
      data: { votingRoundGoalId: crGoal1.id, visitorIp: `10.0.1.${i}`, fingerprint: `closed-round-g1-${i}` },
    }).catch(() => {});
  }
  for (let i = 0; i < 86; i++) {
    await prisma.goalVote.create({
      data: { votingRoundGoalId: crGoal2.id, visitorIp: `10.0.2.${i}`, fingerprint: `closed-round-g2-${i}` },
    }).catch(() => {});
  }

  // جولة 2: تصويت الجولة الحالية في الدوري (نشطة بدون تاريخ انتهاء endsAt: null حتى لا تصبح قديمة)
  const activeRound = await prisma.votingRound.create({
    data: {
      title: 'تصويت أفضل هدف - الجولة الحالية',
      description: 'اختر هدفك المفضل من بين أروع أهداف الجولة وشارك في اختيار صاحب الهدف الأجمل!',
      status: 'active',
      tournamentId: activeLeague.id,
      startsAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endsAt: null, // لا تنتهي أبداً في نسخة العرض
      showResultsMode: 'after_vote',
    },
  });

  const arGoal1 = await prisma.votingRoundGoal.create({
    data: { roundId: activeRound.id, goalId: a1Goal2.id, sortOrder: 1, videoUrl: a1Goal2.videoUrl },
  });
  const arGoal2 = await prisma.votingRoundGoal.create({
    data: { roundId: activeRound.id, goalId: a3Goal3.id, sortOrder: 2, videoUrl: a3Goal3.videoUrl },
  });
  const arGoal3 = await prisma.votingRoundGoal.create({
    data: { roundId: activeRound.id, goalId: liveGoal3.id, sortOrder: 3, videoUrl: liveGoal3.videoUrl },
  });

  // توليد أصوات تجريبية متباينة
  for (let i = 0; i < 42; i++) {
    await prisma.goalVote.create({
      data: { votingRoundGoalId: arGoal1.id, visitorIp: `192.168.10.${i}`, fingerprint: `active-round-g1-${i}` },
    }).catch(() => {});
  }
  for (let i = 0; i < 28; i++) {
    await prisma.goalVote.create({
      data: { votingRoundGoalId: arGoal2.id, visitorIp: `192.168.20.${i}`, fingerprint: `active-round-g2-${i}` },
    }).catch(() => {});
  }
  for (let i = 0; i < 16; i++) {
    await prisma.goalVote.create({
      data: { votingRoundGoalId: arGoal3.id, visitorIp: `192.168.30.${i}`, fingerprint: `active-round-g3-${i}` },
    }).catch(() => {});
  }

  console.log('🎉 اكتملت تغذية قاعدة البيانات بنجاح تام وبأعلى معايير الواقعية!');
}

main()
  .catch((error) => {
    console.error('❌ فشل في تغذية قاعدة البيانات:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

async function main() {
  if (process.env.DEMO_MODE !== 'true' || process.env.DEMO_DATABASE !== 'true') {
    throw new Error('Destructive demo seed requires DEMO_MODE=true and DEMO_DATABASE=true on an isolated database');
  }
  await cleanDatabase();
  await seed();
}
