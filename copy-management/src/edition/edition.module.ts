import { Module } from '@nestjs/common';
import { EditionService } from './edition.service';
import { EditionController } from './edition.controller';
import { WorkModule } from '../work/work.module';

@Module({
  imports: [WorkModule],
  controllers: [EditionController],
  providers: [EditionService],
  exports: [EditionService],
})
export class EditionModule {}
