import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MdSend, MdAttachFile } from "react-icons/md";
import useChatContext from "../Context/ChatContext";
import { useNavigate } from "react-router";
import SockJS from "sockjs-client";
import toast from "react-hot-toast";
import { Stomp } from "@stomp/stompjs";
import { getMessages } from "../Services/RoomService";
import { timeAgo } from "../config/Helper";

const ChatPage = () => {
  const { roomId, currentUser, connected, setConnected, setRoomId, setCurrentUser } = useChatContext();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [stompClient, setStompClient] = useState(null);

  const fileInputRef = useRef(null);
  const chatBoxRef = useRef(null);

  // Redirect if not connected
  useEffect(() => {
    if (!connected) navigate("/");
  }, [connected, roomId, currentUser]);

  // Load messages on page init
  useEffect(() => {
    async function loadMessages() {
      try {
        const messages = await getMessages(roomId);
        setMessages(messages);
      } catch (error) {
        console.error(error);
      }
    }
    if (connected) loadMessages();
  }, [connected]);

  // WebSocket connection
  useEffect(() => {
    if (!connected) return;

    const sock = new SockJS(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/chat`);
    const client = Stomp.over(sock);

    client.connect({}, () => {
      setStompClient(client);
      client.subscribe(`/topic/room/${roomId}`, (message) => {
        const newMessage = JSON.parse(message.body);
        setMessages((prev) => [...prev, newMessage]);
      });
    });

    return () => {
      if (client.connected) client.disconnect();
    };
  }, [roomId, connected]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scroll({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // File selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Upload file to backend
  const uploadFile = async () => {
    if (!selectedFile) return null;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8080/api/files/upload", {
        method: "POST",
        body: formData,
      });
      const fileUrl = await response.text(); // backend returns plain URL
      return fileUrl;
    } catch (error) {
      console.error("File upload failed:", error);
      toast.error("File upload failed");
      return null;
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!stompClient || !connected || (!input.trim() && !selectedFile)) return;

    let mediaUrl = null;
    let mediaType = null;

    if (selectedFile) {
      mediaUrl = await uploadFile();
      mediaType = selectedFile.type.startsWith("image") ? "image" : "video";
    }

    const message = {
      sender: currentUser,
      content: input,
      roomId: roomId,
      mediaUrl,
      mediaType,
      timestamp: new Date().toISOString(),
    };

    stompClient.send(`/app/sendMessage/${roomId}`, {}, JSON.stringify(message));

    setInput("");
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // Leave room
  const handleLeaveRoom = () => {
    if (stompClient) stompClient.disconnect(() => {});
    setConnected(false);
    setRoomId("");
    setCurrentUser("");
    toast.success("Disconnected from WebSocket");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-black text-gray-900 dark:text-gray-50 transition-colors duration-500 flex justify-center items-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col w-full max-w-3xl h-[90vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 overflow-hidden"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center border-b dark:border-gray-700 pb-4 mb-4"
        >
          <div>
            <h1 className="text-xl font-bold">
              Room: <span className="text-pink-500 dark:text-pink-400">{roomId}</span>
            </h1>
          </div>
          <div>
            <h1 className="text-xl font-bold">
              User: <span className="text-orange-500 dark:text-orange-400">{currentUser}</span>
            </h1>
          </div>
          <div>
            <button
              onClick={handleLeaveRoom}
              className="bg-red-500 dark:bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            >
              Leave Room
            </button>
          </div>
        </motion.div>

        {/* Messages */}
        <motion.div
          ref={chatBoxRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 overflow-y-auto mb-4 p-2 flex flex-col gap-3"
        >
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: msg.sender === currentUser ? 50 : -50, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.1 * index, type: "spring", stiffness: 120 }}
              className={`flex ${msg.sender === currentUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-3 rounded-2xl max-w-xs shadow-lg ${
                  msg.sender === currentUser ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-gray-100"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold">{msg.sender}</p>
                  <p>{msg.content}</p>

                  {msg.mediaUrl && msg.mediaType === "image" && (
                    <img src={msg.mediaUrl} alt="media" className="rounded-lg max-w-xs mt-2" />
                  )}
                  {msg.mediaUrl && msg.mediaType === "video" && (
                    <video controls className="rounded-lg max-w-xs mt-2">
                      <source src={msg.mediaUrl} type="video/mp4" />
                    </video>
                  )}

                  <p className="text-xs text-gray-300">{timeAgo(msg.timeStamp)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* File Preview (above input, WhatsApp style) */}
{previewUrl && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="flex items-center mb-2 max-w-full overflow-x-auto gap-2"
  >
    <div className="relative">
      {selectedFile.type.startsWith("image") ? (
        <img src={previewUrl} alt="preview" className="rounded-lg max-h-40" />
      ) : (
        <video src={previewUrl} controls className="rounded-lg max-h-40" />
      )}
      <button
        onClick={() => {
          setSelectedFile(null);
          setPreviewUrl(null);
        }}
        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex justify-center items-center text-xs hover:bg-red-600"
      >
        ×
      </button>
    </div>
  </motion.div>
)}

{/* Input Row */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.5 }}
  className="flex items-center gap-3 flex-wrap"
>
  <input
    type="text"
    placeholder="Type your message..."
    value={input}
    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
    onChange={(e) => setInput(e.target.value)}
    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 transition duration-300 shadow-inner"
  />

  {/* Hidden File Input */}
  <input
    type="file"
    accept="image/*,video/*"
    className="hidden"
    ref={fileInputRef}
    onChange={handleFileChange}
  />

  {/* Attach Button */}
  <button
    onClick={() => fileInputRef.current.click()}
    className="bg-purple-600 dark:bg-purple-600 hover:bg-purple-700 dark:hover:bg-purple-700 h-12 w-12 flex justify-center items-center rounded-full text-white transition-transform duration-300 transform hover:scale-110 shadow-lg"
  >
    <MdAttachFile size={24} />
  </button>

  {/* Send Button */}
  <button
    onClick={sendMessage}
    className="bg-green-600 dark:bg-green-600 hover:bg-green-700 dark:hover:bg-green-700 h-12 w-12 flex justify-center items-center rounded-full text-white transition-transform duration-300 transform hover:scale-110 shadow-lg"
  >
    <MdSend size={24} />
  </button>
</motion.div>
      </motion.div>
    </div>
  );
};

export default ChatPage;
