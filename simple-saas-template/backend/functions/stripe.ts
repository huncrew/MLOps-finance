import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { DynamoDBService } from '../lib/dynamodb';
import { APIResponse } from '../types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { priceId, userId } = body;

    if (!priceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Price ID is required',
        }),
      };
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      ui_mode: 'embedded',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      return_url: `${event.headers.origin || event.headers.Origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        userId: userId || 'anonymous',
      },
    });

    const response: APIResponse = {
      success: true,
      data: {
        clientSecret: session.client_secret,
        sessionId: session.id,
      },
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Stripe handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to create checkout session',
      }),
    };
  }
};

// Webhook handler for Stripe events
export const webhookHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    if (!sig || !endpointSecret) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing signature or webhook secret' }),
      };
    }

    const stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig,
      endpointSecret
    );

    // Handle the event
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;

      default:
        console.log(`Unhandled event type ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Webhook handler error:', error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Webhook handler failed' }),
    };
  }
};

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.userId;
    if (!userId || userId === 'anonymous') {
      console.error('No user ID found in session metadata');
      return;
    }

    // Update user subscription status
    await DynamoDBService.updateUser(userId, {
      subscriptionStatus: 'active',
    });

    // Create subscription record
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      await DynamoDBService.createSubscription({
        id: subscription.id,
        userId,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        planId: subscription.items.data[0]?.price.id || 'unknown',
      });
    }
  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    // Find user by subscription ID
    const userId = subscription.metadata?.userId;
    if (!userId) {
      console.error('No user ID found in subscription metadata');
      return;
    }

    // Update user subscription status
    const subscriptionStatus = subscription.status === 'active' ? 'active' : 'inactive';
    await DynamoDBService.updateUser(userId, {
      subscriptionStatus,
    });
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}