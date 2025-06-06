import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

// import StatusBar from '../StatusBar';
import InfoSection from '../InfoSection';
import Friends from '../Friends';
import Post from '../Post';
import * as PostService from '@/services/PostService';
import { updateListPost } from '@/action/PostAction';

import { useDispatch, useSelector } from 'react-redux';
import styles from './MainContent.module.scss';

import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const MainContent = () => {
    const dispatch = useDispatch();

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    //get theme
    const isDarkMode = useSelector((state) => state.theme.isDarkModeEnabled);
    const isHeaderLayout = useSelector((state) => state.layout.isHeaderLayout);
    const listPost = useSelector((state) => state.post.listPost);
    console.log(listPost);

    const fetchApi = async () => {
        const result = await PostService.getNewFeed(page);
        if (result.success) {
            const newPosts = result.data;

            if (newPosts.length === 0) {
                setHasMore(false);
            } else {
                // Kiểm tra xem list post cũ có chứa list post vừa get từ api không
                const check = newPosts.every((item2) => listPost.some((item1) => item1.id === item2.id));
                if (!check) {
                    // nếu list mới không có trong list cũ mới cập nhật list post
                    dispatch(updateListPost([...listPost, ...newPosts]));
                    setPage((prevPage) => prevPage + 1);
                }
            }
        }
    };
    useEffect(() => {
        fetchApi();
        // eslint-disable-next-line
    }, []);

    return (
        <div
            className={cx(isDarkMode ? 'theme-dark' : 'bg-content-light', 'main-container')}
            style={{ marginLeft: isHeaderLayout ? '0' : '25rem', marginTop: isHeaderLayout ? '6rem' : '0' }}
        >
            <div className={cx('main-wrapper')} style={{ gap: isHeaderLayout ? '12rem' : '8rem' }}>
                <div className={cx('post-content')}>
                    <InfiniteScroll
                        dataLength={listPost.length}
                        next={fetchApi}
                        hasMore={hasMore}
                        loader={<h1>Đang tải...</h1>}
                    >
                        {/* <StatusBar /> */}
                        {listPost &&
                            listPost.map((result) => (
                                <Post
                                    key={result.id}
                                    data={{
                                        ...result,
                                        files: result.files.filter((item) => item.status === 'ENABLE'),
                                    }}
                                />
                            ))}
                    </InfiniteScroll>
                </div>

                <div className={cx('right-section')} style={{ right: isHeaderLayout ? '15rem' : '10rem' }}>
                    <InfoSection />
                    <Friends />
                </div>
            </div>
        </div>
    );
};

export default MainContent;
