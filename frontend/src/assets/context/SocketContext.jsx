import { createContext, useContext, useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import io from 'socket.io-client';
import userAtom from "../atoms/userAtom";


const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
}

export const SocketContextProvider = ({children}) => {
    const [socket, setSocket] = useState(null);
    const user = useRecoilValue(userAtom);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        const socket = io('http://localhost:5000', {
            query:{
                userId: user?._id
            }
        });
        console.log('socket--->', socket);
        setSocket(socket);

        socket.on('getOnlineUsers',(users) => {
            setOnlineUsers(users);
        })

        return () => {
            if (socket.connected === 1) { // <-- This is important
                console.log('socketClose--->', socket);
                socket.close();
            }
        }
    }, [user])
    return (
        <SocketContext.Provider value={{socket, onlineUsers}}>
            {children}
        </SocketContext.Provider>
    )
}