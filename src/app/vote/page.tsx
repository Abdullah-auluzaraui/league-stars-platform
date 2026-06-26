import React from 'react';
import Link from 'next/link';
import { prisma } from '@/core/lib/prisma';
import { getNominatedGoals } from '@/features/voting/actions';
import GoalGallery from '@/features/voting/components/GoalGallery';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تصويت هدف الجولة — نجوم الدوري',
  description: 'شاهد أجمل الأهداف المرشحة وصوّت لهدفك المفضل في هذه الجولة',
};

async function getVotePageData() {
  const tournament = await prisma.tournament.findFirst({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
  });

  if (!tournament) {
    return { tournament: null, goals: [] };
  }

  const goals = await getNominatedGoals(tournament.id);
  
  // نقوم بتحويل التواريخ لكائنات Date صالحة للـ client serializability
  const serializedGoals = goals.map((g) => ({
    ...g,
    createdAt: new Date(g.createdAt),
    match: {
      ...g.match,
      matchDate: new Date(g.match.matchDate),
    },
  }));

  return { tournament, goals: serializedGoals };
}

export default async function VotePage() {
  const { tournament, goals } = await getVotePageData();

  return (
    <div className="vote-page">
      {/* ─── رأس الصفحة (Hero / Header Section) ─── */}
      <header className="vote-header">
        <div className="vote-header-inner">
          <span className="vote-header-badge">
            <span className="live-badge-dot" />
            التصويت جارٍ الآن
          </span>
          <h1 className="vote-title font-el-messiri">تصويت هدف الجولة</h1>
          <p className="vote-subtitle">
            شاهد إبداعات النجوم وصوّت لهدفك المفضل في هذه الجولة. صوتك يصنع الفارق في تتويج بطل الجولة!
          </p>
        </div>
      </header>

      {/* ─── محتوى الصفحة الرئيسي ─── */}
      <main className="vote-main-content">
        {!tournament ? (
          <div className="vote-empty-state">
            <span className="empty-state-icon">🏆</span>
            <h2 className="font-el-messiri">لا توجد بطولة نشطة حالياً</h2>
            <p>سيتم تفعيل التصويت فور انطلاق مباريات البطولة الجديدة.</p>
            <Link href="/" className="btn-primary">
              العودة للرئيسية
            </Link>
          </div>
        ) : goals.length === 0 ? (
          <div className="vote-empty-state">
            <span className="empty-state-icon">🗳️</span>
            <h2 className="font-el-messiri">لا توجد أهداف مرشحة في هذه الجولة بعد</h2>
            <p>ترقبوا ترشيح أفضل أهداف مباريات اليوم فور انتهاء الجولة!</p>
            <div className="empty-actions">
              <Link href="/matches" className="btn-primary">
                ⚽ جدول المباريات
              </Link>
              <Link href="/" className="btn-secondary">
                الرئيسية
              </Link>
            </div>
          </div>
        ) : (
          <GoalGallery initialGoals={goals} tournamentId={tournament.id} />
        )}
      </main>
    </div>
  );
}
