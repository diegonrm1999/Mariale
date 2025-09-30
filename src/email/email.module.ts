import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { PdfService } from 'src/pdf/pdf.service';
import sesConfig from './config/ses.config';

@Module({
  imports: [
    ConfigModule.forFeature(sesConfig),
  ],
  providers: [EmailService, PdfService],
  exports: [EmailService],
})
export class EmailModule {}