import { Module } from '@nestjs/common';

import { MemoryModule } from '@/modules/memory';
import { ClaudeService } from './claude.service';
import { FileService } from './file.service';

@Module({ imports: [MemoryModule], providers: [ClaudeService, FileService], exports: [ClaudeService, FileService] })
export class ClaudeModule {}
