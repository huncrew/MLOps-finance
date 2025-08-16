import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBService } from '../lib/dynamodb';
import { APIResponse } from '../types';

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

interface AIRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  userId?: string;
}

interface AIResponse {
  response: string;
  model: string;
  tokens: number;
  requestId: string;
}

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
    const { prompt, model = 'anthropic.claude-3-haiku-20240307-v1:0', maxTokens = 1000, temperature = 0.7, userId } = body as AIRequest;

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Prompt is required',
        }),
      };
    }

    // Check user subscription status if userId provided
    if (userId) {
      const user = await DynamoDBService.getUser(userId);
      if (!user || user.subscriptionStatus !== 'active') {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Active subscription required for AI features',
          }),
        };
      }
    }

    // Prepare the request for Claude
    const requestBody = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };

    // Call Bedrock
    const command = new InvokeModelCommand({
      modelId: model,
      body: JSON.stringify(requestBody),
      contentType: 'application/json',
      accept: 'application/json',
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Extract the response text
    const aiResponse = responseBody.content[0]?.text || 'No response generated';
    const tokensUsed = responseBody.usage?.output_tokens || 0;

    // Store AI session if userId provided
    if (userId) {
      await storeAISession({
        userId,
        prompt,
        response: aiResponse,
        model,
        tokens: tokensUsed,
      });
    }

    const result: APIResponse<AIResponse> = {
      success: true,
      data: {
        response: aiResponse,
        model,
        tokens: tokensUsed,
        requestId: event.requestContext.requestId,
      },
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('AI handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'AI processing failed',
      }),
    };
  }
};

// Get AI history for a user
export const historyHandler = async (
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
    const userId = event.pathParameters?.userId || event.queryStringParameters?.userId;

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'User ID is required',
        }),
      };
    }

    // Get AI sessions for user (this would need to be implemented in DynamoDBService)
    const sessions = await getAIHistory(userId);

    const response: APIResponse = {
      success: true,
      data: sessions,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('AI history handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to retrieve AI history',
      }),
    };
  }
};

async function storeAISession(session: {
  userId: string;
  prompt: string;
  response: string;
  model: string;
  tokens: number;
}) {
  try {
    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    // This would be implemented in DynamoDBService
    // For now, we'll just log it
    console.log('Storing AI session:', {
      id: sessionId,
      ...session,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error storing AI session:', error);
  }
}

async function getAIHistory(userId: string) {
  try {
    // This would query DynamoDB for AI sessions
    // For now, return mock data
    console.log('Getting AI history for user:', userId);
    return [
      {
        id: 'session-1',
        prompt: 'Analyze this data...',
        response: 'Based on the analysis...',
        model: 'anthropic.claude-3-haiku-20240307-v1:0',
        tokens: 150,
        createdAt: new Date().toISOString(),
      },
    ];
  } catch (error) {
    console.error('Error getting AI history:', error);
    return [];
  }
}