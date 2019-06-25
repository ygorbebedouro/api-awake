const mongoose = require('mongoose');

function MongoConnection(){
    this.servidor = 'localhost';
    this.porta = '27017';
    this.banco = 'awake';
    this.usuario = '';
    this.senha = '';
}

//Para tipo de conexão local ou remota
const AMBIENTE = 'REMOTO';

MongoConnection.prototype.url = function(){
    switch(AMBIENTE){
        case 'LOCAL':
            return 'mongodb://' + this.servidor + ':' + this.porta + '/' + this.banco;
        case 'REMOTO':
            return 'mongodb+srv://rodrigo:rodrigo@awake-71owl.mongodb.net/test?retryWrites=true&w=majority';        
    }
}

//Abre a conexão com o banco de dados
MongoConnection.prototype.open = function(callback){
    //Padrão para todos os projetos
    mongoose.Promise = global.Promise;

    mongoose.connect(this.url(),{
        useNewUrlParser: true
    }, function(err, db){
        callback(err, db)
    });
}

module.exports = MongoConnection;