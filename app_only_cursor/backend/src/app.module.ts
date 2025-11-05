import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ImportModule } from './modules/import/import.module';
import { StudentModule } from './modules/student/student.module';
import { ReportModule } from './modules/report/report.module';
import { AuthModule } from './modules/auth/auth.module';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    LoggerModule,
    AuthModule,
    ImportModule,
    StudentModule,
    ReportModule,
  ],
})
export class AppModule {}


