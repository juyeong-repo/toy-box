import { useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';

export type SupportedLang = 'ko' | 'en';

/**
 * 실시간 번역 훅
 * - 소켓으로 'translate' 이벤트를 보내고, 서버가 스트리밍으로 돌려주는
 *   'translation:chunk'를 받아 결과 텍스트에 이어붙인다
 * - 한 번에 하나의 번역만 진행한다고 가정 (동시에 여러 요청을 구분하지 않음)
 */
export function useTranslate() {
  const [result, setResult] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleChunk = ({ chunk }: { chunk: string }) => {
      setResult((prev) => prev + chunk);
    };

    const handleDone = () => {
      setIsTranslating(false);
    };

    const handleError = ({ message }: { message: string }) => {
      setError(message);
      setIsTranslating(false);
    };

    socket.on('translation:chunk', handleChunk);
    socket.on('translation:done', handleDone);
    socket.on('translation:error', handleError);

    return () => {
      socket.off('translation:chunk', handleChunk);
      socket.off('translation:done', handleDone);
      socket.off('translation:error', handleError);
    };
  }, []);

  const translate = (text: string, sourceLang: SupportedLang, targetLang: SupportedLang) => {
    setResult('');
    setError(null);
    setIsTranslating(true);
    getSocket().emit('translate', { text, sourceLang, targetLang });
  };

  return { result, isTranslating, error, translate };
}
