/* eslint-disable */

import Avatar from './Avatar';
import classNames from 'classnames/bind';
import styles from './ChatList.module.scss';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { useEffect, useMemo, useState } from 'react';
import useFirestore from '@/hooks/useFirestore';
import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
TimeAgo.addLocale(en);
// Create formatter (English).
const timeAgo = new TimeAgo('en-US');

const cx = classNames.bind(styles);

const ChatListItems = ({ data, active, isOnline, animationDelay, time }) => {
    const [online, setOnline] = useState(isOnline);
    const [timeOnline, setTimeOnline] = useState(time);

    const selectChat = (e) => {
        for (let index = 0; index < e.currentTarget.parentNode.children.length; index++) {
            e.currentTarget.parentNode.children[index].classList.remove('active');
        }
        e.currentTarget.classList.add('active');
    };
    const userCondition = useMemo(() => {
        return {
            fieldName: 'username',
            operator: '==',
            compareValue: data ? data.username : '-1',
        };
    }, [data]);
    const userList = useFirestore('user', userCondition);

    useEffect(() => {
        const getUser = async () => {
            const collection_ref = collection(db, 'user');
            const q = query(collection_ref, where('username', '==', data.username));
            const doc_refs = await getDocs(q);

            const res = [];

            doc_refs.forEach((country) => {
                res.push({
                    id: country.id,
                    ...country.data(),
                });
            });

            const friendFireBase = res[0];
            if (friendFireBase) {
                setOnline(friendFireBase.isOnline ? 'active' : '');
                setTimeOnline(friendFireBase.date);
            }
        };

        getUser();
    }, [userList]);
    return (
        <div
            style={{ animationDelay: `0.${animationDelay}s` }}
            className={cx('list-item') + ` ${active ? active : ''}`}
        >
            <Avatar image={data.avatar} isOnline={online} />
            <div className={cx('userOnl')}>
                <p>{data.name}</p>
                {!online ? (
                    timeOnline && (
                        <span className={cx('active-time')}>
                            {timeAgo.format(new Date(timeOnline?.seconds * 1000))}
                        </span>
                    )
                ) : (
                    <span className={cx('active-time')}>Đang hoạt động</span>
                )}
            </div>
        </div>
    );
};

export default ChatListItems;
