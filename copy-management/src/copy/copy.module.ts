import { Module } from '@nestjs/common';
import { CopyService } from './copy.service';
import { CopyController } from './copy.controller';

@Module({
  controllers: [CopyController],
  providers: [CopyService],
})
export class CopyModule {}
