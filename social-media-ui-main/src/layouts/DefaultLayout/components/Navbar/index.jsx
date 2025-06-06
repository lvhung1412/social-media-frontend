import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';

import { Container, Row, Col } from 'react-bootstrap';
import { onSnapshot, query, collection, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

// Components
import Notification from '../Notification';
import Invitation from '../Invitation';
import Search from '@components/Search';

// Assets
import useFirestore from '@/hooks/useFirestore';
import { toast, ToastContainer } from 'react-toastify';
import logoLight from '@/assets/images/logo/logo.jpg';
import { ChatOutlined, AddCircleOutline } from '@mui/icons-material';

// Styles
import styles from './Navbar.module.scss';
import 'bootstrap/dist/css/bootstrap.min.css';

// Action
import { logoutUser, updateUserListPost } from '@/action/UserAction';
import { updateCurrentRoom } from '@/action/ChatAction';
import { sidebarLayout } from '@/action/ThemeAction';

// Service
import * as UserService from '@/services/UserService';
import AppAvatar from '@components/Avatar';
import CreatePost from '@/components/CreatePost';

const cx = classNames.bind(styles);
const Navbar = () => {
    const userInfo = useSelector((state) => state.user.user);
    const isDarkMode = useSelector((state) => state.theme.isDarkModeEnabled);
    //const count = useSelector((state) => state.chat.count);
    const [count, setCount] = useState(0);
    const [modal, setModal] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const toProfile = () => {
        listUserPostApi();
    };
    //gọi Api trang Profile User
    const listUserPostApi = async () => {
        const result = await UserService.getUserListPost();
        if (result.success) {
            dispatch(updateUserListPost(result.data));
            navigate('/profile');
        }
    };
    const handleCloseModal = () => {
        setModal(false);
    };

    //xử lý khi Logout
    const handleLogout = () => {
        toast.dark('Đợi một chút!');
        setTimeout(() => {
            dispatch(updateCurrentRoom({}));
            dispatch(logoutUser());
            navigate('/login');
        }, 100);
        //set offline in firestore
        updateDoc(doc(db, 'user', userInfo.username), {
            isOnline: false,
            date: serverTimestamp(),
        });
        localStorage.clear(); // hoặc
        sessionStorage.clear();
        dispatch({ type: 'RESET_USER' });

    };

    const roomsCondition = useMemo(() => {
        return {
            fieldName: 'members',
            operator: 'array-contains',
            compareValue: userInfo.username,
        };
    }, [userInfo.username]);
    const rooms = useFirestore('rooms', roomsCondition);

    useEffect(() => {
        setCount(0);
        const chatRoom = (room) => {
            const q = query(collection(db, 'messages'), where('room', '==', room));

            const unsubcribe = onSnapshot(q, (snapshot) => {
                const document = snapshot.docs
                    .filter((doc) => doc.data().user !== userInfo.username && doc.data().status === 'WAITING')
                    .map((doc) => ({ ...doc.data(), id: doc.id }));
                if (document.length > 0) {
                    setCount((prev) => prev + 1);
                }
            });
            return unsubcribe;
        };
        rooms.forEach((room) => chatRoom(room.id));
        // eslint-disable-next-line
    }, [rooms]);
    return (
        <div>
            <ToastContainer />
            {modal && <CreatePost onClose={handleCloseModal} />}

            <div className={cx(`${isDarkMode ? 'theme-dark' : 'theme-light'}`, 'navbar__barContent')}>
                <Container style={{ maxWidth: 'var(--default-layout-width)' }} >
                    <Row className="d-flex align-items-center justify-content-between">
                        <Col>
                            <Link to="/">
                                <img src={logoLight} alt="logo" height="58px" style={{ paddingTop: '4px' }} />
                            </Link>
                        </Col>
                        <Col>
                            <Search darkMode={isDarkMode} />
                        </Col>
                        <Col className="d-flex align-items-center justify-content-end position-relative">
                            <AddCircleOutline
                                titleAccess="Create"
                                style={{ fontSize: '3rem', transition: 'all 0.3s' }}
                                className={cx('navbar-icon', 'add')}
                                onClick={() => setModal(true)}
                            />
                            <div className={cx('messages')}>
                                <ChatOutlined
                                    style={{ fontSize: '3rem', transition: 'all 0.3s' }}
                                    fontSize="large"
                                    title="Messages"
                                    className={cx('navbar-icon')}
                                    onClick={() => navigate('/messages')}
                                />
                                {count > 0 && (
                                    <div className={cx('count')}>
                                        <span>{count}</span>
                                    </div>
                                )}
                            </div>
                            <Invitation />
                            <Notification />

                            <div className={cx('dropdown')}>
                                <span style={{ display: 'flex' }}>
                                    <Link to="/profile">
                                        <AppAvatar src={userInfo.avatar} size={32} />
                                    </Link>
                                </span>
                                <div className={cx(`${isDarkMode ? 'theme-light' : ''}`, 'dropdown-content')}>
                                    <div className={cx('dropdown-item')} onClick={toProfile}>
                                        Hồ sơ
                                    </div>
                                    <div
                                        className={cx('dropdown-item')}
                                        onClick={() => {
                                            dispatch(sidebarLayout());
                                        }}
                                    >
                                        <span>Thay đổi giao diện</span>
                                        <div title="Dark/Light mode" style={{ height: '30px' }}></div>
                                    </div>
                                    <div className={cx('dropdown-item')} onClick={handleLogout}>
                                        <span>Đăng xuất</span>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>
    );
};

export default Navbar;
