/*
  # Importing Libs
*/
import z from 'zod'
import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
/*
  # Importing Databases
*/
import { prisma } from '../../lib/prisma'
import { redis } from '../../lib/redis'
/*
  # Importing Util
*/
import { voting } from '../../utils/voting-pub-sub'
/*
  # Vote On Poll Controller
*/
export async function voteOnPoll(app: FastifyInstance) {
  /*
    # Post Votes Method
  */
  app.post('/polls/:pollId/votes', async (req, res) => {

    // Validating poll option id and poll id with zod
    const voteOnPollBody = z.object({
      pollOptionId: z.string().uuid()
    })
    const voteOnPollParams = z.object({
      pollId: z.string().uuid()
    })

    // Taking the poll id and poll option id from params and body request
    const { pollId } = voteOnPollParams.parse(req.params)
    const { pollOptionId } = voteOnPollBody.parse(req.body)
    
    // Taking coockies from request
    let { sessionId } = req.cookies

    // Validating if sessionId already exist
    if (sessionId) {

      // If exist, get the relationated vote
      const userPreviousVoteOnPoll = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: {
            sessionId,
            pollId
          }
        }
      })

      // Validating if previous vote and actual vote is the same
      if (userPreviousVoteOnPoll && userPreviousVoteOnPoll.pollOptionId !== pollOptionId) {

        // Delete from postgresql
        await prisma.vote.delete({
          where: {
            id: userPreviousVoteOnPoll.id
          }
        })

        // Decrease score from redis
        const votes = await redis.zincrby(pollId, -1, userPreviousVoteOnPoll.pollOptionId)

        // Subscribe the poll id on pub and send the related message
        voting.publish(pollId, {
          pollOptionId: userPreviousVoteOnPoll.pollOptionId,
          votes: Number(votes)
        })
        
      // Validating if user already voted
      } else if (userPreviousVoteOnPoll) {

        return res.status(400).send({
          message: 'You already voted on this poll.'
        })

      }

    // If already no exist
    } else {

      // Getting a random UUID
      sessionId = randomUUID()

      // Sending cookie to frontend
      res.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,  // 30 days
        signed: true,
        httpOnly: true,
      })

    }

    // Creating the vote on postgresql
    await prisma.vote.create({
      data: {
        sessionId,
        pollId,
        pollOptionId
      }
    })

    // Creating the vote score on redis
    const votes = await redis.zincrby(pollId, 1, pollOptionId)

    // Subscribe the poll id on pub and send the related message
    voting.publish(pollId, {
      pollOptionId,
      votes: Number(votes)
    })

    // Returning to frontend created status to frontend
    return res.status(201).send()
  })
}