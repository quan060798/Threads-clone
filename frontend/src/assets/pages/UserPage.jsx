import { useEffect, useState } from "react"
import UserHeader from "../components/UserHeader"
// import UserPost from "../components/UserPost"
import { useParams } from "react-router-dom";
import useShowToast from '../hooks/useShowToast'
import { Spinner, Flex } from "@chakra-ui/react";
import Post from "../components/Post";
import useGetUserProfile from "../hooks/useGetUserProfile";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";

const UserPage = () => {
  const {user, loading} = useGetUserProfile();
  const { username } = useParams();
  const showToast = useShowToast();
  const [posts, setPosts] = useRecoilState(postsAtom);
  const [fetchingPosts, setFetchingPosts] = useState(true);

  useEffect(() => {
    const getPosts = async () => {
      setFetchingPosts(true);
      try {
        const res = await fetch(`/api/posts/user/${username}`);
        const data = await res.json();
        if (data.error) {
          showToast("Error", data.error, 'error');
          return
        }
        setPosts(data);
      } catch (error) {
        showToast("Error", error, 'error');
        setPosts([]);
      } finally {
        setFetchingPosts(false);
      }
    }

    getPosts();

  }, [username, showToast, setPosts]);

  if (!user && loading) {
    return (
      <Flex justifyContent={'center'}>
        <Spinner size={'xl'} />
      </Flex>
      
    )
  }
  if (!user && !loading) {
    return (
      <h1>User Not Found</h1>
    )
  }

  return (
    <>
        <UserHeader user={user} />

        {!fetchingPosts && posts.length === 0 && <h1>User has no post yet.</h1>}

        {fetchingPosts && (
          <Flex justifyContent={'center'} my={12}>
            <Spinner size={'xl'} />
          </Flex>
        )}

        {posts.map((post) => (
          <Post key={post._id} post={post} postedBy={post.postedBy} />
        ))}
    </>
  )
}

export default UserPage