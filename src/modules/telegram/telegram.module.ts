import { Module } from '@nestjs/common';

import { AgentModule } from '@/modules/agent';
import { ClaudeModule } from '@/modules/claude';
import { MemoryModule } from '@/modules/memory';
import { ReminderModule } from '@/modules/reminder';
import { ReminderSender } from './reminderSender';
import { TelegramService } from './telegram.service';

@Module({ imports: [AgentModule, ClaudeModule, MemoryModule, ReminderModule], providers: [TelegramService, ReminderSender] })
export class TelegramModule {}
