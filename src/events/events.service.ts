import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository, SelectQueryBuilder } from 'typeorm';
import { AttendeeAnswerEnum } from './attendee.entity';
import { Event } from './event.entity';
import { ListEvent, WhenEventFilter } from './input/list.event';
import {
  PaginateOptions,
  PaginationResult,
  paginate,
} from 'src/pagaination/paganator';
import { CreateEventDto } from './input/create-event.dto';
import { User } from 'src/auth/user.entity';
import { UpdateEventDto } from './input/update-event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  private getEventsBaseQuery(): SelectQueryBuilder<Event> {
    return this.eventsRepository
      .createQueryBuilder('e')
      .orderBy('e.id', 'DESC');
  }

  public getEventsWithAttendeeCountQuery(): SelectQueryBuilder<Event> {
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
  ): Promise<PaginationResult<Event>> {
    return await paginate(
      await this.getEventsWithAttendeeCountFiltered(filter),
      PaginateOptions,
    );
  }
  public async getEventWIthAttendeeCount(
    id: number,
  ): Promise<Event | undefined> {
    const query = this.getEventsWithAttendeeCountQuery().andWhere(
      'e.id = :id',
      { id },
    );

    this.logger.debug(query.getSql());
    const result = await query.getOne();
    console.log(
      '🚀 ~ file: events.service.ts:104 ~ EventsService ~ getEvent ~ result:',
      result,
    );
    return result;
  }

  public async findOne(id: number): Promise<Event | undefined> {
    return await this.eventsRepository.findOne({
      where: {
        id,
      },
    });
  }

  public async createEvent(input: CreateEventDto, user: User): Promise<Event> {
    const result = await this.eventsRepository.save(
      new Event({
        ...input,
        organizer: user,
        when: new Date(input.when),
      }),
    );
    console.log(
      '🚀 ~ file: events.service.ts:113 ~ EventsService ~ createEvent ~ result:',
      result,
    );
    return result;
  }

  public async updateEvent(
    event: Event,
    input: UpdateEventDto,
  ): Promise<Event> {
    return await this.eventsRepository.save(
      new Event({
        ...event,
        ...input,
        when: input.when ? new Date(input.when) : event.when,
      }),
    );
  }

  public async deleteEvent(id: number): Promise<DeleteResult> {
    return await this.eventsRepository
      .createQueryBuilder('e')
      .delete()
      .where('e.id = :id', { id })
      .execute();
  }

  public async getEventsOrganizedByUserIdPaginated(
    userId: number,
    PaginateOptions: PaginateOptions,
  ): Promise<PaginationResult<Event>> {
    return await paginate<Event>(
      this.getEventsOrganizedByUserIdQuery(userId),
      PaginateOptions,
    );
  }

  private getEventsOrganizedByUserIdQuery(
    userId: number,
  ): SelectQueryBuilder<Event> {
    return this.getEventsBaseQuery().where('e.organizerId = :userId', {
      userId,
    });
  }

  public async getEventsAttendedByUserIdPaginated(
    userId: number,
    PaginateOptions: PaginateOptions,
  ): Promise<PaginationResult<Event>> {
    return await paginate<Event>(
      this.getEventsAttendedByUserIdQuery(userId),
      PaginateOptions,
    );
  }

  private getEventsAttendedByUserIdQuery(
    userId: number,
  ): SelectQueryBuilder<Event> {
    return this.getEventsBaseQuery()
      .leftJoinAndSelect('e.attendees', 'a')
      .where('a.userId = :userId', { userId });
  }
}
