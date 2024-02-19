import { Container, Box } from "@chakra-ui/react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import UserPage from "./assets/pages/UserPage"
import PostPage from "./assets/pages/PostPage"
import HomePage from "./assets/pages/HomePage"
import AuthPage from "./assets/pages/AuthPage"
import Header from "./assets/components/Header"
import { useRecoilValue } from "recoil"
import userAtom from "./assets/atoms/userAtom"
// import LogoutButton from "./assets/components/LogoutButton
import CreatePost from "./assets/components/CreatePost"
import UpdateProfilePage from "./assets/pages/UpdateProfilePage"
import ChatPage from "./assets/pages/ChatPage"

function App() {

  const user = useRecoilValue(userAtom);
  const { pathname } = useLocation();
  return (
    <Box position={"relative"} w={"full"}>
      <Container maxW={pathname === "/" ? { base: "620px", md: "900px" } : "620px"}>
        <Header />
        <Routes>
          <Route
            path="/"
            element={user ? <HomePage /> : <Navigate to="/auth" />}
          />
          <Route
            path="/auth"
            element={!user ? <AuthPage /> : <Navigate to="/" />}
          />
          <Route
            path="/update"
            element={user ? <UpdateProfilePage /> : <Navigate to="/auth" />}
          />

          <Route
            path="/:username"
            element={
              user ? (
                <>
                  <UserPage />
                  <CreatePost />
                </>
              ) : (
                <UserPage />
              )
            }
          />
          <Route path="/:username/post/:pid" element={<PostPage />} />
          <Route
            path="/chat"
            element={user ? <ChatPage /> : <Navigate to="/auth" />}
          />
        </Routes>

        {/* {user && <LogoutButton />} */}
      </Container>
    </Box>
  );
}

export default App
