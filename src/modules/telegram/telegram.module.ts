import { Module } from '@nestjs/common';

import { AgentModule } from '@/modules/agent';
import { ClaudeModule } from '@/modules/claude';
import { MemoryModule } from '@/modules/memory';
import { TelegramService } from './telegram.service';

@Module({ imports: [AgentModule, ClaudeModule, MemoryModule], providers: [TelegramService] })
export class TelegramModule {}
