import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn, Matches } from 'class-validator';

export class CreateServiceBookingDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'car_wash', enum: ['car_wash', 'wheel_fixing'] })
  service_type: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['scheduled', 'instant'])
  @ApiProperty({ example: 'scheduled', enum: ['scheduled', 'instant'] })
  service_timing: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '123 Main St, City' })
  location: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  @ApiProperty({ example: '2024-02-20' })
  schedule_date: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:mm format' })
  @ApiProperty({ example: '14:30' })
  schedule_time: string;
}