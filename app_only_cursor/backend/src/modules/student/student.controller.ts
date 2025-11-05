import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentService } from './student.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('students')
@Controller('students')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudentController {
  constructor(private studentService: StudentService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os alunos com métricas' })
  async findAll(@Query('search') search?: string) {
    return this.studentService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um aluno' })
  async findOne(@Param('id') id: string) {
    return this.studentService.findOne(parseInt(id));
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Obter métricas de um aluno' })
  async getMetrics(@Param('id') id: string) {
    return this.studentService.getMetrics(parseInt(id));
  }
}


