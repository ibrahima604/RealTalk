const http = require("http");
const { Server } = require("socket.io");
const db = require("./database");

const app = require("./app");
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5000",
        methods: ["GET", "POST"]
    }
});

let usersOnline = {}; // Stocke les utilisateurs en ligne

// Fonction pour gérer les connexions des utilisateurs
const handleUserConnection = (socket, userId) => {
    usersOnline[userId] = socket.id;
    console.log(`Utilisateur ${userId} est maintenant en ligne`);
    io.emit("update-user-status", { userId, status: "online" });
};

// Fonction pour gérer les déconnexions des utilisateurs
const handleUserDisconnection = (socket) => {
    for (let userId in usersOnline) {
        if (usersOnline[userId] === socket.id) {
            delete usersOnline[userId];
            console.log(`Utilisateur ${userId} déconnecté`);
            io.emit("update-user-status", { userId, status: "offline" });
            break;
        }
    }
};

// Fonction pour récupérer les messages
const fetchMessages = (query, params, socket, eventName) => {
    db.query(query, params, (err, results) => {
        if (err) {
            console.error(`Erreur lors de la récupération des messages :`, err);
            return;
        }
        socket.emit(eventName, results);
    });
};

// Fonction pour envoyer un message
const sendMessage = ({ senderId, receiverId, message }, socket) => {
    db.query(
        "INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES (?, ?, ?, NOW())",
        [senderId, receiverId, message],
        (err) => {
            if (err) {
                console.error("Erreur lors de l'envoi du message :", err);
                return;
            }
            const receiverSocketId = usersOnline[receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive-message", { senderId, message });
            }
            socket.emit("receive-message", { senderId: receiverId, message });
        }
    );
};

// Gestion des connexions Socket.io
io.on("connection", (socket) => {
    console.log("Un utilisateur est connecté");

    // Événement : Utilisateur connecté
    socket.on("user-connected", (userId) => {
        handleUserConnection(socket, userId);
    });

    // Événement : Récupérer les messages reçus
    socket.on("get-messages", (userId) => {
        fetchMessages(
            "SELECT * FROM messages WHERE receiver_id = ? ORDER BY created_at ASC",
            [userId],
            socket,
            "load-messages"
        );
    });

    // Événement : Envoyer un message
    socket.on("send-message", (data) => {
        sendMessage(data, socket);
    });

    // Événement : Récupérer l'historique des messages entre deux utilisateurs
    socket.on("get-message-history", ({ senderId, receiverId }) => {
        fetchMessages(
            "SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC",
            [senderId, receiverId, receiverId, senderId],
            socket,
            "load-message-history"
        );
    });

    // Événement : Déconnexion
    socket.on("disconnect", () => {
        handleUserDisconnection(socket);
    });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});