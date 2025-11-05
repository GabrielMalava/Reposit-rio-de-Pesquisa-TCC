import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { PrismaModule } from '../prisma/prisma.module';
import { XmlValidationService } from './xml-validation.service';
import { MetricsCalculationService } from '../report/metrics-calculation.service';

@Module({
  imports: [PrismaModule],
  controllers: [ImportController],
  providers: [ImportService, XmlValidationService, MetricsCalculationService],
  exports: [ImportService],
})
export class ImportModule {}


