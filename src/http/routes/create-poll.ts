/*
  # Importing Libs
*/
import { FastifyInstance } from 'fastify'
import z from 'zod'
/*
  # Importing Database
*/
import { prisma } from '../../lib/prisma'
/*
  # Create Poll Controller
*/
export async function createPoll(app: FastifyInstance) {
  /*
    # Post Poll Method
  */
  app.post('/polls', async (req, res) => {

    // Validating the title and options with zod
    const createPollbody = z.object({
      title: z.string(),
      options: z.array(z.string()),
    })
  
    // Getting title and options from request body
    const { title, options } = createPollbody.parse(req.body)
  
    // Creating the poll on postgresql
    const poll = await prisma.poll.create({
      data: {
        title,
        options: {
          createMany: {
            data: options.map(option => {
              return { title: option }
            })
          }
        },
      }
    })
  
    // Sending the created poll id to frontend
    return res.status(201).send({
      pollId: poll.id
    })
  })
}