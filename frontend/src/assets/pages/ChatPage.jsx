import { SearchIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Input, Skeleton, SkeletonCircle, Text, useColorModeValue } from "@chakra-ui/react"
import Conversation from "../components/Conversation";
import { GiConversation } from 'react-icons/gi';
import MessageContainer from "../components/MessageContainer";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { useRecoilState, useRecoilValue } from "recoil";
import { conversationAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import { useSocket } from "../context/SocketContext";

const ChatPage = () => {
    const showToast = useShowToast();
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [conversations, setConversations] = useRecoilState(conversationAtom);
    const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
    const [searchText, setSearchText] = useState('');
    const [searchingUser, setSearchingUser] = useState(false);
    const currentUser = useRecoilValue(userAtom);
    const {socket, onlineUsers} = useSocket();

    useEffect(() => {
		socket?.on("messagesSeen", ({ conversationId }) => {
			setConversations((prev) => {
				const updatedConversations = prev.map((conversation) => {
					if (conversation._id === conversationId) {
						return {
							...conversation,
							lastMessage: {
								...conversation.lastMessage,
								seen: true,
							},
						};
					}
					return conversation;
				});
				return updatedConversations;
			});
		});
	}, [socket, setConversations]);
    
    useEffect(() => {
        const getConversations = async () => {
            try {
                const res = await fetch('/api/message/conversations');
                const data = await res.json();
                if (data.error) {
                    showToast('Error', data.error, 'error');
                    return;
                }

                setConversations(data);

            } catch (error) {
                showToast('Error', error.message, 'error');
            } finally {
                setLoadingConversations(false);
            }
        }

        getConversations();
    }, [showToast, setConversations]);

    const handleConversationSearch = async (e) => {
        e.preventDefault();
        if (searchingUser) {
            return;
        }
        setSearchingUser(true);
        try {
            const res = await fetch(`api/users/profile/${searchText}`);
            const data = await res.json();
            if (data.error) {
                showToast('Error', data.error, 'error');
                return;
            }
            // User cannot message themself
            if (data._id === currentUser._id) {
                showToast('Error', 'You Cannot Message Yourself', 'error');
                return;
            }

            // Check if searching user is already in the conversation
            if (conversations.find((c) => c.participants[0]._id === data._id)) {
                setSelectedConversation({
                    _id: conversations.find((c) => c.participants[0]._id === data._id)._id,
                    userId: data._id,
                    username: data.username,
                    userProfilePic: data.profilePic
                })

                return;
            }

            const mockConversation = {
                mock: true,
                lastMessage: {
                    text: '',
                    sender: ''
                },
                _id: Date.now(),
                participants: [
                    {
                        _id: data._id,
                        username: data.username,
                        profilePic: data.profilePic
                    }
                ]
            }

            setConversations((prev) => [...prev, mockConversation]);
            
        } catch (error) {
            showToast('Error', error.message, 'error');
        } finally {
            setSearchingUser(false);
        }
    }
    return (
        <Box
            position={"absolute"}
            left={"50%"}
            transform={'translateX(-50%)'}
            w={{
                base: '100%',
                md: '80%',
                lg: '750px'
            }}
            p={4}
        >
        <Flex
            gap={4}
            flexDirection={{
                base: 'column',
                md: 'row'
            }}
            maxW={{
                sm: '400px',
                md: 'full'
            }}
            mx={'auto'}
        >
            <Flex
                flex={30}
                gap={2}
                flexDirection={'column'}
                maxW={{
                    sm: '250px',
                    md: 'full'
                }}
                mx={'auto'}
            >
                <Text
                    fontWeight={700} color={useColorModeValue('gray.600', 'gray.400')}
                >
                    Your Conversations
                </Text>
                <form onSubmit={handleConversationSearch}>
                    <Flex alignItems={'center'} gap={2}>
                        <Input placeholder="Search For a User" onChange={(e) => setSearchText(e.target.value)}/>
                        <Button size={'sm'} onClick={handleConversationSearch} isLoading={searchingUser}>
                            <SearchIcon />
                        </Button>
                    </Flex>
                </form>

                {
                    loadingConversations && (
                        [0,1,2,3,4].map((_, i) => {
                            return (
                                <Flex key={i} gap={4} alignItems={'center'} p={1} borderRadius={'md'}>
                                    <Box>
                                        <SkeletonCircle size={'10'}/>
                                    </Box>
                                    <Flex w={'full'} flexDirection={'column'} gap={3}>
                                        <Skeleton h={'10px'} w={'80px'} />
                                        <Skeleton h={'8px'} w={'90%'} />
                                    </Flex>
                                </Flex>
                            )
                        })
                    )
                }
                
                {
                    !loadingConversations && (
                        conversations.map((conversation) =>(
                            <Conversation
                                key={conversation._id}
                                conversation={conversation}
                                isOnline={onlineUsers.includes(conversation.participants[0]._id)}
                            />
                        ))
                    )
                }
            </Flex>
            {
                !selectedConversation._id && (
                    <Flex
                        flex={70}
                        borderRadius={'md'}
                        p={2}
                        flexDirection={'column'}
                        alignItems={'center'}
                        justifyContent={'center'}
                        height={'400px'}
                    >
                        <GiConversation size={100} />
                        <Text>
                            Select a conversation to start messaging
                        </Text>
                    </Flex>
                )
            }
            
            {
                selectedConversation._id && (
                    <MessageContainer />
                )
            }
        </Flex>
        </Box>
    );
}

export default ChatPage