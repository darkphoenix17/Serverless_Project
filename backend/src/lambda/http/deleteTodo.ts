import 'source-map-support/register'
import * as middy from 'middy'
import { getToken } from '../../auth/utils';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { createLogger } from '../../utils/logger';
import { deleteTodo } from "../../businessLogic/todo";

// Using Winston Logger
const logger = createLogger('delete-Todo');

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Getting todoID from path Parameters 
  const todoId = event.pathParameters.todoId

  // TODO: Remove a TODO item by id
  const authorization = event.headers.Authorization;
  const jwtToken: string = getToken(authorization)
  logger.info(`deleting todo ${todoId}`)
  //logging delete todo
  try {
    await deleteTodo(todoId, jwtToken)
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: 'Successfully Deleted'
    }
  } catch (e) {
    logger.error('Error: ' + e.message)

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: e.message
    }
  }
})