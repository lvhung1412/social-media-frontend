/* eslint-disable */
import { useState, useMemo, useEffect, useRef } from 'react';

import AppAvatar from '@components/Avatar';
import * as UserService from '@/services/UserService';
import FriendItem from '@/layouts/DefaultLayout/components/Invitation/FriendItem';
import * as NotifyService from '@/services/NotifyService';
import * as RelaService from '@/services/RelaService';
import { toast, ToastContainer } from 'react-toastify';

import {
    NotificationsNoneOutlined,
    HomeOutlined,
    ChatOutlined,
    AddCircleOutline,
    FavoriteBorder,
    Home,
    Search,
    Chat,
    Favorite,
    Notifications,
    Menu,
    AddCircle,
} from '@mui/icons-material';
import { BsCheckAll } from 'react-icons/bs';

import { onSnapshot, query, collection, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

import classNames from 'classnames/bind';
import styles from './Sidebar.module.scss';
import CreatePost from '@/components/CreatePost';

import logoLight from '@/assets/images/logo/logo.jpg';

import { useDispatch, useSelector } from 'react-redux';

// Action
import { logoutUser } from '@/action/UserAction';
import { updateCurrentRoom } from '@/action/ChatAction';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SidebarItem from '../SidebarItem';
import { headerLayout } from '@/action/ThemeAction';
import useFirestore from '@/hooks/useFirestore';
import NotifyItem from '@/layouts/DefaultLayout/components/Notification/NotifyItem';
import ResultItem from './ResultItem';

const cx = classNames.bind(styles);

const Sidebar = () => {
    const userInfo = useSelector((state) => state.user.user);
    const isDarkMode = useSelector((state) => state.theme.isDarkModeEnabled);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const iconStyle = {
        fontSize: '3rem',
        transition: 'all 0.3s',
    };
    const location = useLocation().pathname.substring(1);
    const [activeTab, setActiveTab] = useState(location || '');
    const [modal, setModal] = useState(false);
    const [countMsg, setCountMsg] = useState(0);
    const [countNoti, setCountNoti] = useState(0);
    const [countInvi, setCountInvi] = useState(0);
    const [searchValue, setSearchValue] = useState('');
    const [searchResult, setSearchResult] = useState([]);

    const [showNotifyResult, setShowNotifyResult] = useState(false);
    const [showInviResult, setShowInviResult] = useState(false);
    const [showMoreModal, setShowMoreModal] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [listNotify, setListNotify] = useState([]);
    const [listInvitation, setListInvitation] = useState([]);

    const notifyRef = useRef();
    const invitationRef = useRef();
    const moreRef = useRef();
    const searchRef = useRef();
    const inputSearchRef = useRef();

    const handleCloseModal = () => {
        setModal(false);
        setActiveTab('');
    };

    const changeNotiCount = () => {
        setCountNoti((prev) => prev - 1);
    };
    const changeInviCount = () => {
        setCountInvi((prev) => prev - 1);
    };

    const seenNotify = (id) => {
        setListNotify((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    return {
                        ...item,
                        status: 'SEEN',
                    };
                }
                return item;
            }),
        );
    };
    const seenAll = async () => {
        const result = await NotifyService.seenNotify({
            ids: listNotify.filter((item) => item.status === 'WAITING').map((item) => item.id),
        });
        if (result.data) {
            setCountNoti(0);
            setListNotify((prev) =>
                prev.map((item) => ({
                    ...item,
                    status: 'SEEN',
                })),
            );
        }
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
        setCountMsg(0);
        const chatRoom = (room) => {
            const q = query(collection(db, 'messages'), where('room', '==', room));

            const unsubcribe = onSnapshot(q, (snapshot) => {
                const document = snapshot.docs
                    .filter((doc) => doc.data().user !== userInfo.username && doc.data().status === 'WAITING')
                    .map((doc) => ({ ...doc.data(), id: doc.id }));
                if (document.length > 0) {
                    setCountMsg((prev) => prev + 1);
                }
            });
            return unsubcribe;
        };
        rooms.forEach((room) => chatRoom(room.id));
    }, [rooms]);

    useEffect(() => {
        const notifyApi = async () => {
            const result = await NotifyService.getNotify();
            if (result.data) {
                setListNotify(result.data);
                setCountNoti(result.data.filter((item) => item.status === 'WAITING').length);
            }
        };
        const invitationApi = async () => {
            const result = await RelaService.getInvitation();
            if (result.data) {
                setListInvitation(result.data.map((item) => item.userFrom));
                setCountInvi(result.data.length);
            }
        };
        notifyApi();
        invitationApi();
    }, []);

    //handle show/hide notification
    useEffect(() => {
        const handleClick = (e) => {
            if (notifyRef.current && notifyRef.current !== null) {
                if (notifyRef.current.contains(e.target)) {
                    setShowNotifyResult((prevState) => !prevState);
                } else {
                    setShowNotifyResult(false);
                }
            }
            if (invitationRef.current && invitationRef.current !== null) {
                if (invitationRef.current.contains(e.target)) {
                    setShowInviResult((prevState) => !prevState);
                } else {
                    setShowInviResult(false);
                }
            }

            if (moreRef.current && moreRef.current !== null) {
                if (moreRef.current.contains(e.target)) {
                    setShowMoreModal((prevState) => !prevState);
                } else {
                    setShowMoreModal(false);
                }
            }

            if (searchRef.current && searchRef.current !== null) {
                if (searchRef.current.contains(e.target)) {
                    if (showSearch) {
                        searchRef.current.style.transition = 'all 0.3s ease-out';
                        searchRef.current.style.width = '100%';
                        if (inputSearchRef.current && inputSearchRef.current != null) {
                            inputSearchRef.current.style.transition = 'all 0.3s ease-in-out';
                            inputSearchRef.current.style.width = '0';
                        }
                    } else {
                        searchRef.current.style.transition = 'all 0.3s ease-out';
                        searchRef.current.style.width = '0';
                        if (inputSearchRef.current && inputSearchRef.current != null) {
                            inputSearchRef.current.style.transition = 'all 0.3s ease-in-out';
                            inputSearchRef.current.style.width = '100%';
                        }
                    }
                    setShowSearch((prevState) => !prevState);
                } else if (inputSearchRef.current && inputSearchRef.current != null) {
                    if (!inputSearchRef.current.contains(e.target)) {
                        searchRef.current.style.transition = 'all 0.3s ease-out';
                        searchRef.current.style.width = '100%';
                        inputSearchRef.current.style.transition = 'all 0.3s ease-in-out';
                        inputSearchRef.current.style.width = '0';

                        setShowSearch(false);
                    }
                }
            }
        };
        document.addEventListener('click', handleClick, true);
    }, []);

    // LOGOUT
    const handleLogout = () => {
        toast.dark('Đang chờ một chút!');
        setTimeout(() => {
            dispatch(updateCurrentRoom({}));
            dispatch(logoutUser());
            navigate('/login');
        }, 1500);
        //set offline in firestore
        updateDoc(doc(db, 'user', userInfo.username), {
            isOnline: false,
            date: serverTimestamp(),
        });
    };

    useEffect(() => {
        if (!searchValue.trim()) {
            setSearchResult([]);
            return;
        }
        //Get data from search result
        const fetchApi = async () => {
            const result = await UserService.searchByName(searchValue);
            setSearchResult(result.data);
        };
        fetchApi();
    }, [searchValue]);

    return (
        <div className={cx('sidebar', `${isDarkMode ? 'theme-dark' : 'theme-light'}`)} >
            <ToastContainer />
            {modal && <CreatePost onClose={handleCloseModal} />}
            <div className={cx('logo')}>
                <Link to="/">
                    <img src={logoLight} alt="logo" height="58px" />
                </Link>
            </div>
            <div className={cx('items-container')}>
                <SidebarItem
                    icon={<HomeOutlined style={iconStyle} />}
                    activeIcon={<Home style={iconStyle} />}
                    isActive={activeTab === ''}
                    title="Trang chủ"
                    onClick={() => {
                        setActiveTab('');
                        navigate('/');
                    }}
                />

                <div className={cx('sidebar-search')}>
                    <div className={cx('sidebar-search-item')} ref={searchRef}>
                        <SidebarItem
                            icon={<Search style={iconStyle} />}
                            activeIcon={<Search style={iconStyle} />}
                            isActive={activeTab === 'search'}
                            title="Tìm kiếm"
                            onClick={() => setActiveTab('search')}
                        />
                    </div>
                    <div className={cx('input-search', 'sidebar-search-item')} ref={inputSearchRef}>
                        <input
                            style={{ paddingLeft: '35px' }}
                            placeholder="Tìm kiếm..."
                            value={searchValue}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (!value.startsWith(' ')) {
                                    setSearchValue(value);
                                }
                            }}
                        />
                    </div>
                    {searchResult && searchResult.length > 0 && (
                        <div
                            className={cx(
                                'search-result',
                                !showSearch && 'hidden',
                                `${isDarkMode ? 'theme-dark' : 'theme-light'}`,
                            )}
                        >
                            {searchResult.map((item) => {
                                return <ResultItem key={item.username} item={item} />;
                            })}
                        </div>
                    )}
                </div>

                <div className={cx('sidebar-notify')} ref={notifyRef}>
                    <SidebarItem
                        count={countNoti}
                        icon={<NotificationsNoneOutlined style={iconStyle} />}
                        activeIcon={<Notifications style={iconStyle} />}
                        isActive={activeTab === 'notifications'}
                        title="Thông báo"
                        onClick={() => setActiveTab('notifications')}
                    />

                    <div className={cx('notify-result', !showNotifyResult && 'hidden', isDarkMode ? 'theme-dark' : '')}>
                        <div className={cx('top')}>
                            <h4 className={cx('notify-title')}>Thông báo</h4>
                            <div className={cx('mark')} onClick={seenAll}>
                                <BsCheckAll size={24} />
                                Đánh dấu tất cả đã xem
                            </div>
                        </div>

                        {listNotify.length > 0 ? (
                            <div className={cx('list-notify')}>
                                {listNotify.map((result) => (
                                    <div className={cx('notify-item')} key={result.id}>
                                        <NotifyItem
                                            content={result}
                                            changeCount={changeNotiCount}
                                            seenNotify={seenNotify}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={cx('result-notify')}>
                                <span>Không có thông báo</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className={cx('sidebar-invitation')} ref={invitationRef}>
                    <SidebarItem
                        count={countInvi}
                        icon={<FavoriteBorder style={iconStyle} />}
                        activeIcon={<Favorite style={iconStyle} />}
                        isActive={activeTab === 'invitations'}
                        title="Lời mời kết bạn"
                        onClick={() => setActiveTab('invitations')}
                    />

                    <div
                        className={cx(
                            'notify-result',
                            !showInviResult && 'hidden',
                            isDarkMode ? 'theme-dark' : '',
                            'small-wrap',
                        )}
                    >
                        <h4 className={cx('notify-title')}>Lời mời kết bạn</h4>
                        {listInvitation.length > 0 ? (
                            <div className={cx('list-notify')}>
                                {listInvitation.map((result) => (
                                    <div className={cx('notify-item')} key={result.username}>
                                        <FriendItem user={result} changeCount={changeInviCount} size={1} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={cx('result-notify')}>
                                <span>Không có lời mời</span>
                            </div>
                        )}
                    </div>
                </div>

                <SidebarItem
                    count={countMsg}
                    icon={<ChatOutlined style={iconStyle} />}
                    activeIcon={<Chat style={iconStyle} />}
                    isActive={activeTab === 'messages'}
                    title="Tin nhắn"
                    onClick={() => {
                        setActiveTab('messages');
                        navigate('/messages');
                    }}
                />
                <SidebarItem
                    icon={<AddCircleOutline style={iconStyle} />}
                    activeIcon={<AddCircle style={iconStyle} />}
                    isActive={activeTab === 'create'}
                    title="Tạo bài viết"
                    onClick={() => {
                        setActiveTab('create');
                        setModal(true);
                    }}
                />
                <SidebarItem
                    icon={<AppAvatar src={userInfo.avatar} size={24} alt="" />}
                    activeIcon={<AppAvatar src={userInfo.avatar} size={30} alt="" />}
                    isActive={activeTab === 'profile'}
                    title="Hồ sơ"
                    onClick={() => {
                        setActiveTab('profile');
                        navigate('/profile');
                    }}
                />
            </div>
            <div ref={moreRef} className={cx('more-options')}>
                <SidebarItem
                    icon={<Menu style={iconStyle} />}
                    activeIcon={<Menu style={iconStyle} />}
                    isActive={activeTab === 'more'}
                    title="Thêm"
                    onClick={() => {
                        setActiveTab('more');
                    }}
                />
                <div
                    className={cx(`${isDarkMode ? 'theme-light' : ''}`, !showMoreModal && 'hidden', 'dropdown-content')}
                >
                    <div
                        className={cx('dropdown-item')}
                        onClick={() => {
                            dispatch(headerLayout());
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
        </div>
    );
};

export default Sidebar;
