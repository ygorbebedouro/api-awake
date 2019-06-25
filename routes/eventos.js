const express = require('express');
const app = express();
const MongoConnection = require('../config/MongoConnection');
const moment = require('moment');
const objectId = require('mongodb').ObjectID;
const fs = require('fs');
const multer = require('../config/multer');


//CADASTRO DE EVENTO
app.post('/', function(requisicao, resposta){
    //Recupera os dados passado no corpo da requisição via POST.
    let dados = requisicao.body;

    //VALIDAÇÃO DOS DADOS
    if(!dados.idusuario){
        resposta.status(500).json('O ID do usuário é obrigatório!');
        return;
    }else if(!dados.titulo){
        resposta.status(500).json('O título do evento é obrigatório!');
        return;
    }else if(!dados.detalhes){
        resposta.status(500).json('Os detalhes do evento é obrigatório!');
        return;
    }else if(!dados.data){
        resposta.status(500).json('A data do evento é obrigatório!');
        return;
    }else if(!dados.hora){
        resposta.status(500).json('A hora do evento é obrigatória!');
        return;
    }else if(!dados.local){
        resposta.status(500).json('O local do evento é obrigatório!');
        return;
    }else if(!dados.publicado){
        resposta.status(500).json('A privacidade do evento é obrigatória!');
        return;
    }else if(dados.publicado != 0 && dados.publicado != 1){
        resposta.status(500).json('O valor de publicado deve ser 1 para publico ou 0 para privado!');
        return;
    }
    else if(!dados.tipo){
        resposta.status(500).json('O tipo do evento é obrigatório!');
        return;
    }


    //Formatando a data para o padrão do MongoDB        
    dados.data = moment(dados.data, 'DD-MM-YYYY').utc('YYYY-MM-DD HH:mm:ss').toDate();    


    //abre a conexão com o mongo
    var mongoConnection = new MongoConnection().open(function(err, banco){                
        banco.collection('eventos').insertOne({...dados, visualizacoes: 0}, 
            function(erro, resultado){
                if(erro){
                    resposta.status(500).json(erro);
                }else{
                    resposta.status(200).json(resultado);
                }
            });
    });
});



//EXIBIR TODOS OS EVENTOS PUBLICOS
app.get('/', function(requisicao, resposta){

    var hoje = new Date();    
    //Formatando a data para no padrão do MongoDB e subtraiu um dia para retornar eventos do dia.    
    let dataFormatada = moment().subtract(1, 'days').utc(hoje, "YYYY-MM-DD HH:mm:ss").toDate();

    //Abre a conexão com o MongoDB
    let mongoConnection = new MongoConnection().open(async function(erro, banco){        
        
        await banco.collection('eventos').find({$and: [{publicado:'1'}, { data: {'$gte': dataFormatada }}]}).toArray(
            function(erro, resultado){
                if(erro){
                    resposta.status(500).json(erro);
                }else{
                    resposta.status(200).json(resultado);
                }
            });
    });
});



//EXIBIR TODOS OS EVENTOS DO USUÁRIO LOGADO
app.get('/usuario/:id', function(requisicao, resposta){

    var idUsuario = requisicao.params.id;

    //Abre a conexão com o MongoDB
    let mongoConnection = new MongoConnection().open(async function(erro, banco){        
        
        await banco.collection('eventos').find({'idusuario': idUsuario}).toArray(
            function(erro, resultado){
                if(erro){
                    resposta.status(500).json(erro);
                }else{
                    resposta.status(200).json(resultado);
                }
            });
    });
});



//FILTRA OS EVENTOS PELO TIPO
app.get('/pesquisa/tipo/:valor', function(requisicao, resposta){
    //Recupera o parametro do filtro pelo tipo
    let tipo = requisicao.params.valor;

    //Formatando a data para no padrão do MongoDB    
    var hoje = new Date();     
    let dataAtual = moment().subtract(1, 'days').utc(hoje, "YYYY-MM-DD HH:mm:ss").toDate();
    
    //Abre a conexão com o MongoDB
    let mongoConnection = new MongoConnection().open(async function(erro, banco){

        await banco.collection('eventos').find({$and: [{publicado:'1'}, {tipo:tipo}, {data: {'$gte': dataAtual }}]}).toArray(
            function(erro, resultado){
                if(erro){
                    resposta.status(500).json(erro);
                }else{
                    resposta.status(200).json(resultado);
                }
            });
    });
});



//CARREGA OS DETALHES DE UM EVENTO PELO ID
app.get('/:id', function(requisicao, resposta){
    //Recupera o ID do usuário pelo parametro.
    let idusuario = requisicao.params.id;
    
    //Abre a conexão com o MongoDB
    let mongoConnection = new MongoConnection().open(async function(erro, banco){

        let evento = await banco.collection('eventos').findOneAndUpdate({'_id': objectId(idusuario)}, {$inc:{'visualizacoes': 1}});
        resposta.status(200).json(evento);
    });
});






//ATUALIZA OS DADOS DE UM EVENTO
app.put('/:id', function(requisicao, resposta){
    
    //Recupera o id do evento
    let idEvento = requisicao.params.id;
    //Recupera os dados passado no corpo da requisição via POST.
    let dados = requisicao.body;

    //abre a conexão com o mongo
    var mongoConnection = new MongoConnection().open(function(err, banco){                
        banco.collection('eventos').update({'_id': objectId(idEvento)},{$set: {...dados}}, 
            function(erro, resultado){
                if(erro){
                    resposta.status(500).json(erro);
                }else{
                    resposta.status(200).json(resultado);
                }
            });
    });
});





