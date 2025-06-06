import { useEffect, useState, lazy, Suspense } from 'react';

import { useDispatch } from 'react-redux';
import { updateUserListPost } from '@/action/UserAction';
import { updateDetailPost } from '@/action/PostAction';
import { updateRelation } from '@/action/RelationAction';

import * as UserService from '@/services/UserService';
import * as RelaService from '@/services/RelaService';
import * as PostService from '@/services/PostService';

import { Https, NoPhotography } from '@mui/icons-material';
import { Modal, Button } from 'react-bootstrap';
import { FiSettings } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import styles from './UserProfileContent.module.scss';
import 'bootstrap/dist/css/bootstrap.min.css';
import AppAvatar from '@components/Avatar';
import classNames from 'classnames/bind';
const PostDetail = lazy(() => import('@components/PostDetail'));

const cx = classNames.bind(styles);

const UserProfileContent = ({ username }) => {
    const isDarkMode = useSelector((state) => state.theme.isDarkModeEnabled);
    const dispatch = useDispatch();

    const listPost = useSelector((state) => state.user.userListPost);
    const isHeaderLayout = useSelector((state) => state.layout.isHeaderLayout);

    const [userProfile, setUserProfile] = useState({});
    const status = useSelector((state) => state.relation.status);
    const [isPostOpen, setIsPostOpen] = useState(false);
    const [toggler, setToggler] = useState(false);
    const [modal, setModal] = useState(false);

    const addFriend = async () => {
        const result = await RelaService.addFriend(username);
        if (result.success) {
            dispatch(updateRelation(result.data.status));
        }
    };
    const unFollow = async () => {
        const result = await RelaService.deleteRelation(username);
        if (!result.data) {
            dispatch(updateRelation('KẾT BẠN'));
        }
    };
    //handle add friend
    const handleAddFriend = async () => {
        if (status === 'KẾT BẠN') {
            await addFriend();
        } else if (status === 'BẠN BÈ') {
            setModal(true);
        } else {
            await unFollow();
        }
    };

    const openPost = (data) => {
        dispatch(updateDetailPost(data));
        setIsPostOpen(true);
    };

    const closePost = () => {
        setIsPostOpen(false);
    };

    useEffect(() => {
        //Api load user info
        const fetchApi = async () => {
            const result = await UserService.userProfile(username);
            setUserProfile(result.data);
        };

        //api load list post of user
        const listPostApi = async () => {
            const result = await PostService.getListPostUser(username);
            if (result.success) {
                dispatch(updateUserListPost(result.data));
            }
        };
        //api load status relation
        const statusRelation = async () => {
            const result = await RelaService.getRelation(username);
            if (result.data) {
                dispatch(updateRelation(result.data.status));
            } else {
                dispatch(updateRelation('KẾT BẠN'));
            }
        };
        fetchApi();
        listPostApi();
        statusRelation();

        // eslint-disable-next-line
    }, [username]);

    return (
        <div style={{ marginLeft: isHeaderLayout ? '0' : '25rem', marginTop: isHeaderLayout ? '6rem' : '0' }}>
            <Modal show={modal} onHide={() => setModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Hủy kết bạn</Modal.Title>
                </Modal.Header>
                <Modal.Body>Bạn có chắc chắn muốn hủy kết bạn với {userProfile.name}?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setModal(false)}>
                        Không
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            unFollow();
                            setModal(false);
                        }}
                    >
                        Có
                    </Button>
                </Modal.Footer>
            </Modal>
            {isPostOpen && (
                <Suspense fallback={<div>Đang tải...</div>}>
                    <PostDetail onClose={closePost} />
                </Suspense>
            )}

            {/* View avatar */}
            <Lightbox open={toggler} close={() => setToggler(!toggler)} slides={[{ src: userProfile.avatar }]} />

            <div className={`${isDarkMode ? 'theme-dark' : 'bg-content-light'}`} style={{ minHeight: '100vh' }}>
                <div className={cx('container-profile')}>
                    <header className={cx('profile-header')}>
                        <div className={cx('dropdown')}>
                            <div className={cx('profile-image')}>
                                <AppAvatar src={userProfile.avatar} size={160} />
                            </div>
                            <div className={cx('avatar_action', `${isDarkMode ? 'theme-light' : ''}`)}>
                                <div className={cx('action_item')} onClick={() => setToggler(!toggler)}>
                                    Xem ảnh đại diện
                                </div>
                            </div>
                        </div>

                        <div className={cx('content')}>
                            <div className={cx('profile')}>
                                <h4 className={cx('profile-username')}>{userProfile.username}</h4>
                                <button
                                    className={cx('edit-profile', `${isDarkMode ? 'theme-dark' : ''}`)}
                                    onClick={handleAddFriend}
                                >
                                    {(status === "WAITING" ? 'Đang chờ' : status === 'FRIEND' ? 'Hủy kết bạn': status)}
                                </button>
                                <button className={cx('settings', `${isDarkMode ? 'theme-dark' : ''}`)}>
                                    <FiSettings size="25px" />
                                </button>
                            </div>
                            <div className={cx('profile-follow')}>
                                <h5 className={cx('profile-follow-count')}>
                                    <span>{listPost.length}</span> {listPost.length > 1 ? 'bài viết' : 'bài viết'}
                                </h5>
                                <h5 className={cx('profile-follow-count')}>
                                    <span>{userProfile.countFriend}</span>{' '}
                                    {userProfile.countFriend > 1 ? 'bạn bè' : 'bạn bè'}
                                </h5>
                                <h5 className={cx('profile-follow-count')}>
                                    <span>{userProfile.countCommonFriend}</span>{' '}
                                    {userProfile.countCommonFriend > 1 ? 'bạn chung' : 'bạn chung'}
                                </h5>
                            </div>
                            <div className={cx('profile-bio')}>
                                <div className={cx('profile-real-name')}>{userProfile.name}</div>
                                <p>{userProfile.bio}</p>
                            </div>
                        </div>
                    </header>

                    <div
                        style={{
                            borderTop: isDarkMode ? '1px solid white' : '1px solid black',
                            padding: '20px 0',
                        }}
                    >
                        {userProfile.security === 'PRIVATE' ? (
                            status === 'FRIEND' ? (
                                listPost.length > 0 ? (
                                    <div className={cx('gallery')}>
                                        {listPost.map((result) => {
                                            return (
                                                result.files.length > 0 &&
                                                (result.files[0].type === 1 ? (
                                                    <img
                                                        key={result.id}
                                                        className={cx('gallery-item')}
                                                        src={result.files[0].value}
                                                        alt={result.value}
                                                        onClick={() => openPost(result)}
                                                    />
                                                ) : (
                                                    <video
                                                        key={result.id}
                                                        className={cx('gallery-item')}
                                                        src={result.files[0].value}
                                                        alt={result.value}
                                                        onClick={() => openPost(result)}
                                                    ></video>
                                                ))
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className={cx('private')}>
                                        <div className={cx('private-icon')}>
                                            <NoPhotography style={{ fontSize: '4rem' }} />
                                        </div>
                                        <span>Không có bài viết</span>
                                    </div>
                                )
                            ) : (
                                <div className={cx('private')}>
                                    <div className={cx('private-icon')}>
                                        <Https style={{ fontSize: '4rem' }} />
                                    </div>
                                    <span>Tài khoản riêng tư</span>
                                </div>
                            )
                        ) : listPost.length > 0 ? (
                            <div className={cx('gallery')}>
                                {listPost.map((result) => {
                                    return (
                                        result.files.length > 0 &&
                                        (result.files[0].type === 1 ? (
                                            <img
                                                key={result.id}
                                                className={cx('gallery-item')}
                                                src={result.files[0].value}
                                                alt={result.value}
                                                onClick={() => openPost(result)}
                                            />
                                        ) : (
                                            <video
                                                key={result.id}
                                                className={cx('gallery-item')}
                                                src={result.files[0].value}
                                                alt={result.value}
                                                onClick={() => openPost(result)}
                                            ></video>
                                        ))
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={cx('private')}>
                                <div className={cx('private-icon')}>
                                    <NoPhotography style={{ fontSize: '4rem' }} />
                                </div>
                                <span>Không có bài viết</span>
                            </div>
                        )}
                        {/* {listPost.length > 0 ? 
                         (userProfile.security === 'PUBLIC' || status == 'FRIEND' ? (
                            <div className={cx('gallery')}>
                                {listPost.map((result) => {
                                    return (
                                        result.files.length > 0 &&
                                        (result.files[0].type === 1 ? (
                                            <img
                                                key={result.id}
                                                className={cx('gallery-item')}
                                                src={result.files[0].value}
                                                alt={result.value}
                                                onClick={() => openPost(result)}
                                            />
                                        ) : (
                                            <video
                                                key={result.id}
                                                className={cx('gallery-item')}
                                                src={result.files[0].value}
                                                alt={result.value}
                                                onClick={() => openPost(result)}
                                            ></video>
                                        ))
                                    );
                                })}
                            </div>) : 
                         userProfile.security !== 'PUBLIC' ? 
                            <div className={cx('private')}>
                                <div className={cx('private-icon')}>
                                    <Https style={{ fontSize: '4rem' }} />
                                </div>
                                <span>This account is private</span>
                            </div>
                        : 
                            <div className={cx('private')}>
                                <div className={cx('private-icon')}>
                                    <NoPhotography style={{ fontSize: '4rem' }} />
                                </div>
                                <span>No post</span>
                            </div>
} */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileContent;
