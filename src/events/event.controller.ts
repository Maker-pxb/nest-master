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
  UseGuards,
  ForbiddenException,
  SerializeOptions,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './input/create-event.dto';
import { UpdateEventDto } from './input/update-event.dto';
import { Repository, MoreThan, Like } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './event.entity';
import { Attendee } from './attendee.entity';
import { ListEvent } from './input/list.event';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { User } from 'src/auth/user.entity';
import { AuthGuardJwt } from 'src/auth/auth-guard.jwt';
import { version } from 'os';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

/**
 * version: string
 * 版本控制
 */
@Controller({
  path: 'events',
  // version: '1',
})
@SerializeOptions({
  strategy: 'excludeAll',
})
@ApiTags('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);
  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>,
    @InjectRepository(Attendee)
    private readonly attendeeRepository: Repository<Attendee>,
    private readonly eventsService: EventsService,
  ) {}
  /**
   * 版本控制
   * @version('1')
   */
  // @version('1')
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
        id: 'DESC',
        // when: 'DESC',
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
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({
    summary: 'Get all events',
    description: 'Retrieve all events from the database by pages and filters',
  })
  @ApiQuery({
    name: 'page',
    description: 'The page number of the results',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'The number of items to show per page',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'when',
    description: 'Filter events by when they start',
    required: false,
    enum: [1, 2, 3, 4, 5],
  })
  async findAll(@Query() filter: ListEvent) {
    this.logger.log('Hit the findAll route');
    const result =
      await this.eventsService.getEventsWithAttendeeCountFilteredPaginated(
        filter,
        {
          total: true,
          limit: filter.limit,
          page: filter.page,
        },
      );
    return result;
  }
  @Get(':id')
  @ApiParam({
    name: 'id',
    description: 'The id of the event',
    type: Number,
    required: true,
  })
  @UseInterceptors(ClassSerializerInterceptor)
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
  @UseGuards(AuthGuardJwt)
  // TODO 使用过滤器后不能正常返回数据
  // @UseInterceptors(ClassSerializerInterceptor)
  async create(
    @Body()
    input: CreateEventDto,
    @CurrentUser() user: User,
  ): Promise<Event> {
    return await this.eventsService.createEvent(input, user);
  }

  @Patch(':id')
  @UseGuards(AuthGuardJwt)
  // TODO 使用过滤器后不能正常返回数据
  // @UseInterceptors(ClassSerializerInterceptor)
  async update(
    @Param('id')
    id,
    @Body() input: UpdateEventDto,
    @CurrentUser() user: User,
  ) {
    const event = await this.eventsService.getEvent(id);

    if (!event) {
      throw new NotFoundException();
    }

    if (event.organizerId !== user.id) {
      throw new ForbiddenException(
        null,
        'You are not the organizer of this event',
      );
    }

    const result = await this.eventsService.updateEvent(event, input);
    return result;
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AuthGuardJwt)
  async remove(
    @Param('id', ParseIntPipe)
    id: number,
    @CurrentUser()
    user: User,
  ) {
    const event = await this.eventsService.getEvent(id);
    if (!event) {
      throw new NotFoundException();
    }

    if (event.organizerId !== user.id) {
      throw new ForbiddenException(
        null,
        'You are not the organizer of this event',
      );
    }
    const result = await this.eventsService.deleteEvent(id);
    if (result?.affected !== 1) {
      throw new NotFoundException();
    }
  }
}
