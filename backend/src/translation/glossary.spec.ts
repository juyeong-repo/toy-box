import { matchGlossary } from './glossary';

describe('matchGlossary', () => {
  it('텍스트에 등장하는 용어만 골라낸다', () => {
    const result = matchGlossary(
      '이 API는 낙관적 잠금을 사용해 동시성을 제어한다.',
      'ko',
      'en',
    );

    expect(result).toEqual([{ ko: '낙관적 잠금', en: 'optimistic locking' }]);
  });

  it('등장하지 않는 용어는 포함하지 않는다', () => {
    const result = matchGlossary('오늘 날씨가 좋다.', 'ko', 'en');
    expect(result).toEqual([]);
  });

  it('source와 target 언어가 같으면 매칭하지 않는다', () => {
    const result = matchGlossary('낙관적 잠금', 'ko', 'ko');
    expect(result).toEqual([]);
  });
});
