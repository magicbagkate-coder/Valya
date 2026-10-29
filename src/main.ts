import 'dotenv/config';
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { appEnv } from '@/config/appEnv';
import { AppModule } from '@/app.module';

async function startServer(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(appEnv.port);
  new Logger('Main').log(`Listening on port ${appEnv.port}`);
}

// Fire and forget: Nest reports a start error and stops the process.
void startServer();
