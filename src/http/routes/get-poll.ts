/*
  # Importing Libs
*/
import { FastifyInstance } from 'fastify'
import z from 'zod'
/*
  # Importing Database
*/
import { prisma } from '../../lib/prisma'
import { redis } from '../../lib/redis'
/*
  # Get Poll Controller
*/
export async function getPoll(app: FastifyInstance) {
  /*
    # Get Poll Method
  */
  app.get('/polls/:pollId', async (req, res) => {

    // Validating poll id with zod
    const getPollParams = z.object({
      pollId: z.string().uuid(),
    })
  
    // Taking poll id from request params
    const { pollId } = getPollParams.parse(req.params)
  
    // Taking poll from postgresql
    const poll = await prisma.poll.findUnique({
      where: {
        id: pollId,
      },
      include: {
        options: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    })

    // Validating if the poll already exist
    if ( !poll ) {

      return res.status(400).send({
        msg: 'Poll not found.'
      })

    }

    // Getting the score from redis
    const result = await redis.zrange(pollId, 0, -1, 'WITHSCORES')

    // Structurin the score object in votes
    const votes = result.reduce((obj, row, index) => {
      if (index % 2 === 0) {
        const score = result[index + 1]

        Object.assign(obj, { [row]: Number(score) })
      }

      return obj
    }, {} as Record<string, number>)
  
    // Returning the poll and score structured to frontend
    return res.send({ 
      poll: {
        id: poll.id,
        title: poll.title,
        options: poll.options.map(option => {
          return {
            id: option.id,
            title: option.title,
            score: (option.id in votes) ? votes[option.id] : 0
          }
        })
      }
    })
  })
}