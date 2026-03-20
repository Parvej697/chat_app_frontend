import { createContext, useContext, useState, useEffect } from "react";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  // Initialize from localStorage if available
  const [roomId, setRoomId] = useState(localStorage.getItem("roomId") || "");
  const [currentUser, setCurrentUser] = useState(localStorage.getItem("currentUser") || "");
  const [connected, setConnected] = useState(localStorage.getItem("connected") === "true");

  // Sync changes to localStorage
  useEffect(() => {
    localStorage.setItem("roomId", roomId);
  }, [roomId]);

  useEffect(() => {
    localStorage.setItem("currentUser", currentUser);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("connected", connected);
  }, [connected]);

  return (
    <ChatContext.Provider value={{ roomId, setRoomId, currentUser, setCurrentUser, connected, setConnected }}>
      {children}
    </ChatContext.Provider>
  );
};

const useChatContext = () => useContext(ChatContext);
export default useChatContext;
