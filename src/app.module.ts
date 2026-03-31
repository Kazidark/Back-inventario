import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/users/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ModuleChipsModule } from './modules/module-chips/module-chips.module';
import { ModuleModemsModule } from './modules/module-modems/module-modems.module';
import { ModuleCelularesModule } from './modules/module-celulares/module-celulares.module';
import { LaptosModule } from './modules/module-pc/laptos/laptos.module';
import { ModuleMonitoresModule } from './modules/module-monitores/module-monitores.module';
import { ModuleTabletModule } from './modules/module-tablet/module-tablet.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { ExportsModule } from './modules/exports/exports.module';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        //  conssole.log(config)
        type: 'mssql',
        host:
          config.get<string>('DB_HOST') ??
          config.get<string>('DB_SERVER') ??
          'localhost',
        port: Number(config.get<number>('DB_PORT') ?? 1433),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        options: {
          encrypt: config.get<string>('DB_ENCRYPT') === 'true',
          trustServerCertificate: config.get<string>('DB_ENCRYPT') !== 'true',
        },
        autoLoadEntities: true,
        // synchronize: config.get<string>('DB_SYNC') === 'true',
      }),
    }),
    UserModule,
    AuthModule,
    ModuleChipsModule,
    ModuleModemsModule,
    ModuleCelularesModule,
    LaptosModule,
    ModuleMonitoresModule,
    ModuleTabletModule,
    MasterDataModule,
    ExportsModule,
  ],
  controllers: [], // todo : add controllers
  providers: [], // todo : add services
})
export class AppModule {}
