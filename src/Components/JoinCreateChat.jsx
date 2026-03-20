import React,{useState} from "react";
import { motion } from "framer-motion";
import chatIcon from "../assets/chat.png"; // PNG icon
import { toast } from 'react-hot-toast'
import { createRoom1, joinChat1 } from "../Services/RoomService";
import useChatContext from "../Context/ChatContext";
import { useNavigate } from "react-router";

const JoinCreateChat = () => {

    const[details,setDetails]=useState({
      userName:"",
      roomId:""
    });

   const {roomId,setRoomId,currentUser,setCurrentUser,setConnected}=useChatContext(); 
   const navigate = useNavigate();

    function  handleFormInputChange(event) {
        setDetails({
            ...details,
            [event.target.name]: event.target.value
        });
    }

    function validateForm() {
        if(details.userName.trim() === "" || details.roomId.trim() === "") {
            toast.error("Please enter both your name and room ID.");
            return false;
        }
        return true;
    }

    async function JoinChat() {
        if(validateForm()) {
          try {
           const room = await joinChat1(details.roomId);
           toast.success(`Joined room: ${room.roomId}`);
            setCurrentUser(details.userName); 
            setRoomId(room.roomId);
            setConnected(true);
            // forwarding to chat page
            navigate('/chat');

          } catch (error) {
            if(error.status===400){
              toast.error(error.response.data);
            }
            else{
              toast.error("Error in Joining Room.");
            }
            console.log(error);
          }
        }
    }

    async function createRoom() {
        if(validateForm()) {
            // Logic to create a new chat room
            try{
              const response = await createRoom1(details.roomId);
              console.log(response);
              toast.success(`Room created with ID: ${response.roomId}`);
              // Join the room
              setCurrentUser(details.userName);
              setRoomId(response.roomId);
              setConnected(true);
              // forwarding to chat page
              navigate('/chat');
            }catch(error){
              if(error.status==400){
                toast.error("Room already exists");
                return;
              }else{
                  toast("Error creating room");
              }
             
            }
        }
    }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-orange-100 to-yellow-100 dark:from-gray-900 dark:via-gray-800 dark:to-black transition-colors duration-500">
      
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full p-10 border dark:border-gray-700 rounded-3xl flex flex-col gap-6 shadow-2xl max-w-md dark:bg-gray-900 bg-white transform hover:scale-[1.01] transition-transform duration-300"
      >
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="flex justify-center"
        >
          <img
            src={chatIcon}
            alt="Chat Icon"
            className="w-28 h-28 drop-shadow-xl"
          />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-extrabold text-center bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500 dark:from-pink-400 dark:via-orange-400 dark:to-yellow-400 bg-clip-text text-transparent"
        >
          Join or Create a Chat
        </motion.h1>

        {/* Name Input */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-2"
        >
          <label htmlFor="name" className="block font-medium text-gray-700 dark:text-gray-200">
            Your Name
          </label>
          <input
          onChange={handleFormInputChange}
          value={details.userName}
            type="text"
            id="name"
            name="userName"
            placeholder="Enter your name"
            className="w-full border px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 transition duration-300"
          />
        </motion.div>

        {/* Room Input */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-2"
        >
          <label htmlFor="room" className="block font-medium text-gray-700 dark:text-gray-200">
            Room ID / New Room ID
          </label>
          <input
          name="roomId"
            onChange={handleFormInputChange}    
            value={details.roomId}
            type="text"
            id="room"
            placeholder="Enter the room id"
            className="w-full border px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 transition duration-300"
          />
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center gap-3 mt-4"
        >
          <button onClick={JoinChat} className="w-full bg-gradient-to-r from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800 text-white font-medium px-4 py-3 rounded-full shadow-lg transform hover:scale-105 transition duration-300 focus:outline-none focus:ring-2 focus:ring-pink-300">
            Join Room
          </button>
          <button onClick={createRoom} className="w-full bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white font-medium px-4 py-3 rounded-full shadow-lg transform hover:scale-105 transition duration-300 focus:outline-none focus:ring-2 focus:ring-orange-300">
            Create Room
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default JoinCreateChat;
