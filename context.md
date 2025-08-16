Objective:

We need to create a new, simple SaaS template using the following tech stack: Next.js with TypeScript for the frontend, ShadCN for UI components, AWS Cognito for authentication (integrated via NextAuth), Node.js/TypeScript for the backend running on AWS Lambda, and DynamoDB for storage. We’ll use SST to manage local development and deployment. 

The template will be used, along with business context to set up AI SaaS apps. Generally these will have a dashboard that can be logged into, behind a stripe paywall, to show some data.
We want there to be a landing page too of course, that’s clean and modern looking and sleek with a nice design as it’s for AI users, probably financial or SaaS.

I want it to be as simple as possible, so it can be setup quickly, and then used quickly too for new projects.

Requirements:
1. Start a new project from scratch using these technologies.
2. Migrate only the essential parts from our existing app: just the dashboard layout and the Stripe integration. We do not need any of the translation features or any other complex parts—just a clean, minimal template.
3. Keep everything as simple as possible. We want a lightweight starting point that we can easily customize further.
4. Use SST to enable local testing so we can run the Lambdas and the frontend locally without deploying each time.
End Goal: We want Kiro to generate this entire setup for us, giving us a simple, clean SaaS starter template with just the essentials carried over. No extra complexity, just a fast and easy foundation.