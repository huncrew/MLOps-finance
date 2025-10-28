# Simple SaaS Template (Terraform + Python)

A premium, production-ready SaaS starter template built with Next.js, AWS, and Stripe. **Migrated from SST to Terraform + Python** for enhanced infrastructure control and AI/ML capabilities. Designed specifically for **AI-powered financial intelligence** and data analytics platforms with a professional, enterprise-grade design.

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
- AWS Lambda functions (Python 3.11)
- AWS API Gateway HTTP API
- AWS Cognito for user management
- DynamoDB for data persistence
- AWS Bedrock for AI capabilities
- SSM Parameter Store for configuration

### Infrastructure
- Terraform for Infrastructure as Code
- Modular Terraform design for reusability
- CloudWatch monitoring and alerting
- Least-privilege IAM security

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Terraform 1.6+
- AWS CLI configured with appropriate permissions
- Stripe account for payment processing

### 1. Clone and Install

\`\`\`bash
git clone <your-repo-url>
cd simple-saas-template
npm install
cd frontend && npm install
\`\`\`

### 2. Environment Setup

Copy the environment template and fill in your values:

\`\`\`bash
cp .env.example .env.local
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
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

### 3. Build Backend Functions

Build the Python Lambda functions:

\`\`\`bash
cd backend
make build
\`\`\`

### 4. Deploy Infrastructure

Initialize and deploy the Terraform infrastructure:

\`\`\`bash
cd infra/terraform
terraform init
terraform plan
terraform apply
\`\`\`

Get the outputs and update your \`.env.local\`:

\`\`\`bash
terraform output
\`\`\`

### 5. Configure Secrets

Set your Stripe secrets in AWS SSM Parameter Store:

\`\`\`bash
aws ssm put-parameter --name "/simple-saas-template/dev/stripe/secret-key" --value "sk_test_..." --type "SecureString" --overwrite
aws ssm put-parameter --name "/simple-saas-template/dev/stripe/webhook-secret" --value "whsec_..." --type "SecureString" --overwrite
\`\`\`

### 6. Start Development

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## Project Structure

\`\`\`
simple-saas-template/
├── frontend/                     # Next.js frontend application
│   ├── src/                     # Source code
│   │   ├── app/                 # App Router pages
│   │   │   ├── (auth)/         # Authentication pages
│   │   │   ├── dashboard/      # Protected dashboard
│   │   │   └── api/            # API routes
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/             # ShadCN components
│   │   │   └── providers/      # Context providers
│   │   ├── lib/                # Utility functions
│   │   └── types/              # TypeScript definitions
│   ├── public/                 # Static assets
│   ├── package.json            # Frontend dependencies
│   └── next.config.ts          # Next.js configuration
├── backend/                     # Python Lambda functions
│   ├── lambdas/                # Lambda function code
│   │   ├── common/             # Shared utilities
│   │   ├── api/                # API handlers (auth, stripe, ai, subscription)
│   │   └── upload/             # File upload handlers
│   ├── dist/                   # Built Lambda packages
│   ├── Makefile                # Build automation
│   ├── build.sh                # Build script
│   └── requirements-dev.txt    # Development dependencies
├── infra/terraform/            # Infrastructure as Code
│   ├── main.tf                 # Root configuration
│   ├── variables.tf            # Input variables
│   ├── outputs.tf              # Output values
│   └── modules/                # Reusable modules
├── docs/                       # Documentation
│   ├── context/                # Business context
│   └── architecture/           # Technical architecture
├── .kiro/steering/             # AI development guidelines
├── warp.md                     # Quick commands
├── codex.md                    # Agent usage guide
└── package.json                # Root monorepo configuration
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

1. **Frontend**: \`npm run dev\` - Next.js development server
2. **Backend Build**: \`npm run backend:build\` - Build Lambda functions
3. **Backend Test**: \`npm run backend:test\` - Run Python tests
4. **Backend Format**: \`npm run backend:format\` - Format Python code
5. **Type Check**: \`npm run type-check\` - TypeScript validation
6. **Lint**: \`npm run lint\` - ESLint validation

### Infrastructure Management

1. **Initialize**: \`npm run infra:init\` - Initialize Terraform
2. **Plan**: \`npm run infra:plan\` - Preview changes
3. **Deploy**: \`npm run infra:apply\` - Deploy infrastructure
4. **Destroy**: \`npm run infra:destroy\` - Remove resources
5. **Validate**: \`npm run infra:validate\` - Validate configuration

### Environment Variables

The template uses different environment variables for different contexts:

- **Local Development**: \`.env.local\`
- **Terraform Variables**: \`infra/terraform/terraform.tfvars\`
- **Runtime Configuration**: AWS SSM Parameter Store
- **Production**: Environment-specific Terraform workspaces

## Customization

### Adding New Features

1. **Frontend**: Add components in \`frontend/src/components/\`
2. **Backend**: Add Lambda functions in \`backend/lambdas/api/\`
3. **Infrastructure**: Update \`infra/terraform/main.tf\` to add resources
4. **Database**: Extend DynamoDB schema in \`backend/lambdas/common/dynamodb.py\`
5. **Build**: Update \`backend/Makefile\` to include new functions

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

## Migration from SST

This template has been migrated from SST (Serverless Stack) to Terraform + Python. Key changes:

### Infrastructure Changes
- **SST → Terraform**: Infrastructure as Code using Terraform modules
- **TypeScript → Python**: Lambda functions migrated to Python 3.11
- **CDK → Terraform**: More control and standardization over infrastructure
- **Local Development**: Simplified development workflow

### Benefits of Migration
- **Better Infrastructure Control**: Terraform provides more flexibility and control
- **AI/ML Integration**: Python ecosystem better suited for AI development
- **Standardization**: Industry-standard infrastructure management
- **Modularity**: Reusable Terraform modules for different environments

### Compatibility
- **Frontend**: Next.js frontend remains completely unchanged
- **API Contracts**: All API endpoints maintain the same request/response format
- **Authentication**: Cognito integration preserved
- **Payments**: Stripe integration unchanged
- **User Experience**: No changes to user-facing functionality

### Migration Guide
For existing SST deployments:

1. **Backup Data**: Export existing DynamoDB data
2. **Deploy New Infrastructure**: Use Terraform to create new resources
3. **Migrate Data**: Import data to new DynamoDB table
4. **Update DNS**: Point domain to new API Gateway
5. **Remove Old Resources**: Clean up SST resources

See `docs/architecture/architecture.md` for detailed migration procedures.

## License

MIT License - see LICENSE file for details.

## Support

For questions and support:
- Check the documentation
- Open an issue on GitHub
- Contact support at support@example.com

---

Built with ❤️ for the developer community. Happy coding!