//PUBLICAR OU PRIVAR UM EVENTO
app.put('/:id/:publicar', function(requisicao, resposta){
        
    let idEvento = requisicao.params.id;
    let publicar = requisicao.params.publicar;

    if(publicar == 0 || publicar == 1)
    {
        //abre a conexão com o mongo
        var mongoConnection = new MongoConnection().open(function(err, banco){                
    
            banco.collection('eventos').update({'_id': objectId(idEvento)},{$set: {publicado: publicar }}, 
                function(erro, resultado){
                    if(erro){
                        resposta.status(500).json(erro);
                    }else{
                        resposta.status(200).json(resultado);
                    }
                });
        });
    }else{
        resposta.status(500).json('Informe 0 para PRIVAR ou 1 para PUBLICAR o evento!');
    }
});




//PESQUISAR O EVENTO PELO TÍTULO
app.get('/pesquisa/titulo/:valor', function(requisicao, resposta){

    let pesquisa = requisicao.params.valor;
    var hoje = new Date();    
    //Formatando a data para no padrão do MongoDB e subtraiu um dia para retornar eventos do dia.    
    let dataFormatada = moment().subtract(1, 'days').utc(hoje, "YYYY-MM-DD HH:mm:ss").toDate();

    //Abre a conexão com o MongoDB
    let mongoConnection = new MongoConnection().open(async function(erro, banco){        
        
        await banco.collection('eventos').find({$and: [{publicado:'1'}, { data: {'$gte': dataFormatada }}, {titulo: {$regex: pesquisa, $options: 'i'}} ]}).toArray(
            function(erro, resultado){
                if(erro){
                    resposta.status(500).json(erro);
                }else{
                    resposta.status(200).json(resultado);
                }
            });
    });
});





//DELETA O EVENTO E EXCLUI A FOTO DO EVENTO DA PASTA DE UPLOAD
app.delete('/:id', function(requisicao, resposta){

    //Recupera o ID do usuário pelo parametro.
    let idevento = requisicao.params.id;    
    const path = './public/uploads/';
    
    //Abre a conexão com o MongoDB
    let mongoConnection = new MongoConnection().open(async function(erro, banco){

        await banco.collection('eventos').find({_id: objectId(idevento)}).toArray(
            function(erro, resultado){                                
                fs.unlinkSync(path + resultado[0].imagem);
        });
        
        let evento = await banco.collection('eventos').remove({_id: objectId(idevento)});
        resposta.status(200).json(evento);
    });
});





//EXIBIR TODOS OS EVENTOS PUBLICOS DO DIA
app.get('/filtrar/hoje', function(requisicao, resposta){

    var hoje = moment().startOf('day').toDate();
    hoje = moment(hoje, 'DD-MM-YYYY').utc('YYYY-MM-DD HH:mm:ss').toDate();

    //Abre a conexão com o MongoDB
    let mongoConnection = new MongoConnection().open(async function(erro, banco){        
        
        await banco.collection('eventos').find({$and: [{publicado:'1'}, { data: {'$gte': hoje, '$lte': hoje }}]}).toArray(
            function(erro, resultado){
                if(erro){
                    resposta.status(500).json(erro);
                }else{
                    resposta.status(200).json(resultado);
                }
            });
    });
});



//EXIBIR TODOS OS EVENTOS PUBLICOS DO MÊS
app.get('/filtrar/mes', function(requisicao, resposta){

    var hoje = moment().startOf('day').toDate();
    hoje = moment(hoje, 'DD-MM-YYYY').utc('YYYY-MM-DD HH:mm:ss').toDate();

    var dataFim = moment().endOf('month').toDate();
    dataFim = moment(dataFim, 'DD-MM-YYYY').utc('YYYY-MM-DD HH:mm:ss').toDate();

    //Abre a conexão com o MongoDB
    let mongoConnection = new MongoConnection().open(async function(erro, banco){        
        
        await banco.collection('eventos').find({$and: [{publicado:'1'}, { data: {'$gte': hoje, '$lte': dataFim }}]}).toArray(
            function(erro, resultado){
                if(erro){
                    resposta.status(500).json(erro);
                }else{
                    resposta.status(200).json(resultado);
                }
            });
    });
});








//UPLOAD DE IMAGEM
app.post('/upload', multer, (requisicao, resposta) => {

    let dados = requisicao.body;
    
    if(!requisicao.file){
        resposta.status(500).json('Informe a imagem para fazer upload!');
        return;
    }else if(!dados.idevento){
        resposta.status(500).json('O idevento é obrigatório!');
        return;
    }
    
    //Recupera o nome da imagem
    var imagem = requisicao.file.filename;
    
    //Registra a imagem do evento no MongoDB
    var mongoConnection = new MongoConnection().open(function(err, banco){                
        banco.collection('eventos').update({'_id': objectId(dados.idevento)},{$set: {'imagem': imagem}}, 
            function(erro, resultado){
                if(erro){
                    resposta.status(500).json(erro);
                }else{
                    resposta.status(200).json(resultado);
                }
            });
    });
            
});


//Exporta o modulo.
module.exports = app;