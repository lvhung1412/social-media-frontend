import { useState, useEffect } from 'react';

import {
    HomeOutlined,
    Home,
    ManageAccounts,
    ManageAccountsOutlined,
    Textsms,
    TextsmsOutlined,
    Assignment,
    AssignmentOutlined,
    Logout,
    Person,
} from '@mui/icons-material';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import { logoutUser } from '@/action/UserAction';
import classNames from 'classnames/bind';
import styles from './HomeAdmin.module.scss';
import * as AdminService from '@/services/AdminService';

import logo from '@/assets/images/login/nature.jpg';

import { useDispatch, useSelector } from 'react-redux';
import SidebarItem from '@/layouts/SidebarLayout/components/SidebarItem';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';

const cx = classNames.bind(styles);

const HomeAdmin = () => {
    const userInfo = useSelector((state) => state.user.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const iconStyle = {
        fontSize: '3rem',
        color: '#fff',
        transition: 'all 0.3s',
    };

    const [title, setTitle] = useState('Dashboard');
    const [countAll, setCountAll] = useState({});
    const [listField, setListField] = useState([]);
    const [listData, setListData] = useState([]);
    const [tableKey, setTableKey] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [activeTab, setActiveTab] = useState('dashboard');

    //xử lý khi Logout
    const handleLogout = () => {
        toast.dark('Đang chờ một chút!');
        setTimeout(() => {
            dispatch(logoutUser());
            navigate('/login/admin');
        }, 1500);
    };

    const formatDate = (createDate) => {
        const date = new Date(createDate);
        return date.toLocaleDateString('vi-VN');
    };

    // Chuyển đến trang tiếp theo
    const nextPage = () => {
        if (page < totalPages) {
            setPage((prev) => prev + 1);
        }
    };

    // Quay lại trang trước đó
    const prevPage = () => {
        if (page > 1) {
            setPage((prev) => prev - 1);
        }
    };

    const getListUser = async () => {
        const result = await AdminService.getAllUser(page);
        if (result.success) {
            setListData(result.data);
            const totalPages = Math.ceil(countAll.countUser / 7);
            setTotalPages(totalPages);
        }
    };

    const getListPost = async () => {
        const result = await AdminService.getAllPost(page);
        if (result.success) {
            setListData(result.data);
            const totalPages = Math.ceil(countAll.countPost / 7);
            setTotalPages(totalPages);
        }
    };

    const getListComment = async () => {
        const result = await AdminService.getAllComment(page);
        if (result.success) {
            setListData(result.data);
            const totalPages = Math.ceil(countAll.countComment / 7);
            setTotalPages(totalPages);
        }
    };

    const getMonthName = (monthNumber) => {
        const date = new Date();
        date.setMonth(monthNumber - 1);

        return date.toLocaleString('en-US', {
            month: 'short',
        });
    };

    const getStatistic = async () => {
        const result = await AdminService.getStatistic();
        if (result.success) {
            const listCountUser = result.data.countUserOfMonth;
            const listCountPost = result.data.countPostOfMonth;
            const listCountComment = result.data.countCommentOfMonth;
            var dataChart = [
                { month: 1 },
                { month: 2 },
                { month: 3 },
                { month: 4 },
                { month: 5 },
                { month: 6 },
                { month: 7 },
                { month: 8 },
                { month: 9 },
                { month: 10 },
                { month: 11 },
                { month: 12 },
            ];
            dataChart = dataChart.map((item) => {
                const user = listCountUser.find((count) => count.month === item.month);
                const post = listCountPost.find((count) => count.month === item.month);
                const comment = listCountComment.find((count) => count.month === item.month);
                return {
                    month: getMonthName(item.month),
                    User: user ? user.count : 0,
                    Post: post ? post.count : 0,
                    Comment: comment ? comment.count : 0,
                };
            });
            setCountAll({
                countUser: result.data.countUser - 1,
                countPost: result.data.countPost,
                countComment: result.data.countComment,
                dataChart: dataChart,
            });
        }
    };

    useEffect(() => {
        switch (tableKey) {
            case 1: //User
                getListUser();
                break;
            case 2: //Post
                getListPost();
                break;
            case 3: //Comment
                getListComment();
                break;
            default:
                break;
        }
        // eslint-disable-next-line
    }, [page]);

    useEffect(() => {
        if (userInfo && userInfo.role.name === 'CUSTOMER') {
            dispatch(logoutUser());
            navigate('/login/admin');
        }
        getStatistic();
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        setPage(1);
        switch (tableKey) {
            case 1: //User
                setListField(['Create date', 'Username', 'Name', 'Phone', 'Email', 'Security', 'Status']);
                getListUser();
                break;
            case 2: //Post
                setListField(['User', 'Caption', 'Create Date', 'Sercurity', 'Status']);
                getListPost();
                break;
            case 3: //Comment
                setListField(['User', 'Comment', 'Create date', 'Status']);
                getListComment();
                break;
            default:
                break;
        }
        // eslint-disable-next-line
    }, [tableKey]);

    return (
        <div className={cx('wrapper')}>
            <ToastContainer />
            <div className={cx('sidebar')}>
                <div className={cx('logo')}>
                    <img src={logo} alt="logo" height="40px" />
                    <span>Admin</span>
                </div>
                <div className={cx('items-container')}>
                    <SidebarItem
                        icon={<HomeOutlined style={iconStyle} />}
                        activeIcon={<Home style={iconStyle} />}
                        isActive={title === 'Dashboard'}
                        title="Bảng điều khiển"
                        onClick={() => {
                            setTitle('Dashboard');
                            setTableKey(0);
                        }}
                    />

                    <SidebarItem
                        icon={<ManageAccountsOutlined style={iconStyle} />}
                        activeIcon={<ManageAccounts style={iconStyle} />}
                        isActive={title === 'Manage User'}
                        title="Quản lý người dùng"
                        onClick={() => {
                            setTitle('Manage User');
                            setTableKey(1);
                        }}
                    />

                    <SidebarItem
                        icon={<AssignmentOutlined style={iconStyle} />}
                        activeIcon={<Assignment style={iconStyle} />}
                        isActive={title === 'Manage Post'}
                        title="Quản lý bài viết"
                        onClick={() => {
                            setTitle('Manage Post');
                            setTableKey(2);
                        }}
                    />
                    <SidebarItem
                        icon={<TextsmsOutlined style={iconStyle} />}
                        activeIcon={<Textsms style={iconStyle} />}
                        isActive={title === 'Manage Comment'}
                        title="Quản lý bình luận"
                        onClick={() => {
                            setTitle('Manage Comment');
                            setTableKey(3);
                        }}
                    />
                </div>
                <SidebarItem
                    icon={<Logout style={iconStyle} />}
                    activeIcon={<Logout style={iconStyle} />}
                    isActive={activeTab === 'logout'}
                    title="Đăng xuất"
                    onClick={() => {
                        setActiveTab('logout');
                        handleLogout();
                    }}
                />
            </div>

            <div className={cx('content')}>
                <h1 style={{ marginTop: '20px' }}>{title}</h1>
                {tableKey === 0 ? (
                    <div>
                        <div className={cx('dashboard-header')}>
                            <div className={cx('header-item')}>
                                <div className={cx('header-title')}>
                                    <Person style={{ ...iconStyle, fontSize: '4rem', color: 'var(--primary)' }} />
                                    <span>Người dùng</span>
                                </div>
                                <span className={cx('header-count')}>{countAll.countUser}</span>
                            </div>
                            <div className={cx('header-item')}>
                                <div className={cx('header-title')}>
                                    <Assignment style={{ ...iconStyle, fontSize: '4rem', color: 'var(--primary)' }} />
                                    <span>Bài viết</span>
                                </div>
                                <span className={cx('header-count')}>{countAll.countPost}</span>
                            </div>
                            <div className={cx('header-item')}>
                                <div className={cx('header-title')}>
                                    <Textsms style={{ ...iconStyle, fontSize: '4rem', color: 'var(--primary)' }} />
                                    <span>Bình luận</span>
                                </div>
                                <span className={cx('header-count')}>{countAll.countComment}</span>
                            </div>
                        </div>
                        <div className={cx('dashboard-chart')}>
                            <ResponsiveContainer width="100%" aspect={2.6}>
                                <LineChart
                                    width={500}
                                    height={300}
                                    data={countAll.dataChart}
                                    margin={{
                                        top: 10,
                                        right: 30,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="User" stroke="#8884d8" activeDot={{ r: 8 }} />
                                    <Line type="monotone" dataKey="Post" stroke="#82ca9d" activeDot={{ r: 8 }} />
                                    <Line type="monotone" dataKey="Comment" stroke="orange" activeDot={{ r: 8 }} />

                                    {/* <Line type="monotone" dataKey="count" stroke="#82ca9d" /> */}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <div className={cx('table')}>
                        <table>
                            <thead>
                                <tr>
                                    {listField.map((item, index) => (
                                        <th key={index}>{item}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {listData &&
                                    tableKey === 1 &&
                                    listData.map((item, index) => (
                                        <tr className={cx(`${index % 2 === 0 ? 'even-row' : 'odd-row'}`)} key={index}>
                                            <td style={{ minWidth: '150px' }}>{formatDate(item.createDate)}</td>
                                            <td>{item.username}</td>
                                            <td>{item.name}</td>
                                            <td>{item.phone}</td>
                                            <td>{item.email}</td>
                                            <td>{item.security}</td>
                                            <td>{item.enabled ? 'Enabled' : 'Disabled'}</td>
                                        </tr>
                                    ))}

                                {listData &&
                                    tableKey === 2 &&
                                    listData.map((item, index) => (
                                        <tr className={cx(`${index % 2 === 0 ? 'even-row' : 'odd-row'}`)} key={index}>
                                            <td>{item.user?.username}</td>
                                            {/* <td>{item.value}</td> */}
                                            <td style={{ display: 'flex' }}>
                                                <span
                                                    style={{
                                                        width: '250px',
                                                        overflow: 'hidden',
                                                        whiteSpace: 'nowrap',
                                                        display: 'inline-block',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {item.value}
                                                </span>
                                            </td>

                                            <td>{formatDate(item.createDate)}</td>
                                            <td>{item.security}</td>
                                            <td>{item.status}</td>
                                        </tr>
                                    ))}

                                {listData &&
                                    tableKey === 3 &&
                                    listData.map((item, index) => (
                                        <tr className={cx(`${index % 2 === 0 ? 'even-row' : 'odd-row'}`)} key={index}>
                                            <td>{item.user?.username}</td>
                                            {/* <td>{item.value}</td> */}
                                            <td style={{ display: 'flex' }}>
                                                <span
                                                    style={{
                                                        width: '250px',
                                                        overflow: 'hidden',
                                                        whiteSpace: 'nowrap',
                                                        display: 'inline-block',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {item.value}
                                                </span>
                                            </td>

                                            <td>{formatDate(item.createDate)}</td>

                                            <td>{item.status}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        <div className={cx('panigation')}>
                            <div
                                className={cx('prev-btn', page === 1 ? 'disabled' : '')}
                                onClick={prevPage}
                                disabled={page === 1}
                            >
                                Prev
                            </div>
                            <span style={{ width: '100px', textAlign: 'center' }}>{`${page} of ${totalPages}`}</span>
                            <div
                                className={cx('next-btn', page === totalPages ? 'disabled' : '')}
                                onClick={nextPage}
                                disabled={page === totalPages}
                            >
                                Next
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomeAdmin;
