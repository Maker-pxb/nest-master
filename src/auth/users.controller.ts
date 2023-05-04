import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  Session,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { CreateUserDto } from './input/create.user.dto';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post()
  async create(@Body() input: CreateUserDto) {
    const user = new User();
    //TODO 验证码
    if (input.password !== input.retypedPassword) {
      throw new BadRequestException(['Passwords are not identical']);
    }

    const existingUser = await this.userRepository.findOne({
      where: [{ username: input.username }, { email: input.email }],
    });

    if (existingUser) {
      throw new BadRequestException(['username or email is already taken']);
    }

    user.username = input.username;
    user.password = await this.authService.hashPassword(input.password);
    user.email = input.email;
    user.firstName = input.firstName;
    user.lastName = input.lastName;

    return {
      ...(await this.userRepository.save(user)),
      token: this.authService.getTokenForUser(user),
    };
  }

  @Get('captcha')
  async captcha(@Req() req, @Res() res, @Session() session) {
    const { text, data } = this.userService.create();
    res.type('image/svg+xml');
    res.send(data);
    session.captcha = text;
  }
}
