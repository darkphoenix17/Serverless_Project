import 'source-map-support/register'
import * as middy from 'middy'
//import { cors } from 'middy/middlewares'
import { createLogger } from '../../utils/logger';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { createTodo } from "../../businessLogic/todo";
import { getToken } from '../../auth/utils';
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

// Using Winston for logging
const logger = createLogger('createTodo');

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const newTodo: CreateTodoRequest = JSON.parse(event.body)

    //  TODO: Implement creating a new TODO item
    const jwtToken = getToken(event.headers.Authorization)
    const newItem = await createTodo(newTodo, jwtToken)

    // Logging userId and newTodo
    logger.info(`create Todo with data ${newTodo}`);

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        newItem
      })
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