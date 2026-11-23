
// ========================================
// BUZZTALK BACKEND SERVER
// Node.js + Express + Socket.IO
// ========================================

const express = require("express");

const http = require("http");

const { Server } = require("socket.io");

const cors = require("cors");

// CREATE EXPRESS APPLICATION

const app = express();

const server = http.createServer(app);

// MIDDLEWARE

app.use(cors());

app.use(express.json());

// SOCKET.IO CONFIGURATION

const io = new Server(server, {

    cors: {

        origin: "*",

        methods: ["GET", "POST"]

    }

});

// STORE CONNECTED USERS

const users = new Map();

// HEALTH CHECK ROUTE

app.get("/", (req, res) => {

    res.status(200).send(
        "BuzzTalk Real-Time Chat Server is Running!"
    );

});

// SERVER STATUS ROUTE

app.get("/health", (req, res) => {

    res.json({

        status: "online",

        application: "BuzzTalk",

        connectedUsers: users.size

    });

});

// ========================================
// SOCKET CONNECTION
// ========================================

io.on("connection", socket => {

    console.log("New user connected:", socket.id);

    // USER JOINS

    socket.on("new-user-joined", rawName => {

        const name = String(rawName || "")
            .trim()
            .slice(0, 24);

        if (!name) {
            return;
        }

        users.set(socket.id, name);

        console.log(`${name} joined the chat`);

        socket.broadcast.emit("user-joined", name);

    });

    // SEND MESSAGE

    socket.on("send", rawMessage => {

        const message = String(rawMessage || "")
            .trim()
            .slice(0, 1000);

        const name = users.get(socket.id);

        if (!message || !name) {
            return;
        }

        console.log(`${name}: ${message}`);

        // Send to every other connected user.
        socket.broadcast.emit("receive", {

            name: name,

            message: message

        });

    });

    // USER DISCONNECTS

    socket.on("disconnect", () => {

        const name = users.get(socket.id);

        if (name) {

            console.log(`${name} left the chat`);

            socket.broadcast.emit("left", name);

        }

        users.delete(socket.id);

    });

});

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 8000;

server.listen(PORT, "0.0.0.0", () => {

    console.log(
        `BuzzTalk server running on port ${PORT}`
    );

});
