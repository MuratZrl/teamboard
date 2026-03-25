import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map } from 'rxjs';

@Injectable()
export class EventsService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit(workspaceId: string, event: { type: string; data: any }) {
    this.eventEmitter.emit(`workspace.${workspaceId}`, event);
  }

  subscribe(workspaceId: string): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, `workspace.${workspaceId}`).pipe(
      map((event) => ({
        data: JSON.stringify(event),
      } as MessageEvent)),
    );
  }
}
