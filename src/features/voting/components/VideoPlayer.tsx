'use client';

import React from 'react';

interface VideoPlayerProps {
  url: string;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  if (!url) return null;

  // ─── 1. تحليل روابط يوتيوب (YouTube) ───────────────────────────────────────
  const getYouTubeId = (videoUrl: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
    const match = videoUrl.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // ─── 2. تحليل روابط تيك توك (TikTok) ────────────────────────────────────────
  const getTikTokId = (videoUrl: string) => {
    const regExp = /\/video\/(\d+)/;
    const match = videoUrl.match(regExp);
    return match ? match[1] : null;
  };

  const ytId = getYouTubeId(url);
  const ttId = getTikTokId(url);

  // ─── 3. تشغيل يوتيوب ────────────────────────────────────────────────────────
  if (ytId) {
    return (
      <div className="video-player-wrapper">
        <div className="video-player-container youtube-player">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="video-iframe"
          />
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="external-playback-link yt-color"
        >
          <span className="platform-dot">🔴</span> افتح في يوتيوب لمشاهدة سريعة ↗
        </a>
      </div>
    );
  }

  // ─── 4. تشغيل تيك توك ───────────────────────────────────────────────────────
  if (ttId) {
    return (
      <div className="video-player-wrapper">
        <div className="video-player-container tiktok-player">
          <iframe
            src={`https://www.tiktok.com/embed/v2/${ttId}`}
            title="TikTok video player"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="video-iframe tiktok-iframe"
          />
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="external-playback-link tt-color"
        >
          <span className="platform-dot">🎵</span> افتح في تيك توك لمشاهدة سريعة ↗
        </a>
      </div>
    );
  }

  // ─── 5. تشغيل فيديو مباشر (MP4/WebM) ────────────────────────────────────────
  const isDirectVideo = /\.(mp4|webm|ogg|mov)($|\?)/i.test(url) || url.includes('res.cloudinary.com');
  if (isDirectVideo) {
    return (
      <div className="video-player-wrapper">
        <div className="video-player-container direct-player">
          <video
            src={url}
            controls
            preload="metadata"
            playsInline
            className="video-element"
          />
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="external-playback-link direct-color"
        >
          <span className="platform-dot">🎬</span> مشاهدة أو تحميل الفيديو المباشر ↗
        </a>
      </div>
    );
  }

  // ─── 6. حالة الاحتياط (Fallback Placeholder) ────────────────────────────────
  return (
    <div className="video-player-fallback">
      <div className="fallback-content">
        <span className="fallback-icon">⚽</span>
        <p className="fallback-text">مشاهدة لقطة الهدف على منصة البث</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary fallback-btn"
        >
          شاهد الهدف الآن ↗
        </a>
      </div>
    </div>
  );
}
