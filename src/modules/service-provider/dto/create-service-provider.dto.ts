import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateServiceProviderDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Car Wash Pro' })
  business_name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'BUS123456' })
  business_number: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  profile_picture?: any;

  @ApiProperty({ type: 'string', format: 'binary' })
  license_front?: any;

  @ApiProperty({ type: 'string', format: 'binary' })
  license_back?: any;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '1234567890' })
  nid_number: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'LIC123456' })
  license_number: string;

  @IsNotEmpty()
  @IsDateString()
  @ApiProperty({ example: '1990-01-01T00:00:00.000Z' })
  date_of_birth: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '123 Business St, City' })
  business_location: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '456 Home St, City' })
  permanent_address: string;
}