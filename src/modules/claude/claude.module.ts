import { Module } from '@nestjs/common';

import { MemoryModule } from '@/modules/memory';
import { ReminderModule } from '@/modules/reminder';
import { ClaudeService } from './claude.service';
import { FileService } from './file.service';

@Module({ imports: [MemoryModule, ReminderModule], providers: [ClaudeService, FileService], exports: [ClaudeService, FileService] })
export class ClaudeModule {}
