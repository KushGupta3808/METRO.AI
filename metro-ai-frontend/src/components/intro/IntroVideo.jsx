import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, SkipForward } from 'lucide-react';

// Drop your video at public/intro-video.mp4 - that's the only wiring needed.
// If the file isn't there yet, the <video> 'error' event fires and this
// component quietly hands off to the next boot stage instead of showing a
// broken player.
export default function IntroVideo({ onComplete }) {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function handleTimeUpdate() {
      if (video.duration) setProgress((video.currentTime / video.duration) * 100);
    }
    function handleError() {
      setHasError(true);
      onComplete();
    }

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', onComplete);
    video.addEventListener('error', handleError);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', onComplete);
      video.removeEventListener('error', handleError);
    };
  }, [onComplete]);

  if (hasError) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-void flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        src="/intro-video.mp4"
        poster="/intro-poster.jpg"
        autoPlay
        muted={isMuted}
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-void/70 via-transparent to-void/40" />

      <div className="absolute top-6 left-6 brand-card px-3 py-2">
        <img src="/logo-icon.png" alt="METRO AI" className="h-5 w-auto" />
      </div>

      <div className="absolute top-6 right-6 flex items-center gap-2">
        <button
          onClick={() => setIsMuted((m) => !m)}
          className="p-2.5 rounded-full bg-white/10 backdrop-blur-md text-slate-100 hover:bg-white/20 transition-colors"
          aria-label={isMuted ? 'Unmute intro video' : 'Mute intro video'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button
          onClick={onComplete}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-md text-sm text-slate-100 hover:bg-white/20 transition-colors"
        >
          Skip intro <SkipForward size={14} />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-sapphireNeon to-emeraldNeon"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
