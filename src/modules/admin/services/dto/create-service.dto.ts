import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateServiceDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Exterior Wash' })
  service_name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Sedan' })
  service_category: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'New York City' })
  location: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '09:30 AM - 11:00 PM' })
  available_time: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ example: 3, type: Number })
  team_size: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Full car wash service description' })
  descriptions: string;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @ApiProperty({ example: true, type: Boolean })
  mobile: boolean;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @ApiProperty({ example: false, type: Boolean })
  garage: boolean;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  additional_image?: any;
}