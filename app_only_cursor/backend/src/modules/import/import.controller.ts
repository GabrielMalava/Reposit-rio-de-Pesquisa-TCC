import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { memoryStorage } from 'multer';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@ApiTags('import')
@Controller('import')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/xml' || file.mimetype === 'text/xml') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Apenas arquivos XML são permitidos'), false);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Upload e importação de arquivo XML' })
  @ApiConsumes('multipart/form-data')
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      throw new BadRequestException('Arquivo não fornecido');
    }

    const userId = req.user?.userId || null;
    return this.importService.importXml(file.buffer, file.originalname, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar histórico de importações' })
  async getImports(@Request() req) {
    return this.importService.getImports(req.user?.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de uma importação' })
  async getImport(@Param('id') id: string) {
    return this.importService.getImportById(parseInt(id));
  }

  @Get(':id/original')
  @ApiOperation({ summary: 'Download do arquivo XML original' })
  async downloadOriginal(@Param('id') id: string, @Res() res: Response) {
    const file = await this.importService.getOriginalFile(parseInt(id));
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.buffer);
  }
}


