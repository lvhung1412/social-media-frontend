import React from 'react';

import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

import { SubdirectoryArrowRight } from '@mui/icons-material';
import AppAvatar from '../Avatar';
import classNames from 'classnames/bind';
import styles from './CommentItem.module.scss';

const cx = classNames.bind(styles);

TimeAgo.addLocale(en);
const timeAgo = new TimeAgo('en-US');

const CommentItem = ({ data, isReply = false, onReplyClick }) => {
    return (
        <div className={cx('comment-container')}>
            {isReply && <SubdirectoryArrowRight style={{ fontSize: '2.5rem', margin: '0 0 0 2rem' }} />}
            <div className={cx('comment-item')}>
                <AppAvatar src={data.user.avatar} size={30} />
                <div className={cx('content')}>
                    <div className={cx('info', 'username-hover')}>
                        <span>{data.user.name}</span>
                        <span>{data.value}</span>
                    </div>
                    {!isReply && (
                        <div className={cx('action')}>
                            <div>Thích</div>
                            <div onClick={onReplyClick}>Phản hồi</div>
                            <div>{timeAgo.format(new Date(data.createDate))}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommentItem;
