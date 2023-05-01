import { IsNumber, IsString, Length, IsDateString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @Length(2, 10, {
    message: '名称长度错误',
  })
  name: string;
  @Length(5, 20)
  description: string;
  @IsDateString()
  when: string;
  @IsString()
  @Length(5, 20)
  address: string;
}
