// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "simple-saas-template",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const stage = $app.stage;
    
    // DynamoDB table for users and subscriptions
    const table = new sst.aws.Dynamo("Database", {
      fields: {
        pk: "string",
        sk: "string",
        gsi1pk: "string",
        gsi1sk: "string",
      },
      primaryIndex: { hashKey: "pk", rangeKey: "sk" },
      globalIndexes: {
        GSI1: { hashKey: "gsi1pk", rangeKey: "gsi1sk" },
      },
    });

    // Cognito User Pool for authentication
    const userPool = new sst.aws.CognitoUserPool("UserPool", {
      usernames: ["email"],
    });

    const userPoolClient = userPool.addClient("UserPoolClient", {
      authFlows: ["ADMIN_NO_SRP_AUTH", "USER_PASSWORD_AUTH", "USER_SRP_AUTH"],
      generateSecret: false,
      explicitAuthFlows: ["ADMIN_NO_SRP_AUTH", "USER_PASSWORD_AUTH", "USER_SRP_AUTH"],
      callbackUrls: [
        "http://localhost:3000/api/auth/callback/cognito",
        "https://d22rqzy2a8pk72.cloudfront.net/api/auth/callback/cognito",
      ],
      logoutUrls: [
        "http://localhost:3000",
        "https://d22rqzy2a8pk72.cloudfront.net",
      ],
    });

    // API Gateway for backend functions
    const api = new sst.aws.ApiGatewayV2("Api", {
      cors: {
        allowCredentials: true,
        allowHeaders: ["content-type", "authorization"],
        allowMethods: ["*"],
        allowOrigins: ["http://localhost:3000", "https://localhost:3000", "https://d22rqzy2a8pk72.cloudfront.net"],
      },
    });

    // Add routes to API
    api.route("POST /auth/session", "backend/functions/auth.handler", {
      environment: {
        DATABASE_TABLE_NAME: table.name,
      },
    });
    api.route("POST /stripe/checkout", "backend/functions/stripe.handler", {
      environment: {
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "sk_test_placeholder",
        DATABASE_TABLE_NAME: table.name,
      },
    });
    api.route("POST /stripe/webhook", "backend/functions/stripe.webhookHandler", {
      environment: {
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "sk_test_placeholder",
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder",
        DATABASE_TABLE_NAME: table.name,
      },
    });
    api.route("GET /subscription/status", "backend/functions/subscription.handler", {
      environment: {
        DATABASE_TABLE_NAME: table.name,
      },
    });
    api.route("POST /ai/generate", "backend/functions/ai.handler", {
      environment: {
        DATABASE_TABLE_NAME: table.name,
      },
    });
    api.route("GET /ai/history", "backend/functions/ai.historyHandler", {
      environment: {
        DATABASE_TABLE_NAME: table.name,
      },
    });

    // Next.js frontend
    const web = new sst.aws.Nextjs("Web", {
      environment: {
        NEXTAUTH_URL: "https://d22rqzy2a8pk72.cloudfront.net",
        NEXTAUTH_SECRET: "your-secret-key-here", // TODO: Use proper secret management
        COGNITO_CLIENT_ID: userPoolClient.id,
        COGNITO_CLIENT_SECRET: userPoolClient.secret || "",
        COGNITO_ISSUER: $interpolate`https://cognito-idp.us-east-1.amazonaws.com/${userPool.id}`,
        DATABASE_TABLE_NAME: table.name,
        API_URL: api.url,
        NEXT_PUBLIC_API_URL: api.url,
      },
      link: [table, userPool, userPoolClient, api],
    });

    return {
      api: api.url,
      web: web.url,
      userPool: userPool.id,
      userPoolClient: userPoolClient.id,
    };
  },
});
