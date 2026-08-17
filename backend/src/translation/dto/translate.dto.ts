import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { SupportedLang } from '../glossary';

export class TranslateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text!: string;

  @IsIn(['ko', 'en'])
  sourceLang!: SupportedLang;

  @IsIn(['ko', 'en'])
  targetLang!: SupportedLang;
}
