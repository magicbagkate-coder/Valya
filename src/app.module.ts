import { Module } from '@nestjs/common';

import { HealthModule } from '@/modules/health';

@Module({ imports: [HealthModule] })
export class AppModule {}
