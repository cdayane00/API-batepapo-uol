import express from "express";
import cors from "cors";
import { MongoClient} from 'mongodb';
import dotenv from "dotenv";
import dayjs from 'dayjs';
import { authSchema, messageBodySchema } from './schemas.js';
dotenv.config();


const server = express();
server.use(cors());
server.use(express.json());

const cliente = new MongoClient(process.env.MONGO_URI);
let db = null;

cliente.connect().then(() => {
    db = cliente.db('api-batepapo-uol');
});

server.get('/participants', async (request, response) => {
    const {user} = request.headers;

    try{
        const participantes = await db.collection('participantes').find({name: {$ne: user}}).toArray();
        response.send(participantes);
    }
    catch(erro){
        res.status(500).send({error: erro.message});
    }
});

server.post('/participants', async (request, response) => {
    let {name} = request.body;

    try{
        const req = await db.collection('participantes').findOne({name});
        if(req){
            response.status(409).send('Esse participande já existe');
        }
        else{
            await db.collection('participantes').insertOne({name, lastStatus: Date.now()});
            await db.collection('mensagens').insertOne({
                from: name,
                to: 'Todos',
                text: 'entra na sala...',
                type: 'status',
                time: dayjs().format('HH:mm:ss')
            });
            response.status(201).send({name});
        }
    }
    catch(erro){
        console.log('erro: ', erro);
    }
});


server.get('/messages', async(request, response) => {
    try{
        const {user} = request.headers;
        const {limit} = request.query;

        if(limit){
            const req = await db.collection('mensagens').find({
                $or: [
                    {to: 'Todos'},
                    {to: user},
                    {from: user},
                    {type: 'message'},
                ]
            }).toArray();
            let mensagens = [...req].reverse().slice(0,limit);
            response.send(mensagens.reverse());
        }
        else{
            const req = await db.collection('mensagens').find({ 
                $or: [
                    {to: 'Todos'},
                    {to: user},
                    {from: user}
                ]}).toArray();
            let mensagens = [...req];
            response.send(mensagens);
        }
    }
    catch(erro){
        console.log('erro: ', erro);
    }
})

server.post('/messages', async (request, response) => {
    const {user} = request.headers;
    let {to, text, type} = request.body;
    const validarHeader = await db.collection('participantes').findOne({name: user});
    const validarBody = messageBodySchema.validate(request.body,{
        abortEarly: false
    });

    if(!validarHeader || validarBody.hasOwnProperty('error')){
        if(validarBody.error){
            response.status(422).send(
                validarBody.error.details.map((detail) => detail.message)
            );
        }
        else{
            response.sendStatus(422);
        }
    }
    else{
        try{
            await db.collection('mensagens').insertOne({
                from: user,
                to: to,
                text: text,
                type: type,
                time: dayjs().format('HH:mm:ss')
            });
            response.sendStatus(201)
        }
        catch(erro){
            console.log('erro: ', erro);
        }
    }
})




server.listen(5000, () => {
    console.log("Rodando em http://localhost:5000");
  });
