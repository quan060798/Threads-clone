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
        let socket;
        const socketIo = import.meta.env.VITE_SOCKET_IO_ENDPOINT;
        if (import.meta.env.MODE === 'production') {
            
            socket = io({
                path: socketIo,
                query:{
                    userId: user?._id
                }
            });    
        } else {
            socket = io(socketIo, {
                query:{
                    userId: user?._id
                }
            });
        }
        
        console.log('socket--->', socket);
        setSocket(socket);

        socket.on("connect_error", (err) => {
            // the reason of the error, for example "xhr poll error"
            console.log('connect_error_message', err.message);
          
            // some additional description, for example the status code of the initial HTTP response
            console.log('connect_error_description', err.description);
          
            // some additional context, for example the XMLHttpRequest object
            console.log('connect_error_context', err.context);
          });

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