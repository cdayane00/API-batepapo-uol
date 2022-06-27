import express from "express";
import cors from "cors";
import { MongoClient} from 'mongodb';
import dotenv from "dotenv";
import dayjs from 'dayjs';
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





server.listen(5000, () => {
    console.log("Rodando em http://localhost:5000");
  });
