import 'source-map-support/register'
import * as middy from 'middy'
//import { cors } from 'middy/middlewares'
import { getToken } from '../../auth/utils';
import { createLogger } from '../../utils/logger';
import { getAllTodos } from "../../businessLogic/todo";

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

// Using Winson logger
const logger = createLogger('getTodos');

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event:', event)

    try {
      const jwtToken: string = getToken(event.headers.Authorization)
      const todo = await getAllTodos(jwtToken)

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          items: todo
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
  }
)