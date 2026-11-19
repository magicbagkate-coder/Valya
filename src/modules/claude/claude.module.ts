import { Module } from '@nestjs/common';

import { AnalysisModule } from '@/modules/analysis';
import { MemoryModule } from '@/modules/memory';
import { ReminderModule } from '@/modules/reminder';
import { ClaudeService } from './claude.service';
import { FileService } from './file.service';
import { ReplyActions } from './replyActions';
import { TableAdvisor } from './tableAdvisor';

@Module({
  imports: [AnalysisModule, MemoryModule, ReminderModule],
  providers: [ClaudeService, FileService, ReplyActions, TableAdvisor],
  exports: [ClaudeService, FileService, TableAdvisor],
})
export class ClaudeModule {}
