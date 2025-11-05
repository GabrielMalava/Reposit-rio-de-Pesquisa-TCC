import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MetricsCalculationService } from '../report/metrics-calculation.service';

@Module({
  imports: [PrismaModule],
  controllers: [StudentController],
  providers: [StudentService, MetricsCalculationService],
  exports: [StudentService],
})
export class StudentModule {}


