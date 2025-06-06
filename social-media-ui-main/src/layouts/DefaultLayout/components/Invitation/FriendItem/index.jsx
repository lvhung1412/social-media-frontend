import { useState } from 'react';

import { useSelector, useDispatch } from 'react-redux';
import { updateFriend } from '@/action/RelationAction';
import * as RelaService from '@/services/RelaService';
import * as NotifyService from '@/services/NotifyService';

import classNames from 'classnames/bind';
import styles from './FriendItem.module.scss';
import { Avatar } from '@mui/material';

const cx = classNames.bind(styles);
const NotifyItem = ({ user, changeCount, size = 2 }) => {
    const isDarkMode = useSelector((state) => state.theme.isDarkModeEnabled);

    const dispatch = useDispatch();
    const userInfo = useSelector((state) => state.user.user);
    const listFriend = useSelector((state) => state.relation.listFriend);
    const [notify, setNotify] = useState();
    const acceptFriend = async () => {
        const result = await RelaService.acceptFriend({
            usernameTo: user.username,
            status: 'FRIEND',
        });
        if (result.data) {
            dispatch(
                updateFriend([
                    result.data.userFrom.username === userInfo.username ? result.data.userTo : result.data.userFrom,
                    ...listFriend,
                ]),
            );
            changeCount();
            setNotify('Đã chấp nhận');
            const content = `${userInfo.avatar}###${userInfo.name} đã chấp nhận lời mời kết bạn của bạn`;
            createNotify(content, user.username);
        }
    };
    const denyFriend = async () => {
        const result = await RelaService.deleteRelation(user.username);
        if (result.success) {
            changeCount();
            setNotify('Denied');
        }
    };
    const accept = () => {
        acceptFriend();
    };
    const deny = () => {
        denyFriend();
    };

    const createNotify = async (content, user) => {
        const result = await NotifyService.createNotify({
            content: content,
            username: user,
        });
        return result;
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('user-info')}>
                <Avatar src={user.avatar} />
                <div className={cx('info')}>
                    <div className={cx('info-name')}>{user.name}</div>
                    <div className={cx('info-username')}>{user.username}</div>
                </div>
            </div>

            {notify ? (
                <span>{notify}</span>
            ) : (
                <div className={cx('actions')}>
                    <button className={cx('btn-accept', size === 1 && 'small')} onClick={accept}>
                        Đồng ý
                    </button>
                    <button
                        className={cx('btn-deny', isDarkMode ? 'theme-dark' : '', size === 1 && 'small')}
                        onClick={deny}
                    >
                        Từ chối
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotifyItem;
