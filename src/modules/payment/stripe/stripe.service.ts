import { Injectable } from '@nestjs/common';
import { StripePayment } from '../../../common/lib/Payment/stripe/StripePayment';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

interface StripeSubscriptionWithDates extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
}

interface StripeInvoiceWithPaymentIntent extends Stripe.Invoice {
  payment_intent: Stripe.PaymentIntent;
}

interface StripeCustomerWithMetadata extends Stripe.Customer {
  metadata: {
    user_id: string;
  };
}

@Injectable()
export class StripeService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async handleWebhook(rawBody: string, sig: string | string[]) {
    return StripePayment.handleWebhook(rawBody, sig);
  }

  async createSubscription(customerId: string, priceId: string, userId: string) {
    try {
      console.log('Creating subscription with:', { customerId, priceId, userId });
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-03-31.basil'
      });

      // Get or create the plan
      console.log('Getting or creating plan...');
      let plan = await this.prisma.plan.findFirst({
        where: {
          stripe_price_id: priceId
        }
      });

      if (!plan) {
        // Get price details from Stripe
        const price = await stripe.prices.retrieve(priceId);
        console.log('Creating new plan with price:', price);
        plan = await this.prisma.plan.create({
          data: {
            name: 'Monthly Plan',
            description: 'Monthly subscription plan',
            price: price.unit_amount / 100,
            currency: price.currency,
            interval: 'month',
            stripe_price_id: priceId
          }
        });
      }
      console.log('Plan ready:', plan.id);

      // Create the subscription
      console.log('Creating Stripe subscription...');
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { 
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card']
        },
        expand: ['latest_invoice']
      }) as unknown as StripeSubscriptionWithDates;
      console.log('Subscription created:', subscription.id);

      // Get the latest invoice
      console.log('Getting latest invoice...');
      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      
      if (!latestInvoice) {
        console.error('No invoice found for subscription:', subscription.id);
        throw new Error('No invoice found for the subscription');
      }
      console.log('Latest invoice found:', latestInvoice.id);

      // Create a payment intent for the invoice
      console.log('Creating payment intent...');
      const paymentIntent = await stripe.paymentIntents.create({
        amount: latestInvoice.amount_due,
        currency: latestInvoice.currency,
        customer: customerId,
        payment_method_types: ['card'],
        metadata: {
          subscription_id: subscription.id,
          invoice_id: latestInvoice.id,
          user_id: userId
        }
      });
      console.log('Payment intent created:', paymentIntent.id);

      // Store initial subscription data
      console.log('Storing subscription in database...');
      try {
        const subscriptionData = {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          plan_id: plan.id,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
          status: 'incomplete',
          cancel_at_period_end: false,
          canceled_at: null
        };
        console.log('Subscription data to be stored:', subscriptionData);
        
        const dbSubscription = await this.prisma.subscription.create({
          data: subscriptionData
        });
        console.log('Subscription stored in database:', dbSubscription);
      } catch (dbError) {
        console.error('Error storing subscription in database:', dbError);
        throw dbError;
      }

      return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        status: subscription.status
      };
    } catch (error) {
      console.error('Error in createSubscription:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  }

  async handleSuccessfulSubscription(subscriptionId: string) {
    try {
      console.log('Handling successful subscription:', subscriptionId);
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-03-31.basil'
      });

      // Retrieve the subscription from Stripe
      console.log('Retrieving subscription from Stripe...', subscriptionId);
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['customer', 'latest_invoice.payment_intent'] // Expanded payment_intent here
      }) as unknown as StripeSubscriptionWithDates;
      console.log('Subscription retrieved from Stripe:', subscription.id);

      // Get the payment intent from the latest invoice
      console.log('Getting latest invoice and payment intent...');
      const latestInvoice = subscription.latest_invoice as StripeInvoiceWithPaymentIntent;
      if (!latestInvoice) {
        console.error('Error: No invoice found for the subscription', subscription.id);
        throw new Error('No invoice found for the subscription');
      }
      console.log('Latest invoice found:', latestInvoice.id);

      const paymentIntent = latestInvoice.payment_intent;
      if (!paymentIntent) {
         console.error('Error: No payment intent found for the latest invoice', latestInvoice.id);
        throw new Error('No payment intent found for the subscription');
      }
      console.log('Payment intent found:', paymentIntent.id);

      // Get the user ID from payment intent metadata
      console.log('Getting user ID from payment intent metadata...');
      const userId = paymentIntent.metadata.user_id;
      if (!userId) {
        console.error('Error: No user ID found in payment intent metadata for payment intent', paymentIntent.id);
        throw new Error('No user ID found in payment intent metadata');
      }
      console.log('User ID found:', userId);

      // Get the plan ID from the subscription
      console.log('Getting plan ID from subscription...');
       const priceId = subscription.items.data[0].price.id;
      console.log('Price ID from subscription:', priceId);

      // Get or create the plan
      console.log('Getting or creating plan...');
      let plan = await this.prisma.plan.findFirst({
        where: {
          stripe_price_id: priceId
        }
      });

      if (!plan) {
        // Get price details from Stripe
        const price = await stripe.prices.retrieve(priceId);
        console.log('Creating new plan with price details:', price);
        plan = await this.prisma.plan.create({
          data: {
            name: 'Monthly Plan',
            description: 'Monthly subscription plan',
            price: price.unit_amount / 100,
            currency: price.currency,
            interval: 'month',
            stripe_price_id: priceId
          }
        });
        console.log('New plan created:', plan.id);
      }
      console.log('Plan ready:', plan.id);

      // Store initial subscription data
      console.log('Preparing subscription data for database...');
      const subscriptionData = {
        user_id: userId,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        plan_id: plan.id,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
      };
      console.log('Subscription data to be stored:', subscriptionData);

      console.log('Storing subscription in database...');
      const dbSubscription = await this.prisma.subscription.create({
        data: subscriptionData
      });
      console.log('Subscription stored in database:', dbSubscription);

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      };
    } catch (error) {
      console.error('Error in handleSuccessfulSubscription:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  }

  async createCustomer(email: string, name: string, user_id: string) {
    try {
      return await StripePayment.createCustomer({
        email,
        name,
        user_id
      });
    } catch (error) {
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-03-31.basil'
      });

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
        ...(cancelAtPeriodEnd ? {} : { cancel_immediately: true })
      }) as unknown as StripeSubscriptionWithDates;

      // Find the subscription in database first
      let dbSubscription = await this.prisma.subscription.findFirst({
        where: {
          stripe_subscription_id: subscriptionId
        }
      });

      // If subscription doesn't exist in database, create it
      if (!dbSubscription) {
        // Get the customer to find the user_id
        const customer = await stripe.customers.retrieve(subscription.customer as string) as unknown as StripeCustomerWithMetadata;
        if (!customer || !customer.metadata?.user_id) {
          throw new Error('Could not find user ID for subscription');
        }

        // Get the plan ID from the subscription
        const priceId = subscription.items.data[0].price.id;
        const plan = await this.prisma.plan.findFirst({
          where: {
            stripe_price_id: priceId
          }
        });

        if (!plan) {
          throw new Error('Plan not found in database');
        }

        // Create the subscription record
        dbSubscription = await this.prisma.subscription.create({
          data: {
            user_id: customer.metadata.user_id,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            plan_id: plan.id,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
          }
        });
      }

      // Update subscription in database
      await this.prisma.subscription.update({
        where: {
          id: dbSubscription.id
        },
        data: {
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          current_period_end: new Date(subscription.current_period_end * 1000)
        }
      });

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      };
    } catch (error) {
      throw error;
    }
  }
}
