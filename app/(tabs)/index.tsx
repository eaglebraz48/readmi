import readmiFace from '../../assets/readmi-face.png';
import ReadmiChat from '../../components/ReadmiChat';
import { useEffect, useRef, useState } from 'react';
import readmiBgPeople from '../../assets/readmi-bg-people.png';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import Purchases from 'react-native-purchases';
import { BILLING } from '../../constants/billing';


const API_BASE_URL = 'https://readmi-opal.vercel.app/api';
import {
  Alert,
  Animated,
  Easing,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
type Lang = 'en' | 'pt' | 'es' | 'fr';
type Mode = 'interview' | 'date' | 'social' | 'party' | 'conversation';
type ReadResult = {
  overallRead: string;
  strength: string;
  improve: string;
  tryThis: string;
};
const STRINGS: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    subtitleStart: string;
    subtitleHighlight: string;
    allowCamera: string;
    cameraPrompt: string;
    loading: string;
    startRead: string;
    scanning: string;
    holdStill: string;
    overallRead: string;
    strength: string;
    improve: string;
    tryThis: string;
    retry: string;
    newRead: string;
    captureFailed: string;
    tryAgain: string;
    cameraError: string;
    couldNotTakePicture: string;
    modes: Record<Mode, string>;
    genericError: string;
    couldNotAnalyze: string;
    webCameraNotFound: string;
    canvasNotAvailable: string;
    couldNotCreateImage: string;
    freeReadsLeft: string;
    plusTitle: string;
    plusBody: string;
    plusCta: string;
    plusLater: string;
    comingSoon: string;
    continueFree: string;
weeklyPlan: string;
monthlyPlan: string;

    contextLabel: string;
    cameraReady: string;
    cameraHint: string;
    goDeeper: string;
    readingYou: string;
    splashTagLeft: string;
    splashTagRight: string;
  }
