import {
  Body,
  Controller,
  Post,
  Headers,
  Req,
  Res,
  HttpException,
  HttpStatus,
  RawBodyRequest,
  UseGuards,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CreateSubscriptionDto } from './dto/create-stripe.dto';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('payment/stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('/subscribe')
  async subscribe(@Body() dto: CreateSubscriptionDto) {
    const { email, paymentMethodId, userId } = dto;

    try {
      const { customerId, subscription } =
        await this.stripeService.createCustomerWithSubscription(email, paymentMethodId, userId);

      return {
        success: true,
        message: 'Subscription created successfully!',
        customerId,
        subscriptionId: subscription.id,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/cancel-subscription')
  async cancelSubscription(
    @Body() data: { subscriptionId: string },
    @Req() req: Request & { user?: { userId: string } }
  ) {
    try {
      if (!req.user?.userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      if (!data.subscriptionId) {
        throw new HttpException('Missing subscription ID', HttpStatus.BAD_REQUEST);
      }

      const result = await this.stripeService.cancelSubscription(
        data.subscriptionId,
        req.user.userId
      );

      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }

      return {
        success: true,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Subscription cancellation failed',
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/instant-payment')
  async createInstantPayment(
    @Body() data: { 
      email: string;
      paymentMethodId: string;
      userId: string;
      amount: number;
      currency?: string;
    },
    @Req() req: Request & { user?: { userId: string } }
  ) {
    try {
      if (!req.user?.userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      console.log("data",data)
      const result = await this.stripeService.createOneTimePayment(
        data.email,
        data.paymentMethodId,
        data.userId,
        data.amount,
        data.currency
      );
      console.log("result",result)
      return {
        success: true,
        message: 'Payment processed successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Payment processing failed',
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('/webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response
  ) {
    try {
      const event = await this.stripeService.constructWebhookEvent(req.rawBody, signature);

      switch (event.type) {
        case 'invoice.paid':
          const invoice = event.data.object as Stripe.Invoice & { subscription: string | Stripe.Subscription };
          console.log('[Info] Invoice paid:', invoice);
          await this.stripeService.handleSuccessfulPayment(invoice);
          break;

        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log('[Info] Payment Intent succeeded:', paymentIntent.id);
          await this.stripeService.handleSuccessfulOneTimePayment(paymentIntent);
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object as Stripe.Invoice & { subscription: string | Stripe.Subscription };
          await this.stripeService.handleFailedPayment(failedInvoice);
          break;

        case 'customer.subscription.deleted':
          const deletedSub = event.data.object as Stripe.Subscription & { subscription: string | Stripe.Subscription };
          await this.stripeService.handleSubscriptionCancelled(deletedSub);
          break;

        // case 'customer.subscription.updated':
        //   const updatedSub = event.data.object as Stripe.Subscription;
        //   await this.stripeService.handleSubscriptionUpdated(updatedSub);
        //   break;
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('[Webhook Error]', error.message);
      return res.status(400).json({ error: error.message });
    }
  }

 
}
