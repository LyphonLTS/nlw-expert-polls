/*
  # Import Libs
*/
import fastify from 'fastify'
import cookie from '@fastify/cookie'
import websocket from '@fastify/websocket'
/*
  # Import Routes
*/
import { createPoll } from './routes/create-poll'
import { getPoll } from './routes/get-poll'
import { voteOnPoll } from './routes/vote-on-poll'
import { pollResults } from './ws/poll-results'
/*
  # Starting Fastify
*/
const app = fastify()
/*
  # Registering @fastify/coockie
*/
app.register(cookie, {
  secret: 'polls-app-nlw',
  hook: 'onRequest',
})
/*
  # Registering @fastify/websocket
*/
app.register(websocket)            // Can register optional config
/*
  # Registering http routes
*/
app.register(createPoll)
app.register(getPoll)
app.register(voteOnPoll)
/*
  # Registering ws routes
*/
app.register(pollResults)
/*
  # Server start log
*/
app.listen({ port: 3333 }).then(() => {
  console.log("HTTP server running!")
})