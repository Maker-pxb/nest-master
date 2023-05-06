import { IsNumber, IsString, Length, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateEventDto {
  @IsString()
  @Length(2, 10, {
    message: '名称长度错误',
  })
  @ApiProperty({
    description: '名称',
    minLength: 2,
    maxLength: 10,
  })
  name: string;
  @ApiProperty()
  @Length(5, 20)
  @ApiProperty()
  description: string;
  @IsDateString()
  @ApiProperty()
  when: string;
  @IsString()
  @Length(5, 20)
  @ApiProperty()
  address: string;
}
