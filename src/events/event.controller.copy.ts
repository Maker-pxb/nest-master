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

/**
 * @SerializeOptions() 是 NestJS 中的一个装饰器，用于指定响应对象的序列化选项。
 * 其中，strategy 参数表示序列化策略，可以是以下几种取值之一：
 * excludeAll：排除所有属性，只返回空对象。
   exposeAll：暴露所有属性，包括私有属性。
   none：不进行任何转换，直接返回原始对象。
 */
@Controller('/events')
@SerializeOptions({
  strategy: 'excludeAll',
})
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
  @UseInterceptors(ClassSerializerInterceptor)
  @UsePipes(
    new ValidationPipe({
      transform: true, // 将查询字符串转换为数字
    }),
  )
  @UseInterceptors(ClassSerializerInterceptor)
  async findAll(@Query() filter: ListEvent) {
    this.logger.log('Hit the findAll route', filter);
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
  /**
   *
   * @UseInterceptors() 是 NestJS 中的一个装饰器，
   * 用于应用拦截器（Interceptor）到控制器或处理程序上。
   * 其中，ClassSerializerInterceptor 是一个内置的拦截器，
   * 用于将响应对象中的实体类（Entity Class）转换为平面对象（Plain Object）。
   * 这样，我们就可以在响应中返回实体类，而不是平面对象。
   */
  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  async findOne(@Param('id', ParseIntPipe) id) {
    this.logger.debug(`Hit the findOne route with id ${id}`);
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
  @UseInterceptors(ClassSerializerInterceptor)
  async create(
    @Body()
    input: CreateEventDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.eventsService.createEvent(input, user);
    return result;
  }

  @Patch(':id')
  @UseGuards(AuthGuardJwt)
  @UseInterceptors(ClassSerializerInterceptor)
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

    await this.eventsService.updateEvent(event, input);
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
