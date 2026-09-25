import { Module } from '@nestjs/common';
import { CopyService } from './copy.service';
import { CopyController } from './copy.controller';
import { EditionModule } from '../edition/edition.module';
import { UserClient } from './clients/user.client';

@Module({
  imports: [EditionModule],
  controllers: [CopyController],
  providers: [CopyService, UserClient],
  exports: [CopyService],
})
export class CopyModule {}
