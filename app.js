const express=require("express");
const app=express();
const db=require("./database");
const bcrypt = require('bcrypt');
const saltRounds = 10; // Le nombre de "salts" utilisés pour rendre le hachage plus sécurisé
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//La route l'index
app.get("/",(req,res)=>{
    res.sendFile(`${__dirname}/public/index.html`);
})
//La route pour la page de connexion
app.get("/login",(req,res)=>{
    res.sendFile(`${__dirname}/public/login.html`);
})
//La route pour la page d'incription
app.get("/signup",(req,res)=>{
    res.sendFile(`${__dirname}/public/signup.html`);
})
app.post("/signup", (req, res) => {
    const { fullname, email, password } = req.body;

    // Vérification si l'email existe déjà
    db.query("SELECT * FROM users WHERE email=?", [email], (err, results) => {
        if (err) {
            res.status(500).send('Erreur de base de données');
            return;
        }
        if (results.length > 0) {
            res.status(400).send('L\'email est déjà utilisé');
            return;
        }

        // Hachage du mot de passe
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
            if (err) {
                res.status(500).send('Erreur lors du hachage du mot de passe');
                return;
            }

            // Insertion de l'utilisateur dans la base de données avec le mot de passe haché
            const query = "INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)";
            db.query(query, [fullname, email, hashedPassword], (err, result) => {
                if (err) {
                    res.status(500).send('Erreur lors de l\'inscription');
                    return;
                }
               // Log pour débogage avant la redirection
               console.log('Inscription réussie, redirection vers /login');

               // Redirection vers la page de connexion après inscription réussie
               res.redirect('/login'); // Assurez-vous que la route '/login' existe
            });
        });
    });
});
app.get("/dashboard",(req,res)=>{
    res.sendFile(`${__dirname}/public/dashboard.html`)
})
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    // Vérifier si l'email existe dans la base de données
    db.query("SELECT * FROM users WHERE email=?", [email], (err, result) => {
        if (err) {
            console.error("Erreur de base de données", err);
            return res.status(500).send('Erreur de base de données');
        }

        // Vérifier si l'email existe
        if (result.length === 0) {
            return res.status(400).send("L'email n'existe pas. Vérifiez vos identifiants.");
        }

        // Comparer le mot de passe avec le mot de passe haché stocké
        bcrypt.compare(password, result[0].password, (err, isMatch) => {
            if (err) {
                console.error("Erreur lors de la comparaison des mots de passe", err);
                return res.status(500).send('Erreur lors de la vérification du mot de passe');
            }

            if (!isMatch) {
                return res.status(400).send("Le mot de passe est incorrect. Vérifiez vos identifiants.");
            }

           // Log pour débogage avant la redirection
           console.log('Inscription réussie, redirection vers /dasboard');

           // Redirection vers la page de connexion après inscription réussie
           res.redirect('/dashboard'); // Assurez-vous que la route '/login' existe
        });
    });
});
module.exports=app;
