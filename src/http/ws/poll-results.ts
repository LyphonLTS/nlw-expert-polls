/*
  # Importing Libs
*/
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
/*
  # Importing Util
*/
import { voting } from '../../utils/voting-pub-sub'
/*
  # Poll Results Controller
*/
export async function pollResults(app: FastifyInstance) {
  /*
    # Get Results Method
  */
  app.get('/polls/:pollId/results', { websocket: true }, (connection, request) => {

    // Validating the poll id with zod
    const getPollParams = z.object({
      pollId: z.string().uuid(),
    })

    // Taking the poll id from url params
    const { pollId } = getPollParams.parse(request.params)

    // Subscribe the poll id on pub and send the related message
    voting.subscribe(pollId, (message) => {
      connection.socket.send(JSON.stringify(message))
    })

  })
}