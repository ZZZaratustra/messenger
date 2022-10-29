import {WebSocketServer} from 'ws'
import {v4 as uuid} from 'uuid'
import {writeFile, readFileSync, existsSync} from 'fs'

const clients = {}
const log = existsSync('log') && readFileSync('log')
const messages =JSON.parse(log.toString()) || []

const day = new Date().toJSON().slice(0,10).replace(/-/g,'/')
const time = new Date().toJSON().slice(11,19).replace(/-/g,'/')

const wss = new WebSocketServer({port: 8000})
wss.on('connection', (ws) => {
    const id = uuid()
    clients[id] = ws

    console.log(`New client ${id}`)
    ws.send(JSON.stringify(messages))

    ws.on('message', (rawMessage) => {
        console.log(rawMessage.toString())
        const {name, message, day, time} = JSON.parse(rawMessage)
        messages.push({name, message, day, time})
        for (const id in clients) {
            clients[id].send(JSON.stringify([{name, message}]))
        }
    })
    ws.on('close', () =>  {
        delete clients[id]
        console.log(`Connection witht client ${id} have lost`)
    })
})

    process.on('SIGINT', () => {
        wss.close()
        writeFile('log', JSON.stringify(messages), err => {
            if (err) console.log('err')
            process.exit()
        })
    })