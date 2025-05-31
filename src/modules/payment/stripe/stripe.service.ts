// src/stripe/stripe.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-03-31.basil',
    });
  }

  async createCustomerWithSubscription(
    email: string,
    paymentMethodId: string,
    userId: string,
  ) {
    try {
      const priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
  
      const existingCustomers = await this.stripe.customers.list({ email, limit: 1 });
  
      let customer: Stripe.Customer;
  
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        console.log('[Info] Reusing existing customer:', customer.id);
      } else {
        customer = await this.stripe.customers.create({
          email,
          metadata: { userId },
        });
      }
  
      try {
        await this.stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id,
        });
      } catch (err) {
        if (err.code !== 'resource_already_attached') {
          throw err;
        }
      }
  
      await this.stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
  
      // Store billing_id
      await this.prisma.user.update({
        where: { id: userId },
        data: { billing_id: customer.id },
      });
  
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        expand: ['latest_invoice'],
      });

      // Get plan details
      const plan = await this.prisma.plan.findFirst({
        where: { stripe_price_id: priceId }
      });

      if (!plan) {
        throw new Error('Plan not found for the given price ID');
      }

      // Create subscription record
      const dbSubscription = await this.prisma.subscription.create({
        data: {
          user_id: userId,
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          plan_id: plan.id,
          status: subscription.status,
          is_active: subscription.status === 'active',
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          cancel_at_period_end: subscription.cancel_at_period_end,
        }
      });

      // Create payment transaction record
      await this.prisma.paymentTransaction.create({
        data: {
          user_id: userId,
          type: 'subscription',
          provider: 'stripe',
          reference_number: subscription.id,
          status: 'pending',
          amount: subscription.items.data[0].price.unit_amount / 100,
          currency: subscription.currency,
        }
      });
  
      return {
        customerId: customer.id,
        subscription: dbSubscription,
        stripeSubscription: subscription,
      };
    } catch (error) {
      console.error('[Stripe Error]', error);
      throw new Error(error.message);
    }
  }

  async constructWebhookEvent(rawBody: any, signature: string) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error) {
      throw new Error(`Webhook Error: ${error.message}`);
    }
  }

  async cancelSubscription(stripeSubId: string, userId: string) {
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          stripe_subscription_id: stripeSubId,
          user_id: userId,
        },
      });
  
      if (!subscription) {
        return { success: false, message: 'Subscription not found', data: null };
      }
  
      // Cancel on Stripe
      const stripeRes = await this.stripe.subscriptions.update(stripeSubId, {
        cancel_at_period_end: true, // or false if you want immediate cancel
      });
  
      // Update DB
      await this.prisma.subscription.update({
        where: { stripe_subscription_id: stripeSubId },
        data: {
          cancel_at_period_end: stripeRes.cancel_at_period_end,
          status: stripeRes.status,
          is_active: stripeRes.cancel_at_period_end ? true : false,
          canceled_at: stripeRes.cancel_at_period_end ? null : new Date(),
        },
      });
  
      return {
        success: true,
        message: 'Subscription cancelled successfully',
        data: stripeRes,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  async handleSuccessfulPayment(invoice: Stripe.Invoice & { subscription: string | Stripe.Subscription }) {
    try {
      const subscriptionId = typeof invoice.subscription === 'string' 
        ? invoice.subscription 
        : invoice.subscription?.id;
        
      if (!subscriptionId) {
        throw new Error('No subscription ID found in invoice');
      }

      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const customer = await this.stripe.customers.retrieve(invoice.customer as string);
      
      // First check if subscription exists
      const existingSubscription = await this.prisma.subscription.findFirst({
        where: {
          stripe_subscription_id: subscriptionId,
        },
      });

      if (!existingSubscription) {
        console.error(`[Payment Success Error] Subscription not found: ${subscriptionId}`);
        return {
          success: false,
          message: 'Subscription not found',
          subscription,
          customer,
          invoice
        };
      }

      // Update subscription record with correct ID
      await this.prisma.subscription.update({
        where: {
          stripe_subscription_id: subscriptionId,
        },
        data: {
          is_active: true,
          status: subscription.status,
        },
      });
      
      // Update payment transaction
      await this.prisma.paymentTransaction.updateMany({
        where: {
          reference_number: subscriptionId,
          status: 'pending',
        },
        data: {
          status: 'completed',
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          paid_amount: invoice.amount_paid / 100,
          paid_currency: invoice.currency,
        },
      });

      return {
        success: true,
        subscription,
        customer,
        invoice
      };
    } catch (error) {
      console.error('[Payment Success Error]', error);
      throw new Error(`Payment handling error: ${error.message}`);
    }
  }

  async handleFailedPayment(invoice: Stripe.Invoice & { subscription: string | Stripe.Subscription }) {
    try {
      const subscriptionId = typeof invoice.subscription === 'string' 
        ? invoice.subscription 
        : invoice.subscription?.id;
        
      if (!subscriptionId) {
        throw new Error('No subscription ID found in invoice');
      }
      const customerId = invoice.customer as string;
  
      if (!subscriptionId || !customerId) {
        throw new Error('Missing subscription or customer ID in invoice.');
      }
  
      // Optionally fetch more details (if needed)
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
  
      // Update your subscription record to reflect failure
      await this.prisma.subscription.update({
        where: {
          stripe_subscription_id: subscriptionId,
        },
        data: {
          is_active: false,
          status: subscription.status, // likely 'past_due' or 'incomplete'
        },
      });
  
      // Update any pending payment transaction
      await this.prisma.paymentTransaction.updateMany({
        where: {
          reference_number: subscriptionId,
          status: 'pending',
        },
        data: {
          status: 'failed',
        },
      });
  
      // (Optional) Send a notification to the user
      // const user = await this.prisma.user.findFirst({ where: { billing_id: customerId } });
      // if (user) {
      //   await this.userNotificationService.create(
      //     user.id,
      //     'PAYMENT_FAILED',
      //     'Your subscription payment failed. Please update your payment method.',
      //     { subscriptionId }
      //   );
      // }
  
      console.warn(`❗ Subscription payment failed for ${subscriptionId}`);
    } catch (error) {
      console.error(`handleFailedPayment error: ${error.message}`);
      throw new Error(`Failed to process payment failure: ${error.message}`);
    }
  }

  async handleSubscriptionCancelled(subscription: Stripe.Subscription) {
    try {
      const subscriptionId = subscription.id;
      const customerId = subscription.customer as string;
  
      // Step 1: Update your DB subscription record
      await this.prisma.subscription.update({
        where: {
          stripe_subscription_id: subscriptionId,
        },
        data: {
          is_active: false,
          status: 'canceled',
          canceled_at: new Date(), // Optional, you can use `subscription.canceled_at` if available
        },
      });
  
      // Step 2: Update payment transaction if needed
      await this.prisma.paymentTransaction.updateMany({
        where: {
          reference_number: subscriptionId,
          status: 'pending',
        },
        data: {
          status: 'cancelled',
        },
      });
  
      // Step 3: Optional notification to the user
      // const user = await this.prisma.user.findFirst({
      //   where: { billing_id: customerId },
      // });
      // if (user) {
      //   await this.userNotificationService.create(
      //     user.id,
      //     'SUBSCRIPTION_CANCELLED',
      //     'Your subscription has been cancelled.',
      //     { subscriptionId }
      //   );
      // }
  
      console.log(`🛑 Subscription ${subscriptionId} cancelled successfully`);
    } catch (error) {
      console.error(`[Subscription Cancelled Error]`, error.message);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }
  
  async handleSuccessfulOneTimePayment(paymentIntent: Stripe.PaymentIntent) {
    try {
      // Update payment transaction status
      await this.prisma.paymentTransaction.updateMany({
        where: {
          reference_number: paymentIntent.id,
          status: 'pending',
        },
        data: {
          status: 'completed',
          paid_amount: paymentIntent.amount / 100,
          paid_currency: paymentIntent.currency,
        },
      });

      console.log(`✅ One-time payment ${paymentIntent.id} processed successfully`);
    } catch (error) {
      console.error(`[One-Time Payment Success Error]`, error.message);
      throw new Error(`Failed to process one-time payment success: ${error.message}`);
    }
  }
  
  async createOneTimePayment(
    email: string,
    paymentMethodId: string,
    userId: string,
    amount: number,
    currency: string = 'usd',
  ) {
    try {
      console.log(email, paymentMethodId, userId, amount, currency)
      // Find or create customer
      const existingCustomers = await this.stripe.customers.list({ email, limit: 1 });
      let customer: Stripe.Customer;
      console.log("existingCustomers", existingCustomers)
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await this.stripe.customers.create({
          email,
          metadata: { userId },
        });
      }

      // Attach payment method if not already attached
      try {
        await this.stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id,
        });
      } catch (err) {
        if (err.code !== 'resource_already_attached') {
          throw err;
        }
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customer.id,
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        return_url: process.env.STRIPE_RETURN_URL || 'http://localhost:3000/payment/complete',
      });

      // Create payment transaction record
      await this.prisma.paymentTransaction.create({
        data: {
          user_id: userId,
          type: 'instant_service',
          provider: 'stripe',
          reference_number: paymentIntent.id,
          status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
          amount: amount,
          currency: currency,
          paid_amount: paymentIntent.status === 'succeeded' ? amount : 0,
          paid_currency: currency,
        }
      });

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      console.error('[One-Time Payment Error]', error);
      throw new Error(error.message);
    }
  }

}
