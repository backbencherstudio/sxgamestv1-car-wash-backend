import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @ApiProperty({ example: 'John Doe' })
  name: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password should be minimum 8 characters' })
  @ApiProperty({ example: 'password123' })
  password: string;

  @IsOptional()
  @ApiProperty({ 
    type: 'string', 
    format: 'binary',
    required: false 
  })
  avatar?: string;

  @IsOptional()
  @ApiProperty({
    type: "string",
    example: 'user',
    default: "user",
    required: false
  })
  type: string = 'user'; // Add default value here
}
