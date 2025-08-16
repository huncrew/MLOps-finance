import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocument.from(
  new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
  }),
  {
    marshallOptions: {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
  }
);

const TABLE_NAME = process.env.DATABASE_TABLE_NAME!;

export class DynamoDBService {
  static async getUser(userId: string) {
    try {
      const result = await client.get({
        TableName: TABLE_NAME,
        Key: {
          pk: `USER#${userId}`,
          sk: `USER#${userId}`,
        },
      });
      return result.Item;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }

  static async createUser(user: any) {
    try {
      const item = {
        pk: `USER#${user.id}`,
        sk: `USER#${user.id}`,
        gsi1pk: `EMAIL#${user.email}`,
        gsi1sk: `USER#${user.id}`,
        ...user,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await client.put({
        TableName: TABLE_NAME,
        Item: item,
      });

      return item;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  static async updateUser(userId: string, updates: any) {
    try {
      const result = await client.update({
        TableName: TABLE_NAME,
        Key: {
          pk: `USER#${userId}`,
          sk: `USER#${userId}`,
        },
        UpdateExpression: "SET #updatedAt = :updatedAt, #subscriptionStatus = :subscriptionStatus",
        ExpressionAttributeNames: {
          "#updatedAt": "updatedAt",
          "#subscriptionStatus": "subscriptionStatus",
        },
        ExpressionAttributeValues: {
          ":updatedAt": new Date().toISOString(),
          ":subscriptionStatus": updates.subscriptionStatus,
        },
        ReturnValues: "ALL_NEW",
      });

      return result.Attributes;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  static async getSubscription(userId: string) {
    try {
      const result = await client.get({
        TableName: TABLE_NAME,
        Key: {
          pk: `USER#${userId}`,
          sk: `SUBSCRIPTION#${userId}`,
        },
      });
      return result.Item;
    } catch (error) {
      console.error("Error getting subscription:", error);
      throw error;
    }
  }

  static async createSubscription(subscription: any) {
    try {
      const item = {
        pk: `USER#${subscription.userId}`,
        sk: `SUBSCRIPTION#${subscription.userId}`,
        gsi1pk: `STRIPE#${subscription.stripeSubscriptionId}`,
        gsi1sk: `SUBSCRIPTION#${subscription.userId}`,
        ...subscription,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await client.put({
        TableName: TABLE_NAME,
        Item: item,
      });

      return item;
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  }
}