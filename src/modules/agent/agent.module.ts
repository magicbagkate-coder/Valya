import { Module } from '@nestjs/common';

import { MemoryModule } from '@/modules/memory';
import { SheetModule } from '@/modules/sheet';
import { AgentService } from './agent.service';

@Module({ imports: [SheetModule, MemoryModule], providers: [AgentService], exports: [AgentService] })
export class AgentModule {}
