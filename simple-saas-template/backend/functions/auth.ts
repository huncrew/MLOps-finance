import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBService } from '../lib/dynamodb';
import { APIResponse } from '../types';

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
    const { action, userId, userData } = body;

    let response: APIResponse;

    switch (action) {
      case 'getUser':
        const user = await DynamoDBService.getUser(userId);
        response = {
          success: true,
          data: user,
        };
        break;

      case 'createUser':
        const newUser = await DynamoDBService.createUser(userData);
        response = {
          success: true,
          data: newUser,
        };
        break;

      default:
        response = {
          success: false,
          error: 'Invalid action',
        };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Auth handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
    };
  }
};