setInterval(() => {
    let chatMessages = document.querySelectorAll(".Ss4fHf"); // Select chat messages
    chatMessages.forEach(msg => {
        let userElement = msg.querySelector(".poVWob"); // User name
        let messageElement = msg.querySelector(".beTDc"); // Message text

        if (userElement && messageElement) {
            let user = userElement.innerText.trim();
            let message = messageElement.innerText.trim();
            let time = new Date().toISOString();

            console.log(`📢 Captured Chat: User - ${user}, Message - ${message}, Time - ${time}`);

            fetch("http://localhost:5000/saveChat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user, message, time })
            })
            .then(response => response.json())
            .then(data => console.log("✅ Chat saved response:", data))
            .catch(error => console.error("❌ Error saving chat:", error));
        }
    });
}, 5000);
