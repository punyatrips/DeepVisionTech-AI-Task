document.addEventListener("DOMContentLoaded", function () {
    const googleLoginBtn = document.getElementById("google-login");
    const loginSection = document.getElementById("login-section");
    const userInfoSection = document.getElementById("user-info");
    const userPic = document.getElementById("user-pic");
    const userName = document.getElementById("user-name");

    googleLoginBtn.addEventListener("click", () => {
        chrome.identity.launchWebAuthFlow(
            {
                url: "http://localhost:5000/auth/google",
                interactive: true
            },
            function (redirectUrl) {
                if (chrome.runtime.lastError) {
                    console.error("❌ Authentication Error:", chrome.runtime.lastError.message);
                    return;
                }
    
                if (!redirectUrl) {
                    console.error("❌ Authentication failed: No redirect URL received.");
                    return;
                }
    
                console.log("✅ Successfully authenticated! Redirect URL:", redirectUrl);
    
                // Store login status
                localStorage.setItem("userLoggedIn", "true");
    
                // Redirect to View History page
                window.location.href = "viewHistory.html";
            }
        );
    });        
});

document.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.getElementById("login-btn");
    const googleLoginBtn = document.getElementById("google-login");

    loginBtn.addEventListener("click", async () => {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            alert("⚠️ Both fields are required!");
            return;
        }

        // Perform login via the backend
        try {
            const response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();
            if (result.success) {
                // Store login status
                localStorage.setItem("userLoggedIn", "true");

                // Redirect to View History page
                window.location.href = "viewHistory.html";
            } else {
                alert("❌ Login Error: " + result.message);
            }
        } catch (error) {
            console.error("❌ Error logging in:", error);
        }
    });

    googleLoginBtn.addEventListener("click", () => {
        chrome.identity.launchWebAuthFlow(
            {
                url: "http://localhost:5000/auth/google",
                interactive: true
            },
            function (redirectUrl) {
                if (chrome.runtime.lastError) {
                    console.error("❌ Authentication Error:", chrome.runtime.lastError.message);
                    return;
                }

                if (!redirectUrl) {
                    console.error("❌ Authentication failed: No redirect URL received.");
                    return;
                }

                console.log("✅ Successfully authenticated with Google! Redirect URL:", redirectUrl);

                // Store login status
                localStorage.setItem("userLoggedIn", "true");

                // Redirect to View History page
                window.location.href = "viewHistory.html";
            }
        );
    });
});


// If no internet, it will alert.
document.getElementById("google-login").addEventListener("click", () => {
    if (!navigator.onLine) {
        alert("No internet connection. Please check your network and try again.");
        return; // Stop further execution if there's no internet connection
    }

    // Proceed with Google login (you can add your Google login logic here)
    console.log("Attempting to log in with Google...");
});



document.getElementById("view-history").addEventListener("click", () => {
    // Check if user is logged in (replace with actual authentication check)
    // const isLoggedIn = localStorage.getItem("userLoggedIn");

    // if (!isLoggedIn) {
    //     alert("⚠️ Please log in with Google to view chat history!");
    //     return;
    // }
    // Redirect to the chat history page if logged in
    window.location.href = "viewHistory.html";

    fetch("http://localhost:5000/getChatHistory")
        .then(response => response.json())
        .then(data => {
            let chatHistoryDiv = document.getElementById("chat-history");
            chatHistoryDiv.innerHTML = "<h3>Chat History</h3>";

            if (data.length === 0) {
                chatHistoryDiv.innerHTML += "<p>No chat history available.</p>";
            } else {
                data.forEach(chat => {
                    chatHistoryDiv.innerHTML += `
                        <div class="chat-item">
                            <strong>${chat.user}</strong> (${new Date(chat.time).toLocaleString()}):<br>
                            ${chat.message}
                        </div><hr>
                    `;
                });
            }
            chatHistoryDiv.classList.remove("hidden");
        })
        .catch(error => console.error("❌ Error fetching chat history:", error));
});
