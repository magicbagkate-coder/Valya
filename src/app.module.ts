import { Module } from '@nestjs/common';

import { HealthModule } from '@/modules/health';
import { TelegramModule } from '@/modules/telegram';

@Module({ imports: [HealthModule, TelegramModule] })
export class AppModule {}
