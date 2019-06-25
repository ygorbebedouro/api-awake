//Injetando o Express para atender as requisições HTTP.
const express = require('express');
const app = express();

//Body Parser para interpretar os valores passados pelo corpo (body) das requisições HTTP p/ JSON.
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

//Carregando o arquivo da rota
const evento = require('./routes/eventos');
const usuario = require('./routes/usuarios');

//Definindo a rota
app.use('/eventos', evento);
app.use('/usuarios', usuario);

//ROTA DE BOAS VINDAS
app.get('/', function(requisicao, resposta){
    resposta.status(200).send('<h1>Bem Vindo a API Awake!</h1>');
});

//Definição da porta em que a API irá atender as requisições.
const porta = process.env.PORT || 3000;

app.listen(porta, () => {
    console.log('SERVIDOR ONLINE RODANDO NA PORTA ' + porta);
});