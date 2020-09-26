import 'source-map-support/register'
import * as middy from 'middy'
//import { cors } from 'middy/middlewares'
import { getToken } from '../../auth/utils';
import { createLogger } from '../../utils/logger';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { updateTodo } from "../../businessLogic/todo";
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

// Using Winston
const logger = createLogger('updateTodo');

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`updating todo main-page is running`)
    //logging updating todo main-page
    try {
      const todoId: string = event.pathParameters.todoId
      const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
      const jwtToken: string = getToken(event.headers.Authorization)
      await updateTodo(todoId, updatedTodo, jwtToken)

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: 'Updated Succesfully'
      }
    } catch (e) {
      logger.error('Error', { error: e.message })

      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: e.message
      }
    }
  }
)