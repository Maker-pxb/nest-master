import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  ParseIntPipe,
  Logger,
  NotFoundException,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './input/create-event.dto';
import { UpdateEventDto } from './input/update-event.dto';
import { Repository, MoreThan, Like } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './event.entity';
import { Attendee } from './attendee.entity';
import { ListEvent } from './input/list.event';

@Controller('/events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);
  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>,
    @InjectRepository(Attendee)
    private readonly attendeeRepository: Repository<Attendee>,
    private readonly eventsService: EventsService,
  ) {}
  @Get('/practice')
  async practice() {
    const result = await this.repository.find({
      select: ['id', 'name'],
      where: [
        {
          id: MoreThan(15),
        },
        // {
        //   description: Like('%因此%'),
        // },
        // {
        //   name: Like('%宋静%'),
        // },
      ],
      order: {
        when: 'DESC',
      },
      take: 2,
      skip: 0,
    });
    return result;
  }
  @Get('/practice2')
  async practice2() {
    // const event = await this.repository.find({
    //   where: {
    //     id: 2,
    //   },
    //   // 这个选项用于指定查询实体时是否要立即加载其关系。
    //   loadEagerRelations: false,
    //   relations: ['attendees'],
    // });
    const event = await this.repository.findOne({
      where: { id: 2 },
      relations: ['attendees'],
    });
    // const event = new Event();
    const attendee = new Attendee();
    attendee.name = 'Using the attendee name';
    // attendee.event = event;
    event.attendees.push(attendee);
    await this.repository.save(event);
    // await this.attendeeRepository.save(attendee);
    return event;
  }
  @Get()
  @UsePipes(
    new ValidationPipe({
      transform: true, // 将查询字符串转换为数字
    }),
  )
  async findAll(@Query() filter: ListEvent) {
    this.logger.log('Hit the findAll route');
    const result =
      await this.eventsService.getEventsWithAttendeeCountFilteredPaginated(
        filter,
        {
          total: true,
          limit: filter.limit,
          currentPage: filter.page,
        },
      );
    return result;
  }
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id) {
    // 方法1
    // const event = await this.repository.findOne({
    //   where: {
    //     id: id,
    //   },
    // });
    // if (!event) {
    //   throw new Error(`Event with id ${id} not found`);
    // }
    // return event;
    // 方法2
    const event = await this.eventsService.getEvent(id);

    if (!event) {
      throw new NotFoundException();
    }

    return event;
  }

  @Post()
  async create(
    @Body()
    createEventDto: CreateEventDto,
  ) {
    const event = {
      ...createEventDto,
      when: createEventDto.when ? new Date(createEventDto.when) : new Date(),
    };

    const result = await this.repository.save(event);

    return result;
  }

  @Patch(':id')
  async update(
    @Param('id') id,
    @Body()
    updateEventDto: UpdateEventDto,
  ) {
    const event = await this.repository.findOneByOrFail({
      id,
    });
    console.log(
      '🚀 ~ file: events.controller.ts:55 ~ EventsController ~ update ~ event:',
      event,
    );
    return await this.repository.save({
      ...event,
      ...updateEventDto,
      when: updateEventDto.when ? new Date(updateEventDto.when) : event.when,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.eventsService.deleteEvent(id);
    if (result?.affected !== 1) {
      throw new NotFoundException();
    }
  }
}
