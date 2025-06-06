/* eslint-disable */

import { useRef, useState, lazy, Suspense } from 'react';
import AppAvatar from '../Avatar';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { FiSend, FiHeart, FiMessageSquare, FiMoreHorizontal } from 'react-icons/fi';
import { BsEmojiSmile } from 'react-icons/bs';
import { NavigateBefore, NavigateNext } from '@mui/icons-material';

import classNames from 'classnames/bind';

import { toast, ToastContainer } from 'react-toastify';
import { Modal, ModalBody } from 'react-bootstrap';
import * as PostService from '../../services/PostService';
import * as NotifyService from '../../services/NotifyService';
import { LIST_REACTION } from '@/constant';

import { useSelector, useDispatch } from 'react-redux';
import { updateListPost, updateDetailPost } from '../../action/PostAction';

import styles from './Post.module.scss';
import CreatePost from '@components/CreatePost';
import { useNavigate } from 'react-router-dom';

const PostDetail = lazy(() => import('@components/PostDetail'));

const cx = classNames.bind(styles);

TimeAgo.addLocale(en);
// Create formatter (English).
const timeAgo = new TimeAgo('en-US');

const Post = ({ data }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const listPost = useSelector((state) => state.post.listPost);
    const detailPost = useSelector((state) => state.post.detailPost);
    const userInfo = useSelector((state) => state.user.user);

    const [modal, setModal] = useState(false);
    const [isPostOpen, setIsPostOpen] = useState(false);
    const [modalEdit, setModalEdit] = useState(false);

    //State ẩn/hiện Comment action

    const [toggleClass, setToggleClass] = useState(false);

    const [comment, setComment] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    //get Dark/Light theme
    const isDarkMode = useSelector((state) => state.theme.isDarkModeEnabled);
    const cmtRef = useRef();
    const moreRef = useRef();

    const handleNextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % data.files.length);
    };

    const handlePreviousImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? data.files.length - 1 : prevIndex - 1));
    };

    const openPost = () => {
        dispatch(updateDetailPost({ ...data, comments: [] }));
        setIsPostOpen(true);
    };

    const closePost = () => {
        setIsPostOpen(false);
    };

    //Xử lý khi Comment
    const postComment = (e) => {
        e.preventDefault();
        const fetchApi = async () => {
            //Khi rep một Comment
            const result = await PostService.createComment({
                postId: data.id,
                content: comment,
            });
            return result;
        };

        fetchApi().then((result) => {
            if (result.success) {
                setComment('');
                dispatch(
                    updateListPost(
                        listPost.map((item) => {
                            if (item.id === result.data.post.id) {
                                item.countComment++;
                            }
                            return item;
                        }),
                    ),
                );

                if (data.user.username !== userInfo.username) {
                    const content = `${userInfo.avatar}###${userInfo.name} đã bình luận vào bài viết của bạn.`;
                    createNotify(content, data.user.username);
                }
            }
        });
    };
    //Ẩn bài Post
    const hiddenPost = () => {
        // Owner post hidden
        if (userInfo.username === data.user.username) {
            const hiddenApi = async () => {
                const result = await PostService.hiddenPost(data.id);
                return result;
            };
            hiddenApi().then((data) => {
                if (data.success) {
                    dispatch(updateListPost(listPost.filter((item) => !(item.id === data.data.id))));
                    toast.success('Ẩn bài viết thành công', {
                        position: 'bottom-right',
                        autoClose: 1500,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: false,
                        theme: 'dark',
                    });
                    setModal(!modal);
                }
            });
        } else {
            dispatch(updateListPost(listPost.filter((item) => !(item.id === data.id))));
            toast.info('Đã ẩn bài viết', {
                position: 'bottom-right',
                autoClose: 1500,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: false,
                theme: 'dark',
            });
            setModal(!modal);
        }
    };
    //Ẩn Comment
    const hiddenComment = (id) => {
        const hiddenCmtApi = async () => {
            const result = await PostService.hiddenComment(id);
            //console.log(result);
            return result;
        };
        hiddenCmtApi().then((data) => {
            if (data.success) {
                console.log(data);
                dispatch(
                    updateListPost(
                        listPost.map((item) => {
                            if (item.id === data.data.post.id) {
                                item.comments = item.comments.filter((cmt) => !(cmt.id === data.data.id));
                            }
                            return item;
                        }),
                    ),
                );
            }
        });
    };

    const createNotify = async (content, user) => {
        const result = await NotifyService.createNotify({
            content: content,
            username: user,
        });
        return result;
    };

    const postReacton = async (reation) => {
        if (reation.name !== data.likedPost) {
            const result = await PostService.postReaction(data.id, reation.name);
            if (result.success) {
                const updatedCountReaction = data.countReaction.map((count, index) => {
                    if (index === reation.id) {
                        return count + 1;
                    }
                    return count;
                });

                LIST_REACTION.forEach((item) => {
                    if (item.name === data.likedPost) {
                        updatedCountReaction[item.id] -= 1;
                    }
                });

                if (data.likedPost === '') {
                    updatedCountReaction[6] += 1;
                }
                if (data.user.username !== userInfo.username) {
                    const content = `${userInfo.avatar}###${userInfo.name} bày tỏ cảm xúc vào bài viết của bạn.`;
                    createNotify(content, data.user.username);
                }

                dispatch(
                    updateListPost(
                        listPost.map((item) => {
                            if (item.id === data.id) {
                                item = { ...data, countReaction: updatedCountReaction, likedPost: reation.name };
                            }
                            return item;
                        }),
                    ),
                );
            }
        }
    };

    const unReaction = async () => {
        const result = await PostService.unReactionPost(data.id);
        if (result.success) {
            const updatedCountReaction = data.countReaction;
            LIST_REACTION.forEach((item) => {
                if (item.name === data.likedPost) {
                    updatedCountReaction[item.id] -= 1;
                }
            });
            if (data.likedPost !== '') {
                updatedCountReaction[6] -= 1;
            }
            dispatch(
                updateListPost(
                    listPost.map((item) => {
                        if (item.id === data.id) {
                            item = { ...data, countReaction: updatedCountReaction, likedPost: '' };
                        }
                        return item;
                    }),
                ),
            );
        }
    };

    const editPost = () => {
        setModalEdit(true);
        setModal(false);
    };
    const handleCloseEdit = () => {
        setModalEdit(false);
    };

    return (
        <div className={cx(`${isDarkMode ? 'post-theme-dark' : ''}`, 'post__container')}>
            <ToastContainer />
            {/* {isPostOpen && <PostDetail onClose={closePost} />} */}

            {isPostOpen && (
                <Suspense fallback={<div>Đang tải...</div>}>
                    <PostDetail onClose={closePost} />
                </Suspense>
            )}

            {modalEdit && <CreatePost data={data} onClose={handleCloseEdit} />}

            {/* Modal action post */}
            <Modal size="sm" centered show={modal} onHide={() => setModal(!modal)}>
                <ModalBody bsPrefix="modal-custom">
                    {userInfo.username && data.user.username && userInfo.username === data.user.username && (
                        <div className={cx('more-action')}>Xóa bài viết</div>
                    )}
                    <div className={cx('more-action')} onClick={hiddenPost}>
                        Ẩn bài viết
                    </div>
                    {userInfo.username === data.user.username && (
                        <div className={cx('more-action')} onClick={editPost}>
                            Chỉnh sửa bài viết
                        </div>
                    )}
                    <div className={cx('more-action')} onClick={() => setModal(!modal)}>
                        Hủy
                    </div>
                </ModalBody>
            </Modal>

            {/* Header Post */}
            <div className={cx('post__header')}>
                <div className="m-3">
                    <AppAvatar src={data.user.avatar} />
                </div>
                <div className={cx('post__username', 'username-hover')}>
                    <span
                        onClick={() => {
                            if (data.user.username === userInfo.username) {
                                navigate('/profile');
                            } else {
                                navigate(`/${data.user.username}`);
                            }
                        }}
                    >
                        {data.user.name}
                    </span>
                    <span className={cx('post-time')}>{timeAgo.format(new Date(data.createDate))}</span>
                </div>
                <FiMoreHorizontal size="25px" className={cx('icon-more')} onClick={() => setModal(!modal)} />
            </div>

            {/* Image Post*/}
            <div>
                {data.files.length > 0 && (
                    <div className={cx('list-image')}>
                        {data.files.filter((item) => item.status === 'ENABLE').length > 1 && (
                            <div className={cx('image-action')}>
                                <div className={cx('previous-btn')} onClick={handlePreviousImage}>
                                    <NavigateBefore style={{ fontSize: '2rem' }} />
                                </div>

                                <div className={cx('panigation')}>
                                    {data.files
                                        .filter((item) => item.status === 'ENABLE')
                                        .map((file, index) => (
                                            <span
                                                key={index}
                                                className={cx(currentImageIndex === index ? 'img-active' : '')}
                                                onClick={() => setCurrentImageIndex(index)}
                                            ></span>
                                        ))}
                                </div>

                                <div className={cx('next-btn')} onClick={handleNextImage}>
                                    <NavigateNext style={{ fontSize: '2rem' }} />
                                </div>
                            </div>
                        )}
                        {data.files[currentImageIndex].status === 'ENABLE' &&
                        data.files[currentImageIndex].type === 1 ? (
                            <img
                                src={data.files[currentImageIndex].value}
                                alt="Post"
                                style={{ width: '700px', height: '600px', objectFit: 'contain', background: '#181818' }}
                            />
                        ) : (
                            <video
                                controls
                                style={{ width: '700px', height: '600px', objectFit: 'contain', background: '#181818' }}
                            >
                                <source src={data.files[currentImageIndex].value} type="video/mp4" />
                                Trình duyệt của bạn không hỗ trợ loại video này.
                            </video>
                        )}
                    </div>
                )}
                <div className={cx('post-caption')}>
                    <div className="position-relative">
                        {/* <b>{data.user.name}:</b>  */}
                        <span style={{ fontWeight: '300', margin: '10px' }}>{data.value}</span>
                    </div>
                </div>
            </div>

                
            {/* Reaction, Comment, Share */}
            <div>
                <div style={{ marginBottom: '3px', display: 'flex', padding: '0 1rem', alignItems: 'center'}}>
                    <div className={cx('dropdown-icons')} style={{ paddingBottom: '3px'}}>
                        {LIST_REACTION.map((item, index) => {
                            if (item.name === data.likedPost) {
                                return (
                                    <img
                                        key={index}
                                        src={item.icon}
                                        alt="like"
                                        className={cx('post-react')}
                                        style={{ width: '25px', paddingBottom: '3px' }}
                                        onClick={unReaction}
                                    />
                                );
                            }
                            return null;
                        })}

                        {/* Default click like not choose reaction is Love reaction */}
                        {!data.likedPost && (
                            <FiHeart
                                size="25px"
                                className={cx('post-react')}
                                onClick={() => postReacton(LIST_REACTION[1])}
                            />
                        )}
                        <div className={cx('dropdown-wrap')}>
                            {LIST_REACTION.map((item, index) => (
                                <img
                                    key={index}
                                    src={item.icon}
                                    alt="like"
                                    className={cx('dropdown-icon')}
                                    onClick={() => postReacton(item)}
                                />
                            ))}
                        </div>
                    </div>
                    <FiMessageSquare
                        size="25px"
                        className={cx('post__reactIcon')}
                        onClick={() => cmtRef.current.focus()}
                    />
                    <FiSend size="25px" className={cx('post__reactIcon')} />
                </div>
                <div style={{ fontSize: '14px', marginLeft: '20px', marginBottom: '10px', fontWeight: '100' }}>
                    {data.countReaction[6]} {data.countReaction[6] > 1 ? 'lượt thích' : 'lượt thích'}
                </div>
            </div>

            {/* List Comment */}
            <div>
                {/* {format(data.comments)
                    .sort((a, b) => {
                        //Sắp xếp Comment theo thời gian
                        let da = new Date(a.createDate);
                        let db = new Date(b.createDate);
                        return da - db;
                    })
                    .map(
                        (comment) =>
                            //Chỉ hiện những Comment có status là Enable
                            comment.status === 'ENABLE' && (
                                <div key={comment.id} className={cx('post__comment')}>
                                    <div className="position-relative">
                                        <div>
                                            {comment.user.username}:
                                            <span style={{ fontWeight: '300', fontSize: '14px', marginLeft: '5px' }}>
                                                {comment.value}
                                            </span>
                                            <div className={cx('like-comment')}>
                                                <div role="button">Like</div>
                                                <div
                                                    role="button"
                                                    onClick={() => {
                                                        setRepId(comment.id);
                                                        setRepUser(comment.user.username);
                                                        cmtRef.current.focus();
                                                    }}
                                                >
                                                    Reply
                                                </div>
                                            </div>
                                        </div>
                                        {comment.children
                                            //render những Comment có Rep Comment
                                            .sort((a, b) => {
                                                //Sắp xếp theo thời gian
                                                let da = new Date(a.createDate);
                                                let db = new Date(b.createDate);
                                                return da - db;
                                            })
                                            .map((item, index) => (
                                                <div style={{ marginLeft: '20px' }} key={index}>
                                                    <BsArrowReturnRight style={{ marginRight: '5px' }} />
                                                    {item.user.username}:
                                                    <span
                                                        style={{
                                                            fontWeight: '300',
                                                            fontSize: '14px',
                                                            marginLeft: '5px',
                                                        }}
                                                    >
                                                        {item.value}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                    <div className={cx('comment-dropdown')} ref={moreRef}>
                                        <FiMoreHorizontal
                                            size="15px"
                                            className={cx('more')}
                                            onClick={() => {
                                                setToggleClass(!toggleClass);
                                                setCommentId(comment.id);
                                            }}
                                        />

                                        <div
                                            className={cx(
                                                'comment-action',
                                                `${isDarkMode ? 'theme-light' : ''}`,
                                                `${toggleClass && commentId === comment.id ? 'activeAct' : ''}`,
                                            )}
                                        >
                                            <div
                                                className={cx('action-item')}
                                                onClick={() => hiddenComment(comment.id)}
                                            >
                                                Hidden comment
                                            </div>
                                            <div className={cx('action-item')}>Report comment</div>
                                        </div>
                                    </div>
                                    <div className={cx('cmt-time')}>{timeAgo.format(new Date(comment.createDate))}</div>
                                </div>
                            ),
                    )} */}
                {data.countComment > 0 && (
                    <div className={cx('view-all')} onClick={openPost}>
                        Xem {data.countComment} {data.countComment > 1 ? 'bình luận' : 'bình luận'}
                    </div>
                )}

                {/* Input Comment */}
                <form onSubmit={postComment}>
                    <div style={{ display: 'flex', borderTop: '1px solid #dbdddb' }}>
                        <div className={cx('icon-emoji')}>
                            <BsEmojiSmile size={25} />
                        </div>
                        <input
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            ref={cmtRef}
                            type="text"
                            className={cx(`${isDarkMode ? 'post-theme-dark' : ''}`, 'post__commentInput')}
                            placeholder="Thêm bình luận..."
                        />

                        <button className={cx('post-btn')} disabled={comment === '' ? true : false}>
                            Đăng
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Post;
