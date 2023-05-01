import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { AttendeeAnswerEnum } from './attendee.entity';
import { Event } from './event.entity';
import { ListEvent, WhenEventFilter } from './input/list.event';
import { query } from 'express';
import { PaginateOptions, paginate } from 'src/pagaination/paganator';
import { CreateEventDto } from './input/create-event.dto';
import { CreateUserDto } from 'src/auth/input/create.user.dto';
import { User } from 'src/auth/user.entity';
import { UpdateEventDto } from './input/update-event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  private getEventsBaseQuery() {
    return this.eventsRepository
      .createQueryBuilder('e')
      .orderBy('e.id', 'DESC');
  }

  public getEventsWithAttendeeCountQuery() {
    return this.getEventsBaseQuery()
      .loadRelationCountAndMap('e.attendeeCount', 'e.attendees')
      .loadRelationCountAndMap(
        'e.attendeeAccepted',
        'e.attendees',
        'attendee',
        (qb) =>
          qb.where('attendee.answer = :answer', {
            answer: AttendeeAnswerEnum.Accepted,
          }),
      )
      .loadRelationCountAndMap(
        'e.attendeeMaybe',
        'e.attendees',
        'attendee',
        (qb) =>
          qb.where('attendee.answer = :answer', {
            answer: AttendeeAnswerEnum.Maybe,
          }),
      )
      .loadRelationCountAndMap(
        'e.attendeeRejected',
        'e.attendees',
        'attendee',
        (qb) =>
          qb.where('attendee.answer = :answer', {
            answer: AttendeeAnswerEnum.Rejected,
          }),
      );
  }
  private async getEventsWithAttendeeCountFiltered(filter?: ListEvent) {
    const query = this.getEventsWithAttendeeCountQuery();
    if (!filter) {
      return query;
    }
    console.log(
      '🚀 ~ file: events.service.ts:61 ~ EventsService ~ getEventsWithAttendeeCountFiltered ~ filter:',
      filter,
    );
    if (filter.when) {
      if (filter.when == WhenEventFilter.Today) {
        query.andWhere(
          'e.when >= CURDATE() AND e.when < CURDATE() + INTERVAL 1 DAY',
        );
      } else if (filter.when == WhenEventFilter.Tomorrow) {
        query.andWhere(
          'e.when >= CURDATE() + INTERVAL 1 DAY AND e.when < CURDATE() + INTERVAL 2 DAY',
        );
      } else if (filter.when == WhenEventFilter.ThisWeek) {
        query.andWhere('YEARWEEK(e.when, 1) = YEARWEEK(CURDATE(), 1)');
      } else if (filter.when == WhenEventFilter.NextWeek) {
        query.andWhere('YEARWEEK(e.when, 1) = YEARWEEK(CURDATE(), 1) + 1');
      }
    }
    return query;
  }

  public async getEventsWithAttendeeCountFilteredPaginated(
    filter: ListEvent,
    PaginateOptions: PaginateOptions,
  ) {
    return await paginate(
      await this.getEventsWithAttendeeCountFiltered(filter),
      PaginateOptions,
    );
  }
  public async getEvent(id: number): Promise<Event | undefined> {
    const query = this.getEventsWithAttendeeCountQuery().andWhere(
      'e.id = :id',
      { id },
    );

    this.logger.debug(query.getSql());

    return await query.getOne();
  }

  public async createEvent(input: CreateEventDto, user: User): Promise<Event> {
    return await this.eventsRepository.save({
      ...input,
      organizer: user,
      when: new Date(input.when),
    });
  }

  public async updateEvent(
    event: Event,
    input: UpdateEventDto,
  ): Promise<Event> {
    return await this.eventsRepository.save({
      ...event,
      ...input,
      when: input.when ? new Date(input.when) : event.when,
    });
  }

  public async deleteEvent(id: number): Promise<DeleteResult> {
    return await this.eventsRepository
      .createQueryBuilder('e')
      .delete()
      .where('e.id = :id', { id })
      .execute();
  }
}
