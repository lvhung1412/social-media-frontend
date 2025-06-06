import { useMemo, useEffect, useState } from 'react';

import ChatListItems from './ChatListItems';

import classNames from 'classnames/bind';
import styles from './ChatList.module.scss';
import * as UserService from '../../../../services/UserService';
import { onSnapshot, query, collection, where, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { updateCurrentRoom } from '../../../../action/ChatAction';
import Search from '../../../../components/Search';
import { Avatar } from '@mui/material';

import { useSelector, useDispatch } from 'react-redux';
import useFirestore from '../../../../hooks/useFirestore';

const cx = classNames.bind(styles);

const ChatList = () => {
    const dispatch = useDispatch();
    const userInfo = useSelector((state) => state.user.user);
    const [listUser, setListUser] = useState([]);

    const roomsCondition = useMemo(() => {
        return {
            fieldName: 'members',
            operator: 'array-contains',
            compareValue: userInfo.username,
        };
    }, [userInfo.username]);
    const rooms = useFirestore('rooms', roomsCondition);

    useEffect(() => {
        if (rooms.length > 0) {
            setListUser([]);
            rooms.forEach((room) => {
                const friendName = room.members.filter((member) => member !== userInfo.username);

                const userApi = async () => {
                    const result = await UserService.userProfile(friendName);
                    if (result.data) {
                        const collection_ref = collection(db, 'user');
                        const q = query(collection_ref, where('username', '==', friendName[0]));
                        const doc_refs = await getDocs(q);

                        const res = [];

                        doc_refs.forEach((country) => {
                            res.push({
                                id: country.id,
                                ...country.data(),
                            });
                        });

                        const friendFireBase = res[0];

                        setListUser((prev) => [
                            ...prev,
                            {
                                ...result.data,
                                isOnline: friendFireBase?.isOnline,
                                offLineDate: friendFireBase?.date,
                                room: room,
                            },
                        ]);
                    }
                };
                userApi();
            });
        }
        // eslint-disable-next-line
    }, [rooms]);

    const chatRoom = (room) => {
        const q = query(collection(db, 'messages'), where('room', '==', room));

        const unsubcribe = onSnapshot(q, (snapshot) => {
            const document = snapshot.docs
                .filter((doc) => doc.data().user !== userInfo.username && doc.data().status === 'WAITING')
                .map((doc) => ({ ...doc.data(), id: doc.id }));
            if (document.length > 0) {
                document.forEach((item) => {
                    updateDoc(doc(db, 'messages', item.id), {
                        status: 'SEEN',
                    });
                });
            }
        });
        return unsubcribe;
    };

    return (
        <div className={cx('chat-list')}>
            <div className={cx('heading')}>
                <h2>Tin nhắn</h2>
                <button className={cx('btn-nobg')}>
                    {/* <FaEllipsisH fill="black" /> */}
                    <Avatar src={userInfo.avatar} />
                </button>
            </div>
            <div className={cx('chat-search')}>
                <Search chat={true} />
                {/* <div className={cx('search-wrapper')}>
                    <input type="text" placeholder="Search a friend" required />
                    <FaSearch className={cx('search-btn')} />
                </div> */}
            </div>
            <div className={cx('list-items')}>
                {rooms &&
                    listUser.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => {
                                chatRoom(item.room.id);
                                dispatch(updateCurrentRoom(item.room));
                            }}
                        >
                            <ChatListItems
                                data={item}
                                active={item.active ? 'active' : ''}
                                isOnline={item.isOnline ? 'active' : ''}
                                animationDelay={index + 1}
                                time={item.offLineDate}
                            />
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default ChatList;
