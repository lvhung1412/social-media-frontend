/* eslint-disable */
import { useState, createRef, useEffect, useMemo, useRef } from 'react';
import { FaCog, FaMicrophone, FaSquare } from 'react-icons/fa';
import { GrAttachment } from 'react-icons/gr';
import { GiCancel } from 'react-icons/gi';

import { query, collection, where, getDocs } from 'firebase/firestore';
import { IoSend } from 'react-icons/io5';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { v4 } from 'uuid';
import Avatar from '../ChatList/Avatar';
import audioGif from '@/assets/images/audio/recording-audio.gif';
import ChatItem from './ChatItem';
import useFirestore from '../../../../hooks/useFirestore';
import * as UserService from '../../../../services/UserService';
import vmsg from 'vmsg';
import classNames from 'classnames/bind';
import styles from './ChatContent.module.scss';
import { useSelector } from 'react-redux';

const cx = classNames.bind(styles);
const recorder = new vmsg.Recorder({
    wasmURL: 'https://unpkg.com/vmsg@0.3.0/vmsg.wasm',
});
const ChatContent = () => {
    const userInfo = useSelector((state) => state.user.user);
    const messagesEndRef = createRef(null);
    const currentRoom = useSelector((state) => state.chat.currentRoom);
    const [inputMsg, setinputMsg] = useState('');
    const [friend, setFriend] = useState({});
    const [pictures, setPictures] = useState([]);
    const [recordingAudio, setRecordingAudio] = useState(false);
    const [audio, setAudio] = useState({});
    const chatRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    };

    const userCondition = useMemo(() => {
        let friendName = '-1';
        if (currentRoom && currentRoom.members) {
            friendName = currentRoom.members.filter((member) => member !== userInfo.username)[0];
        }

        return {
            fieldName: 'username',
            operator: '==',
            compareValue: friendName,
        };
    }, [currentRoom]);
    const userList = useFirestore('user', userCondition);

    useEffect(() => {
        if (currentRoom && currentRoom.members) {
            const friendName = currentRoom.members.filter((member) => member !== userInfo.username);
            const userApi = async () => {
                const result = await UserService.userProfile(friendName[0]);

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
                    setFriend({
                        ...result.data,
                        isOnline: friendFireBase?.isOnline,
                        offLineDate: friendFireBase?.date,
                    });
                }
            };

            userApi();
        }
    }, [currentRoom]);

    useEffect(() => {
        if (userList && userList.length > 0) {
            setFriend((prev) => ({ ...prev, isOnline: userList[0].isOnline, offlineDate: userList[0].date }));
        }
    }, [userList]);

    const handlePreview = (e) => {
        const files = Array.from(e.target.files);
        let selectedFiles;

        if (files.length > 6) {
            selectedFiles = files.slice(0, 6);
        } else {
            selectedFiles = files;
        }

        const updatedPictures = selectedFiles.map((file) => {
            file.preview = URL.createObjectURL(file);
            return file;
        });

        setPictures((prev) => [...prev, ...updatedPictures]);
    };

    const handleRemovePicture = (index) => {
        const updatedPictures = [...pictures];
        updatedPictures.splice(index, 1);
        setPictures(updatedPictures);
    };

    const uploadFileChat = async (data) => {
        const result = await UserService.uploadFileChat(data);
        if (result.success) {
            return result.data;
        }
    };

    const sendMsg = async (e) => {
        e.preventDefault();

        try {
            if (audio.preview) {
                const data = new FormData();
                data.append('files', audio);

                const listAudio = await uploadFileChat(data);


                if (listAudio && listAudio.length > 0) {
                    setDoc(doc(db, 'messages', v4()), {
                        content: listAudio[0],
                        user: userInfo.username,
                        room: currentRoom.id,
                        date: serverTimestamp(),
                        type: 3,
                        status: 'WAITING',
                    });
                    setAudio({});
                }
            }

            if (pictures && pictures.length > 0) {
                const data = new FormData();
                if (pictures.length > 0) {
                    //data.append('files', pictures);
                    for (let i = 0; i < pictures.length; i++) {
                        data.append('files', pictures[i]);
                    }
                }
                const listFile = await uploadFileChat(data);
                for (let i = 0; i < pictures.length; i++) {
                    var type = 4;
                    if (pictures[i].type.startsWith('image/')) {
                        type = 1;
                    }
                    // alert(pictures[i].type);
                    if (pictures[i].type.startsWith('video/')) {
                        type = 2;
                    }
                    // if (type === 4) {
                    //         // alert('Please select image or video file');
                    //         return;
                    // }

                    setDoc(doc(db, 'messages', v4()), {
                        content: listFile[i],
                        user: userInfo.username,
                        room: currentRoom.id,
                        date: serverTimestamp(),
                        type: type,
                        status: 'WAITING',
                    });
                }

                setPictures([]);
            }

            if (inputMsg) {
                setDoc(doc(db, 'messages', v4()), {
                    content: inputMsg,
                    user: userInfo.username,
                    room: currentRoom.id,
                    date: serverTimestamp(),
                    type: 0,
                    status: 'WAITING',
                });
                setinputMsg('');
            }
        } catch (error) {
            console.log(error);
        }
    };

    //RECORDING AUDIO
    const recordAudio = async () => {
        if (audio.preview) {
            setAudio({});
            setRecordingAudio(false);
        } else {
            if (recordingAudio) {
                const blob = await recorder.stopRecording();
                if (blob) {
                    const newAudio = blob;
                    newAudio.preview = URL.createObjectURL(blob);
                    setAudio(newAudio);
                }
                setRecordingAudio(false);
            } else {
                try {
                    await recorder.initAudio();
                    await recorder.initWorker();
                    recorder.startRecording();
                    setRecordingAudio(true);
                } catch (error) {
                    console.error(error);
                }
            }
        }
    };

    const chatsCondition = useMemo(() => {
        return {
            fieldName: 'room',
            operator: '==',
            compareValue: currentRoom.id ? currentRoom.id : '-1',
        };
    }, [currentRoom.id]);
    const chats = useFirestore('messages', chatsCondition);

    useEffect(() => {
        scrollToBottom();
    }, [chats]);

    return (
        <div className={cx('chat-content')}>
            <div className={cx('header')}>
                <div className={cx('blocks')}>
                    {currentRoom.id && (
                        <div className={cx('current-chatting-user')}>
                            <Avatar isOnline={friend.isOnline && 'active'} image={friend.avatar} />
                            <p>{friend.name}</p>
                        </div>
                    )}
                </div>

                <div className={cx('blocks')}>
                    <div className={cx('settings')}>
                        <button className={cx('btn-nobg')}>
                            <FaCog />
                        </button>
                    </div>
                </div>
            </div>
            <div className={cx('body')}>
                <div className={cx('chat-items')}>
                    {currentRoom.id &&
                        chats.length > 0 &&
                        chats
                            .sort((a, b) => {
                                //Sắp xếp Comment theo thời gian
                                if (a.date && b.date) {
                                    let da = new Date(a.date.toDate());
                                    let db = new Date(b.date.toDate());
                                    return da - db;
                                }
                                return true;
                            })
                            .map((item, index) => {
                                return (
                                    <ChatItem
                                        animationDelay={index + 2}
                                        key={item.id}
                                        me={userInfo.username}
                                        user={item.user === userInfo.username ? userInfo : friend}
                                        msg={item.content}
                                        time={item.date}
                                        type={item.type}
                                    />
                                );
                            })}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className={cx('content-footer')}>
                <form className={cx('sendNewMessage')} onSubmit={sendMsg}>
                    <div className={cx('chat-input')}>
                        <button className={cx('addFiles')} type="button" onClick={recordAudio}>
                            {audio.preview ? (
                                <GiCancel className={cx('add-file-icon')} />
                            ) : recordingAudio ? (
                                <FaSquare className={cx('add-file-icon')} />
                            ) : (
                                <FaMicrophone className={cx('add-file-icon')} />
                            )}
                        </button>
                        {recordingAudio && <img src={audioGif} alt="" className={cx('audio-gif')} />}
                        {!recordingAudio && !audio.preview && (
                            <button className={cx('addFiles')} type="button" onClick={() => chatRef.current.click()}>
                                <GrAttachment className={cx('add-file-icon')} />
                            </button>
                        )}

                        {audio.preview && (
                            <audio className={cx('audio-preview')} alt="" controls>
                                <source src={audio.preview} />
                            </audio>
                        )}
                        <input
                            onChange={handlePreview}
                            ref={chatRef}
                            type="file"
                            name="chat-file"
                            id="chat-file"
                            multiple
                            hidden
                        />
                        {!recordingAudio && !audio.preview && (
                            <input
                                type="text"
                                placeholder="Nhập tin nhắn ở đây"
                                onChange={(e) => setinputMsg(e.target.value)}
                                value={inputMsg}
                            />
                        )}

                        {!recordingAudio && (
                            <button className={cx('btnSendMsg')} id="sendMsgBtn" type="submit">
                                <IoSend />
                            </button>
                        )}
                    </div>

                    {pictures && pictures.length > 0 && (
                        <div className={cx('files-chat')}>
                            {pictures.map((picture, index) => {
                                if (picture.type.startsWith('image/')) {
                                    return (
                                        <div className={cx('picture-chat')}>
                                            <img
                                                key={index}
                                                src={picture.preview}
                                                alt={`files ${index}`}
                                                className={cx('picture-item')}
                                            />
                                            <span onClick={() => handleRemovePicture(index)}>X</span>
                                        </div>
                                    );
                                } else if (picture.type.startsWith('video/')) {
                                    return (
                                        <div className={cx('picture-chat')}>
                                            <video
                                                key={index}
                                                src={picture.preview}
                                                alt={`files ${index}`}
                                                className={cx('picture-item')}
                                            />
                                            <span onClick={() => handleRemovePicture(index)}> X</span>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ChatContent;
