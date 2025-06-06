import Avatar from '../ChatList/Avatar';
import classNames from 'classnames/bind';
import styles from './ChatContent.module.scss';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

TimeAgo.addLocale(en);
// Create formatter (English).
const timeAgo = new TimeAgo('en-US');
const cx = classNames.bind(styles);

const ChatItem = ({ me, user, msg, time, type }) => {
    console.log('ChatItem props:', { me, user, msg, time, type });

    const [toggler, setToggler] = useState(false);

    return (
        <div style={{ animationDelay: `0.8s` }} className={cx('chat-item', `${user.username === me ? 'me' : 'other'}`)}>
            <Lightbox open={toggler} close={() => setToggler(!toggler)} slides={[{ src: msg }]} />
            <div className={cx('chat-item-content')}>
                {type === 0 && <div className={cx('chat-msg')}>{msg}</div>}
                {type === 1 && (
                    <div className={cx('chat-msg')} onClick={() => setToggler(true)}>
                        <img src={msg} alt="" />
                    </div>
                )}
                {type === 2 && (
                    <div className={cx('chat-msg')}>
                        <video controls alt="">
                            <source src={msg} type="video/mp4" />
                            Trình duyệt của bạn không hỗ trợ thẻ video.
                        </video>
                    </div>
                )}
                {type === 3 && (
                    <div className={cx('chat-msg')}>
                        <audio controls alt="">
                            <source src={msg} />
                            Trình duyệt của bạn không hỗ trợ thẻ audio.
                        </audio>
                    </div>
                )}
                
                {![0, 1, 2, 3].includes(type) && (
                    <div className={cx('chat-msg', 'unsupported')}>
                        (Unsupported message)
                    </div>
                )}
                <div className={cx('chat-meta')}>
                    {time && <span>{timeAgo.format(new Date(time?.seconds * 1000))}</span>}
                    {/* <span>Seen 21:58</span> */}
                </div>
            </div>
            <Avatar image={user.avatar} />
        </div>
    );
};

export default ChatItem;
