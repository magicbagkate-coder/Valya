import { Module } from '@nestjs/common';

import { SheetModule } from '@/modules/sheet';
import { AgentService } from './agent.service';

@Module({ imports: [SheetModule], providers: [AgentService], exports: [AgentService] })
export class AgentModule {}
