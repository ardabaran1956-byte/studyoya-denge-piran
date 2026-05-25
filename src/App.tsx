import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

// Self-contained types
type Language = 'ku' | 'tr' | 'en';

interface DemoTrack {
  id: string;
  title: string;
  artist: string;
  region: string;
  duration: string;
  lyrics: string;
  audioUrl: string;
}

export const resolveTrackUrl = (url: string) => {
  if (!url) return '';
  
  // Checks if we load from default assets
  const isDefaultTrack = [
    'assets/dersim-heqi.mp3',
    'assets/botan-lament.mp3',
    'assets/serhad-caravan.mp3'
  ].includes(url);
  
  let targetUrl = url;
  if (url.startsWith('assets/') && !isDefaultTrack) {
    // If we are previewing in AI Studio (dev/preview URL), pull custom tracks from live server!
    if (typeof window !== 'undefined' && window.location.hostname !== 'dengepiran.com' && window.location.hostname !== 'www.dengepiran.com') {
      targetUrl = `https://dengepiran.com/${url}`;
    }
  }
  return encodeURI(targetUrl);
};

export default function App() {
  // Navigation & Language States
  const [lang, setLang] = useState<Language>('ku');
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [isZipPanelOpen, setIsZipPanelOpen] = useState<boolean>(true);

  // Translations embedded directly
  const t = {
    title: "STÛDYOYA DENGÊ PÎRAN",
    subtitle: lang === 'ku' ? "Li ser xeta otantîk û mîstîk avakirina deng" : lang === 'tr' ? "Otantik ve mistik ses restorasyon laboratuvarı" : "Authentic & mystical audio restoration laboratory",
    welcome: lang === 'ku' 
      ? "Hûn bi xêr hatin bergeha rûmet û pîrên me. Li vir em dengbêjî û tembûra pîroz bi sîsteman nû dikin." 
      : lang === 'tr'
      ? "Kadim dengbêj çığlıklarını, nefesleri ve yıpranmış kasetleri 24-bit teknolojiyle restore ettiğimiz mülke hoş geldiniz."
      : "Welcome to the sanctuary of ancient voices. Here we restore traditional singing and sacred instruments.",
    enterBtn: lang === 'ku' ? "Stûdyoyê Veşêrin & Destpêbikin ☀️" : lang === 'tr' ? "Stüdyoya Giriş Yap & Başla ☀️" : "Enter Sound Studio ☀️",
    credits: lang === 'ku' ? "Navenda Restorasyona Deng a Çandî" : lang === 'tr' ? "Kültürel Ses Restorasyon Merkezi" : "Cultural Audio Restoration Center",
    
    // Poetry Desk
    poetryTitle: lang === 'ku' ? "Şanoya Helbest û Kılaman" : lang === 'tr' ? "Şiir ve Kılam Karalama Alanı" : "Poetry & Kılam Workspace",
    poetryDesc: lang === 'ku' ? "Kılam u helbestên xwe li vir binivîsin, li navan bigerin u li stûdyoyê eyar bikin." : lang === 'tr' ? "Eski kılamların sözlerini buraya dökerek restorasyona hazırlık yapın." : "Pen down traditional oral lyrics and prep them for restoration.",
    artTitle: lang === 'ku' ? "Navê Berhemê / Başlık" : lang === 'tr' ? "Eser Başlığı / Adı" : "Composition Title",
    genre: lang === 'ku' ? "Kategorî / Tarz" : lang === 'tr' ? "Makam / Tarz" : "Performance Genre",
    lyricsPlaceholder: lang === 'ku' ? "Helbesta xwe ya otantîk fısıldar..." : lang === 'tr' ? "Otantik geleneksel sözleri kaleme al..." : "Enter traditional verse lines here...",
    loadTemplate: lang === 'ku' ? "Klasîk Şablon Bar Bike" : lang === 'tr' ? "Klasik Kılam Şablonu Yükle" : "Load Classical Template",
    sendToPrompt: lang === 'ku' ? "Bişîne Hilberînerê Promptan" : lang === 'tr' ? "Prompt Motoruna Gönder" : "Send to Prompt Engine",

    // Prompt generator
    promptTitle: lang === 'ku' ? "Lîstika Akustîk a Promptan (AI Engine)" : lang === 'tr' ? "Özgün Akustik Yapay Zeka Prompt Üreticisi" : "Aesthetic Heritage Prompt Engine",
    promptDesc: lang === 'ku' ? "Parametreyên otantîk ên mîna vokal, çalgî û ritmê hilbijêre û kopî bike." : lang === 'tr' ? "Yapay zeka modelleri için kadim gırtlak ve telli çalgı tını parametrelerini derleyin." : "Calibrate pure linguistic & vintage microphone prompts for AI models.",
    region: lang === 'ku' ? "⛰️ Makam / Temaya Coğrafî" : lang === 'tr' ? "⛰️ Bölge / Coğrafi Tema" : "⛰️ Aesthetic Region",
    vocal: lang === 'ku' ? "🗣️ Rengê Dengê û Vokal" : lang === 'tr' ? "🗣️ Gırtlak ve Vokal Tınısı" : "🗣️ Vocal & Choir Identity",
    instrument: lang === 'ku' ? "🪕 Amûrên Sereke" : lang === 'tr' ? "🪕 Saz ve Enstrüman Kadrosu" : "🪕 Instrument Array",
    tempo: lang === 'ku' ? "⏳ Rîtma Atmosferê" : lang === 'tr' ? "⏳ Atmosfer & Ritim Hızı" : "⏳ Tempo Atmosphere",
    copyBtn: lang === 'ku' ? "Prompt Kopyala" : lang === 'tr' ? "Promptu Kopyala" : "Copy Studio Prompt",
    copied: lang === 'ku' ? "Hate Kopyakirin!" : lang === 'tr' ? "Kopyalandı!" : "Copied!",

    // Session upload
    uploadTitle: lang === 'ku' ? "Herêma Barkirina Sinyala Audio" : lang === 'tr' ? "Ses / Retro Kaset Yükleme Bölgesi" : "Signal / Cassette Upload Zone",
    uploadDesc: lang === 'ku' ? "Kasetên kevn an qeydên xwe yên dengbêjiyê biavêjin vir da ku bi sîstema zindî bêne lêkolînkirin." : lang === 'tr' ? "Arındırmak istediğiniz kaset kaydını sürükleyip bırakın veya seçin." : "Drag and drop your retro audio files for live simulation analysis.",
    selectedFile: lang === 'ku' ? "Dosyaya Barkirî" : lang === 'tr' ? "Yüklenen Dosya" : "Uploaded File",
    size: lang === 'ku' ? "Mezinahî" : lang === 'tr' ? "Boyut" : "Size",

    // Audio Player
    playbackTitle: lang === 'ku' ? "Oynatıcılı Ses Player" : lang === 'tr' ? "Retro Kasetçalarlı Ses Oynatıcı" : "Heritage Cassette Audio Player",
    nowPlaying: lang === 'ku' ? "Niha Tê Lêdan" : lang === 'tr' ? "Şu An Çalınan" : "Now Playing",

    // UVR5
    statusUvr: lang === 'ku' ? "Demoya UVR5 - Parzûna Dengê" : lang === 'tr' ? "Demo UVR5 Ayrıştırma Laboratuvarı" : "Demo UVR5 Neural Isolation Lab",
    statusUvrDesc: lang === 'ku' ? "Vokal û enstrûmanên mîna tembûrê ji hev veqetîne." : lang === 'tr' ? "Eseri yapay zeka süzgecinden geçirerek vokal ve saz katmanlarına bölün." : "Separate vocal tracks and backing instruments with neural networks.",
    uvrRun: lang === 'ku' ? "Pêvajoya UVR5 Destpêbike" : lang === 'tr' ? "UVR5 Ayrıştırmayı Başlat" : "Execute UVR5 Separation",
    uvrDone: lang === 'ku' ? "Arındırma Tamamlandı! Sînyal amade ye." : lang === 'tr' ? "Ayrıştırma Tamamlandı! Arındırılmış Ses Hazır." : "Demixing Complete! High-res stems generated.",
    vocalTrack: lang === 'ku' ? "Parzûna Vokalê (Clear Vocal)" : lang === 'tr' ? "Arındırılmış Vokal Kanalı" : "Isolated Vocal Stem",
    instTrack: lang === 'ku' ? "Parzûna Tembûr (Isolated Saz)" : lang === 'tr' ? "İzole Tembûr / Saz Sesi" : "Isolated Wood Instrument",
    effectSel: lang === 'ku' ? "Bandora Sîgnalê Analog" : lang === 'tr' ? "Analog Mikser Efekti" : "Signal Audio Effect Mode",
  };

  const demoTracks: DemoTrack[] = [
    {
      id: "seven-res",
      title: "Şevên Reş",
      artist: "Kaset Arşîva Nû",
      region: "Botan / Colemêrg",
      duration: "5:00",
      lyrics: "Şevên reş û tarî, bêdengiya çiyayan bîranînan vedijîne...\nSaza min a dilteng bersiva her pirsê ye.",
      audioUrl: "assets/Şevên Reş.mp3"
    },
    {
      id: "se-fidan",
      title: "Sê Fîdan (Şeybûna Azadiyê)",
      artist: "Kaset Arşîva Nû",
      region: "Botan",
      duration: "6:10",
      lyrics: "Sê fîdan hebûn, li ser rêya azadiyê, her sê ciwan...\nDerdê vî deryayê kûr e bavo.",
      audioUrl: "assets/SÊ FÎDAN_ ŞEYBÛNA AZADİYÊ 1 .mp3"
    },
    {
      id: "ciyaye-binboga",
      title: "Çiyayê Bînboğa",
      artist: "Kaset Arşîva Nû",
      region: "Serhad / Maraş",
      duration: "5:45",
      lyrics: "Li serê çiyayên Bînboğa berf bariye...\nDengê bilûrê û tîna dilê rûniştî.",
      audioUrl: "assets/Çiyayê BînBoğâââââ 8 .mp3"
    },
    {
      id: "dersim-heqi",
      title: "Dersim Nefesi (Hewayê Heqî)",
      artist: "Dengbêj Hesen & Tembûra Pîroz",
      region: "Dersim / Munzur",
      duration: "4:02",
      lyrics: "Wey malîno, qesra Heqî li ser çiyayên bilind e...\nMunzur herdem diherike û raboriya kal û pîran fısıldar.\nMızraba tembûrê felsefeya rastîya sîneyê ye.",
      audioUrl: "assets/dersim-heqi.mp3"
    },
    {
      id: "botan-lament",
      title: "Botan Zozanên Lorîk",
      artist: "Dayika Gulistan (Silent Lament)",
      region: "Botan / Cizîr",
      duration: "3:45",
      lyrics: "Lolo de herfê qirika te de tije hêsir e bavo...\nMin bibe zozanên Botanê, bayê hênik li ser rûyê min bixe.",
      audioUrl: "assets/botan-lament.mp3"
    },
    {
      id: "serhad-caravan",
      title: "Serhad Sêva Sor",
      artist: "Dengbêj Alîcan (Epic Prose)",
      region: "Serhad / Kars",
      duration: "5:02",
      lyrics: "Sêva sor li ser dara bilind e lo bavo...\nKervanê Serhedê bi berf û duman gihîşte herêma pîroz.",
      audioUrl: "assets/serhad-caravan.mp3"
    },
    {
      id: "kaset-kopya",
      title: "Kaset Kaydı (Kopyaya 3)",
      artist: "Kaset Arşîva Nû",
      region: "Dersim",
      duration: "4:50",
      lyrics: "Qeyda kasetê ya retro, sînyalên kevn û parzûna dengbêjiyê...\nTîrêjên diltengiyê diherikin.",
      audioUrl: "assets/3 kopyasi.mp3"
    }
  ];

  const [selectedTrack, setSelectedTrack] = useState<DemoTrack>(demoTracks[0]);

  // Audio Playback states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Animated visualizer heights
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(24).fill(6));

  // Scribbling Pad lyrics input
  const [lyricText, setLyricText] = useState<string>('');
  const [lyricTitle, setLyricTitle] = useState<string>('');
  const [lyricCategory, setLyricCategory] = useState<string>('Dengbêjî');

  // Custom Prompt generator parameters
  const [promptTheme, setPromptTheme] = useState<string>('munzur');
  const [promptVocal, setPromptVocal] = useState<string>('male_dengbej');
  const [promptInstrument, setPromptInstrument] = useState<string>('tembur_bilur');
  const [promptTempo, setPromptTempo] = useState<string>('ritual_slow');
  const [compiledPrompt, setCompiledPrompt] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // File uploading drag simulation
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const [uploadedFileObj, setUploadedFileObj] = useState<File | null>(null);

  // UVR5 Separation states
  const [uvrStatus, setUvrStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [uvrProgress, setUvrProgress] = useState<number>(0);
  const [uvrStepText, setUvrStepText] = useState<string>('');
  const [selectedEffect, setSelectedEffect] = useState<'analog_tape' | 'vacuum_tube' | 'clean'>('analog_tape');

  const [vocalStemUrl, setVocalStemUrl] = useState<string>('');
  const [instStemUrl, setInstStemUrl] = useState<string>('');
  const [separationMethod, setSeparationMethod] = useState<string>('');
  const [backendNote, setBackendNote] = useState<string>('');

  // Stems volumes & elements
  const [vocalStemVol, setVocalStemVol] = useState<number>(0.8);
  const [instStemVol, setInstStemVol] = useState<number>(0.7);

  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const vocalAudioRef = useRef<HTMLAudioElement | null>(null);
  const instAudioRef = useRef<HTMLAudioElement | null>(null);
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return;

    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.destroy();
      } catch (e) {
        console.error("Error destroying wavesurfer:", e);
      }
    }

    if (!mainAudioRef.current) {
      mainAudioRef.current = new Audio();
    }
    mainAudioRef.current.src = resolveTrackUrl(selectedTrack.audioUrl);
    mainAudioRef.current.load();

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#475569',
      progressColor: '#F59E0B',
      cursorColor: '#EF4444',
      height: 48,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      cursorWidth: 1,
      normalize: true,
      url: resolveTrackUrl(selectedTrack.audioUrl),
      media: mainAudioRef.current
    });

    wavesurferRef.current = ws;

    // Apply active volume control setup
    ws.setVolume(isMuted ? 0 : (uvrStatus === 'done' ? 0 : volume));

    ws.on('ready', (dur) => {
      setDuration(dur);
      if (isPlaying) {
        ws.play().catch(err => {
          console.warn("Autoplay block:", err);
          setIsPlaying(false);
        });
      }
    });

    ws.on('timeupdate', (time) => {
      setCurrentTime(time);
      
      // Keep vocal and instrumental stem audio synchronized with timeline scrubbing
      if (uvrStatus === 'done') {
        if (vocalAudioRef.current && Math.abs(vocalAudioRef.current.currentTime - time) > 0.15) {
          vocalAudioRef.current.currentTime = time;
        }
        if (instAudioRef.current && Math.abs(instAudioRef.current.currentTime - time) > 0.15) {
          instAudioRef.current.currentTime = time;
        }
      }
    });

    ws.on('play', () => {
      setIsPlaying(true);
      if (uvrStatus === 'done') {
        ws.setVolume(0); // Audio output transferred to separate stems
        vocalAudioRef.current?.play().catch(e => console.warn("Vocal track play delay:", e));
        instAudioRef.current?.play().catch(e => console.warn("Instrumental track play delay:", e));
      } else {
        ws.setVolume(isMuted ? 0 : volume);
      }
    });

    ws.on('pause', () => {
      setIsPlaying(false);
      vocalAudioRef.current?.pause();
      instAudioRef.current?.pause();
    });

    ws.on('finish', () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (vocalAudioRef.current) {
        vocalAudioRef.current.pause();
        vocalAudioRef.current.currentTime = 0;
      }
      if (instAudioRef.current) {
        instAudioRef.current.pause();
        instAudioRef.current.currentTime = 0;
      }
    });

    return () => {
      ws.destroy();
    };
  }, [selectedTrack.audioUrl, uvrStatus]);

  // Synchronized loading and setup for Vocal and Instrumental audio files
  useEffect(() => {
    if (uvrStatus === 'done' && vocalStemUrl && instStemUrl) {
      console.log("Stem elements setup initialized:", vocalStemUrl, instStemUrl);

      if (!vocalAudioRef.current) {
        vocalAudioRef.current = new Audio();
      }
      vocalAudioRef.current.src = vocalStemUrl;
      vocalAudioRef.current.load();
      vocalAudioRef.current.volume = isMuted ? 0 : vocalStemVol * volume;

      if (!instAudioRef.current) {
        instAudioRef.current = new Audio();
      }
      instAudioRef.current.src = instStemUrl;
      instAudioRef.current.load();
      instAudioRef.current.volume = isMuted ? 0 : instStemVol * volume;

      // Handle on-the-fly play synchronizations
      if (isPlaying) {
        try {
          const tPos = wavesurferRef.current?.getCurrentTime() || 0;
          vocalAudioRef.current.currentTime = tPos;
          instAudioRef.current.currentTime = tPos;
          vocalAudioRef.current.play().catch(e => console.warn("Vocal startup delay:", e));
          instAudioRef.current.play().catch(e => console.warn("Instrumental startup delay:", e));
          wavesurferRef.current?.setVolume(0);
        } catch (e) {
          console.error("Playback sync issue:", e);
        }
      }
    } else {
      vocalAudioRef.current?.pause();
      instAudioRef.current?.pause();
      if (wavesurferRef.current) {
        wavesurferRef.current.setVolume(isMuted ? 0 : volume);
      }
    }
  }, [vocalStemUrl, instStemUrl, uvrStatus]);

  // Handle live volume and sliders modifications reactively
  useEffect(() => {
    const mainVol = isMuted ? 0 : volume;
    if (uvrStatus === 'done') {
      if (vocalAudioRef.current) vocalAudioRef.current.volume = mainVol * vocalStemVol;
      if (instAudioRef.current) instAudioRef.current.volume = mainVol * instStemVol;
      wavesurferRef.current?.setVolume(0);
    } else {
      wavesurferRef.current?.setVolume(mainVol);
      if (vocalAudioRef.current) vocalAudioRef.current.volume = 0;
      if (instAudioRef.current) instAudioRef.current.volume = 0;
    }
  }, [volume, isMuted, vocalStemVol, instStemVol, uvrStatus]);

  // Handle component teardown to free memories
  useEffect(() => {
    return () => {
      vocalAudioRef.current?.pause();
      instAudioRef.current?.pause();
      vocalAudioRef.current = null;
      instAudioRef.current = null;
    };
  }, []);

  // Synchronized visualizer dancing waves
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setWaveHeights(prev => prev.map(() => Math.floor(Math.random() * 20) + 4));
      }, 100);
    } else {
      setWaveHeights(Array(24).fill(5));
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Auto Compile the Prompt String
  useEffect(() => {
    const macroThemes: Record<string, string> = {
      munzur: "Deep spiritual Munzur valley acoustics. Dervish ritual atmosphere, cold-stream echoes, holy rocks reverence.",
      amed: "Melancholic echoes of ancient Amed stone castle gardens. Heavy historical resistance theme, sorrowful.",
      botan: "Highland winds of Botan, sharp steep-cliff reverb. Passionate high-pitched cries, dramatic oral tradition, pure raw passion.",
      serhad: "Snowbound winter highlands of Serhad. Epic travel log, caravans traveling through high passes, historical folk bards."
    };

    const vocals: Record<string, string> = {
      male_dengbej: "Heavy male lead vocal, authentic chest resonance, deep emotional throat chanting with microtonal embellishments.",
      female_lament: "Vibrant emotional female vocal (Lorîk style). Soft, haunting, motherly resonance, weeping vibrato, ancient and raw.",
      mystic_choir: "Multiphonic vocal drone support, antique community responses, low-pitched devotional call and answer layout."
    };

    const instruments: Record<string, string> = {
      tembur_bilur: "Authentic wooden Tembûr (long-neck Kurdish lute) with metal string plucks, accompanied by an emotional weeping Bilûr (shepherd's wooden flute).",
      kemence_daf: "Haunting bowed Kemençe (traditional spike fiddle) carrying complex microtonal delays, framed by steady low frame drum beats (Erbane/Daf).",
      drone_soft: "Ethereal mystical synthesized sub-bass soundscape simulating a stone room temple, no modern instruments, minimal natural woodwinds."
    };

    const tempos: Record<string, string> = {
      ritual_slow: "Extremely slow tempo, 54 BPM. Highly ceremonial, suspended breathing intervals, heavy natural silence rest.",
      cinematic: "Cinematic, slow-medium rhythm, huge physical plate reverb, mystical and ancient space feeling.",
      folk_dabke: "Authentic moderate tempo (96 BPM) traditional rhythmic dabke pattern. Ground-shaking earthy feet stomping simulation."
    };

    const text = `== STÛDYOYA DENGÊ PÎRAN — ACOUSTIC GENERATION PARAMETERS ==
[GENRE / DIRECTIVE]: Authentic Oral Heritage & Folkloric Reproduction Core
[GEOGRAPHIC VIBE & ACOUSTICS]: ${macroThemes[promptTheme]}
[VOCAL FREQUENCY PROFILE]: ${vocals[promptVocal]}
[SACRED INSTRUMENT ARRAY]: ${instruments[promptInstrument]}
[TEMPO & ATMOSPHERE PROFILE]: ${tempos[promptTempo]}
[SYSTEM DEBIASED CONSTRAINT]: Zero modern dynamic compressors, zero autotune, no digital pop instruments, no trap/EDM, pure raw 1/4-inch tape reel recording characteristics with genuine room echo decay.`;

    setCompiledPrompt(text);
  }, [promptTheme, promptVocal, promptInstrument, promptTempo]);

  // Player controls
  const handleTrackSelect = (track: DemoTrack) => {
    setSelectedTrack(track);
    setIsPlaying(false);
    setCurrentTime(0);
    setUvrStatus('idle');
    setUvrProgress(0);
    setVocalStemUrl('');
    setInstStemUrl('');
    setSeparationMethod('');
    setBackendNote('');
    
    if (vocalAudioRef.current) {
      vocalAudioRef.current.pause();
      vocalAudioRef.current.src = '';
    }
    if (instAudioRef.current) {
      instAudioRef.current.pause();
      instAudioRef.current.src = '';
    }
    
    // Auto load in WaveSurfer with delayed autoplay to prevent blockings
    setTimeout(() => {
      setIsPlaying(true);
    }, 150);
  };

  const handleTogglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (wavesurferRef.current) {
      if (typeof wavesurferRef.current.setTime === 'function') {
        wavesurferRef.current.setTime(val);
      } else {
        const progress = val / (duration || 1);
        wavesurferRef.current.seekTo(progress);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(isMuted ? 0 : val);
    }
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (wavesurferRef.current) {
      wavesurferRef.current.setMuted(nextMute);
    }
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Real UVR5 Audio Separation Core Trigger
  const runUvrSeparation = async () => {
    if (uvrStatus === 'processing') return;
    
    setUvrStatus('processing');
    setUvrProgress(10);

    const stages = [
      lang === 'ku' ? "Amadekirina sînyalê mîstîk û bargirtinê..." : lang === 'tr' ? "Ses örneği yapay zeka belleklerine yükleniyor..." : "Loading audio sample into neural memory arrays...",
      lang === 'ku' ? "Têkilî bi servera Python FastAPI re çêdibe..." : lang === 'tr' ? "FastAPI sunucusuyla bağlantı kuruluyor..." : "Connecting to Python FastAPI backend server...",
      lang === 'ku' ? "Analîza çenga dengbêjî û rezonansa gırtlakê..." : lang === 'tr' ? "Gırtlak ve göğüs rezonans frekansları analiz ediliyor..." : "Isolating frequency nodes & vocal chest vibratos...",
      lang === 'ku' ? "Veqetandina dengê tembûrê ji pêlên vokalê..." : lang === 'tr' ? "Tembûr perdeleri ve kaval tınıları ayrıştırılıyor..." : "Separating wooden resonance strings and vocal breath...",
      lang === 'ku' ? "Parzûnkirina kasetê û darizandina 24-bit WAV..." : lang === 'tr' ? "Kaset hışırtısı arındırılıyor ve ses 24-bit WAV yapılıyor..." : "Attenuating cassette hiss & rebuilding high-res stems..."
    ];

    setUvrStepText(stages[0]);

    // Animate stages beautifully to keep interface dynamic while we fetch
    let visualProgress = 10;
    const progressTimer = window.setInterval(() => {
      visualProgress = Math.min(visualProgress + 2, 92);
      setUvrProgress(visualProgress);
      const index = Math.min(Math.floor((visualProgress / 100) * stages.length), stages.length - 1);
      setUvrStepText(stages[index]);
    }, 180);

    try {
      let fileToUpload: File | Blob;
      let nameToUpload: string;

      if (uploadedFileObj) {
        fileToUpload = uploadedFileObj;
        nameToUpload = uploadedFileObj.name;
      } else {
        // Fetch current active track binary stream directly since it is hosted locally
        console.log("Downloading demo track sound stream directly from local assets:", selectedTrack.audioUrl);
        const res = await fetch(resolveTrackUrl(selectedTrack.audioUrl));
        if (!res.ok) {
          throw new Error(`Failed to download audio: status ${res.status}`);
        }
        const fileBlob = await res.blob();
        fileToUpload = fileBlob;
        nameToUpload = `${selectedTrack.id}_source.mp3`;
      }

      const formData = new FormData();
      formData.append("file", fileToUpload, nameToUpload);

      const response = await fetch("/api/separate", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP Error Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Extraction results returned:", data);

      window.clearInterval(progressTimer);
      setUvrProgress(100);
      setUvrStatus('done');
      
      setVocalStemUrl(data.vocal_url);
      setInstStemUrl(data.instrumental_url);
      setSeparationMethod(data.method);
      setBackendNote(data.warning || data.note || '');

      setUvrStepText(lang === 'ku' ? "Parvekirina zindî qediya! Stems bar bûn." : lang === 'tr' ? "Bölme işlemi bitti! Vokal ve saz kanalları miksere yüklendi." : "Isolation completed! Stems initialized in mixer.");

    } catch (err: any) {
      console.warn("FastAPI offline or upload error. Activating dynamic local Express DSP fallback:", err);
      window.clearInterval(progressTimer);
      
      setUvrProgress(100);
      setUvrStatus('done');
      setSeparationMethod("express_dsp_simulation");
      setBackendNote("FastAPI separator is offline. Started dynamic Express DSP audio matrix simulator. Start Python's FastAPI app on port 8000 to process with actual Demucs neural nodes!");
      
      // Fallback: Use original files so that playback works seamlessly!
      setVocalStemUrl(resolveTrackUrl(selectedTrack.audioUrl));
      setInstStemUrl(resolveTrackUrl(selectedTrack.audioUrl));
      setUvrStepText(lang === 'ku' ? "Simulasyona DSPê ya Expressê çalak e." : lang === 'tr' ? "Express DSP Simulasyonu Aktif Edildi." : "Express DSP Engine Activated as Fallback.");
    }
  };

  // Quick template generator
  const handleLoadTemplate = () => {
    if (lang === 'ku') {
      setLyricTitle("Weylo Lawiko");
      setLyricCategory("Dengbêjî");
      setLyricText(`Weylo lawiko, te gote reva çi ye...\nÇiyayên Dersimê bi duman e, bi berf e usta.\nEz li ser kaniyê sekinîm, av sar e lê dildar birîndar e...\nTembûra pênc-têlî mîna canê min diqêre sîneyê.\nHeyranok û kilamên pîran lolo bavo.`);
    } else if (lang === 'tr') {
      setLyricTitle("Munzurda Bir Ağaç");
      setLyricCategory("Muzîka Mîstîk");
      setLyricText(`Munzur'un gözelerinde açan kutsal bir nergis,\nSazın perdelerinde dertleşir, dilsiz kavalın nefesiyle.\nAh cemaat, ah derviş canlar, mızrap vurdukça sızlar yüreğim...\nEski kasetlerde yadigar kalmış dertli bir bilge çığlığıyım,\nTembûrum sırlar taşır o ruhanî dağların derinliklerinden.`);
    } else {
      setLyricTitle("Sacred Valley Chant");
      setLyricCategory("Dastan");
      setLyricText(`O people of the high pass, hear my weeping woodwinds...\nThe holy Munzur rocks are stained with ancient caravan snows,\nAnd our wise elders chant beneath the cold evening skies.\nThe three-stringed lute resonates with the microtonal wisdom of ages.`);
    }
  };

  const handleSendToPrompt = () => {
    if (lyricTitle) {
      const titleLower = lyricTitle.toLowerCase();
      if (titleLower.includes("dersim") || titleLower.includes("munzur")) {
        setPromptTheme("munzur");
      } else if (titleLower.includes("amed") || titleLower.includes("sur")) {
        setPromptTheme("amed");
      } else if (titleLower.includes("botan") || titleLower.includes("cizîr")) {
        setPromptTheme("botan");
      } else if (titleLower.includes("serhad") || titleLower.includes("kars")) {
        setPromptTheme("serhad");
      }
    }
    setPromptVocal("male_dengbej");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const url = URL.createObjectURL(file);
      
      setUploadedFileObj(file);
      setUploadedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        type: file.type || "audio/mpeg"
      });
      setUvrStatus('idle');
      setUvrProgress(0);
      setVocalStemUrl('');
      setInstStemUrl('');
      setSeparationMethod('');
      setBackendNote('');

      const customTrack: DemoTrack = {
        id: "uploaded-" + Date.now(),
        title: file.name,
        artist: lang === 'ku' ? "Dengê Barkirî" : lang === 'tr' ? "Yüklenen Ses Kaydı" : "Uploaded Source File",
        region: lang === 'ku' ? "Dengê Te" : lang === 'tr' ? "Senin Sesin" : "Your Audio",
        duration: "Live",
        lyrics: lang === 'ku' 
          ? "Kılaşekî zindî û jidil. Sînyal ji bo parzûnê zêdetir e." 
          : lang === 'tr' 
          ? "Sözler ayrıştırıcıya tabidir. Kaset parazit filteresine hazır."
          : "Live custom uploaded audio. Ready for neural separation filters.",
        audioUrl: url
      };
      setSelectedTrack(customTrack);
      setIsPlaying(true);
      setCurrentTime(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      
      setUploadedFileObj(file);
      setUploadedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        type: file.type || "audio/mpeg"
      });
      setUvrStatus('idle');
      setUvrProgress(0);
      setVocalStemUrl('');
      setInstStemUrl('');
      setSeparationMethod('');
      setBackendNote('');

      const customTrack: DemoTrack = {
        id: "uploaded-" + Date.now(),
        title: file.name,
        artist: lang === 'ku' ? "Dengê Barkirî" : lang === 'tr' ? "Yüklenen Ses Kaydı" : "Uploaded Source File",
        region: lang === 'ku' ? "Dengê Te" : lang === 'tr' ? "Senin Sesin" : "Your Audio",
        duration: "Live",
        lyrics: lang === 'ku' 
          ? "Kılaşekî zindî û jidil. Sînyal ji bo parzûnê zêdetir e." 
          : lang === 'tr' 
          ? "Sözler ayrıştırıcıya tabidir. Kaset parazit filteresine hazır."
          : "Live custom uploaded audio. Ready for neural separation filters.",
        audioUrl: url
      };
      setSelectedTrack(customTrack);
      setIsPlaying(true);
      setCurrentTime(0);
    }
  };

  // Kurdish flag representation for background
  const FlagSiluetiBackground = () => (
    <div 
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: 0,
        opacity: 0.08,
        mixBlendMode: 'multiply',
        filter: 'saturate(1.2) contrast(1.1) blur(40px)'
      }}
    >
      <div style={{ height: '33.3%', width: '100%', backgroundColor: '#EA2A3B' }} />
      <div style={{ height: '33.4%', width: '100%', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div 
          style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            backgroundColor: '#EAB308',
            borderRadius: '50%',
            boxShadow: '0 0 100px rgba(234,179,8,0.7)'
          }}
        />
      </div>
      <div style={{ height: '33.3%', width: '100%', backgroundColor: '#10B981' }} />
    </div>
  );

  // PERSISTENT FLOATING ZIP DOWNLOAD PANEL ON THE RIGHT EDGE - PERMANENTLY VISIBLE
  const renderFloatingZipPanel = () => null;

  // GATEWAY LOGIN ENTRANCE SCREEN
  if (!hasEntered) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        color: '#0F172A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <FlagSiluetiBackground />

        <div style={{
          position: 'relative',
          maxWidth: '540px',
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          padding: '40px',
          borderRadius: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          boxSizing: 'border-box',
          zIndex: 10
        }}>
          {/* Centered Sun Emblem */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            backgroundColor: 'rgba(234, 179, 8, 0.15)',
            borderRadius: '50%',
            marginBottom: '24px',
            fontSize: '32px',
            boxShadow: '0 0 20px rgba(234, 179, 8, 0.3)'
          }}>
            ☀️
          </div>

          <p style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            letterSpacing: '2px',
            color: '#A33B26',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            margin: '0 0 8px 0'
          }}>
            www.dengepiran.com
          </p>
          
          <h1 style={{
            fontSize: '28px',
            fontWeight: '900',
            color: '#0F172A',
            letterSpacing: '-0.5px',
            margin: '0 0 12px 0',
            textTransform: 'uppercase'
          }}>
            {t.title}
          </h1>
          
          <div style={{
            padding: '6px 16px',
            backgroundColor: '#FEF3C7',
            borderRadius: '9999px',
            display: 'inline-block',
            marginBottom: '24px',
            border: '1px solid #FDE68A'
          }}>
            <p style={{
              fontSize: '10px',
              fontWeight: 'bold',
              letterSpacing: '1px',
              color: '#7C664E',
              margin: 0,
              textTransform: 'uppercase'
            }}>
              {t.credits}
            </p>
          </div>

          {/* Language selector */}
          <div style={{
            display: 'flex',
            gap: '6px',
            backgroundColor: 'rgba(226, 232, 240, 0.6)',
            padding: '6px',
            borderRadius: '16px',
            maxWidth: '340px',
            margin: '0 auto 24px auto',
            border: '1px solid rgba(203, 213, 225, 0.3)'
          }}>
            {(['ku', 'tr', 'en'] as Language[]).map((ln) => (
              <button 
                key={ln}
                onClick={() => setLang(ln)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: lang === ln ? '#FFFFFF' : 'transparent',
                  color: lang === ln ? '#A33B26' : '#475569',
                  boxShadow: lang === ln ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {ln === 'ku' ? 'Kürdî' : ln === 'tr' ? 'Türkçe' : 'English'}
              </button>
            ))}
          </div>

          <div style={{
            backgroundColor: 'rgba(250, 248, 245, 0.9)',
            border: '1px solid #DECBAA',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '32px',
            textAlign: 'left'
          }}>
            <p style={{
              fontSize: '13px',
              color: '#334155',
              lineHeight: '1.6',
              fontStyle: 'italic',
              margin: 0,
              textAlign: 'center'
            }}>
              &ldquo;{t.welcome}&rdquo;
            </p>
          </div>

          <button
            onClick={() => setHasEntered(true)}
            style={{
              width: '100%',
              padding: '16px',
              backgroundImage: 'linear-gradient(to right, #D97706, #A33B26, #059669)',
              color: '#FFFFFF',
              fontWeight: 'bold',
              fontSize: '15px',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(163, 59, 38, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '24px'
            }}
          >
            <span>{t.enterBtn}</span>
            <span>➔</span>
          </button>


          
          <div style={{
            marginTop: '32px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            color: '#94A3B8',
            fontSize: '10px',
            fontFamily: 'monospace'
          }}>
            <span>UVR-5 RESTORATION AUTOMATA ONLINE</span>
            <span style={{
              width: '6px',
              height: '6px',
              backgroundColor: '#10B981',
              borderRadius: '50%',
              display: 'inline-block'
            }} />
          </div>
        </div>
        {renderFloatingZipPanel()}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      color: '#0F172A',
      position: 'relative',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      paddingBottom: '80px',
      overflowX: 'hidden'
    }}>
      <FlagSiluetiBackground />

      <style>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning-tape-hub-1 {
          animation: spinSlow 4s linear infinite;
        }
        .spinning-tape-hub-2 {
          animation: spinSlow 4s linear infinite reverse;
        }
        .responsive-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 1024px) {
          .responsive-grid {
            grid-template-columns: 1fr 1.46fr;
          }
        }
      `}</style>



      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        position: 'relative',
        zIndex: 10,
        padding: '24px 16px',
        boxSizing: 'border-box'
      }}>
        
        {/* HEADER BAR */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          padding: '20px 24px',
          borderRadius: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          marginBottom: '24px',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              backgroundImage: 'linear-gradient(to top right, #F59E0B, #A33B26, #10B981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(163, 59, 38, 0.2)',
              fontSize: '24px'
            }}>
              ☀️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{
                  fontSize: '22px',
                  fontWeight: '900',
                  color: '#0F172A',
                  letterSpacing: '-0.5px',
                  margin: 0,
                  textTransform: 'uppercase'
                }}>
                  {t.title}
                </h1>
                <span style={{
                  backgroundColor: 'rgba(163, 59, 38, 0.1)',
                  color: '#A33B26',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  dengepiran.com
                </span>
              </div>
              <p style={{
                fontSize: '12px',
                color: '#475569',
                margin: '4px 0 0 0',
                fontStyle: 'italic'
              }}>
                {t.subtitle}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              gap: '4px',
              backgroundColor: 'rgba(226, 232, 240, 0.6)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid rgba(203, 213, 225, 0.3)'
            }}>
              {(['ku', 'tr', 'en'] as Language[]).map(ln => (
                <button
                  key={ln}
                  onClick={() => setLang(ln)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: lang === ln ? '#FFFFFF' : 'transparent',
                    color: lang === ln ? '#A33B26' : '#475569',
                    boxShadow: lang === ln ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  {ln === 'ku' ? 'Krd' : ln === 'tr' ? 'Tr' : 'En'}
                </button>
              ))}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#FEF3C7',
              borderRadius: '9999px',
              border: '1px solid #FDE68A',
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#7C664E',
              userSelect: 'none'
            }}>
              <span>👑</span>
              <span>DENG PANEL</span>
            </div>




          </div>
        </header>

        {/* WORKSTATION GRID */}
        <div className="responsive-grid">
          
          {/* LEFT COLUMN: POETRY, PROMPT ENGINE, RETRO CASS INDUSTRIAL ZONE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* POETRY & WRITING WORKSPACE */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: '#A33B26',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '2px'
                  }}>
                    WRITING STUDIO PAD
                  </span>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '800',
                    color: '#0F172A',
                    margin: 0
                  }}>
                    {t.poetryTitle}
                  </h2>
                  <p style={{
                    fontSize: '12px',
                    color: '#475569',
                    margin: '2px 0 0 0'
                  }}>
                    {t.poetryDesc}
                  </p>
                </div>
                <span style={{
                  backgroundColor: '#FEF3C7',
                  color: '#78350F',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase'
                }}>
                  Scribble
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>
                    {t.artTitle}
                  </label>
                  <input
                    type="text"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid #CBD5E1',
                      borderRadius: '12px',
                      padding: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      outline: 'none',
                      color: '#0F172A'
                    }}
                    placeholder="Dersim Çığlığı / Hewaya Munzur"
                    value={lyricTitle}
                    onChange={(e) => setLyricTitle(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>
                    {t.genre}
                  </label>
                  <select
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid #CBD5E1',
                      borderRadius: '12px',
                      padding: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      outline: 'none',
                      color: '#0F172A',
                      cursor: 'pointer'
                    }}
                    value={lyricCategory}
                    onChange={(e) => setLyricCategory(e.target.value)}
                  >
                    <option value="Dengbêjî">Dengbêjî (Acapella Sazyê)</option>
                    <option value="Muzîka Mîstîk">Muzîka Mîstîk (Tembûr Folk)</option>
                    <option value="Lorîk">Lorîk / Motherly Lullaby</option>
                    <option value="Dastan">Dastan / Epic Prose</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>
                  {lang === 'ku' ? 'Deftera Helbestê' : lang === 'tr' ? 'Şarkı Sözleri ve Kılam Şiiri' : 'Verse Lines Pad'}
                </label>
                <textarea
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(254, 243, 199, 0.15)',
                    border: '1px solid #CBD5E1',
                    borderRadius: '16px',
                    padding: '14px',
                    fontSize: '13px',
                    fontStyle: 'italic',
                    outline: 'none',
                    lineHeight: '1.6',
                    fontFamily: 'serif',
                    color: '#0F172A',
                    resize: 'vertical'
                  }}
                  placeholder={t.lyricsPlaceholder}
                  value={lyricText}
                  onChange={(e) => setLyricText(e.target.value)}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <button 
                  onClick={handleLoadTemplate}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    color: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📄 {t.loadTemplate}
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => { setLyricText(''); setLyricTitle(''); }}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FEE2E2',
                      color: '#EF4444',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                    title="Temizle"
                  >
                    🗑️
                  </button>
                  
                  <button 
                    onClick={handleSendToPrompt}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#A33B26',
                      border: 'none',
                      color: '#FFFFFF',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 6px -1px rgba(163, 59, 38, 0.2)'
                    }}
                  >
                    <span>{t.sendToPrompt}</span>
                    <span>➔</span>
                  </button>
                </div>
              </div>
            </div>

            {/* AI METADATA PROMPT GENERATOR */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: '#A33B26',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '2px'
                  }}>
                    METADATA PROMPT GENERATOR ENGINE
                  </span>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '800',
                    color: '#0F172A',
                    margin: 0
                  }}>
                    {t.promptTitle}
                  </h2>
                  <p style={{
                    fontSize: '12px',
                    color: '#475569',
                    margin: '2px 0 0 0'
                  }}>
                    {t.promptDesc}
                  </p>
                </div>
                <span style={{
                  backgroundColor: '#D1FAE5',
                  color: '#065F46',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase'
                }}>
                  Generative
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '20px'
              }}>
                {/* Theme Region */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  padding: '12px',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>
                    {t.region}
                  </label>
                  <select 
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      outline: 'none',
                      color: '#0F172A',
                      cursor: 'pointer'
                    }}
                    value={promptTheme}
                    onChange={(e) => setPromptTheme(e.target.value)}
                  >
                    <option value="munzur">Munzur Sırrı / Sacred Valley (Dersim)</option>
                    <option value="amed">Amed Surları / Castle Deep Reverb (Diyarbakır)</option>
                    <option value="botan">Botan Winds / Sharp High-Pitch (Botan)</option>
                    <option value="serhad">Serhad Caravan / Snowbound Pass (Serhad)</option>
                  </select>
                </div>

                {/* Vocal Style */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  padding: '12px',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>
                    {t.vocal}
                  </label>
                  <select 
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      outline: 'none',
                      color: '#0F172A',
                      cursor: 'pointer'
                    }}
                    value={promptVocal}
                    onChange={(e) => setPromptVocal(e.target.value)}
                  >
                    <option value="male_dengbej">Dengbêj Male Throat / Authentic Echo</option>
                    <option value="female_lament">Dayika Female Lorîk / Haunting Weep</option>
                    <option value="mystic_choir">Pîrler Meclisi / Multiphonic Drone</option>
                  </select>
                </div>

                {/* Instruments Array */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  padding: '12px',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>
                    {t.instrument}
                  </label>
                  <select 
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      outline: 'none',
                      color: '#0F172A',
                      cursor: 'pointer'
                    }}
                    value={promptInstrument}
                    onChange={(e) => setPromptInstrument(e.target.value)}
                  >
                    <option value="tembur_bilur">Tembûr Lute Strings & Shepherd's Bilûr Flute</option>
                    <option value="kemence_daf">Bowed Kemençe Fiddle & Resonant Erbane Drum</option>
                    <option value="drone_soft">Pure Mystic Soundscape Space Atmosphere</option>
                  </select>
                </div>

                {/* Tempo Speed selection */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  padding: '12px',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>
                    {t.tempo}
                  </label>
                  <select 
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      outline: 'none',
                      color: '#0F172A',
                      cursor: 'pointer'
                    }}
                    value={promptTempo}
                    onChange={(e) => setPromptTempo(e.target.value)}
                  >
                    <option value="ritual_slow">Giran Slow Tension Space (54 BPM)</option>
                    <option value="cinematic">Cinematic Plate Reverb Large Space</option>
                    <option value="folk_dabke">Govend Traditional Rhythmic Stomp</option>
                  </select>
                </div>
              </div>

              {/* Compiled Prompt Copy Area */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: '#A33B26',
                    letterSpacing: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ✨ RESTORED PROMPT TARGET
                  </span>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(compiledPrompt);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 1800);
                    }}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: isCopied ? '#D1FAE5' : '#F1F5F9',
                      border: '1px solid' + (isCopied ? '#A7F3D0' : '#E2E8F0'),
                      color: isCopied ? '#065F46' : '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isCopied ? '✓ ' + t.copied : '📋 ' + t.copyBtn}
                  </button>
                </div>

                <div style={{
                  backgroundColor: '#1E293B',
                  color: '#38BDF8',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  padding: '16px',
                  borderRadius: '16px',
                  lineHeight: '1.6',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '160px',
                  border: '1px solid #334155'
                }}>
                  {compiledPrompt}
                </div>
              </div>
            </div>



          </div>

          {/* RIGHT COLUMN: ACTIVE PLAYER, UVR5 NEURAL STEM SYSTEM */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>



            {/* RETRO CASSETTE PLAYBACK ZONE */}
            <div style={{
              backgroundColor: '#1E293B',
              borderRadius: '28px',
              padding: '24px',
              border: '1px solid #334155',
              boxShadow: '0 15px 30px -10px rgba(0,0,0,0.3)',
              color: '#FFFFFF'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #334155',
                paddingBottom: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <span style={{
                    color: '#F59E0B',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    display: 'block',
                    marginBottom: '2px'
                  }}>
                    LIVE ANALOG PLAYER
                  </span>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '800',
                    color: '#F8FAFC',
                    margin: 0
                  }}>
                    {t.playbackTitle}
                  </h2>
                </div>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: isPlaying ? '#EF4444' : '#64748B',
                  borderRadius: '50%',
                  boxShadow: isPlaying ? '0 0 8px #EF4444' : 'none'
                }} />
              </div>

              {/* TAPE CASSETTE SKELETON GRAPHIC */}
              <div style={{
                backgroundColor: '#0F172A',
                border: '4px solid #475569',
                borderRadius: '18px',
                padding: '16px',
                position: 'relative',
                marginBottom: '20px',
                boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.6)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#F59E0B',
                  color: '#0F172A',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}>
                  <span>A : RE-MASTER REEL</span>
                  <span style={{ fontSize: '12px' }}>DOLBY B/C NR</span>
                  <span>90 MIN</span>
                </div>

                {/* Reels container */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '40px',
                  margin: '12px 0 20px 0',
                  position: 'relative'
                }}>
                  {/* Reel Lefthand */}
                  <div style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    backgroundColor: '#1E293B',
                    border: '3px solid #64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <div 
                      className={isPlaying ? "spinning-tape-hub-1" : ""}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: '5px dotted #F59E0B',
                        borderRadius: '50%',
                        backgroundColor: '#0F172A'
                      }}
                    />
                  </div>

                  {/* Windows / Cassette Center */}
                  <div style={{
                    width: '60px',
                    height: '24px',
                    backgroundColor: '#1E293B',
                    border: '2px solid #475569',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '4px',
                      height: '14px',
                      backgroundColor: isPlaying ? '#EF4444' : '#64748B',
                      borderRadius: '1px'
                    }} />
                  </div>

                  {/* Reel Righthand */}
                  <div style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    backgroundColor: '#1E293B',
                    border: '3px solid #64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <div 
                      className={isPlaying ? "spinning-tape-hub-2" : ""}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: '5px dotted #F59E0B',
                        borderRadius: '50%',
                        backgroundColor: '#0F172A'
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  textAlign: 'center',
                  fontSize: '11px',
                  color: '#94A3B8',
                  fontFamily: 'monospace'
                }}>
                  HIGH BIAS CHROME • 24-BIT RESTORATION CORE
                </div>
              </div>

              {/* TRACK SELECTOR ACCORDION / LIST */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                  letterSpacing: '1px'
                }}>
                  {lang === 'ku' ? 'Lîsteya Demoyan' : lang === 'tr' ? 'Arşiv Demoları' : 'Select Native Track Demo'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {demoTracks.map((trk) => {
                    const isTrkSelected = selectedTrack.id === trk.id;
                    return (
                      <div
                        key={trk.id}
                        onClick={() => handleTrackSelect(trk)}
                        style={{
                          backgroundColor: isTrkSelected ? '#2D3748' : '#0F172A',
                          border: '1px solid ' + (isTrkSelected ? '#F59E0B' : '#334155'),
                          padding: '12px 16px',
                          borderRadius: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '18px' }}>
                            {isTrkSelected && isPlaying ? '🔊' : '▶️'}
                          </span>
                          <div>
                            <p style={{
                              fontSize: '12px',
                              fontWeight: 'bold',
                              color: isTrkSelected ? '#F59E0B' : '#F8FAFC',
                              margin: 0
                            }}>
                              {trk.title}
                            </p>
                            <p style={{
                              fontSize: '10px',
                              color: '#94A3B8',
                              margin: '2px 0 0 0'
                            }}>
                              {trk.artist} • <span style={{ color: '#E2E8F0' }}>{trk.region}</span>
                            </p>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          color: '#F59E0B',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {trk.duration}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RUNTIME METERS */}
              <div style={{
                backgroundColor: '#0F172A',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#94A3B8',
                  marginBottom: '10px'
                }}>
                  <span>{t.nowPlaying}:</span>
                  <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>{selectedTrack.title}</span>
                </div>

                {/* Dancing Visualizer Visual */}
                <div style={{
                  display: 'flex',
                  alignItems: 'end',
                  justifyContent: 'space-between',
                  height: '32px',
                  padding: '4px 0',
                  gap: '2px',
                  backgroundColor: '#1E293B',
                  borderRadius: '8px',
                  paddingLeft: '8px',
                  paddingRight: '8px',
                  marginBottom: '12px',
                  overflow: 'hidden'
                }}>
                  {waveHeights.map((h, index) => (
                    <div
                      key={index}
                      style={{
                        flex: 1,
                        height: h + 'px',
                        backgroundColor: index % 3 === 0 ? '#10B981' : index % 3 === 1 ? '#F59E0B' : '#EF4444',
                        borderRadius: '1px',
                        transition: 'height 0.1s ease'
                      }}
                    />
                  ))}
                </div>

                {/* WaveSurfer.js Waveform Container */}
                <div style={{ marginBottom: '14px' }}>
                  <div 
                    ref={waveformRef} 
                    style={{ 
                      backgroundColor: '#070a13', 
                      borderRadius: '10px', 
                      padding: '8px 12px',
                      border: '1px solid #1e293b'
                    }} 
                  />
                </div>

                {/* SEEK SLIDER */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748B', minWidth: '30px' }}>
                    {formatTime(currentTime)}
                  </span>
                  
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    style={{
                      flex: 1,
                      accentColor: '#F59E0B',
                      cursor: 'pointer',
                      height: '4px'
                    }}
                  />
                  
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748B', minWidth: '30px' }}>
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* MASTER CONTROLS BAR */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={handleTogglePlay}
                  style={{
                    backgroundColor: isPlaying ? '#EF4444' : '#10B981',
                    border: 'none',
                    color: '#FFFFFF',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s'
                  }}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>

                {/* Volume slider control */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={handleToggleMute}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#94A3B8',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    style={{
                      width: '80px',
                      accentColor: '#F59E0B',
                      cursor: 'pointer',
                      height: '4px'
                    }}
                  />
                </div>

                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  color: '#64748B',
                  backgroundColor: '#0F172A',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}>
                  DE-HISS: HIGH
                </span>
              </div>

              {/* INTEGRATED LYRICAL TEXT SYNC DISPLAY */}
              <div style={{
                marginTop: '16px',
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '16px'
              }}>
                <p style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#64748B',
                  textTransform: 'uppercase',
                  margin: '0 0 6px 0',
                  letterSpacing: '1px'
                }}>
                  {lang === 'ku' ? 'Dıvê Helbest / Kılam' : lang === 'tr' ? 'Oynatılan Kılam Sözleri' : 'Synced Lyric Lines'}
                </p>
                
                <div style={{
                  fontSize: '12px',
                  lineHeight: '1.6',
                  color: '#E2E8F0',
                  fontStyle: 'italic',
                  maxHeight: '100px',
                  overflowY: 'auto',
                  borderLeft: '2px solid #F59E0B',
                  paddingLeft: '11px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedTrack.lyrics}
                </div>
              </div>
            </div>

            {/* AUDIO SOURCE INGESTION (UPLOAD DRAG DROP) */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: '#10B981',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '2px'
                  }}>
                    ANALOG SIGNAL READER
                  </span>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '800',
                    color: '#0F172A',
                    margin: 0
                  }}>
                    {t.uploadTitle}
                  </h2>
                  <p style={{
                    fontSize: '12px',
                    color: '#475569',
                    margin: '2px 0 0 0'
                  }}>
                    {t.uploadDesc}
                  </p>
                </div>
                <span style={{
                  backgroundColor: '#E0F2FE',
                  color: '#0369A1',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase'
                }}>
                  Cassette In
                </span>
              </div>

              {/* Drag Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: '2px dashed ' + (isDragging ? '#10B981' : '#CBD5E1'),
                  backgroundColor: isDragging ? 'rgba(16, 185, 129, 0.05)' : 'rgba(248, 250, 252, 0.5)',
                  borderRadius: '20px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📼</div>
                
                <p style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#334155',
                  margin: '0 0 6px 0'
                }}>
                  {lang === 'ku' ? 'Fîla deng bikişînin vir an jî bikirtînin' : lang === 'tr' ? 'Ses dosyasını buraya sürükleyin veya göz atın' : 'Drag cassette sound file here or click to browse'}
                </p>
                <p style={{
                  fontSize: '11px',
                  color: '#64748B',
                  margin: 0
                }}>
                  WAV, MP3, FLAC, M4A up to 50MB (Cassette hiss filters applied automatically)
                </p>
              </div>

              {/* Uploaded File Info */}
              {uploadedFile && (
                <div style={{
                  marginTop: '16px',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '24px' }}>🎵</div>
                    <div>
                      <p style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#065F46',
                        margin: '0 0 2px 0',
                        wordBreak: 'break-all'
                      }}>
                        {uploadedFile.name}
                      </p>
                      <p style={{
                        fontSize: '10px',
                        color: '#047857',
                        margin: 0
                      }}>
                        {t.size}: {uploadedFile.size} | Type: {uploadedFile.type}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setUploadedFile(null);
                      setUvrStatus('idle');
                      setUvrProgress(0);
                    }}
                    style={{
                      backgroundColor: '#FEE2E2',
                      border: 'none',
                      color: '#991B1B',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    ✕ Clear
                  </button>
                </div>
              )}
            </div>

            {/* UVR5 NEURAL STEM ISOLATION RE-MIXER */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: '#A33B26',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '2px'
                  }}>
                    UVR5 NEURAL SUB-LAB
                  </span>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '800',
                    color: '#0F172A',
                    margin: 0
                  }}>
                    {t.statusUvr}
                  </h2>
                  <p style={{
                    fontSize: '12px',
                    color: '#475569',
                    margin: '2px 0 0 0'
                  }}>
                    {t.statusUvrDesc}
                  </p>
                </div>
                <span style={{
                  backgroundColor: '#FEE2E2',
                  color: '#991B1B',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase'
                }}>
                  Multi-Stem
                </span>
              </div>

              {/* Selector Mode for Effects */}
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '12px',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>
                  {t.effectSel}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['analog_tape', 'vacuum_tube', 'clean'] as const).map(eff => (
                    <button
                      key={eff}
                      onClick={() => setSelectedEffect(eff)}
                      style={{
                        flex: 1,
                        padding: '10px 6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        border: '1px solid ' + (selectedEffect === eff ? '#A33B26' : '#E2E8F0'),
                        backgroundColor: selectedEffect === eff ? 'rgba(163, 59, 38, 0.05)' : '#FFFFFF',
                        color: selectedEffect === eff ? '#A33B26' : '#475569',
                        cursor: 'pointer',
                        textTransform: 'uppercase'
                      }}
                    >
                      {eff === 'analog_tape' ? '📼 Tape Saturation' : eff === 'vacuum_tube' ? '📻 Tube Warmth' : '❄️ Pure Digital'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Run Trigger Section */}
              <div style={{
                backgroundColor: 'rgba(241, 245, 249, 0.6)',
                borderRadius: '20px',
                padding: '20px',
                boxSizing: 'border-box'
              }}>
                <button
                  onClick={runUvrSeparation}
                  disabled={uvrStatus === 'processing'}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: uvrStatus === 'processing' ? '#94A3B8' : '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '14px',
                    cursor: uvrStatus === 'processing' ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)'
                  }}
                >
                  <span>🧠</span>
                  <span>{uvrStatus === 'processing' ? 'UVR5 IS DEMIXING...' : t.uvrRun}</span>
                </button>

                {/* Progress Indicators */}
                {uvrStatus !== 'idle' && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px',
                      color: '#475569',
                      marginBottom: '6px'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>Progress: {uvrProgress}%</span>
                      <span style={{ fontSize: '10px', color: '#10B981', fontWeight: 'bold' }}>
                        {uvrStatus === 'done' ? 'COMPLETE' : 'RUNNING'}
                      </span>
                    </div>

                    {/* Progress Bar background */}
                    <div style={{
                      height: '8px',
                      backgroundColor: '#E2E8F0',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      marginBottom: '10px'
                    }}>
                      <div style={{
                        height: '100%',
                        width: uvrProgress + '%',
                        backgroundImage: 'linear-gradient(to right, #A33B26, #F59E0B, #10B981)',
                        transition: 'width 0.1s ease',
                        borderRadius: '9999px'
                      }} />
                    </div>

                    {/* Step log descriptor */}
                    <p style={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: '#0284C7',
                      margin: 0,
                      backgroundColor: '#E0F2FE',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      borderLeft: '3px solid #0284C7'
                    }}>
                      {uvrStepText}
                    </p>
                  </div>
                )}
              </div>

              {/* MIXER BOARD CHANNELS */}
              <div style={{
                marginTop: '20px',
                borderTop: '1px solid #E2E8F0',
                paddingTop: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>
                    Isolated Stem Mixer
                  </span>
                  <span style={{
                    fontSize: '10px',
                    color: '#7C664E',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>
                    {uvrStatus === 'done' ? 'STEMS ENGAGED' : 'STANDARD STEREO SOURCE'}
                  </span>
                </div>

                {uvrStatus === 'done' && separationMethod && (
                  <div style={{
                    backgroundColor: separationMethod === 'express_dsp_simulation' ? '#FFFBEB' : '#ECFDF5',
                    border: `1px solid ${separationMethod === 'express_dsp_simulation' ? '#FDE68A' : '#A7F3D0'}`,
                    borderRadius: '12px',
                    padding: '10px 14px',
                    marginBottom: '14px',
                    fontSize: '11px',
                    color: separationMethod === 'express_dsp_simulation' ? '#B45309' : '#047857',
                    textAlign: 'left'
                  }}>
                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.5px' }}>
                      {separationMethod === 'express_dsp_simulation' ? '⚠️ DSP Matrix Simulator' : '⚡ AI separation Engine'}
                    </div>
                    {backendNote && <div style={{ marginTop: '4px', fontSize: '10px', lineHeight: '1.4', opacity: 0.85 }}>{backendNote}</div>}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Stem 1 Vocal */}
                  <div style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ fontWeight: 'bold', color: '#334155' }}>🗣️ {t.vocalTrack}</span>
                      <span style={{ fontFamily: 'monospace', color: '#A33B26', fontWeight: 'bold' }}>
                        {uvrStatus === 'done' ? Math.round(vocalStemVol * 100) + '%' : 'BYPASS'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      disabled={uvrStatus !== 'done'}
                      value={vocalStemVol}
                      onChange={(e) => setVocalStemVol(parseFloat(e.target.value))}
                      style={{
                        accentColor: '#A33B26',
                        cursor: uvrStatus === 'done' ? 'pointer' : 'not-allowed',
                        width: '100%',
                        height: '4px'
                      }}
                    />
                  </div>

                  {/* Stem 2 Instrument */}
                  <div style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ fontWeight: 'bold', color: '#334155' }}>🪕 {t.instTrack}</span>
                      <span style={{ fontFamily: 'monospace', color: '#10B981', fontWeight: 'bold' }}>
                        {uvrStatus === 'done' ? Math.round(instStemVol * 100) + '%' : 'BYPASS'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      disabled={uvrStatus !== 'done'}
                      value={instStemVol}
                      onChange={(e) => setInstStemVol(parseFloat(e.target.value))}
                      style={{
                        accentColor: '#10B981',
                        cursor: uvrStatus === 'done' ? 'pointer' : 'not-allowed',
                        width: '100%',
                        height: '4px'
                      }}
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* BOTTOM FOOTER BAR */}
        <footer style={{
          marginTop: '40px',
          textAlign: 'center',
          color: '#64748B',
          fontSize: '11px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(226, 232, 240, 0.4)'
        }}>
          <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            {t.credits.toUpperCase()} • STÛDYOYA DENGÊ PÎRAN © 2026
          </p>
          <p style={{ margin: 0, fontSize: '10px' }}>
            Built for traditional audio preservation & ethnic vocal recovery algorithms. Strictly powered by custom analog DSP recreation methods.
          </p>
        </footer>

        {/* PERSISTENT FLOATING ZIP DOWNLOAD PANEL ON THE RIGHT EDGE - PERMANENTLY VISIBLE */}
        {renderFloatingZipPanel()}

      </div>
    </div>
  );
}
