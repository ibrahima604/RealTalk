const mysql=require("mysql");
require('dotenv').config();
//Creation de la connexion a la base de données
const db=mysql.createConnection({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database: process.env.DB_NAME

});
// Connexion à la base de données
db.connect((err) => {
    if (err) {
        console.log('Erreur de connexion à la base de données:', err);
        return;
    }
    console.log('Connexion à la base de données réussie');
});
module.exports=db;