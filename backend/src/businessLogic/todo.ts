import * as uuid from 'uuid'
import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { TodosAccess } from '../dataLayer/todoAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { createLogger } from '../utils/logger'
import { parseUserId } from '../auth/utils'

// Using Winston Logger
const logger = createLogger('todos');

const todoAccess = new TodosAccess()

export const getAllTodos = async (jwtToken: string): Promise<TodoItem[]> => {
  const userId = parseUserId(jwtToken)
  return await todoAccess.getAllTodos(userId)
}


export const createTodo = async (
  createTodoRequest: CreateTodoRequest,
  jwtToken: string
): Promise<TodoItem> => {
  logger.info('In createTodo() function')
  const itemId = uuid.v4()
  const userId = parseUserId(jwtToken)
  //craete a todo using a variable createTodo 
  return await todoAccess.createTodo({
    todoId: itemId,
    userId,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false,
    createdAt: new Date().toISOString()
  })
}

export const deleteTodo = async (
  todoId: string,
  jwtToken: string
): Promise<string> => {
  logger.info('In deleteTodo() function')
  //logging into delete function
  const userId = parseUserId(jwtToken)
  logger.info('User Id: ' + userId)
  return await todoAccess.deleteTodo(todoId, userId)
}

export const updateTodo = async (
  todoId: string,
  updateTodoRequest: UpdateTodoRequest,
  jwtToken: string
): Promise<TodoItem> => {
  logger.info('In updateTodo() function')
  //logging into updateTodo function
  const userId = parseUserId(jwtToken)
  logger.info('User Id: ' + userId)
  return await todoAccess.updateTodo({
    todoId,
    userId,
    name: updateTodoRequest.name,
    dueDate: updateTodoRequest.dueDate,
    done: updateTodoRequest.done,
    createdAt: new Date().toISOString()
  })
}

export const generateUploadUrl = async (todoId: string): Promise<string> => {
  logger.info('In generateUploadUrl() function')
  //logging into generate Url function
  return await todoAccess.generateUploadUrl(todoId)
}


// export async function setAttachmentUrl(
//   todoId: string,
//   attachmentUrl: string,
// ): Promise<void> {
//   const todo = await todoAccess.getTodo(todoId);

//   todoAccess.setAttachmentUrl(todo.todoId, attachmentUrl);
// }