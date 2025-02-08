document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("register-btn").addEventListener("click", async () => {
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!name || !email || !password) {
            alert("⚠️ All fields are required!");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });            

            const result = await response.json();
            if (result.success) {
                alert("✅ Registration successful! Redirecting...");

                // Attempt to log in immediately after registration
                const loginResponse = await fetch("http://127.0.0.1:5000/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });

                const loginResult = await loginResponse.json();
                if (loginResult.success) {
                    localStorage.setItem("token", loginResult.token); // Save JWT token
                    window.location.href = "viewHistory.html"; // Redirect after login
                } else {
                    alert("❌ Login Error: " + loginResult.message);
                }
            } else {
                alert("❌ Registration Error: " + result.message);
            }
        } catch (error) {
            console.error("❌ Registration Error:", error);
        }
    });

    // Back button handler
    document.getElementById("back-btn").addEventListener("click", function () {
        window.location.href = "popup.html"; // Redirect to login page
    });
});
