import { useEffect, useState, useRef } from 'react';

import NotifyItem from './NotifyItem';
import * as NotifyService from '@/services/NotifyService';

//import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { BsCheckAll } from 'react-icons/bs';
import classNames from 'classnames/bind';
import styles from './Notification.module.scss';
import { useSelector } from 'react-redux';

const cx = classNames.bind(styles);
const Notify = () => {
    const isDarkMode = useSelector((state) => state.theme.isDarkModeEnabled);

    const [count, setCount] = useState(0);
    const [searchResult, setSearchResult] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const notifyRef = useRef();

    //fetch Api notify
    useEffect(() => {
        const notifyApi = async () => {
            const result = await NotifyService.getNotify();
            if (result.data) {
                setSearchResult(result.data);
                setCount(result.data.filter((item) => item.status === 'WAITING').length);
            }
        };
        notifyApi();
    }, []);

    //handle show/hide notification
    useEffect(() => {
        const handleClick = (e) => {
            if (notifyRef.current && notifyRef.current !== null) {
                if (notifyRef.current.contains(e.target)) {
                    setShowResult((prevState) => !prevState);
                } else {
                    setShowResult(false);
                }
            }
        };
        document.addEventListener('click', handleClick, true);
    }, []);
    const changeCount = () => {
        setCount((prev) => prev - 1);
    };
    const seenNotify = (id) => {
        setSearchResult((prev) =>
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
            ids: searchResult.filter((item) => item.status === 'WAITING').map((item) => item.id),
        });
        if (result.data) {
            setCount(0);
            setSearchResult((prev) =>
                prev.map((item) => ({
                    ...item,
                    status: 'SEEN',
                })),
            );
        }
    };
    return (
        <div className={cx('wrapper')} ref={notifyRef}>
            <NotificationsNoneOutlinedIcon
                title="Thông báo"
                className={cx('notify-icon')}
                style={{ fontSize: '3rem', transition: 'all 0.3s' }}
            />
            {count > 0 && (
                <div className={cx('count')}>
                    <span>{count}</span>
                </div>
            )}
            <div className={cx('notify-result', !showResult && 'hidden', isDarkMode ? 'theme-dark' : '')}>
                <div className={cx('top')}>
                    <h4 className={cx('notify-title')}>Thông báo</h4>
                    <div className={cx('mark')} onClick={seenAll}>
                        <BsCheckAll size={24} />
                        Đánh dấu tất cả đã xem
                    </div>
                </div>
                {searchResult.length > 0 ? (
                    <div className={cx('list-notify')}>
                        {searchResult.map((result) => (
                            <div className={cx('notify-item')} key={result.id}>
                                <NotifyItem content={result} changeCount={changeCount} seenNotify={seenNotify} />
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
    );
};

export default Notify;
