import { Flex, Spinner, Box } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import useShowToast from '../hooks/useShowToast';
import Post from '../components/Post';
import { useRecoilState } from 'recoil';
import postsAtom from '../atoms/postsAtom';
import SuggestedUsers from '../components/SuggestedUsers';
const HomePage = () => {

  const [posts, setPosts] = useRecoilState(postsAtom);
  const [loading, setLoading] = useState(true);
  const showToast = useShowToast();

  useEffect(() => {
    const getFeedPosts = async () => {
      setLoading(true);
      setPosts([]);
      try {
        const res = await fetch('/api/posts/feed');
        const data = await res.json();
        if (data.error) {
          showToast('Error', data.error, 'error');
          return;
        }
        setPosts(data);
      } catch (error) {
        showToast('Error', error, 'error')
      } finally {
        setLoading(false);
    }
    } 
    getFeedPosts();
  }, [showToast, setPosts]);


  return (
    <Flex gap={10} alignItems={'flex-start'}>
      <Box flex={70}>
        {loading && (
          <Flex justify={"center"}>
            <Spinner size={"xl"} />
          </Flex>
        )}
        {!loading && posts.length === 0 && (
          <h1>Follow Some Users To see the Feed</h1>
        )}

        {posts.map((p) => {
          return <Post key={p._id} post={p} postedBy={p.postedBy} />;
        })}
      </Box>
      <Box flex={30}>
        <SuggestedUsers />
      </Box>
    </Flex>
  );
}

export default HomePage