import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { TaskStatus } from '../task.entity';

/**
 * 태스크 수정 요청 DTO
 * - version 필드: 낙관적 잠금을 위한 필수 값
 *   클라이언트가 마지막으로 조회한 시점의 version을 전송해야 함
 * - title, status: 선택적으로 수정 가능
 */
export class UpdateTaskDto {
  @IsInt({ message: 'version은 정수여야 합니다.' })
  @Min(1, { message: 'version은 1 이상이어야 합니다.' })
  version!: number;

  @IsOptional()
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  @MinLength(1, { message: '제목은 최소 1자 이상이어야 합니다.' })
  @MaxLength(200, { message: '제목은 최대 200자까지 입력할 수 있습니다.' })
  title?: string;

  @IsOptional()
  @IsEnum(TaskStatus, { message: '상태는 TODO, DOING, DONE 중 하나여야 합니다.' })
  status?: TaskStatus;
}
