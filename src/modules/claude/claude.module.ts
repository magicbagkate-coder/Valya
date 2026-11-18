import { Module } from '@nestjs/common';

import { AnalysisModule } from '@/modules/analysis';
import { MemoryModule } from '@/modules/memory';
import { ReminderModule } from '@/modules/reminder';
import { ClaudeService } from './claude.service';
import { FileService } from './file.service';
import { ReplyActions } from './replyActions';

@Module({
  imports: [AnalysisModule, MemoryModule, ReminderModule],
  providers: [ClaudeService, FileService, ReplyActions],
  exports: [ClaudeService, FileService],
})
export class ClaudeModule {}
