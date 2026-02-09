import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksGateway } from './tasks.gateway';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * 일감 컨트롤러
 * - 모든 엔드포인트는 JWT 인증이 필요 (JwtAuthGuard)
 * - 일감 변경 시 WebSocket을 통해 모든 클라이언트에게 실시간 알림
 */
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly tasksGateway: TasksGateway,
  ) {}

  /**
   * 일감 목록 조회
   * - query 파라미터가 있으면 검색, 없으면 전체 조회
   */
  @Get()
  async findAll(@Query('search') search?: string) {
    if (search && search.trim()) {
      return this.tasksService.search(search.trim());
    }
    return this.tasksService.findAll();
  }

  /**
   * 일감 생성
   * - 생성자는 JWT 토큰에서 추출한 현재 로그인 사용자
   * - 생성 후 WebSocket으로 모든 클라이언트에게 알림
   */
  @Post()
  async create(@Body() dto: CreateTaskDto, @Request() req: any) {
    const task = await this.tasksService.create(dto, req.user);
    // 실시간 동기화: 새 일감이 생성되었음을 모든 클라이언트에 브로드캐스트
    this.tasksGateway.broadcastTaskUpdate('task:created', task);
    return task;
  }

  /**
   * 일감 수정 (제목 변경, 상태 변경 등)
   * - 낙관적 잠금: version 필드를 통해 동시성 충돌 감지
   * - 수정 후 WebSocket으로 모든 클라이언트에게 알림
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    const task = await this.tasksService.update(id, dto);
    // 실시간 동기화: 일감이 수정되었음을 모든 클라이언트에 브로드캐스트
    this.tasksGateway.broadcastTaskUpdate('task:updated', task);
    return task;
  }

  /**
   * 일감 삭제
   * - 삭제 후 WebSocket으로 모든 클라이언트에게 알림
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.tasksService.remove(id);
    // 실시간 동기화: 일감이 삭제되었음을 모든 클라이언트에 브로드캐스트
    this.tasksGateway.broadcastTaskUpdate('task:deleted', { id });
    return { success: true };
  }
}
