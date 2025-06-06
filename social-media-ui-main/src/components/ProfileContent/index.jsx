import { useEffect, useState, useRef, lazy, Suspense } from 'react';

import { useDispatch } from 'react-redux';
import { updateUser, updateUserListPost } from '@/action/UserAction';
import { updateDetailPost } from '../../action/PostAction';
import * as RelaService from '@/services/RelaService';

import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import * as UserService from '../../services/UserService';
import { Modal, ModalHeader, ModalBody, Row, Col } from 'react-bootstrap';

import { FiSettings } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import styles from './ProfileContent.module.scss';
import 'bootstrap/dist/css/bootstrap.min.css';
import AppAvatar from '../Avatar';
import classNames from 'classnames/bind';
const PostDetail = lazy(() => import('@components/PostDetail'));

const cx = classNames.bind(styles);

const ProfileContent = () => {
    const isDarkMode = useSelector((state) => state.theme.isDarkModeEnabled);
    const dispatch = useDispatch();
    const inputRef = useRef();

    //get user info from redux
    const userInfo = useSelector((state) => state.user.user);
    const listPost = useSelector((state) => state.user.userListPost);
    const isHeaderLayout = useSelector((state) => state.layout.isHeaderLayout);

    const [name, setName] = useState(userInfo.name);
    const [username, setUsername] = useState(userInfo.username);
    const [bio, setBio] = useState(userInfo.bio);
    const [email, setEmail] = useState(userInfo.email);
    const [phone, setPhone] = useState(userInfo.phone);
    const [birthday, setBirthday] = useState(userInfo.birthday);
    const [gender, setGender] = useState(userInfo.gender);
    const [toggler, setToggler] = useState(false);
    const [modal, setModal] = useState(false);
    const [modal2, setModal2] = useState(false);
    const [friendModal, setFriendModal] = useState(false);
    const [size, setSize] = useState(1);
    const [listFriend, setListFriend] = useState([]);

    const [avatar, setAvatar] = useState(userInfo.avatar);

    const [isPostOpen, setIsPostOpen] = useState(false);
    const [countFriend, setCountFriend] = useState(0);
    const [selectedOption, setSelectedOption] = useState('PUBLIC');

    const changeImage = () => {
        inputRef.current.click();
    };
    useEffect(() => {
        return () => {
            avatar && URL.revokeObjectURL(avatar);
        };
    }, [avatar]);

    //set state khi thay update profile
    useEffect(() => {
        setName(userInfo.name);
        setPhone(userInfo.phone);
        setGender(userInfo.gender);
        setBirthday(userInfo.birthday);
        setBio(userInfo.bio);
        setSelectedOption(userInfo.security);
    }, [userInfo]);

    useEffect(() => {
        document.title = 'Hồ sơ';
        getCountFriend();
        listPostApi();
        // eslint-disable-next-line
    }, []);

    const getCountFriend = async () => {
        const result = await UserService.getCountFriend();
        if (result.success) {
            setCountFriend(result.data);
        }
    };

    const getListFriend = async () => {
        const result = await UserService.getListFriend(size);
        if (result.success) {
            const list = result.data.map((item) => {
                // alert(item.userTo.username);
                if (item.userTo.username === userInfo.username) {
                    return item.userFrom;
                }
                return item.userTo;
            });
            setListFriend([...listFriend, ...list]);
        }
    };

    //Api get list post
    const listPostApi = async () => {
        const result = await UserService.getUserListPost();
        if (result.success) {
            dispatch(updateUserListPost(result.data));
        }
    };

    const unFollow = async (username) => {
        const result = await RelaService.deleteRelation(username);
        if (result.success) {
            setListFriend((prev) => prev.filter((item) => item.username !== username));
            setCountFriend((prev) => prev - 1);
        }
    };

    const checkResult = (result) => {
        if (result.data) {
            setTimeout(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Chỉnh sửa hồ sơ thành công',
                    showConfirmButton: false,
                    timer: 1000,
                });
                localStorage.removeItem('token');
                localStorage.setItem('token', result.data.token);
                dispatch(updateUser(result.data.userInfo));
            }, 1500);
        } else {
            setTimeout(() => {
                Swal.fire({
                    icon: 'error',
                    title: result.message,
                    showConfirmButton: false,
                    timer: 1500,
                });
            }, 1000);
        }
    };

    //xử lý khi Update profile
    const update = async () => {
        const result = await UserService.updateCustomer({
            name: name.trim(),
            phone: phone.trim(),
            birthday: birthday.trim(),
            gender: gender,
            bio: bio,
            security: selectedOption,
        });
        checkResult(result);
    };
    const checkChange = (change) => {
        if (change.data) {
            setTimeout(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Thay đổi avatar thành công',
                    showConfirmButton: false,
                    timer: 1000,
                });
                dispatch(updateUser(change.data));
            }, 1500);
        }
    };
    //xử lý khi đổi avatar
    const changeAvatar = async () => {
        const change = await UserService.changeAvatar({
            avatar: avatar,
        });
        checkChange(change);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        toast.dark('Đang chờ một chút!', { autoClose: 2000 });
        update();
        setModal(!modal);
    };
    const handleChange = () => {
        toast.dark('Đang chờ một chút!', { autoClose: 2000 });
        changeAvatar();
        setModal2(!modal2);
    };

    const openPost = (data) => {
        dispatch(updateDetailPost(data));
        setIsPostOpen(true);
    };

    const closePost = () => {
        setIsPostOpen(false);
    };

    return (
        <div style={{ marginLeft: isHeaderLayout ? '0' : '25rem', marginTop: isHeaderLayout ? '6rem' : '0' }}>
            {isPostOpen && (
                <Suspense fallback={<div>Đang tải...</div>}>
                    <PostDetail onClose={closePost} />
                </Suspense>
            )}

            {/* View avatar */}
            <Lightbox open={toggler} close={() => setToggler(!toggler)} slides={[{ src: userInfo.avatar }]} />

            {/* Friend modal */}
            <Modal
                centered
                show={friendModal}
                onHide={() => {
                    setFriendModal(!friendModal);
                    setSize(1);
                    setListFriend([]);
                }}
            >
                <ModalHeader closeButton={true}>Danh sách bạn bè</ModalHeader>
                <ModalBody>
                    <div style={{ padding: '1rem' }}>
                        <input placeholder="Tìm kiếm bạn bè..." className={cx('input-search')} type="text" />
                    </div>
                    <div className={cx('list-friend-content')}>
                        {listFriend &&
                            listFriend.length > 0 &&
                            listFriend.map((friend) => {
                                return (
                                    <div className={cx('friend-item')} key={friend.username}>
                                        <div key={friend.username} className={cx('userfriend-info')}>
                                            <AppAvatar src={friend.avatar} size={35} />
                                            <div className={cx('friend-username-name')}>
                                                <span className={cx('friend-name')}>{friend.name}</span>
                                                <span className={cx('friend-username')}>{friend.username}</span>
                                            </div>
                                        </div>
                                        <div className={cx('friend-btn')}>
                                            <button onClick={() => unFollow(friend.username)}>Hủy kết bạn</button>
                                        </div>
                                    </div>
                                );
                            })}
                        {/* <div
                            className={cx('view-more')}
                            onClick={() => {
                                setSize((prev) => prev + 1);
                                getListFriend();
                            }}
                        >
                            View more
                        </div> */}
                    </div>
                </ModalBody>
            </Modal>

            {/* Change avatar modal */}
            <Modal centered show={modal2} onHide={() => setModal2(!modal2)}>
                <ModalHeader closeButton={true}>Thay đổi avatar</ModalHeader>
                <ModalBody>
                    {avatar && <img src={avatar.preview} alt="avatar" width="100%" />}
                    <div className="d-flex justify-content-end">
                        <button className="btn btn-primary mt-3" style={{ fontSize: '1.5rem' }} onClick={handleChange}>
                            Thay đổi
                        </button>
                    </div>
                </ModalBody>
            </Modal>
            {/* Edit profile modal */}

            <Modal centered show={modal} onHide={() => setModal(!modal)}>
                <ModalHeader closeButton={true}>Chỉnh sửa thông tin</ModalHeader>
                <ModalBody className="px-4">
                    <form onSubmit={handleSubmit} style={{ fontSize: '14px' }}>
                        <Row>
                            <div className="d-flex align-items-center">
                                <Col lg={3}>
                                    <label>Tên</label>
                                </Col>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="form-control"
                                    placeholder="Nhập tên"
                                />
                            </div>
                            <div className="mt-5 d-flex align-items-center">
                                <Col lg={3}>
                                    <label>Tên đăng nhập</label>
                                </Col>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled
                                    className="form-control"
                                    placeholder="Nhập tên đăng nhập"
                                />
                            </div>

                            <div className="mt-5 d-flex align-items-center">
                                <Col lg={3}>
                                    <label>Tiểu sử</label>
                                </Col>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="form-control"
                                    placeholder="Nhập tiểu sử"
                                />
                            </div>

                            <div className="mt-5 d-flex align-items-center">
                                <Col lg={3}>
                                    <label>Email</label>
                                </Col>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled
                                    className="form-control"
                                    placeholder="Nhập email"
                                />
                            </div>
                            <div className="mt-5 d-flex align-items-center">
                                <Col lg={3}>
                                    <label>Số điện thoại</label>
                                </Col>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="form-control"
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>
                            <div className="mt-5 d-flex align-items-center">
                                <Col lg={3}>
                                    <label>Ngày sinh</label>
                                </Col>
                                <input
                                    type="date"
                                    value={birthday.split('T')[0]}
                                    onChange={(e) => setBirthday(e.target.value)}
                                    className="form-control"
                                />
                            </div>
                            <div className="mt-5 d-flex align-items-center">
                                <Col lg={3}>
                                    <label>Giới tính</label>
                                </Col>
                                <label style={{ marginRight: '20px' }}>
                                    <input
                                        style={{ marginRight: '5px' }}
                                        type="radio"
                                        id="male"
                                        name="gender"
                                        checked={gender === 'MALE'}
                                        onChange={(e) => setGender(e.target.value)}
                                        value="MALE"
                                    />
                                    Nam
                                </label>
                                <label style={{ marginRight: '20px' }}>
                                    <input
                                        style={{ marginRight: '5px' }}
                                        type="radio"
                                        id="female"
                                        name="gender"
                                        checked={gender === 'FEMALE'}
                                        onChange={(e) => setGender(e.target.value)}
                                        value="FEMALE"
                                    />
                                    Nữ
                                </label>
                                <label>
                                    <input
                                        style={{ marginRight: '5px' }}
                                        type="radio"
                                        id="other"
                                        name="gender"
                                        checked={gender === 'OTHER'}
                                        onChange={(e) => setGender(e.target.value)}
                                        value="OTHER"
                                    />
                                    Khác
                                </label>
                            </div>
                            <div className="mt-5 d-flex align-items-center">
                                <Col lg={3}>
                                    <label>Trạng thái</label>
                                </Col>
                                <select
                                    role="button"
                                    value={selectedOption}
                                    onChange={(e) => setSelectedOption(e.target.value)}
                                    name="status"
                                    id="status-post"
                                    className={cx('select-status')}
                                >
                                    <option value="PUBLIC">Công khai</option>
                                    <option value="PRIVATE">Riêng tư</option>
                                </select>
                            </div>
                        </Row>
                        <div className="d-flex justify-content-end">
                            <button className="btn btn-primary mt-3" style={{ fontSize: '1.5rem' }}>
                                Gửi
                            </button>
                        </div>
                    </form>
                </ModalBody>
            </Modal>
            <div className={`${isDarkMode ? 'theme-dark' : 'bg-content-light'}`} style={{ minHeight: '100vh' }}>
                <div className={cx('container-profile')}>
                    <header className={cx('profile-header')}>
                        <div className={cx('dropdown')}>
                            <div className={cx('profile-image')}>
                                <AppAvatar src={userInfo.avatar} size={160} />
                            </div>
                            <div className={cx('avatar_action', `${isDarkMode ? 'theme-light' : ''}`)}>
                                <div className={cx('action_item')} onClick={() => setToggler(!toggler)}>
                                    Xem ảnh đại diện
                                </div>
                                <div className={cx('action_item')} onClick={() => changeImage()}>
                                    Thay đổi ảnh đại diện
                                </div>
                                <input
                                    type="file"
                                    hidden={true}
                                    ref={inputRef}
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        file.preview = URL.createObjectURL(file);
                                        setAvatar(file);
                                        setModal2(!modal2);
                                    }}
                                />
                            </div>
                        </div>

                        <div className={cx('content')}>
                            <div className={cx('profile')}>
                                <h4 className={cx('profile-username')}>{userInfo.username}</h4>
                                <button
                                    className={cx('edit-profile', `${isDarkMode ? 'theme-dark' : ''}`)}
                                    onClick={() => setModal(!modal)}
                                >
                                    Chỉnh sửa hồ sơ
                                </button>
                                <button className={cx('settings', `${isDarkMode ? 'theme-dark' : ''}`)}>
                                    <FiSettings size="25px" />
                                </button>
                            </div>
                            <div className={cx('profile-follow')}>
                                <h5 className={cx('profile-follow-count')}>
                                    <span>{listPost.length}</span> {listPost.length > 1 ? 'bài viết': 'bài viết'}
                                </h5>
                                <h5
                                    className={cx('profile-follow-count')}
                                    onClick={() => {
                                        setFriendModal(!friendModal);
                                        getListFriend();
                                    }}
                                >
                                    <span>{countFriend}</span> {countFriend > 1 ? 'bạn bè' : 'bạn bè'}
                                </h5>
                            </div>
                            <div className={cx('profile-bio')}>
                                <div className={cx('profile-real-name')}>{userInfo.name}</div>
                                <p>{userInfo.bio}</p>
                            </div>
                        </div>
                    </header>

                    <div
                        style={{
                            borderTop: isDarkMode ? '1px solid white' : '1px solid black',
                            padding: '20px 0',
                        }}
                    >
                        <div className={cx('gallery')}>
                            {listPost &&
                                listPost.map((result) => {
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileContent;
