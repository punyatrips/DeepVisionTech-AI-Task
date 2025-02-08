// Import required dependencies
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcryptjs"); // For password hashing
const jwt = require("jsonwebtoken"); // For generating authentication tokens
require("dotenv").config(); // Load environment variables from .env file

const app = express();
app.use(express.json()); // Enable JSON request body parsing
app.use(cors({ origin: "*", credentials: true })); // Allow cross-origin requests

// Connect to MongoDB database
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// Drop the collection (if needed)
mongoose.connection.dropCollection('users')
    .then(() => console.log("Collection dropped"))
    .catch(err => console.error("Error dropping collection", err));

// Define the User schema (structure of user data in MongoDB)
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true  // Ensure emails are unique in the database
    },
    password: {
        type: String,
        required: true
    },
    googleId: {
        type: String,  // For Google login, it can be optional
        unique: true,
        sparse: true // Ensure that multiple null values for googleId are allowed
    },
    profilePicture: String,
    createdAt: { type: Date, default: Date.now },
});

// Ensure unique index with sparse option on googleId
UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });

// Create a User model from the schema
const User = mongoose.model("User", UserSchema);

// Export the User model to use in other files
module.exports = User;

// Middleware for managing user sessions
app.use(session({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy for login with Google
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://127.0.0.1:5000/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    // Create a new user only if the user logs in via Google
                    user = new User({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        profilePicture: profile.photos[0].value,
                    });
                    await user.save();
                } else {
                    // If the user exists, update the user details
                    user.name = profile.displayName;
                    user.profilePicture = profile.photos[0].value;
                    await user.save();
                }

                done(null, user);
            } catch (err) {
                console.error("❌ Google Auth Error:", err);
                done(err, null);
            }
        }
    )
);

// Serialize user session
passport.serializeUser((user, done) => done(null, user.id));

// Deserialize user session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Route for Google authentication
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google authentication callback route
app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
        res.send(`<script>window.close();</script>`); // Close popup after login
    }
);

// Route to register a new user (manual signup)
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    try {
        // Check if the user already exists based on email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists!" });
        }

        // Hash the password before saving to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user with no googleId
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            googleId: null // Explicitly set googleId as null
        });

        // Save the new user to the database
        await newUser.save();

        // Send success response
        res.json({ success: true, message: "Registration successful!" });
    } catch (error) {
        console.error("❌ Error during registration:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Define Chat Schema (structure for chat messages)
const chatSchema = new mongoose.Schema({
    user: String, // User's name or ID
    message: String, // Message content
    time: String // Timestamp when the message was sent
});

// Create a Chat model from the schema
const Chat = mongoose.model("Chat", chatSchema);

// Route to save chat messages from Google Meet
app.post("/saveChat", async (req, res) => {
    try {
      const { user, message, time } = req.body;

      // Ensure all required fields are provided
      if (!user || !message || !time) {
          return res.status(400).json({ error: "Missing fields" });
      }

      // Create and save the chat message
      const newChat = new Chat({ user, message, time });
      await newChat.save();

      console.log("✅ Chat saved:", newChat);
      res.status(201).json({ message: "Chat saved successfully" });

    } catch (error) {
      console.error("❌ Error saving chat:", error);
      res.status(500).json({ error: "Internal server error" });
    }
});

// Route to retrieve chat history
app.get("/getChatHistory", async (req, res) => {
    try {
        // Retrieve chat messages, sorted by latest messages first
        const chats = await Chat.find().sort({ time: -1 });

        if (chats.length === 0) {
            return res.status(200).json({ message: "No chat history found" });
        }

        res.json(chats);

    } catch (err) {
        console.error("❌ Error fetching chat history:", err);
        res.status(500).json({ error: "Failed to load chat history" });
    }
});

// Route to log in an existing user
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Both email and password are required!" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found!" });
        }

        // Compare the entered password with the stored hash
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ success: false, message: "Incorrect password!" });
        }

        // If credentials are correct, send success response
        res.json({ success: true, message: "Login successful!" });
    } catch (error) {
        console.error("❌ Error during login:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
