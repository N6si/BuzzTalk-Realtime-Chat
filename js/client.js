
// ========================================
// BUZZTALK - FRONTEND CHAT APPLICATION
// ========================================

// IMPORTANT:
// Local development uses localhost.
// Production uses your deployed Render backend.

const SERVER_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:8000"
        : "https://YOUR-RENDER-SERVICE.onrender.com";

const socket = io(SERVER_URL);

// DOM ELEMENTS

const form = document.getElementById("send-container");

const messageInput = document.getElementById("messageInp");

const messageList = document.getElementById("messageList");

const chatContent = document.querySelector(".chat-content");

const joinOverlay = document.getElementById("joinOverlay");

const joinForm = document.getElementById("joinForm");

const nameInput = document.getElementById("nameInput");

// APPLICATION STATE

let currentName = "";

let users = [];

// SAFE TEXT HANDLING

function escapeText(value) {

    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));

}

// AUTO SCROLL

function scrollToLatest() {

    chatContent.scrollTop = chatContent.scrollHeight;

}

// UPDATE USER PROFILE

function updateProfile() {

    const initial = currentName.charAt(0).toUpperCase();

    document.getElementById("profileName").textContent =
        currentName;

    document.getElementById("profileAvatar").textContent =
        initial;

    document.getElementById("memberName").textContent =
        currentName + " (you)";

    document.getElementById("memberAvatar").textContent =
        initial;

}

// UPDATE MEMBER LIST

function renderMembers() {

    const uniqueUsers = [
        ...new Set([currentName, ...users].filter(Boolean))
    ];

    document.getElementById("memberCount").textContent =
        uniqueUsers.length;

    document.getElementById("memberList").innerHTML =
        uniqueUsers.map(name => `

            <div class="member">

                <div class="avatar ${
                    name === currentName ? "avatar-me" : ""
                }">

                    ${escapeText(name.charAt(0).toUpperCase())}

                </div>

                <div>

                    <strong>
                        ${escapeText(name)}
                        ${name === currentName ? "(you)" : ""}
                    </strong>

                    <small><i></i> Online</small>

                </div>

            </div>

        `).join("");

}

// SYSTEM NOTIFICATIONS

function addSystemMessage(message) {

    const item = document.createElement("div");

    item.className = "system-message";

    item.textContent = message;

    messageList.appendChild(item);

    scrollToLatest();

}

// ADD CHAT MESSAGE

function addMessage(name, message, mine = false) {

    const empty = document.getElementById("emptyState");

    if (empty) {
        empty.remove();
    }

    const row = document.createElement("div");

    row.className =
        `message-row${mine ? " mine" : ""}`;

    const now = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    row.innerHTML = `

        <div class="message-avatar">
            ${escapeText(name.charAt(0).toUpperCase())}
        </div>

        <div class="message-body">

            <div class="message-meta">

                <span class="message-author">
                    ${escapeText(name)}
                </span>

                <span class="message-time">
                    ${now}
                </span>

            </div>

            <div class="bubble"></div>

        </div>

    `;

    // textContent prevents message HTML from being executed.
    row.querySelector(".bubble").textContent = message;

    messageList.appendChild(row);

    scrollToLatest();

}

// ========================================
// JOIN CHAT
// ========================================

joinForm.addEventListener("submit", event => {

    event.preventDefault();

    currentName = nameInput.value.trim().slice(0, 24);

    if (!currentName) {
        return;
    }

    if (!socket.connected) {
        alert("Connecting to the chat server. Please try again.");
        return;
    }

    joinOverlay.hidden = true;

    updateProfile();

    socket.emit("new-user-joined", currentName);

    renderMembers();

    messageInput.focus();

});

// ========================================
// SEND MESSAGE
// ========================================

form.addEventListener("submit", event => {

    event.preventDefault();

    const message = messageInput.value.trim();

    if (!message || !currentName) {
        return;
    }

    if (!socket.connected) {
        alert("Chat server disconnected. Please wait.");
        return;
    }

    // Display your message immediately.
    addMessage("You", message, true);

    // Send message to backend.
    socket.emit("send", message);

    // Clear input.
    messageInput.value = "";

});

// ========================================
// USER JOINED
// ========================================

socket.on("user-joined", name => {

    if (!name) {
        return;
    }

    users.push(name);

    renderMembers();

    addSystemMessage(`${name} joined the chat`);

});

// ========================================
// RECEIVE MESSAGE
// ========================================

socket.on("receive", data => {

    if (
        data &&
        data.name &&
        typeof data.message === "string"
    ) {

        addMessage(data.name, data.message);

    }

});

// ========================================
// USER LEFT
// ========================================

socket.on("left", name => {

    if (!name) {
        return;
    }

    users = users.filter(user => user !== name);

    renderMembers();

    addSystemMessage(`${name} left the chat`);

});

// ========================================
// CONNECTION STATUS
// ========================================

const connectionStatus =
    document.getElementById("connectionStatus");

socket.on("connect", () => {

    connectionStatus.textContent = "Live";

});

socket.on("disconnect", () => {

    connectionStatus.textContent = "Reconnecting...";

});

socket.on("connect_error", error => {

    console.error("Socket connection error:", error.message);

    connectionStatus.textContent = "Connection error";

});

// ========================================
// OTHER INTERACTIONS
// ========================================

document.getElementById("scrollLatest")
    .addEventListener("click", scrollToLatest);

document.getElementById("emojiButton")
    .addEventListener("click", () => {

        messageInput.value += " 😊";

        messageInput.focus();

    });

// INITIAL SCREEN

window.addEventListener("load", () => {

    nameInput.focus();

});
