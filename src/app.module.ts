import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import ormConfig from './config/crm.config';
import ormConfigProd from './config/crm.config.prod';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from './events/events.module';
import { AppJapanService } from './app.japan.service';
import { AppDummy } from './app.dummy';
import { SchoolModule } from './school/school.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [ormConfig],
      expandVariables: true,
      // ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory:
        process.env.NODE_ENV === 'production' ? ormConfigProd : ormConfig,
    }),
    EventsModule,
    SchoolModule,
    AuthModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: AppService,
      useClass: AppJapanService,
    },
    {
      provide: 'APP_NAME',
      useValue: 'Nest Events Backend!',
    },
    {
      provide: 'MESSAGE',
      inject: [AppDummy],
      useFactory: (app) => `${app.dummy()} Factory!`,
    },
    AppDummy,
  ],
})
export class AppModule {}
