import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(new Logger()); // TODO : para poder registar los  log de  la aplicación
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  app.setGlobalPrefix('api');

  // CORS: permitir SOLO el frontend configurado (por .env)
  // Ej: FRONTEND_URL=http://localhost:5173
  const allowedOrigins = (process.env.FRONTEND_URL)
    // .map((s) => s.trim())
    // .filter(Boolean);

  console.log( allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Requests server-to-server / herramientas (curl, Postman) pueden venir sin Origin
      if (!origin) return callback(null, true);

      if (allowedOrigins === origin) return callback(null, true);

      console.log( origin);
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  /*
   *  SECTION :CONFIGURACIÓN DE SWAGGER ------------
   */
  const config = new DocumentBuilder()
    .setTitle('Inventory API')
    .setDescription('Inventory API description')
    .setVersion('1.0')
    .addTag('inventory')
    // .addBearerAuth() // TODO : para poder autenticar las peticiones con JWT
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('documentation', app, document);

  //-------------------------------------

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
