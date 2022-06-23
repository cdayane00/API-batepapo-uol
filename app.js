import express from "express";
import cors from "cors";
import { MongoClient} from 'mongodb';
import dotenv from "dotenv";
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



server.listen(5000, () => {
    console.log("Rodando em http://localhost:5000");
  });