> = {
  en: {
    title: 'READMI',
    subtitle: "You don't see this. But everyone else does.",
    subtitleStart: "What you don't see — ",
    subtitleHighlight: 'everyone else already reads',
    cameraPrompt: 'No filters. No guessing. Just what you really give off.',
    allowCamera: '◉ READ MY FACE',
    loading: '',
    startRead: 'See what they see',
    scanning: '',
    holdStill: '',
    overallRead: 'OVERALL READ',
    strength: 'WHAT HELPS',
    improve: 'WHAT TO IMPROVE',
    tryThis: 'TRY THIS',
    retry: 'Adjusted. Analyze again',
    newRead: 'New read',
    captureFailed: 'Capture failed',
    tryAgain: 'Try again.',
    cameraError: 'Camera error',
    couldNotTakePicture: 'Could not take picture.',
    genericError: 'Error',
    couldNotAnalyze: 'Could not analyze image.',
    webCameraNotFound: 'Web camera video not found.',
    canvasNotAvailable: 'Canvas not available.',
    couldNotCreateImage: 'Could not create image data.',
    freeReadsLeft: 'free reads',
    plusTitle: 'Want more direction?',
    plusBody: 'Choose premium for camera + chat guidance, or continue free with camera only.',
weeklyPlan: 'Weekly',
monthlyPlan: 'Monthly',

    plusCta: 'Continue Premium',
    plusLater: 'Maybe later',
    comingSoon: 'Coming soon',
    continueFree: 'Continue free',
    contextLabel: 'Reading context',
    cameraReady: 'READY',
    cameraHint: 'Takes 3 seconds',
    goDeeper: 'Go deeper',
    readingYou: 'Analyzing your face…',
    splashTagLeft: 'Controlled · Reserved',
    splashTagRight: 'First impression',
    modes: {
      interview: 'Interview',
      date: 'Date',
      social: 'Social Media',
      party: 'Party / Event',
      conversation: 'Hard Conversation',
    },
  },
  pt: {
    title: 'READMI',
    subtitle: 'Você não vê isso. Mas todo mundo vê.',
    subtitleStart: 'O que você não vê — ',
    subtitleHighlight: 'todo mundo já lê',
    cameraPrompt: 'Sem filtro. Sem adivinhação. Só o que você realmente transmite.',
    allowCamera: '◉ LEIA O MEU ROSTO',
    loading: '',
    startRead: 'Veja o que eles veem',
    scanning: '',
    holdStill: '',
    overallRead: 'LEITURA GERAL',
    strength: 'O QUE AJUDA',
    improve: 'O QUE MELHORAR',
    tryThis: 'TENTE ISSO',
    retry: 'Ajustei. Analisar de novo',
    newRead: 'Nova leitura',
    captureFailed: 'Falha na captura',
    tryAgain: 'Tente novamente.',
    cameraError: 'Erro da câmera',
    couldNotTakePicture: 'Não foi possível tirar a foto.',
    genericError: 'Erro',
    couldNotAnalyze: 'Não foi possível analisar a imagem.',
    webCameraNotFound: 'Vídeo da câmera web não encontrado.',
    canvasNotAvailable: 'Canvas não disponível.',
    couldNotCreateImage: 'Não foi possível criar os dados da imagem.',
    freeReadsLeft: 'leituras grátis',
    plusTitle: 'Quer mais direção?',
    plusBody: 'Escolha premium para câmera + chat com orientação, ou continue grátis só com a câmera.',
weeklyPlan: 'Semanal',
monthlyPlan: 'Mensal',

    plusCta: 'Continuar no premium',
    plusLater: 'Agora não',
    comingSoon: 'Em breve',
    continueFree: 'Continuar grátis',
    contextLabel: 'Contexto da leitura',
    cameraReady: 'PRONTA',
    cameraHint: 'Leva 3 segundos',
    goDeeper: 'Ver mais',
    readingYou: 'Analisando seu rosto…',
    splashTagLeft: 'Controlado · Fechado',
    splashTagRight: 'Primeira impressão',
    modes: {
      interview: 'Entrevista',
      date: 'Encontro',
      social: 'Mídia social',
      party: 'Festa / Evento',
      conversation: 'Conversa difícil',
    },
  },
  es: {
    title: 'READMI',
    subtitle: 'Tú no ves esto. Pero todos los demás sí.',
    subtitleStart: 'Lo que no ves — ',
    subtitleHighlight: 'todos ya lo leen',
    cameraPrompt: 'Sin filtros. Sin suposiciones. Solo lo que realmente transmites.',
    allowCamera: '◉ LEE MI ROSTRO',
    loading: '',
    startRead: 'Mira lo que ellos ven',
    scanning: '',
    holdStill: '',
    overallRead: 'LECTURA GENERAL',
    strength: 'LO QUE AYUDA',
    improve: 'LO QUE MEJORAR',
    tryThis: 'PRUEBA ESTO',
    retry: 'Ajusté. Analizar otra vez',
    newRead: 'Nueva lectura',
    captureFailed: 'Falló la captura',
    tryAgain: 'Inténtalo de nuevo.',
    cameraError: 'Error de cámara',
    couldNotTakePicture: 'No se pudo tomar la foto.',
    genericError: 'Error',
    couldNotAnalyze: 'No se pudo analizar la imagen.',
    webCameraNotFound: 'No se encontró el video de la cámara web.',
    canvasNotAvailable: 'Canvas no disponible.',
    couldNotCreateImage: 'No se pudieron crear los datos de la imagen.',
    freeReadsLeft: 'lecturas gratis',
    plusTitle: '¿Quieres más dirección?',
    plusBody: 'Elige premium para cámara + chat con guía, o sigue gratis solo con la cámara.',
weeklyPlan: 'Semanal',
monthlyPlan: 'Mensual',

    plusCta: 'Continuar premium',
    plusLater: 'Ahora no',
    comingSoon: 'Próximamente',
    continueFree: 'Continuar gratis',
    contextLabel: 'Contexto de lectura',
    cameraReady: 'LISTA',
    cameraHint: 'Toma 3 segundos',
    goDeeper: 'Ver más',
    readingYou: 'Analizando tu rostro…',
    splashTagLeft: 'Controlado · Cerrado',
    splashTagRight: 'Primera impresión',
    modes: {
      interview: 'Entrevista',
      date: 'Cita',
      social: 'Redes sociales',
      party: 'Fiesta / Evento',
      conversation: 'Conversación difícil',
    },
  },
  fr: {
    title: 'READMI',
    subtitle: 'Tu ne vois pas ça. Mais tout le monde le voit.',
    subtitleStart: 'Ce que tu ne vois pas — ',
    subtitleHighlight: 'tout le monde le lit déjà',
    cameraPrompt: 'Sans filtre. Sans supposition. Juste ce que tu dégages vraiment.',
    allowCamera: '◉ LIS MON VISAGE',
    loading: '',
    startRead: "Voyez ce qu'ils voient",
    scanning: '',
    holdStill: '',
    overallRead: 'LECTURE GÉNÉRALE',
    strength: 'CE QUI AIDE',
    improve: 'À AMÉLIORER',
    tryThis: 'ESSAYEZ ÇA',
    retry: "J'ai ajusté. Réanalyser",
    newRead: 'Nouvelle lecture',
    captureFailed: 'Échec de la capture',
    tryAgain: 'Réessayez.',
    cameraError: 'Erreur de caméra',
    couldNotTakePicture: 'Impossible de prendre la photo.',
    genericError: 'Erreur',
    couldNotAnalyze: "Impossible d'analyser l'image.",
    webCameraNotFound: 'Vidéo de la caméra web introuvable.',
    canvasNotAvailable: 'Canvas non disponible.',
    couldNotCreateImage: "Impossible de créer les données de l'image.",
    freeReadsLeft: 'lectures gratuites',
    plusTitle: 'Tu veux plus de direction ?',
    plusBody: 'Choisis premium pour caméra + chat avec guidance, ou continue gratuitement avec la caméra seulement.',

weeklyPlan: 'Hebdomadaire',
monthlyPlan: 'Mensuel',
    plusCta: 'Continuer en premium',
    plusLater: 'Plus tard',
    comingSoon: 'Bientôt disponible',
    continueFree: 'Continuer gratuitement',
    contextLabel: 'Contexte de lecture',
    cameraReady: 'PRÊTE',
    cameraHint: '3 secondes',
    goDeeper: 'Voir plus',
    readingYou: 'Analyse de votre visage…',
    splashTagLeft: 'Contrôlé · Fermé',
    splashTagRight: 'Première impression',
    modes: {
      interview: 'Entretien',
      date: 'Rendez-vous',
      social: 'Réseaux sociaux',
      party: 'Fête / Événement',
      conversation: 'Conversation difficile',
    },
  },
};
export default function HomeScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const resultScrollRef = useRef<ScrollView | null>(null);
  const player = useAudioPlayer(null);
  const titlePulse = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const [showChatHint, setShowChatHint] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [result, setResult] = useState<ReadResult | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [mode, setMode] = useState<Mode>('interview');


  const [isScanning, setIsScanning] = useState(false);
  const [freeReadsUsed, setFreeReadsUsed] = useState(0);
  const [showChoicePopup, setShowChoicePopup] = useState(false);
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [freeUnlocked, setFreeUnlocked] = useState(false);
  const [premiumRetryCount, setPremiumRetryCount] = useState(0);
  const [previousPremiumResult, setPreviousPremiumResult] = useState<ReadResult | null>(null);
  const t = STRINGS[lang];
  const modeList: Mode[] = ['interview', 'date', 'social', 'party', 'conversation'];

  // ----------------------------------------------------------------------
  // FIX: configure iOS/Android audio so TTS plays even when phone is on silent.
  // This is what was missing — without it, expo-audio plays to a muted route on iOS.
  // ----------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
          interruptionMode: 'duckOthers',
          allowsRecording: false,
          shouldRouteThroughEarpiece: false,
        });
      } catch (e) {
        console.log('READMI audio mode setup error:', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      try {
        Purchases.configure({ apiKey: BILLING.androidApiKey });
      } catch (e) {
        console.log('RevenueCat configure error:', e);
      }
    }
  }, []);


  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(titlePulse, {
          toValue: 1,
          duration: 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(titlePulse, {
          toValue: 0,
          duration: 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [titlePulse]);
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scanAnim]);
  const titleOpacity = titlePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });
  const titleScale = titlePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });
  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-55, 55],
  });
  useEffect(() => {
    if (photoUri && result && premiumUnlocked) {
      setShowChatHint(true);
      const timer = setTimeout(() => {
        resultScrollRef.current?.scrollToEnd({ animated: true });
      }, 450);
      const hideTimer = setTimeout(() => {
        setShowChatHint(false);
      }, 3200);
      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [photoUri, result, premiumUnlocked]);
  useEffect(() => {
    if (!permission?.granted) {
      setCameraReady(false);
    }
  }, [permission?.granted]);
  function firstSentence(text: string): string {
    const cleaned = (text || '').replace(/^🟢\s*|^🟡\s*/g, '').trim();
    const match = cleaned.match(/.*?[.!?](\s|$)/);
    return (match ? match[0] : cleaned).trim();
  }
  function isGreenRead(result: ReadResult): boolean {
    const text = `${result?.overallRead || ''} ${result?.tryThis || ''}`.toLowerCase();
    return (
      text.includes('wow. that works') ||
      text.includes('wow, that works') ||
      text.includes('you got it now') ||
      text.includes('this is the one') ||
      text.includes('go with this') ||
      text.includes('use this version') ||
      text.includes('you are ready') ||
      text.includes("you're ready") ||
      text.includes('come back here and tell me how it went') ||
      text.includes('come back and tell me how it went')
    );
  }
  function getReturnHook(lang: Lang, mode: Mode): string {
    if (lang === 'pt') {
      if (mode === 'interview') return 'Boa sorte na entrevista. Depois volta aqui e me conta como foi.';
      if (mode === 'date') return 'Vai curtir o encontro. Depois volta aqui e me conta como foi.';
      if (mode === 'party') return 'Vai curtir a festa. Depois volta aqui e me conta como foi.';
      if (mode === 'conversation') return 'Vai ter essa conversa. Depois volta aqui e me conta como foi.';
      return 'Vai nessa. Depois volta aqui e me conta como foi.';
    }
    if (lang === 'es') {
      if (mode === 'interview') return 'Que te vaya muy bien en la entrevista. Luego vuelve y cuéntame cómo te fue.';
      if (mode === 'date') return 'Disfruta la cita. Luego vuelve y cuéntame cómo te fue.';
      if (mode === 'party') return 'Disfruta la fiesta. Luego vuelve y cuéntame cómo te fue.';
      if (mode === 'conversation') return 'Ve a tener esa conversación. Luego vuelve y cuéntame cómo te fue.';
      return 'Ve con eso. Luego vuelve y cuéntame cómo te fue.';
    }
    if (lang === 'fr') {
      if (mode === 'interview') return "Bonne chance pour l'entretien. Reviens ensuite me dire comment ça s'est passé.";
      if (mode === 'date') return 'Profite bien du rendez-vous. Reviens ensuite me dire comment ça s’est passé.';
      if (mode === 'party') return 'Profite bien de la fête. Reviens ensuite me dire comment ça s’est passé.';
      if (mode === 'conversation') return 'Va avoir cette conversation. Reviens ensuite me dire comment ça s’est passé.';
      return 'Vas-y. Reviens ensuite me dire comment ça s’est passé.';
    }
    if (mode === 'interview') return 'Have a great interview. Come back here after and tell me how it went.';
    if (mode === 'date') return 'Enjoy your date. Come back here after and tell me how it went.';
    if (mode === 'party') return 'Enjoy the party. Come back here after and tell me how it went.';
    if (mode === 'conversation') return 'Go have that conversation. Come back here after and tell me how it went.';
    return 'Go enjoy it. Come back here after and tell me how it went.';
  }
  async function speakReadResult(result: ReadResult, lang: Lang) {
    try {
      let textToSpeak = '';
      if (isGreenRead(result)) {
        const returnHook = getReturnHook(lang, mode);
        textToSpeak = `${result.overallRead || ''} ${result.tryThis || ''} ${returnHook}`.trim();
      } else {
        const firstOverall = firstSentence(result.overallRead);
        const secondLine = firstSentence(result.improve || result.tryThis);
        textToSpeak = `${firstOverall} ${secondLine}`.trim();
      }
      if (!textToSpeak) {
        console.log('READMI tts: empty textToSpeak, skipping.');
        return;
      }

      // WEB — unchanged, this path already works.
      if (Platform.OS === 'web') {
        const res = await fetch(`${API_BASE_URL}/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToSpeak, lang }),
        });
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => setTimeout(() => URL.revokeObjectURL(url), 300);
        await audio.play();
        return;
      }

      // MOBILE — download the MP3 from Vercel and play with expo-audio.
      // FIX: cache-bust the filename so a stale file never gets reused.
      const fileUri = `${FileSystem.cacheDirectory}readmi_tts_${Date.now()}.mp3`;
      const ttsUrl =
        `${API_BASE_URL}/tts?text=${encodeURIComponent(textToSpeak)}&lang=${encodeURIComponent(lang)}`;

      const downloadRes = await FileSystem.downloadAsync(ttsUrl, fileUri, {
        headers: { Accept: 'audio/mpeg' },
      });

      if (downloadRes.status !== 200) {
        // FIX: surface the real failure instead of swallowing it
        console.error('READMI tts download failed:', downloadRes.status, downloadRes.uri);
        Alert.alert(
          'TTS error',
          `Server returned ${downloadRes.status}. Check ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in Vercel env vars.`
        );
        return;
      }

      // FIX: object form, not bare string — more reliable across platforms / SDK versions
      player.replace({ uri: downloadRes.uri });

      // FIX: wait for the source to load before calling play(),
      // otherwise the very first call after a fresh read can silently no-op.
      const sub = player.addListener('playbackStatusUpdate', (status: any) => {
        if (status?.isLoaded) {
          try {
            player.play();
          } catch (e) {
            console.log('READMI tts play error:', e);
          }
          sub.remove();
        }
      });

      // Safety net: if the status listener never fires, still try to play after a tick.
      setTimeout(() => {
        try { player.play(); } catch {}
      }, 400);
    } catch (err) {
      console.error('speakReadResult error:', err);
    }
  }
  const finishRead = async () => {
    try {
      if (!cameraRef.current) {
        setIsScanning(false);
        Alert.alert(t.cameraError, t.tryAgain);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        skipProcessing: Platform.OS === 'android',
      });
      if (!photo?.uri) {
        setIsScanning(false);
        Alert.alert(t.captureFailed, t.tryAgain);
        return;
      }
      let imageBase64 = photo.base64 ?? '';
      if (Platform.OS === 'web') {
        const video = document.querySelector('video') as HTMLVideoElement | null;
        if (!video) {
          setIsScanning(false);
          Alert.alert(t.genericError, t.webCameraNotFound);
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 1280;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsScanning(false);
          Alert.alert(t.genericError, t.canvasNotAvailable);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1] || '';
      }
      if (!imageBase64) {
        setIsScanning(false);
        Alert.alert(t.genericError, t.couldNotCreateImage);
        return;
      }
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: 'image/jpeg',
          mode,
          lang,
          previousResult: premiumUnlocked ? previousPremiumResult : null,
          premiumRetryCount: premiumUnlocked ? premiumRetryCount : 0,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setIsScanning(false);
        Alert.alert(t.genericError, data?.error || t.couldNotAnalyze);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setPhotoUri(photo.uri);
      setResult(data);
      setTimeout(() => {
        speakReadResult(data, lang);
      }, 250);
      if (premiumUnlocked) {
        setPremiumRetryCount((prev) => prev + 1);
        setPreviousPremiumResult(data);
      }
      setFreeReadsUsed((prev) => prev + 1);
      setIsScanning(false);
    } catch (err: any) {
      console.error('READMI camera capture error:', err);
      setIsScanning(false);
      Alert.alert(
        t.cameraError,
        err?.message
          ? `${t.couldNotTakePicture}\n\n${err.message}`
          : t.couldNotTakePicture
      );
    }
  };
  const startRead = async () => {
    if (isScanning) return;
    if (!cameraReady || !cameraRef.current) {
      Alert.alert(t.cameraError, t.tryAgain);
      return;
    }
    if (freeReadsUsed >= 2 && !premiumUnlocked && !freeUnlocked) {
      setShowChoicePopup(true);
      return;
    }
    setIsScanning(true);
    await finishRead();
  };
  const handleChoosePremium = async (plan: 'weekly' | 'monthly') => {
  try {
    setShowChoicePopup(false);

    const offerings = await Purchases.getOfferings();
    const current = offerings.current;

    if (!current || !current.availablePackages.length) {
      Alert.alert('Premium unavailable', 'No subscription package found.');
      return;
    }

    const wantedId = plan === 'weekly' ? '$rc_weekly' : '$rc_monthly';

    const selectedPackage =
      current.availablePackages.find((pkg) => pkg.identifier === wantedId) ||
      current.availablePackages.find((pkg) =>
        plan === 'weekly'
          ? pkg.product.identifier.toLowerCase().includes('weekly')
          : pkg.product.identifier.toLowerCase().includes('monthly')
      );

    if (!selectedPackage) {
      Alert.alert('Premium unavailable', `No ${plan} package found.`);
      return;
    }

    const purchaseResult = await Purchases.purchasePackage(selectedPackage);
    const isPremiumActive =
      purchaseResult.customerInfo.entitlements.active[BILLING.entitlementId];

    if (!isPremiumActive) {
      Alert.alert('Purchase not active', 'Premium entitlement was not activated.');
      return;
    }

    setPremiumUnlocked(true);
    setIsScanning(true);
    await finishRead();
  } catch (e: any) {
    if (!e?.userCancelled) {
      Alert.alert('Purchase error', e?.message || 'Could not complete purchase.');
    }
  }
};
  const handleContinueFree = async () => {
    setShowChoicePopup(false);
    setFreeUnlocked(true);
    setIsScanning(true);
    await finishRead();
  };
  const handleAdjustedRetry = () => {
    setPhotoUri(null);
    setResult(null);
    setIsScanning(false);
    setShowChatHint(false);
  };
  const handleNewRead = () => {
    setPhotoUri(null);
    setResult(null);
    setIsScanning(false);
    setShowChatHint(false);
    setPremiumRetryCount(0);
    setPreviousPremiumResult(null);
  };
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Ionicons name="eye-outline" size={14} color="#fff" />
            </View>
            <Text style={styles.title}>{t.title}</Text>
          </View>
          <Text style={styles.brandTag}>Facial Intelligence</Text>
        </View>
        <View style={styles.langRow}>
          {(['en', 'pt', 'es', 'fr'] as Lang[]).map((code) => (
            <LangButton key={code} code={code} current={lang} onPress={setLang} />
          ))}
        </View>
      </View>
      <View style={styles.contextBlock}>
        <Text style={styles.contextLabel}>{t.contextLabel}</Text>
        <View style={styles.modeRow}>
          {modeList.map((item) => (
            <ModeButton
              key={item}
              label={t.modes[item]}
              active={mode === item}
              onPress={() => setMode(item)}
            />
          ))}
        </View>
      </View>
    </View>
  );
  const renderChoicePopup = () =>
  showChoicePopup ? (
    <View style={styles.popupOverlay}>
      <View style={styles.popupCard}>
        <Text style={styles.popupTitle}>{t.plusTitle}</Text>
        <Text style={styles.popupBody}>{t.plusBody}</Text>

        <Pressable style={styles.primaryButton} onPress={() => handleChoosePremium('weekly')}>
          <Text style={styles.primaryButtonText}>{t.weeklyPlan}</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => handleChoosePremium('monthly')}>
          <Text style={styles.secondaryButtonText}>{t.monthlyPlan}</Text>
        </Pressable>

        <Pressable style={styles.ghostButton} onPress={handleContinueFree}>
          <Text style={styles.ghostButtonText}>{t.continueFree}</Text>
        </Pressable>
      </View>
    </View>
  ) : null;
  if (!permission) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.loadingText}>{t.loading}</Text>
      </SafeAreaView>
    );
  }
  if (!permission.granted) {
    return (
      <ImageBackground
        source={readmiBgPeople}
        style={styles.splashBg}
        imageStyle={styles.splashBgImage}
        resizeMode="cover"
      >
        <View style={styles.splashOverlay}>
          <SafeAreaView style={styles.center}>
            <View style={styles.splashGraphic}>
              <View style={styles.splashRingOuter} />
              <View style={styles.splashRingInner} />
              <View style={styles.splashIconCenter}>
                <Image source={readmiFace} style={styles.faceImage} />
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.splashScanLine,
                    {
                      transform: [{ translateY: scanTranslateY }],
                    },
                  ]}
                />
              </View>
              <View style={[styles.splashCorner, styles.splashCornerTL]} />
              <View style={[styles.splashCorner, styles.splashCornerTR]} />
              <View style={[styles.splashCorner, styles.splashCornerBL]} />
              <View style={[styles.splashCorner, styles.splashCornerBR]} />
              <View style={styles.splashTagLeft}>
                <Text style={styles.splashTagLabel}>DETECTED</Text>
                <Text style={styles.splashTagValue}>{t.splashTagLeft}</Text>
              </View>
              <View style={styles.splashTagRight}>
                <View style={styles.splashLiveRow}>
                  <View style={styles.splashLiveDot} />
                  <Text style={styles.splashLiveText}>LIVE</Text>
                </View>
                <Text style={styles.splashTagValue}>{t.splashTagRight}</Text>
              </View>
            </View>
            <Animated.Text
              style={[
                styles.splashTitle,
                {
                  opacity: titleOpacity,
                  transform: [{ scale: titleScale }],
                },
              ]}
            >
              {t.title}
            </Animated.Text>
            <Text style={styles.splashSubtitle}>
              {t.subtitleStart}
              <Text style={styles.highlight}>{t.subtitleHighlight}</Text>
            </Text>
            <Text style={styles.splashHint}>{t.cameraPrompt}</Text>
            <View style={[styles.langRow, { marginBottom: 28 }]}>
              {(['en', 'pt', 'es', 'fr'] as Lang[]).map((code) => (
                <LangButton
                  key={code}
                  code={code}
                  current={lang}
                  onPress={setLang}
                />
              ))}
            </View>
            <Pressable style={styles.primaryButton} onPress={requestPermission}>
              <Text style={styles.primaryButtonText}>{t.allowCamera}</Text>
            </Pressable>
            <Text style={styles.splashSpeed}>{t.cameraHint}</Text>
            <Text style={styles.splashFooter}>
              © 2026 Arison8, LLC — READMI. All rights reserved.
            </Text>
          </SafeAreaView>
        </View>
      </ImageBackground>
    );
  }
  if (photoUri && result) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView
  ref={resultScrollRef}
  contentContainerStyle={styles.scrollContent}
  showsVerticalScrollIndicator
  bounces
  keyboardShouldPersistTaps="handled"
>
          {renderHeader()}

          <View style={styles.resultCard}>
            <ResultRow label={t.overallRead} value={result.overallRead} accent />
            <View style={styles.divider} />
            <ResultRow label={t.strength} value={result.strength} />
            <View style={styles.divider} />
            <ResultRow label={t.improve} value={result.improve} />
            <View style={styles.divider} />
            <ResultRow label={t.tryThis} value={result.tryThis} />
          </View>
          {isGreenRead(result) ? (
            <View style={styles.returnHookCard}>
              <Text style={styles.returnHookText}>{getReturnHook(lang, mode)}</Text>
            </View>
          ) : null}
          {premiumUnlocked ? (
            <ReadmiChat lang={lang} mode={mode} result={result} />
          ) : null}
          <View style={styles.resultButtons}>
            <Pressable style={styles.secondaryButton} onPress={handleAdjustedRetry}>
              <Text style={styles.secondaryButtonText}>{t.retry}</Text>
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={handleNewRead}>
              <Text style={styles.ghostButtonText}>{t.newRead}</Text>
            </Pressable>
          </View>
        </ScrollView>
        {showChatHint ? (
          <View style={styles.chatToast}>
            <Text style={styles.chatToastText}>
              READMI Plus ativado • role para perguntar ↓
            </Text>
          </View>
        ) : null}
        {renderChoicePopup()}
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator bounces>
        {renderHeader()}
        <View style={styles.cameraHintRow}>
          <Text style={styles.cameraHintText}>{t.cameraHint}</Text>
          <View style={styles.readsBadge}>
            <Text style={styles.readsBadgeText}>
              {Math.max(0, 2 - freeReadsUsed)} {t.freeReadsLeft}
            </Text>
          </View>
        </View>
        <View style={styles.cameraWrap}>
          <View style={{ height: 420, overflow: 'hidden' }}>
            <CameraView
              ref={cameraRef}
              style={{ width: '100%', height: 420 }}
              facing="front"
              onCameraReady={() => setCameraReady(true)}
            />
          </View>
          <Pressable
            style={[
              styles.floatingCta,
              isScanning && styles.floatingCtaScanning,
              isScanning && styles.primaryButtonDisabled,
            ]}
            onPress={startRead}
            disabled={isScanning}
          >
            <Text style={[styles.floatingCtaText, isScanning && styles.floatingCtaTextScanning]}>
              {isScanning ? t.readingYou : t.startRead}
            </Text>
          </Pressable>
          <View style={styles.cameraBar}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>
              {cameraReady ? t.cameraReady : t.loading || '...'}
            </Text>
          </View>
        </View>
      </ScrollView>
      {renderChoicePopup()}
    </SafeAreaView>
  );
}
function LangButton({
  code,
  current,
  onPress,
}: {
  code: Lang;
  current: Lang;
  onPress: (l: Lang) => void;
}) {
  const active = current === code;
  return (
    <Pressable onPress={() => onPress(code)} style={[styles.langButton, active && styles.langButtonActive]}>
      <Text style={[styles.langText, active && styles.langTextActive]}>{code.toUpperCase()}</Text>
    </Pressable>
  );
}
function ModeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.modeButton, active && styles.modeButtonActive]}>
      <Text style={[styles.modeText, active && styles.modeTextActive]}>{label}</Text>
    </Pressable>
  );
}
function ResultRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  const isTryThis =
    label === 'TRY THIS' ||
    label === 'TENTE ISSO' ||
    label === 'PRUEBA ESTO' ||
    label === 'ESSAYEZ ÇA';
  const lower = (value || '').toLowerCase();
  const isGo =
    lower.includes('wow. that works') ||
    lower.includes('wow, that works') ||
    lower.includes('you got it now') ||
    lower.includes('this is the one') ||
    lower.includes('go with this') ||
    lower.includes('use this version') ||
    lower.includes('you are ready') ||
    lower.includes("you're ready") ||
    lower.includes('come back here and tell me how it went') ||
    lower.includes('come back and tell me how it went');
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text
        style={[
          styles.resultValue,
          accent && styles.resultValueAccent,
          isTryThis && (isGo ? styles.resultGo : styles.resultAdjust),
        ]}
      >
        {isTryThis && isGo ? '🟢 ' : isTryThis ? '🟡 ' : ''}
        {value}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0e1118' },
  scrollContent: { padding: 18, paddingBottom: 36 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  loadingText: { color: 'rgba(255,255,255,0.4)', fontSize: 15 },
  splashGraphic: {
    width: 220,
    height: 220,
    marginBottom: 36,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashRingOuter: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(127,119,221,0.2)',
  },
  splashRingInner: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 0.5,
    borderColor: 'rgba(127,119,221,0.12)',
  },
  splashIconCenter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(127,119,221,0.03)',
    borderWidth: 0.5,
    borderColor: 'rgba(127,119,221,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  faceImage: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    opacity: 0.95,
  },
  splashCorner: { position: 'absolute', width: 16, height: 16 },
  splashCornerTL: {
    top: 12,
    left: 12,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#5DCAA5',
    borderTopLeftRadius: 3,
  },
  splashCornerTR: {
    top: 12,
    right: 12,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#5DCAA5',
    borderTopRightRadius: 3,
  },
  splashCornerBL: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#5DCAA5',
    borderBottomLeftRadius: 3,
  },
  splashCornerBR: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#5DCAA5',
    borderBottomRightRadius: 3,
  },
  splashScanLine: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    height: 0.5,
    borderRadius: 999,
    backgroundColor: 'rgba(139,124,255,0.9)',
    shadowColor: '#8B7CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
  },
  splashTagLeft: {
    position: 'absolute',
    left: -140,
    top: 65,
    backgroundColor: '#13161e',
    borderWidth: 0.5,
    borderColor: 'rgba(127,119,221,0.3)',
    borderRadius: 10,
    padding: 9,
    minWidth: 128,
  },
  splashTagRight: {
    position: 'absolute',
    right: -140,
    top: 95,
    backgroundColor: '#13161e',
    borderWidth: 0.5,
    borderColor: 'rgba(93,202,165,0.3)',
    borderRadius: 10,
    padding: 9,
    minWidth: 128,
  },
  splashTagLabel: {
    color: '#7F77DD',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 3,
  },
  splashTagValue: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '500',
  },
  splashLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  splashLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#5DCAA5',
  },
  splashLiveText: {
    color: '#5DCAA5',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  splashTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(157,140,255,0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  splashSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  highlight: {
    color: '#9D8CFF',
    fontWeight: '700',
  },
  splashHint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 18,
  },
  splashSpeed: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  splashFooter: {
    color: 'rgba(255,255,255,0.22)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 18,
  },
  header: { marginBottom: 16 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  splashBg: {
    flex: 1,
    backgroundColor: '#0e1118',
  },
  splashBgImage: {
    opacity: 0.48,
  },
  splashOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8,10,18,0.42)',
  },
  brand: { flexDirection: 'column', gap: 3 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#7F77DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  brandTag: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingLeft: 36,
  },
  langRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  langButton: {
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  langButtonActive: {
    backgroundColor: '#7F77DD',
    borderColor: '#7F77DD',
  },
  langText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  langTextActive: { color: '#ffffff' },
  contextBlock: { gap: 8 },
  contextLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  modeButton: {
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  modeButtonActive: {
    borderColor: '#5DCAA5',
    backgroundColor: 'rgba(93,202,165,0.1)',
  },
  modeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  modeTextActive: {
    color: '#5DCAA5',
    fontWeight: '600',
  },
  cameraHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cameraHintText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    flex: 1,
    marginRight: 10,
  },
  readsBadge: {
    backgroundColor: 'rgba(127,119,221,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(127,119,221,0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  readsBadgeText: {
    color: '#7F77DD',
    fontSize: 11,
    fontWeight: '600',
  },
  cameraWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#13161e',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.07)',
    height: 420,
    maxHeight: 420,
    position: 'relative',
  },
  cameraBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    paddingHorizontal: 16,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#5DCAA5',
  },
  liveLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  floatingCta: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 44,
    backgroundColor: '#7F77DD',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 14,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCtaText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  floatingCtaScanning: { backgroundColor: '#FACC15' },
  floatingCtaTextScanning: { color: '#111827' },
  primaryButton: {
    backgroundColor: '#7F77DD',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 28,
    minWidth: 240,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: 'rgba(127,119,221,0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(127,119,221,0.4)',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: '#a09af5',
    fontSize: 14,
    fontWeight: '600',
  },
  ghostButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ghostButtonText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '500',
  },
  preview: {
    width: '100%',
    height: 420,
    borderRadius: 16,
    marginBottom: 0,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  resultCard: {
    backgroundColor: '#13161e',
    borderRadius: 16,
    padding: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 12,
  },
  resultRow: { paddingVertical: 12 },
  resultLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  resultValue: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  resultValueAccent: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  resultButtons: {
    marginTop: 18,
    gap: 8,
  },
  returnHookCard: {
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: 'rgba(127,119,221,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(127,119,221,0.28)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  returnHookText: {
    color: '#c9c4ff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  popupOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,7,12,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popupCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#13161e',
    borderRadius: 18,
    padding: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  popupTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  popupBody: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 18,
  },
  previewWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  chatFloatingHint: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 18,
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  chatFloatingHintText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultGo: {
    color: '#5DCAA5',
    fontWeight: '700',
  },
  resultAdjust: {
    color: '#FACC15',
    fontWeight: '700',
  },
  chatToast: {
    position: 'absolute',
    bottom: 18,
    alignSelf: 'center',
    backgroundColor: 'rgba(17,24,39,0.96)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chatToastText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});