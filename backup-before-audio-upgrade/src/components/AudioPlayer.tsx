import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Volume2, ChevronUp, ChevronDown, Download, Check, Settings2 } from 'lucide-react';
import { RECITERS_LIST, getVerseAudioUrl } from '../lib/audioData';
import { SURAH_LIST } from '../lib/surahData';

interface AudioPlayerProps {
  currentSurah: number;
  currentAyah: number;
  reciterId: string;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onVerseChange: (surah: number, ayah: number) => void;
  onReciterChange: (reciterId: string) => void;
  isLightMode: boolean;
}

export default function AudioPlayer({
  currentSurah,
  currentAyah,
  reciterId,
  isPlaying,
  onPlayStateChange,
  onVerseChange,
  onReciterChange,
  isLightMode
}: AudioPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [repeatMode, setRepeatMode] = useState<'off' | 'ayah' | 'surah'>('off');
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const surahMeta = SURAH_LIST.find(s => s.number === currentSurah) || SURAH_LIST[0];
  const activeReciter = RECITERS_LIST.find(r => r.id === reciterId) || RECITERS_LIST[0];
  const audioUrl = getVerseAudioUrl(reciterId, currentSurah, currentAyah);

  // Sync Audio Element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
    } else {
      audioRef.current.src = audioUrl;
    }
    audioRef.current.playbackRate = playbackSpeed;

    const handleEnded = () => {
      if (repeatMode === 'ayah') {
        audioRef.current?.play().catch(() => onPlayStateChange(false));
      } else if (currentAyah < surahMeta.numberOfAyahs) {
        onVerseChange(currentSurah, currentAyah + 1);
      } else if (repeatMode === 'surah') {
        onVerseChange(currentSurah, 1);
      } else {
        onPlayStateChange(false);
      }
    };

    audioRef.current.addEventListener('ended', handleEnded);
    if (isPlaying) {
      audioRef.current.play().catch(() => onPlayStateChange(false));
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [currentSurah, currentAyah, reciterId, repeatMode]);

  // Handle play state changes from parent or internal
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => onPlayStateChange(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Handle speed changes
  const toggleSpeed = () => {
    const nextSpeed = playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : playbackSpeed === 1.5 ? 2 : playbackSpeed === 2 ? 0.75 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) audioRef.current.playbackRate = nextSpeed;
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => prev === 'off' ? 'ayah' : prev === 'ayah' ? 'surah' : 'off');
  };

  const handleDownload = () => {
    setDownloaded(true);
    // Cache simulation in IndexedDB / localStorage
    localStorage.setItem(`download_${currentSurah}_${reciterId}`, 'cached');
  };

  useEffect(() => {
    setDownloaded(!!localStorage.getItem(`download_${currentSurah}_${reciterId}`));
  }, [currentSurah, reciterId]);

  return (
    <>
      {/* Persistent Mini-Player (sits exactly above bottom nav) */}
      <div className={`fixed bottom-16 left-0 right-0 z-30 border-t backdrop-blur-md transition-all ${
        isLightMode 
          ? 'bg-slate-100/95 border-slate-200 text-slate-800' 
          : 'bg-slate-800/95 border-slate-700 text-white'
      }`}>
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <button 
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-3 flex-1 text-left group overflow-hidden"
          >
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-emerald-700 flex-shrink-0 flex items-center justify-center shadow-md">
              <img src={activeReciter.photoUrl} alt={activeReciter.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />
              {isPlaying && <Volume2 className="w-5 h-5 text-white absolute animate-pulse" />}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold truncate">{surahMeta.englishName}</p>
                <span className="text-xs text-emerald-500 font-semibold">({currentSurah}:{currentAyah})</span>
              </div>
              <p className="text-xs text-slate-400 truncate">{activeReciter.name}</p>
            </div>
            <ChevronUp className="w-4 h-4 text-slate-400 ml-auto flex-shrink-0 group-hover:text-emerald-500 transition-colors" />
          </button>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => currentAyah > 1 && onVerseChange(currentSurah, currentAyah - 1)}
              disabled={currentAyah <= 1}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors active:scale-95"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPlayStateChange(!isPlaying)}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-all shadow-md active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button
              onClick={() => currentAyah < surahMeta.numberOfAyahs && onVerseChange(currentSurah, currentAyah + 1)}
              disabled={currentAyah >= surahMeta.numberOfAyahs}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors active:scale-95"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Player Modal */}
      {isExpanded && (
        <div className={`fixed inset-0 z-50 flex flex-col transition-colors animate-in fade-in-20 duration-200 ${
          isLightMode ? 'bg-slate-50 text-slate-800' : 'bg-slate-900 text-white'
        }`}>
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <span className="text-xs uppercase tracking-widest font-semibold text-slate-400">Quran Audio Player</span>
            <button 
              onClick={() => setShowReciterPicker(!showReciterPicker)}
              className={`p-2 rounded-full transition-colors ${showReciterPicker ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 max-w-md w-full mx-auto px-6 py-6 flex flex-col justify-between overflow-y-auto no-scrollbar">
            {showReciterPicker ? (
              /* Reciter Selector View */
              <div className="flex flex-col gap-4 py-2">
                <h3 className="text-lg font-bold">Select Reciter (Sheikh)</h3>
                <div className="space-y-2.5">
                  {RECITERS_LIST.map((reciter) => {
                    const isSelected = reciter.id === reciterId;
                    return (
                      <button
                        key={reciter.id}
                        onClick={() => {
                          onReciterChange(reciter.id);
                          setShowReciterPicker(false);
                        }}
                        className={`w-full p-3 rounded-2xl flex items-center gap-4 border text-left transition-all ${
                          isSelected 
                            ? 'bg-emerald-950/40 border-emerald-600 text-white shadow-lg shadow-emerald-950/50' 
                            : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <img src={reciter.photoUrl} alt={reciter.name} className="w-14 h-14 rounded-xl object-cover shadow" />
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-bold truncate">{reciter.name}</p>
                          <p className="text-xs text-emerald-400 font-arabic font-medium mt-0.5">{reciter.arabicName}</p>
                          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-slate-700 rounded-md text-slate-300 font-semibold">{reciter.style}</span>
                        </div>
                        {isSelected && <div className="w-3 h-3 bg-emerald-500 rounded-full" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Main Playing View */
              <>
                <div className="flex flex-col items-center my-auto text-center py-6">
                  <div className="w-64 h-64 rounded-3xl overflow-hidden relative shadow-2xl mb-8 border border-slate-700 group">
                    <img src={activeReciter.photoUrl} alt={activeReciter.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent opacity-80" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <span className="text-xs px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg backdrop-blur-md">{activeReciter.style}</span>
                      <button 
                        onClick={handleDownload}
                        disabled={downloaded}
                        className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${downloaded ? 'bg-emerald-500/30 text-emerald-400' : 'bg-slate-800/80 text-white hover:bg-slate-700'}`}
                      >
                        {downloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <h2 className="text-2xl font-black mb-1">{surahMeta.englishName}</h2>
                  <p className="text-sm text-emerald-400 font-medium mb-1">Surah {surahMeta.name} • Ayah {currentAyah} of {surahMeta.numberOfAyahs}</p>
                  <button 
                    onClick={() => setShowReciterPicker(true)}
                    className="text-xs text-slate-400 hover:text-slate-200 underline mt-2 transition-colors"
                  >
                    {activeReciter.name}
                  </button>
                </div>

                {/* Progress Controls */}
                <div className="space-y-6 mt-auto">
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${(currentAyah / surahMeta.numberOfAyahs) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                      <span>Verse {currentAyah}</span>
                      <span>Total {surahMeta.numberOfAyahs}</span>
                    </div>
                  </div>

                  {/* Player Controls */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={toggleRepeat}
                      className={`p-3 rounded-2xl transition-all ${
                        repeatMode !== 'off' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/50' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                      title="Repeat Mode"
                    >
                      <Repeat className="w-5 h-5" />
                      {repeatMode !== 'off' && (
                        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] px-1 rounded-full font-bold">
                          {repeatMode === 'ayah' ? '1' : 'S'}
                        </span>
                      )}
                    </button>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => currentAyah > 1 && onVerseChange(currentSurah, currentAyah - 1)}
                        disabled={currentAyah <= 1}
                        className="p-3 bg-slate-800 text-slate-300 hover:text-white rounded-2xl disabled:opacity-30 transition-all active:scale-95"
                      >
                        <SkipBack className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => onPlayStateChange(!isPlaying)}
                        className="p-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl shadow-xl shadow-emerald-900/40 transition-all active:scale-95"
                      >
                        {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                      </button>
                      <button
                        onClick={() => currentAyah < surahMeta.numberOfAyahs && onVerseChange(currentSurah, currentAyah + 1)}
                        disabled={currentAyah >= surahMeta.numberOfAyahs}
                        className="p-3 bg-slate-800 text-slate-300 hover:text-white rounded-2xl disabled:opacity-30 transition-all active:scale-95"
                      >
                        <SkipForward className="w-6 h-6" />
                      </button>
                    </div>

                    <button
                      onClick={toggleSpeed}
                      className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black rounded-2xl transition-all active:scale-95 border border-slate-700"
                    >
                      {playbackSpeed}x
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
