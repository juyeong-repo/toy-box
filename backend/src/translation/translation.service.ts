import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { TranslateDto } from './dto/translate.dto';
import { matchGlossary, SupportedLang } from './glossary';

const LANG_LABEL: Record<SupportedLang, string> = {
  ko: '한국어',
  en: '영어',
};

// 실시간성이 중요한 경로라 지연시간이 짧은 모델을 고른다
const MODEL = 'gpt-5-mini';

@Injectable()
export class TranslationService {
  private readonly client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  /**
   * 매칭된 전문용어를 시스템 프롬프트에 강제 매핑으로 주입해
   * 같은 용어가 매 요청마다 다르게 번역되는 것을 막는다.
   */
  private buildInstructions(dto: TranslateDto): string {
    const matched = matchGlossary(dto.text, dto.sourceLang, dto.targetLang);

    const base = `당신은 전문 번역가입니다. 사용자가 보내는 ${LANG_LABEL[dto.sourceLang]} 텍스트를 자연스러운 ${LANG_LABEL[dto.targetLang]}로 번역하세요. 번역 결과만 출력하고, 설명이나 따옴표는 붙이지 마세요.`;

    if (matched.length === 0) {
      return base;
    }

    const glossaryLines = matched
      .map((entry) => `- "${entry[dto.sourceLang]}" → "${entry[dto.targetLang]}"`)
      .join('\n');

    return `${base}\n\n다음 용어가 텍스트에 등장하면 반드시 아래 번역을 그대로 사용하세요:\n${glossaryLines}`;
  }

  /**
   * OpenAI의 스트리밍 응답을 그대로 흘려보낸다 - 조각(delta)이 도착할 때마다
   * onChunk를 호출하고, 최종 텍스트를 반환한다.
   */
  async translateStream(
    dto: TranslateDto,
    onChunk: (chunk: string) => void,
  ): Promise<string> {
    const stream = await this.client.responses.create({
      model: MODEL,
      instructions: this.buildInstructions(dto),
      input: dto.text,
      stream: true,
    });

    let fullText = '';
    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        fullText += event.delta;
        onChunk(event.delta);
      }
    }

    return fullText;
  }
}
