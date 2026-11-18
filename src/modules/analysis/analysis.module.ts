import { Module } from '@nestjs/common';

import { SheetModule } from '@/modules/sheet';
import { AnalysisService } from './analysis.service';

@Module({ imports: [SheetModule], providers: [AnalysisService], exports: [AnalysisService] })
export class AnalysisModule {}
