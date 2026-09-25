import { Module } from '@nestjs/common';
import { OperationService } from './operation.service';
import { OperationController } from './operation.controller';
import { CopyModule } from '../copy/copy.module';
import { CommunityModule } from '../community/community.module';

@Module({
  imports: [CopyModule, CommunityModule],
  controllers: [OperationController],
  providers: [OperationService],
})
export class OperationModule {}
