import { Module } from '@nestjs/common';

import { AgentModule } from '@/modules/agent';
import { ClaudeModule } from '@/modules/claude';
import { TelegramService } from './telegram.service';

@Module({ imports: [AgentModule, ClaudeModule], providers: [TelegramService] })
export class TelegramModule {}
