document.addEventListener("DOMContentLoaded", function () {
    // Fetch chat history from the backend
    fetch("http://127.0.0.1:5000/getChatHistory")
        .then(response => {
            console.log("Response Status:", response.status); // Log response status
            return response.json();
        })
        .then(data => {
            console.log("Chat History Data:", data); // Log data returned from the backend
            let chatHistoryDiv = document.getElementById("chat-history");

            // Clear the "Loading chat history..." text
            chatHistoryDiv.innerHTML = "<h3>Chat History</h3>";

            if (!data || data.message === "No chat history found" || data.length === 0) {
                chatHistoryDiv.innerHTML += "<p>No chat history available.</p>";
                return;
            }

            data.forEach(chat => {
                chatHistoryDiv.innerHTML += `
                    <div class="chat-item">
                        <strong>${chat.user}</strong> (${new Date(chat.time).toLocaleString()}):<br>
                        ${chat.message}
                    </div><hr>
                `;
            });
        })
        .catch(error => {
            console.error("❌ Error fetching chat history:", error);
            document.getElementById("chat-history").innerHTML = "<p>Error loading chat history.</p>";
        });
});

// Redirect to login page when the Back button is clicked
document.getElementById("back-btn").addEventListener("click", function() {
    window.location.href = "popup.html"; // Redirects to the login page
});
