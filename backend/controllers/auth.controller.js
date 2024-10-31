import bcrypt from "bcryptjs"; // Library for hashing passwords
import User from "../models/user.model.js"; // User model
import generateTokenAndSetCookie from "../utils/generateToken.js"; // JWT generation utility

// Controller for user signup
export const signup = async (req, res) => {
	try {
		// Extract user details from request body
		const { fullName, username, password, confirmPassword, gender } = req.body;

		// Check if password and confirmPassword match
		if (password !== confirmPassword) {
			return res.status(400).json({ error: "Passwords don't match" });
		}

		// Check if username is already taken
		const user = await User.findOne({ username });
		if (user) {
			return res.status(400).json({ error: "Username already exists" });
		}

		// Generate salt for hashing password and hash the password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Profile picture URL based on gender
		const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
		const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

		// Create a new user instance
		const newUser = new User({
			fullName,
			username,
			password: hashedPassword, // Store hashed password
			gender,
			profilePic: gender === "male" ? boyProfilePic : girlProfilePic, // Set profile picture based on gender
		});

		// If user creation is successful, save the user and generate a JWT token
		if (newUser) {
			generateTokenAndSetCookie(newUser._id, res); // Generate and set token in cookie
			await newUser.save(); // Save user to database

			// Respond with user details
			res.status(201).json({
				_id: newUser._id,
				fullName: newUser.fullName,
				username: newUser.username,
				profilePic: newUser.profilePic,
			});
		} else {
			// If user data is invalid
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (error) {
		// Log error and respond with server error status
		console.log("Error in signup controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Controller for user login
export const login = async (req, res) => {
	try {
		// Extract username and password from request body
		const { username, password } = req.body;

		// Find user by username
		const user = await User.findOne({ username });

		// Check if user exists and password matches
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		// If user is not found or password is incorrect, return error
		if (!user || !isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid username or password" });
		}

		// Generate JWT token and set it as a cookie
		generateTokenAndSetCookie(user._id, res);

		// Respond with user details
		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			username: user.username,
			profilePic: user.profilePic,
		});
	} catch (error) {
		// Log error and respond with server error status
		console.log("Error in login controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// Controller for user logout
export const logout = (req, res) => {
	try {
		// Clear the JWT cookie by setting it with an expired maxAge
		res.cookie("jwt", "", { maxAge: 0 });

		// Respond with a successful logout message
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		// Log error and respond with server error status
		console.log("Error in logout controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};
