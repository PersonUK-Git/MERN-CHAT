import User from "../models/user.model.js"; // Importing the User model

// Controller function to get all users except the logged-in user
export const getUsersForSidebar = async (req, res) => {
	try {
		// Retrieve the logged-in user's ID from the request object (set by authentication middleware)
		const loggedInUserId = req.user._id;

		// Query the database to get all users except the logged-in user
		const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } })
			.select("-password"); // Exclude the password field from the result

		// Send the filtered list of users as a JSON response
		res.status(200).json(filteredUsers);
	} catch (error) {
		// Log the error if something goes wrong
		console.error("Error in getUsersForSidebar: ", error.message);

		// Send a 500 status with an error message
		res.status(500).json({ error: "Internal server error" });
	}
};
