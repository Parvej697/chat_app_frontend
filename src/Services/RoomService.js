import { publicAxios } from "../config/AxiosHelper"; // Update the path as needed

export const createRoom1 = async (roomDetails) => {
  const response = await publicAxios.post('/api/v1/rooms', roomDetails,{
    headers:{
        'Content-Type': "text/plain"
    },
  });
  return response.data;
};

export const joinChat1 = async (roomId) => {
  const response = await publicAxios.get(`/api/v1/rooms/${roomId}`);
  return response.data;
}

export const getMessages = async (roomId , page=0,size=50) => {
  const response = await publicAxios.get(`/api/v1/rooms/${roomId}/messages?size=${size}&page=${page}`);
  return response.data;
}