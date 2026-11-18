import { Module } from '@nestjs/common';

import { AgentModule } from '@/modules/agent';
import { AnalysisModule } from '@/modules/analysis';
import { ClaudeModule } from '@/modules/claude';
import { MemoryModule } from '@/modules/memory';
import { ReminderModule } from '@/modules/reminder';
import { AnalysisSender } from './analysisSender';
import { ReminderSender } from './reminderSender';
import { TelegramService } from './telegram.service';

@Module({
  imports: [AgentModule, AnalysisModule, ClaudeModule, MemoryModule, ReminderModule],
  providers: [TelegramService, ReminderSender, AnalysisSender],
})
export class TelegramModule {}
