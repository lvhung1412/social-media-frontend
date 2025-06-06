import { useEffect, useState, useRef } from 'react';

import FriendItem from './FriendItem';
import * as RelaService from '@/services/RelaService';
import { useSelector } from 'react-redux';

import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import classNames from 'classnames/bind';
import styles from './Invitation.module.scss';

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
            const result = await RelaService.getInvitation();
            if (result.data) {
                setSearchResult(result.data.map((item) => item.userFrom));
                setCount(result.data.length);
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
    return (
        <div className={cx('wrapper')} ref={notifyRef}>
            <FavoriteBorderIcon
                title="Friends"
                className={cx('heart-icon')}
                style={{ fontSize: '3rem', transition: 'all 0.3s' }}
            />
            {count > 0 && (
                <div className={cx('count')}>
                    <span>{count}</span>
                </div>
            )}
            <div className={cx('notify-result', !showResult && 'hidden', isDarkMode ? 'theme-dark' : '')}>
                <h4 className={cx('notify-title')}>Lời mời kết bạn</h4>
                {searchResult.length > 0 ? (
                    <div className={cx('list-notify')}>
                        {searchResult.map((result) => (
                            <div className={cx('notify-item')} key={result.username}>
                                <FriendItem user={result} changeCount={changeCount} />
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
    );
};

export default Notify;
