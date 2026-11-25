import { Module } from '@nestjs/common';

import { AnalysisModule } from '@/modules/analysis';
import { MemoryModule } from '@/modules/memory';
import { ReminderModule } from '@/modules/reminder';
import { SheetModule } from '@/modules/sheet';
import { ClaudeService } from './claude.service';
import { FileService } from './file.service';
import { ReplyActions } from './replyActions';
import { TableAdvisor } from './tableAdvisor';
import { TableFilesService } from './tableFiles.service';

@Module({
  imports: [AnalysisModule, MemoryModule, ReminderModule, SheetModule],
  providers: [ClaudeService, FileService, ReplyActions, TableAdvisor, TableFilesService],
  exports: [ClaudeService, FileService, TableAdvisor],
})
export class ClaudeModule {}
