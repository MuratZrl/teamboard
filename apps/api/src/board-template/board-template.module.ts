import { Module } from '@nestjs/common';
import { BoardTemplateService } from './board-template.service';
import { BoardTemplateController } from './board-template.controller';

@Module({
  controllers: [BoardTemplateController],
  providers: [BoardTemplateService],
})
export class BoardTemplateModule {}
