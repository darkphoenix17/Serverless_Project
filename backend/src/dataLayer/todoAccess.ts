import * as AWS from 'aws-sdk'
//import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from "../models/TodoItem"
import { TodoUpdate } from '../models/TodoUpdate'
import { createLogger } from '../utils/logger'

const logger = createLogger('todo-access')
const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);


export class TodosAccess {
  constructor(
    private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly indexName = process.env.TODOS_INDEX_NAME,
    private readonly bucketName = process.env.TODOS_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
  ) { }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    logger.info(`Creating a todo with ID ${todoItem.todoId}`)
    //logging creating a todo with ID
    const newItem = {
      ...todoItem,
      attachmentUrl: `https://${this.bucketName}.s3.amazonaws.com/${todoItem.todoId}`
    }
    await this.docClient.put({
      TableName: this.todosTable,
      Item: newItem
    }).promise();

    return todoItem;
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    logger.info('Getting all todo items')
    //logging to get all todos
    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.indexName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues:
      {
        ':userId': userId
      },
      ScanIndexForward: false
    }).promise()

    return result.Items as TodoItem[];
  }

  // async getTodo(id: string): Promise<TodoItem> {
  //   const result = await this.docClient.query({
  //     TableName: this.todosTable,
  //     KeyConditionExpression: 'todoId = :todoId',
  //     ExpressionAttributeValues: {
  //       ':todoId': id
  //     }
  //   }).promise()

  //   const item = result.Items[0];
  //   return item as TodoItem;
  // }

  async deleteTodo(todoId: string, userId: string): Promise<string> {
    logger.info(`Deleting a todo with ID ${todoId}`)
    //logging Deleting todo
    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        },
        ConditionExpression: 'todoId = :todoId',
        ExpressionAttributeValues: {
          ':todoId': todoId
        }
      })
      .promise()

      return userId
  }

  async updateTodo(userId: string, todoId: string, todoItem: TodoUpdate) {
    logger.info(`Update todo with name ${todoItem.name} of user ${userId}`);
      //logging into todoAccess
    await this.docClient.update({
        TableName: this.todosTable, 
        // Update with key: 
        Key: {
            userId, 
            todoId, 
        }, 
        UpdateExpression: 
            'set #name = :name, #dueDate = :dueDate, #done = :done',
        ExpressionAttributeValues: {
            ':name': todoItem.name,
            ':dueDate': todoItem.dueDate, 
            ':done': todoItem.done
        }, 
        ExpressionAttributeNames: {
            '#name': 'name', 
            '#dueDate': 'dueDate', 
            '#done': 'done'
        }
    }).promise()
}
  // async updateTodo(todo: TodoItem): Promise<TodoItem> {
  //   logger.info(`Updating a todo with ID ${todo.todoId}`)
  //   //lgooing Updating todo
  //   const updateExpression = 'set #n = :name, dueDate = :dueDate, done = :done'
  //   await this.docClient.update({
  //     TableName: this.todosTable,
  //     Key: {
  //       UserId: todo.userId,
  //       todoId: todo.todoId
  //     },

  //     UpdateExpression: updateExpression,
  //     ConditionExpression: 'todoId= :todoId',
  //     ExpressionAttributeValues:
  //     {
  //       ':name': todo.name,
  //       ':dueDate': todo.dueDate,
  //       ':done': todo.done,
  //       ':todoId': todo.todoId
  //     },
  //     ExpressionAttributeNames:
  //     {
  //       "#n": "name"
  //     },
  //     ReturnValues: 'UPDATED_NEW'
  //   }).promise()
  //   return todo
  // }

  async generateUploadUrl(todoId: string): Promise<string> {
    logger.info('Generating upload Url')
    //logging generation of url 
    return this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: todoId,
      Expires: +this.urlExpiration
    })
  }
}

const createDynamoDBClient = () => {
  return new XAWS.DynamoDB.DocumentClient()
}