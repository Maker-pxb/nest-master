import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: join(__dirname, '../../public/upload'),
        filename: (req, file, cb) => {
          const randomName = `${Date.now()}`;
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
