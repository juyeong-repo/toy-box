import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useTranslate, type SupportedLang } from '../hooks/useTranslate';

const LANG_LABEL: Record<SupportedLang, string> = {
  ko: '한국어',
  en: '영어',
};

export default function TranslatePage() {
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState<SupportedLang>('ko');
  const [targetLang, setTargetLang] = useState<SupportedLang>('en');
  const { result, isTranslating, error, translate } = useTranslate();

  const handleTranslate = () => {
    if (!text.trim() || isTranslating) return;
    translate(text.trim(), sourceLang, targetLang);
  };

  const swapLangs = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  return (
    <div className="min-h-screen bg-surface-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-black uppercase tracking-tight">
            실시간 번역
          </h1>
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors"
          >
            보드로 돌아가기
          </Link>
        </header>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-medium text-gray-600">{LANG_LABEL[sourceLang]}</span>
          <button
            type="button"
            onClick={swapLangs}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="언어 바꾸기"
          >
            ⇄
          </button>
          <span className="text-sm font-medium text-gray-600">{LANG_LABEL[targetLang]}</span>
        </div>

        <textarea
          className="input-field w-full h-40 resize-none"
          placeholder="번역할 텍스트를 입력하세요"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
        />

        <div className="flex justify-end mt-3">
          <Button onClick={handleTranslate} isLoading={isTranslating} disabled={!text.trim()}>
            번역하기
          </Button>
        </div>

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

        <div className="input-field w-full min-h-[10rem] mt-4 whitespace-pre-wrap">
          {result || <span className="text-gray-400">번역 결과가 여기 표시됩니다</span>}
        </div>
      </div>
    </div>
  );
}
