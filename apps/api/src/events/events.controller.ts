import { Controller, Param, Sse, UseGuards, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Sse('workspaces/:id/events')
  @UseGuards(WorkspaceGuard)
  subscribe(@Param('id') workspaceId: string): Observable<MessageEvent> {
    return this.eventsService.subscribe(workspaceId);
  }
}
