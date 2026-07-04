'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Trophy,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  Upload,
  Globe,
  Link2,
  Check,
  AlertCircle,
  X,
  Settings,
  Tv2,
  Image as ImageIcon,
} from 'lucide-react';

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 11.54a29 29 0 0 0 .46 5.12 2.78 2.78 0 0 0 1.95 1.96C5.12 19 12 19 12 19s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 11.54a29 29 0 0 0-.46-5.12z" />
    <polygon points="9.75 15.02 15.5 11.54 9.75 8.05 9.75 15.02" />
  </svg>
);

const TiktokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);
import {
  createSponsor,
  updateSponsor,
  toggleSponsorStatus,
  deleteSponsor,
  updateSettings,
  updateHeroContent,
} from './settingsActions';

// Inline Image Compression Utility
async function compressImage(file: File, maxWidth = 200, maxHeight = 200, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob failed'));
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

interface SettingsTabProps {
  sponsors: any[];
  settings: Record<string, string>;
  heroContent: any;
  fetchSettingsAndSponsors: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  triggerConfirm: (config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant: 'danger' | 'warning' | 'success';
    onConfirm: () => void;
  }) => void;
}

type SubTabId = 'sponsors' | 'general';

export default function SettingsTab({
  sponsors,
  settings,
  heroContent,
  fetchSettingsAndSponsors,
  showToast,
  triggerConfirm,
}: SettingsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('sponsors');

  // --- States for Settings & Hero Content Form ---
  const [heroTitle, setHeroTitle] = useState('');
  const [heroBody, setHeroBody] = useState('');
  const [votingEnabled, setVotingEnabled] = useState(true);
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Initialize Form States
  useEffect(() => {
    if (heroContent) {
      setHeroTitle(heroContent.title || 'League Stars');
      setHeroBody(heroContent.body || '');
    } else {
      setHeroTitle('League Stars');
      setHeroBody('');
    }
    setVotingEnabled(settings['voting_enabled'] !== 'false');
    setTwitterUrl(settings['social_twitter'] || '');
    setInstagramUrl(settings['social_instagram'] || '');
    setYoutubeUrl(settings['social_youtube'] || '');
    setTiktokUrl(settings['social_tiktok'] || '');
  }, [settings, heroContent]);

  // --- Sponsor Modal & Form States ---
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<any | null>(null);
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorLogoUrl, setSponsorLogoUrl] = useState('');
  const [sponsorWebsiteUrl, setSponsorWebsiteUrl] = useState('');
  const [sponsorDisplayOrder, setSponsorDisplayOrder] = useState('0');
  const [sponsorIsActive, setSponsorIsActive] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSponsorSubmitting, setIsSponsorSubmitting] = useState(false);
  const [sponsorError, setSponsorError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset Modal Form
  const openSponsorModal = (sponsor: any | null = null) => {
    setSponsorError(null);
    setLogoFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (sponsor) {
      setEditingSponsor(sponsor);
      setSponsorName(sponsor.name);
      setSponsorLogoUrl(sponsor.logoUrl || '');
      setSponsorWebsiteUrl(sponsor.websiteUrl || '');
      setSponsorDisplayOrder(String(sponsor.displayOrder || 0));
      setSponsorIsActive(sponsor.isActive);
      if (sponsor.logoUrl) {
        setFilePreview(sponsor.logoUrl);
      }
    } else {
      setEditingSponsor(null);
      setSponsorName('');
      setSponsorLogoUrl('');
      setSponsorWebsiteUrl('');
      setSponsorDisplayOrder('0');
      setSponsorIsActive(true);
    }
    setIsSponsorModalOpen(true);
  };

  const closeSponsorModal = () => {
    setIsSponsorModalOpen(false);
    setEditingSponsor(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setFilePreview(URL.createObjectURL(file));
      setSponsorLogoUrl(''); // Clear text URL if file is uploaded
    }
  };

  const handleRemovePreview = () => {
    setLogoFile(null);
    setFilePreview(null);
    setSponsorLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Save Sponsor
  const handleSponsorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorName.trim()) {
      setSponsorError('يرجى إدخال اسم الراعي');
      return;
    }
    if (!filePreview && !sponsorLogoUrl.trim()) {
      setSponsorError('يرجى إرفاق شعار الراعي (صورة أو رابط مباشر)');
      return;
    }

    setIsSponsorSubmitting(true);
    setSponsorError(null);

    try {
      const formData = new FormData();
      formData.append('name', sponsorName.trim());
      formData.append('logoUrl', sponsorLogoUrl.trim());
      formData.append('websiteUrl', sponsorWebsiteUrl.trim());
      formData.append('displayOrder', sponsorDisplayOrder);
      formData.append('isActive', String(sponsorIsActive));

      if (logoFile) {
        try {
          const compressedBlob = await compressImage(logoFile, 200, 200, 0.85);
          const compressedFile = new File([compressedBlob], `sponsor-${Date.now()}.webp`, {
            type: 'image/webp',
          });
          formData.append('logoFile', compressedFile);
        } catch (err) {
          console.error('Image compression failed, using original:', err);
          formData.append('logoFile', logoFile);
        }
      }

      let res;
      if (editingSponsor) {
        formData.append('id', editingSponsor.id);
        res = await updateSponsor(formData);
      } else {
        res = await createSponsor(formData);
      }

      if (res.success) {
        showToast(editingSponsor ? 'تم تحديث بيانات الراعي بنجاح!' : 'تم إضافة الراعي بنجاح!');
        await fetchSettingsAndSponsors();
        closeSponsorModal();
      } else {
        setSponsorError(res.error || 'حدث خطأ أثناء حفظ البيانات');
      }
    } catch (err) {
      console.error(err);
      setSponsorError('حدث خطأ غير متوقع');
    } finally {
      setIsSponsorSubmitting(false);
    }
  };

  // Toggle Sponsor Status Directly
  const handleToggleSponsor = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const res = await toggleSponsorStatus(id, newStatus);
      if (res.success) {
        showToast(newStatus ? 'تم تفعيل الراعي بنجاح!' : 'تم إيقاف تفعيل الراعي');
        await fetchSettingsAndSponsors();
      } else {
        showToast(res.error || 'فشل تعديل حالة الراعي', 'error');
      }
    } catch (err) {
      showToast('حدث خطأ غير متوقع', 'error');
    }
  };

  // Delete Sponsor
  const handleDeleteSponsor = (id: string) => {
    triggerConfirm({
      title: 'حذف الراعي',
      message: 'هل أنت متأكد من رغبتك في حذف هذا الراعي نهائياً من الموقع؟ لا يمكن التراجع عن هذا الإجراء.',
      confirmText: 'حذف نهائي',
      cancelText: 'تراجع',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await deleteSponsor(id);
          if (res.success) {
            showToast('تم حذف الراعي بنجاح');
            await fetchSettingsAndSponsors();
          } else {
            showToast(res.error || 'فشل حذف الراعي', 'error');
          }
        } catch (err) {
          showToast('حدث خطأ غير متوقع', 'error');
        }
      },
    });
  };

  // Save Settings & Hero Form
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      // 1. Save Hero Content
      const resHero = await updateHeroContent(heroTitle.trim(), heroBody.trim());
      
      // 2. Save General Settings
      const resSettings = await updateSettings({
        voting_enabled: String(votingEnabled),
        social_twitter: twitterUrl.trim(),
        social_instagram: instagramUrl.trim(),
        social_youtube: youtubeUrl.trim(),
        social_tiktok: tiktokUrl.trim(),
      });

      if (resHero.success && resSettings.success) {
        showToast('تم حفظ جميع الإعدادات والتعديلات بنجاح!');
        await fetchSettingsAndSponsors();
      } else {
        showToast('فشل حفظ بعض الإعدادات، يرجى المحاولة لاحقاً', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ غير متوقع أثناء الحفظ', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Sub-Tabs Navigation ── */}
      <div className="flex gap-2 p-1 bg-white/2 border border-white/5 rounded-xl max-w-xs sm:max-w-sm">
        <button
          onClick={() => setActiveSubTab('sponsors')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'sponsors'
              ? 'bg-[#C9971A]/20 text-[#F0C040] border border-[#C9971A]/30'
              : 'text-white/45 hover:text-white/70'
          }`}
        >
          إدارة الرعاة
        </button>
        <button
          onClick={() => setActiveSubTab('general')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'general'
              ? 'bg-[#C9971A]/20 text-[#F0C040] border border-[#C9971A]/30'
              : 'text-white/45 hover:text-white/70'
          }`}
        >
          الإعدادات والمحتوى
        </button>
      </div>

      {/* ── Tab Content: Sponsors ── */}
      {activeSubTab === 'sponsors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5">شركاء النجاح والرعاة</h3>
              <p className="text-[10px] sm:text-xs text-white/55">إضافة وتعديل بيانات الرعاة المعروضين في الموقع</p>
            </div>
            <button
              onClick={() => openSponsorModal(null)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-l from-[#C9971A] to-[#A07510] rounded-xl hover:shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة راعي</span>
            </button>
          </div>

          {sponsors.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 border-dashed border-white/10 text-center">
              <Trophy className="w-10 h-10 text-white/45 mx-auto mb-2" />
              <p className="text-xs text-white/50 font-semibold">لا يوجد رعاة مسجلين حالياً. اضغط على إضافة راعي للبدء.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className={`glass-card rounded-2xl p-4 border flex flex-col justify-between gap-4 transition-all ${
                    sponsor.isActive ? 'border-white/5' : 'border-white/5 opacity-55'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                      {sponsor.logoUrl ? (
                        <img
                          src={sponsor.logoUrl}
                          alt={sponsor.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-white/35" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">{sponsor.name}</h4>
                      {sponsor.websiteUrl ? (
                        <a
                          href={sponsor.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[#F0C040]/75 hover:underline flex items-center gap-0.5 mt-0.5"
                        >
                          <Link2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{sponsor.websiteUrl}</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-white/40">لا يوجد موقع إلكتروني</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/6 mt-auto">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openSponsorModal(sponsor)}
                        className="p-2 bg-white/4 border border-white/8 hover:bg-white/8 text-white rounded-lg transition-colors cursor-pointer"
                        title="تعديل البيانات"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSponsor(sponsor.id)}
                        className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/50 font-bold">الترتيب: {sponsor.displayOrder}</span>
                      <button
                        onClick={() => handleToggleSponsor(sponsor.id, sponsor.isActive)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                          sponsor.isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                            : 'bg-white/8 text-white/55 border-white/10'
                        }`}
                      >
                        {sponsor.isActive ? 'نشط' : 'معطل'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: General & Hero Settings ── */}
      {activeSubTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Hero Section Card */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/5 space-y-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Tv2 className="w-4 h-4 text-[#F0C040]" />
              <h3 className="text-xs sm:text-sm font-bold text-white">محتوى واجهة البطل (Hero Section)</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/50">العنوان الترحيبي الرئيسي</label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="مثال: League Stars"
                  className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/50">وصف أو نص الترحيب الفرعي</label>
                <textarea
                  value={heroBody}
                  onChange={(e) => setHeroBody(e.target.value)}
                  placeholder="مثال: منصة لإدارة ومتابعة البطولات المحلية بالوقت الفعلي."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Social Links & Voting Controls */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/5 space-y-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Settings className="w-4 h-4 text-[#F0C040]" />
              <h3 className="text-xs sm:text-sm font-bold text-white">إعدادات النظام وروابط التواصل</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Toggles */}
              <div className="sm:col-span-4 p-3 bg-white/3 border border-white/5 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">تفعيل نظام التصويت العام</h4>
                  <p className="text-[10px] text-white/50">تمكين أو تعطيل إمكانية التصويت لأهداف الجولة لجميع الزوار</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={votingEnabled}
                    onChange={(e) => setVotingEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/10 border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white/40 after:border-white/10 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C9971A] peer-checked:after:bg-white"></div>
                </label>
              </div>

              {/* Social Channels */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/50 flex items-center gap-1.5">
                  <TwitterIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>تويتر / X</span>
                </label>
                <input
                  type="url"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://x.com/username"
                  className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 transition-all text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/50 flex items-center gap-1.5">
                  <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                  <span>انستقرام</span>
                </label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/username"
                  className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 transition-all text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/50 flex items-center gap-1.5">
                  <YoutubeIcon className="w-3.5 h-3.5 text-red-500" />
                  <span>يوتيوب</span>
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/channel"
                  className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 transition-all text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/50 flex items-center gap-1.5">
                  <TiktokIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>تيك توك</span>
                </label>
                <input
                  type="url"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="https://tiktok.com/@username"
                  className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 transition-all text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-l from-[#C9971A] to-[#A07510] rounded-xl hover:shadow-lg hover:shadow-[#C9971A]/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>حفظ الإعدادات</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Sponsor Modal ── */}
      {isSponsorModalOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg bg-[#0e0e12] border border-white/8 rounded-2xl shadow-2xl animate-scale-in max-h-[calc(100vh-2rem)] flex flex-col"
            dir="rtl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#121018] rounded-t-2xl flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-[#F0C040]" />
                <h3 className="text-sm sm:text-base font-black text-white">
                  {editingSponsor ? 'تعديل بيانات الراعي' : 'إضافة راعي جديد'}
                </h3>
              </div>
              <button
                onClick={closeSponsorModal}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSponsorSubmit} className="flex-grow overflow-y-auto p-5 space-y-4">
              {sponsorError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{sponsorError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/50">اسم الراعي / الشريك *</label>
                <input
                  type="text"
                  required
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  placeholder="مثال: شركة الرعاة الفاخرة"
                  className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/50 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#F0C040]" />
                  <span>شعار الراعي (ملف أو رابط)</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="col-span-2 border border-dashed border-white/10 hover:border-[#C9971A]/30 bg-white/2 hover:bg-white/4 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[96px] text-center"
                  >
                    <Upload className="w-5 h-5 text-white/60" />
                    <span className="text-[10px] sm:text-xs text-white/50 font-bold">تحميل شعار من جهازك</span>
                  </div>

                  <div className="border border-white/8 bg-white/3 rounded-xl p-2 flex flex-col items-center justify-center relative min-h-[96px]">
                    {filePreview ? (
                      <>
                        <img
                          src={filePreview}
                          alt="معاينة الشعار"
                          className="w-12 h-12 rounded-lg object-contain bg-white/5"
                        />
                        <button
                          type="button"
                          onClick={handleRemovePreview}
                          className="absolute -top-1.5 -left-1.5 p-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/35 rounded-full transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-white/35 font-bold">لا يوجد شعار</span>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <span className="block text-[10px] text-white/40 mb-1">أو أدخل رابط الشعار المباشر (URL):</span>
                  <input
                    type="url"
                    value={sponsorLogoUrl}
                    onChange={(e) => {
                      setSponsorLogoUrl(e.target.value);
                      if (e.target.value.trim()) {
                        setFilePreview(e.target.value.trim());
                        setLogoFile(null); // Clear file if URL is written
                      }
                    }}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 transition-all text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/50 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>رابط الموقع الإلكتروني للراعي</span>
                </label>
                <input
                  type="url"
                  value={sponsorWebsiteUrl}
                  onChange={(e) => setSponsorWebsiteUrl(e.target.value)}
                  placeholder="https://sponsor-website.com"
                  className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 transition-all text-left"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-white/50">ترتيب الظهور</label>
                  <input
                    type="number"
                    value={sponsorDisplayOrder}
                    onChange={(e) => setSponsorDisplayOrder(e.target.value)}
                    min="0"
                    className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#C9971A]/60 transition-all"
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sponsorIsActive}
                      onChange={(e) => setSponsorIsActive(e.target.checked)}
                      className="w-4 h-4 accent-[#C9971A] rounded bg-white/4 border-white/8"
                    />
                    <span className="text-xs font-bold text-white">تفعيل الراعي فوراً</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5 flex-shrink-0">
                <button
                  type="button"
                  onClick={closeSponsorModal}
                  className="px-4 py-2 text-xs font-bold text-white bg-white/5 border border-white/8 rounded-xl hover:bg-white/8 transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSponsorSubmitting}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-l from-[#C9971A] to-[#A07510] rounded-xl hover:shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSponsorSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingSponsor ? 'حفظ التعديلات' : 'إضافة الراعي'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
