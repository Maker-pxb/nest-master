import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { join } from 'path';
import { Response } from 'express';
import { zip } from 'compressing';
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('album')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file) {
    console.log(
      '🚀 ~ file: upload.controller.ts:24 ~ UploadController ~ uploadFile ~ file:',
      file,
    );
    return {
      path: `/upload/${file.filename}`,
    };
  }

  @Get('download')
  download(@Res() res: Response) {
    const prefix = join(__dirname, '../../public/upload');
    const url = `${prefix}/1683208601025.jpg`;
    res.download(url);
  }

  @Get('stream')
  async down(@Res() res: Response) {
    const prefix = join(__dirname, '../../public/upload');
    const url = `${prefix}/1683208601025.jpg`;
    const tarStream = new zip.Stream();
    await tarStream.addEntry(url);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename=stream.zip');
    tarStream.pipe(res);
    // return this.uploadService.down();
  }
}
