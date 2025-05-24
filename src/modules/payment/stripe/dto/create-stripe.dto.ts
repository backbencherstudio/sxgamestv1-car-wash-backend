// src/stripe/dto/create-subscription.dto.ts

import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}
