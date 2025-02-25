const db = require('./database');  // Connexion à la base de données

// Fonction pour gérer l'envoi de message
function handleMessage(data, usersOnline, io) {
    const { senderId, receiverId, message } = data;

    // Insérer le message dans la base de données
    db.query(
        "INSERT INTO messages (user_id, message) VALUES (?, ?)",
        [senderId, message],
        (err) => {
            if (err) throw err;
            console.log(`Message envoyé à l'utilisateur ${receiverId}`);
            
            // Envoyer le message en temps réel au destinataire si il est en ligne
            const receiverSocketId = usersOnline[receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive-message", { senderId, message });
            }
        }
    );
}

module.exports = { handleMessage };
