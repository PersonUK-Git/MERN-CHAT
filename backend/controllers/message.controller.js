import Conversation from "../models/conversation.model.js"; // Conversation model
import Message from "../models/message.model.js"; // Message model
import { getReceiverSocketId, io } from "../socket/socket.js"; // Socket functions for real-time messaging

// Controller for sending a message
export const sendMessage = async (req, res) => {
	try {
		// Extract message content from request body and receiver ID from route parameters
		const { message } = req.body;
		const { id: receiverId } = req.params;
		const senderId = req.user._id; // Sender ID is from the logged-in user (authenticated request)

		// Check if a conversation between sender and receiver exists
		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, receiverId] },
		});

		// If no conversation exists, create a new one
		if (!conversation) {
			conversation = await Conversation.create({
				participants: [senderId, receiverId],
			});
		}

		// Create a new message document with sender and receiver IDs and the message content
		const newMessage = new Message({
			senderId,
			receiverId,
			message,
		});

		// If the message was created successfully, add it to the conversation's message list
		if (newMessage) {
			conversation.messages.push(newMessage._id);
		}

		// Save conversation and message in parallel to improve efficiency
		await Promise.all([conversation.save(), newMessage.save()]);

		// Real-time functionality using Socket.IO to notify the receiver
		const receiverSocketId = getReceiverSocketId(receiverId); // Get the receiver's socket ID
		if (receiverSocketId) {
			// Emit the new message event to the receiver's specific socket
			io.to(receiverSocketId).emit("newMessage", newMessage);
		}

		// Respond with the created message object
		res.status(201).json(newMessage);
	} catch (error) {
		console.log("Error in sendMessage controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

// Controller for retrieving messages between the logged-in user and a specific chat participant
export const getMessages = async (req, res) => {
	try {
		// Extract the user ID of the person with whom the logged-in user wants to chat from route parameters
		const { id: userToChatId } = req.params;
		const senderId = req.user._id; // Sender ID is from the logged-in user

		// Find the conversation between the sender and receiver, if it exists, and populate messages
		const conversation = await Conversation.findOne({
			participants: { $all: [senderId, userToChatId] },
		}).populate("messages"); // Populate actual message documents (not just IDs)

		// If no conversation exists, return an empty array
		if (!conversation) return res.status(200).json([]);

		// Retrieve the messages array from the conversation
		const messages = conversation.messages;

		// Respond with the messages array
		res.status(200).json(messages);
	} catch (error) {
		console.log("Error in getMessages controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
