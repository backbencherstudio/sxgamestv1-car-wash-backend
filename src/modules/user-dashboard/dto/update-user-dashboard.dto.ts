import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDashboardDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'John Doe' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '+1234567890' })
  phone_number?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @ApiProperty({ example: 'newPassword123' })
  password?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '123 Main St, City' })
  address?: string;
}
