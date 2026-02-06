import { IsString, MinLength } from 'class-validator';

/** 일감 생성 요청 DTO - 제목만 필수 (상태는 기본값 TODO, 생성자는 로그인 사용자) */
export class CreateTaskDto {
  @IsString({ message: '제목을 입력해 주세요.' })
  @MinLength(1, { message: '제목은 최소 1자 이상이어야 합니다.' })
  title!: string;
}
