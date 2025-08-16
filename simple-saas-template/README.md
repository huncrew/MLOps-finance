# Simple SaaS Template

A premium, production-ready SaaS starter template built with Next.js, AWS, and Stripe. Designed specifically for **AI-powered financial intelligence** and data analytics platforms with a professional, enterprise-grade design.

## Design Theme

This template features a **professional AI intelligence SaaS theme** with:

- 🎯 **Premium Design**: Modern card-based layout with sophisticated data visualization blocks
- 📊 **Data-Driven UI**: Real metrics, KPIs, and performance indicators throughout
- 🤖 **AI-Focused**: Tailored for artificial intelligence and machine learning platforms
- 💼 **Enterprise-Ready**: Professional color schemes and typography suitable for B2B SaaS
- 📈 **Financial Intelligence**: Optimized for fintech, trading, and financial analytics applications
- 🎨 **Modern Aesthetics**: Clean white backgrounds with strategic use of emerald/green accents

## Features

- 🚀 **Next.js 15** with TypeScript and App Router
- 🎨 **ShadCN UI** components with Tailwind CSS
- 🔐 **AWS Cognito** authentication via NextAuth.js
- 💳 **Stripe** subscription management with embedded checkout
- ☁️ **AWS Lambda** serverless backend functions
- 🗄️ **DynamoDB** for data storage
- 🤖 **AI Integration** ready with AWS Bedrock
- 🏗️ **SST** for infrastructure as code and local development
- 📱 **Responsive** design optimized for all devices

## Tech Stack

### Frontend
- Next.js 15 with TypeScript
- ShadCN UI components
- Tailwind CSS
- NextAuth.js for authentication
- Stripe React components

### Backend
- AWS Lambda functions (Node.js/TypeScript)
- AWS API Gateway
- AWS Cognito for user management
- DynamoDB for data persistence
- AWS Bedrock for AI capabilities

### Infrastructure
- SST (Serverless Stack) for IaC
- AWS CDK under the hood
- Local development with hot reload

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- Stripe account for payment processing

### 1. Clone and Install

\`\`\`bash
git clone <your-repo-url>
cd simple-saas-template
npm install
\`\`\`

### 2. Environment Setup

Copy the environment template and fill in your values:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Update the following variables in \`.env.local\`:

\`\`\`env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Stripe Configuration (get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
\`\`\`

### 3. Deploy Infrastructure

Deploy the AWS infrastructure (DynamoDB, Cognito, API Gateway, Lambda functions):

\`\`\`bash
npm run deploy
\`\`\`

This will output the API URL and Cognito configuration. Update your \`.env.local\` with these values.

### 4. Start Development

For frontend-only development:
\`\`\`bash
npm run dev
\`\`\`

For full-stack development with local Lambda functions:
\`\`\`bash
npm run dev:full
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## Project Structure

\`\`\`
simple-saas-template/
├── src/                          # Next.js frontend
│   ├── app/                      # App Router pages
│   │   ├── (auth)/              # Authentication pages
│   │   ├── dashboard/           # Protected dashboard
│   │   └── api/                 # API routes
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # ShadCN components
│   │   └── providers/           # Context providers
│   ├── lib/                     # Utility functions
│   └── types/                   # TypeScript definitions
├── backend/                      # AWS Lambda functions
│   ├── functions/               # Lambda handlers
│   ├── lib/                     # Shared utilities
│   └── types/                   # Backend types
├── sst.config.ts                # SST configuration
└── package.json
\`\`\`

## Key Components

### Authentication
- **Sign In/Up**: \`/auth/signin\` and \`/auth/signup\`
- **Protected Routes**: Middleware protects \`/dashboard/*\`
- **Session Management**: NextAuth.js with Cognito provider

### Subscription Management
- **Pricing Plans**: Configurable in \`src/lib/subscription.ts\`
- **Stripe Integration**: Embedded checkout for seamless UX
- **Subscription Gate**: Protects premium features

### AI Integration
- **AI Service**: Ready for AWS Bedrock integration
- **Chat Component**: \`AIChat\` component for user interactions
- **Token Tracking**: Usage monitoring and billing

## Development Workflow

### Local Development

1. **Frontend Only**: \`npm run dev\` - Next.js development server
2. **Full Stack**: \`npm run dev:full\` - SST dev with Next.js
3. **Type Check**: \`npm run type-check\` - TypeScript validation
4. **Lint**: \`npm run lint\` - ESLint validation

### Deployment

1. **Development**: \`npm run deploy\` - Deploy to dev stage
2. **Production**: \`npm run deploy:prod\` - Deploy to production
3. **Remove**: \`npm run remove\` - Remove all AWS resources

### Environment Variables

The template uses different environment variables for different contexts:

- **Local Development**: \`.env.local\`
- **SST Deployment**: Environment variables in \`sst.config.ts\`
- **Production**: Set via SST or AWS Systems Manager

## Customization

### Adding New Features

1. **Frontend**: Add components in \`src/components/\`
2. **Backend**: Add Lambda functions in \`backend/functions/\`
3. **Routes**: Update \`sst.config.ts\` to add API routes
4. **Database**: Extend DynamoDB schema in \`backend/lib/dynamodb.ts\`

### Styling

- **Theme**: Modify \`src/app/globals.css\`
- **Components**: Customize ShadCN components in \`src/components/ui/\`
- **Colors**: Update Tailwind config in \`tailwind.config.ts\`

### Stripe Configuration

1. Create products and prices in Stripe Dashboard
2. Update \`PRICING_PLANS\` in \`src/lib/subscription.ts\`
3. Configure webhook endpoints for subscription events

## Deployment

### Prerequisites

- AWS CLI configured
- Stripe account with API keys
- Domain name (optional, for custom domains)

### Production Deployment

1. **Set Environment Variables**:
   \`\`\`bash
   export STRIPE_SECRET_KEY=sk_live_...
   export STRIPE_WEBHOOK_SECRET=whsec_...
   \`\`\`

2. **Deploy to Production**:
   \`\`\`bash
   npm run deploy:prod
   \`\`\`

3. **Configure Domain** (optional):
   Update \`sst.config.ts\` with your domain configuration.

## Security Considerations

- **Environment Variables**: Never commit secrets to version control
- **API Keys**: Use AWS Systems Manager for production secrets
- **CORS**: Configure appropriate origins in API Gateway
- **Authentication**: Cognito handles password policies and MFA
- **Stripe Webhooks**: Verify webhook signatures

## Monitoring and Logging

- **CloudWatch**: Automatic logging for Lambda functions
- **Error Tracking**: Built-in error boundaries and logging
- **Performance**: Monitor API Gateway and Lambda metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions and support:
- Check the documentation
- Open an issue on GitHub
- Contact support at support@example.com

---

Built with ❤️ for the developer community. Happy coding!