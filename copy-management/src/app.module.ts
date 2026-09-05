import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthorModule } from './author/author.module';
import { GenreModule } from './genre/genre.module';
import { BookModule } from './book/book.module';
import { EditionModule } from './edition/edition.module';
import { PublisherModule } from './publisher/publisher.module';
import { CopyModule } from './copy/copy.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'copy-management',
    }),
    AuthorModule,
    GenreModule,
    BookModule,
    EditionModule,
    PublisherModule,
    CopyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
