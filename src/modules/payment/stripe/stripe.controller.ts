import { Controller, Post, Body, Headers, Req, Param } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';
import { TransactionRepository } from '../../../common/repository/transaction/transaction.repository';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

@Controller('payment/stripe')
export class StripeController {
  private prisma: PrismaClient;

  constructor(private readonly stripeService: StripeService) {
    this.prisma = new PrismaClient();
  }

  @Post('create-subscription')
  async createSubscription(@Body() body: { 
    email: string; 
    name: string;
    user_id: string;
    payment_method_id?: string;
  }) {
    try {
      // Validate required fields
      if (!body.email || !body.name || !body.user_id) {
        throw new Error('Email, name, and user_id are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        throw new Error('Invalid email format');
      }

      // Get price ID from environment
      const priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
      if (!priceId) {
        throw new Error('Stripe subscription price ID is not configured');
      }

      console.log('Creating subscription for user:', body.user_id);

      // Create a new customer
      const customer = await this.stripeService.createCustomer(
        body.email, 
        body.name, 
        body.user_id
      );
      
      // Create the subscription with payment method if provided
      const subscription = await this.stripeService.createSubscription(
        customer.id,
        priceId,
        body.user_id,
        body.payment_method_id
      );

      return {
        success: true,
        data: {
          ...subscription,
          customer: customer.id
        }
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Post('confirm-subscription')
  async confirmSubscription(@Body() body: {
    payment_intent_id: string;
    payment_method_id: string;
  }) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-03-31.basil'
      });

      const paymentIntent = await stripe.paymentIntents.confirm(
        body.payment_intent_id,
        {
          payment_method: body.payment_method_id,
        }
      );

      return {
        success: true,
        data: {
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Post('subscription/:subscriptionId/cancel')
  async cancelSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: { cancelAtPeriodEnd?: boolean }
  ) {
    try {
      const result = await this.stripeService.cancelSubscription(
        subscriptionId,
        body.cancelAtPeriodEnd ?? true
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Update the webhook handler to include subscription events
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
  ) {
    try {
      console.log('Received webhook event');
      const payload = req.rawBody.toString();
      const event = await this.stripeService.handleWebhook(payload, signature);
      console.log('Webhook event type:', event.type);

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log('Payment succeeded:', paymentIntent.id);
          
          // Update transaction status
          await TransactionRepository.updateTransaction({
            reference_number: paymentIntent.id,
            status: 'succeeded',
            paid_amount: paymentIntent.amount / 100,
            paid_currency: paymentIntent.currency,
            raw_status: paymentIntent.status,
          });

          // If this payment intent is for a subscription, update the subscription status
          if (paymentIntent.metadata?.subscription_id) {
            const subscription = await this.stripeService.handleSuccessfulSubscription(
              paymentIntent.metadata.subscription_id
            );
            console.log('Subscription updated after payment:', subscription);
          }
          break;

        case 'customer.subscription.created':
          console.log('Processing subscription.created event');
          const subscription = event.data.object;
          // Handle subscription creation
          const result = await this.stripeService.handleSuccessfulSubscription(subscription.id);
          console.log('Subscription creation result:', result);
          await TransactionRepository.updateTransaction({
            reference_number: subscription.id,
            status: subscription.status,
            paid_amount: subscription.items.data[0].price.unit_amount / 100,
            paid_currency: subscription.currency,
            raw_status: subscription.status,
          });
          break;

        case 'customer.subscription.updated':
          console.log('Processing subscription.updated event');
          const updatedSubscription = event.data.object;
          // Update subscription in database
          const updateResult = await this.stripeService.handleSuccessfulSubscription(updatedSubscription.id);
          console.log('Subscription update result:', updateResult);
          await TransactionRepository.updateTransaction({
            reference_number: updatedSubscription.id,
            status: updatedSubscription.status,
            raw_status: updatedSubscription.status,
          });
          break;

        case 'customer.subscription.deleted':
          console.log('Processing subscription.deleted event');
          const deletedSubscription = event.data.object;
          // Update subscription status in database
          const dbSubscription = await this.prisma.subscription.findFirst({
            where: {
              stripe_subscription_id: deletedSubscription.id
            }
          });

          if (dbSubscription) {
            await this.prisma.subscription.update({
              where: {
                id: dbSubscription.id
              },
              data: {
                status: 'canceled',
                canceled_at: new Date(),
                cancel_at_period_end: true
              }
            });
          }

          // Update transaction record
          await TransactionRepository.updateTransaction({
            reference_number: deletedSubscription.id,
            status: 'canceled',
            raw_status: deletedSubscription.status,
          });
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return { received: false, error: error.message };
    }
  }
}
