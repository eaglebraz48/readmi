import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Lang = 'en' | 'pt' | 'es' | 'fr';
type Mode = 'interview' | 'date' | 'social' | 'party' | 'conversation';

type ReadResult = {
  overallRead: string;
  strength: string;
  improve: string;
  tryThis: string;
};

type Msg = {
  role: 'user' | 'bot';
  text: string;
};

type Props = {
  lang: Lang;
  mode: Mode;
  result: ReadResult;
};

const PLACEHOLDER: Record<Lang, string> = {
  en: 'Ask about your result...',
  pt: 'Pergunte sobre seu resultado...',
  es: 'Pregunta sobre tu resultado...',
  fr: 'Pose une question sur ton résultat...',
};

const TITLE: Record<Lang, string> = {
  en: 'READMI Plus',
  pt: 'READMI Plus',
  es: 'READMI Plus',
  fr: 'READMI Plus',
};

const SUBTITLE: Record<Lang, string> = {
  en: 'Ask follow-up questions',
  pt: 'Faça perguntas sobre sua leitura',
  es: 'Haz preguntas sobre tu resultado',
  fr: 'Pose des questions sur ton résultat',
};

const SEND: Record<Lang, string> = {
  en: 'Send',
  pt: 'Enviar',
  es: 'Enviar',
  fr: 'Envoyer',
};

const THINKING: Record<Lang, string> = {
  en: 'Thinking...',
  pt: 'Pensando...',
  es: 'Pensando...',
  fr: 'Réflexion...',
};

const ERROR_TEXT: Record<Lang, string> = {
  en: 'Connection issue. Try again.',
  pt: 'Problema de conexão. Tente de novo.',
  es: 'Problema de conexión. Inténtalo de nuevo.',
  fr: 'Problème de connexion. Réessaie.',
};

const STARTER: Record<Lang, string> = {
  en: 'Ask what your expression suggests, what weakens your presence, or what to change first.',
  pt: 'Pergunte o que sua expressão transmite, o que enfraquece sua presença ou o que mudar primeiro.',
  es: 'Pregunta qué transmite tu expresión, qué debilita tu presencia o qué cambiar primero.',
  fr: 'Demande ce que ton expression transmet, ce qui affaiblit ta présence ou quoi changer en premier.',
};

const QUICK: Record<Lang, string[]> = {
  en: [
    'Why do I seem closed off?',
    'What should I change first?',
    'How would this affect an interview?',
  ],
  pt: [
    'Por que eu pareço fechado?',
    'O que eu devo mudar primeiro?',
    'Como isso afeta uma entrevista?',
  ],
  es: [
    '¿Por qué parezco cerrado?',
    '¿Qué debo cambiar primero?',
    '¿Cómo afecta esto una entrevista?',
  ],
  fr: [
    'Pourquoi je parais fermé ?',
    'Que dois-je changer d’abord ?',
    'Comment cela affecte un entretien ?',
  ],
};

export default function ReadmiChat({ lang, mode, result }: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'bot', text: STARTER[lang] },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const quickPrompts = useMemo(() => QUICK[lang], [lang]);

  const sendMessage = async (prefill?: string) => {
    const text = (prefill ?? input).trim();
    if (!text || sending) return;

    const nextUserMessage: Msg = { role: 'user', text };
    const updatedMessages = [...messages, nextUserMessage];

    setMessages(updatedMessages);
    setInput('');
    setSending(true);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const response = await fetch('https://readmi-opal.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          lang,
          mode,
          result,
          messages: updatedMessages,
        }),
      });

      const data = await response.json();

      const reply =
        typeof data?.reply === 'string' && data.reply.trim()
          ? data.reply.trim()
          : ERROR_TEXT[lang];

      setMessages((prev) => [...prev, { role: 'bot', text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', text: ERROR_TEXT[lang] }]);
    } finally {
      setSending(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{TITLE[lang]}</Text>
        <Text style={styles.subtitle}>{SUBTITLE[lang]}</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, index) => (
          <View
            key={`${msg.role}-${index}`}
            style={[
              styles.bubbleWrap,
              msg.role === 'user' ? styles.userWrap : styles.botWrap,
            ]}
          >
            <View
              style={[
                styles.bubble,
                msg.role === 'user' ? styles.userBubble : styles.botBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  msg.role === 'user' ? styles.userText : styles.botText,
                ]}
              >
                {msg.text}
              </Text>
            </View>
          </View>
        ))}

        {sending ? (
          <View style={styles.botWrap}>
            <View style={[styles.bubble, styles.botBubble, styles.loadingBubble]}>
              <ActivityIndicator size="small" color="#cfc8ff" />
              <Text style={styles.loadingText}>{THINKING[lang]}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.quickRow}>
        {quickPrompts.map((item) => (
          <Pressable key={item} style={styles.quickChip} onPress={() => sendMessage(item)}>
            <Text style={styles.quickChipText}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={PLACEHOLDER[lang]}
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={styles.input}
          multiline
        />
        <Pressable
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={() => sendMessage()}
          disabled={sending}
        >
          <Text style={styles.sendButtonText}>{SEND[lang]}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    backgroundColor: '#13161e',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  title: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 12,
  },
  messages: {
    maxHeight: 340,
  },
  messagesContent: {
    padding: 12,
    gap: 10,
  },
  bubbleWrap: {
    flexDirection: 'row',
  },
  userWrap: {
    justifyContent: 'flex-end',
  },
  botWrap: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#7F77DD',
  },
  botBubble: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#ffffff',
  },
  botText: {
    color: 'rgba(255,255,255,0.88)',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#cfc8ff',
    fontSize: 13,
  },
  quickRow: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 0.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickChipText: {
    color: '#ffffff',
    fontSize: 12,
  },
  inputRow: {
    padding: 12,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.07)',
    gap: 10,
  },
  input: {
    minHeight: 52,
    maxHeight: 120,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#7F77DD',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});