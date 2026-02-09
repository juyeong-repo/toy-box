import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TaskStatus } from '../task.entity';

/** 일감 생성 요청 DTO - 제목만 필수 (상태는 기본값 TODO, 생성자는 로그인 사용자) */
export class CreateTaskDto {
  @IsString({ message: '제목을 입력해 주세요.' })
  @MinLength(1, { message: '제목은 최소 1자 이상이어야 합니다.' })
  @MaxLength(200, { message: '제목은 최대 200자까지 입력할 수 있습니다.' })
  title!: string;

  @IsOptional()
  @IsEnum(TaskStatus, { message: '상태는 TODO, DOING, DONE 중 하나여야 합니다.' })
  status?: TaskStatus;
}
