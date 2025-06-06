import React, { useState, useRef, useEffect } from 'react';

import { Close, AddPhotoAlternate } from '@mui/icons-material';
import classNames from 'classnames/bind';
import AppAvatar from '../Avatar';
import * as UserService from '@/services/UserService';

import * as PostService from '@/services/PostService';
import { updateListPost } from '@/action/PostAction';
import { toast, ToastContainer } from 'react-toastify';

import styles from './CreatePost.module.scss';
import { useDispatch, useSelector } from 'react-redux';

const cx = classNames.bind(styles);

const CreatePost = ({ onClose, data }) => {
    const dispatch = useDispatch();
    const userInfo = useSelector((state) => state.user.user);
    const listPost = useSelector((state) => state.post.listPost);
    const [pictures, setPictures] = useState(data?.files.length > 0 ? data?.files : []);
    const [newPictures, setNewPictures] = useState([]);
    const [listDeletedFile, setListDeleteFile] = useState([]);
    const [caption, setCaption] = useState(data?.value || '');

    const [selectedOption, setSelectedOption] = useState(data?.security || 'PUBLIC');
    const [isPostPicture, setIsPostPicture] = useState(data?.files.length > 0 ? true : false);
    const fileInputRef = useRef(null);

    //xử lý khi thêm một bài Post
    const handlePost = (e) => {
        e.preventDefault();
        if (caption) {
            const createPost = async () => {
                const listType = [];
                pictures.forEach((item) => {
                    if (item.type.startsWith('image/')) {
                        listType.push(1);
                    } else if (item.type.startsWith('video/')) {
                        listType.push(2);
                    }
                });
                const obj = {
                    value: caption,
                    security: selectedOption,
                    type: listType,
                };
                const json = JSON.stringify(obj);
                const blob = new Blob([json], {
                    type: 'application/json',
                });
                const data = new FormData();
                data.append('info', blob);
                if (pictures.length > 0) {
                    //data.append('files', pictures);
                    for (let i = 0; i < pictures.length; i++) {
                        data.append('files', pictures[i]);
                    }
                }
                toast.dark('Đang tải...', { position: 'bottom-right', autoClose: 15000 });
                const post = await PostService.createPost(data);

                return post;
            };
            createPost().then((data) => {
                if (data.success) {
                    dispatch(updateListPost([data.data, ...listPost]));
                    //setModal(!modal);
                    setCaption('');
                    setPictures([]);
                    toast.dismiss();
                    toast.success('Đăng thành công', {
                        position: 'bottom-right',
                        autoClose: 1500,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: false,
                        theme: 'dark',
                    });
                    onClose();
                }
            });
        }
    };

    const handleUpdatePost = (e) => {
        e.preventDefault();
        try {
            if (caption) {
                toast.dark('Đang cập nhật...', { position: 'bottom-right', autoClose: 15000 });
                const obj = {
                    value: caption,
                    security: selectedOption,
                    deletedFile: listDeletedFile,
                };

                updatePost(obj);

                if (newPictures.length > 0) {
                    addFilePost();
                }

                //setModal(!modal);
                setCaption('');
                setPictures([]);
                toast.dismiss();
                toast.success('Cập nhật thành công', {
                    position: 'bottom-right',
                    autoClose: 1500,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: false,
                    theme: 'dark',
                });
                onClose();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const addFilePost = async () => {
        try {
            if (newPictures.length > 0) {
                const formData = new FormData();
                const type = [];
                newPictures.forEach((item) => {
                    if (item.type.startsWith('image/')) {
                        type.push(1);
                    } else if (item.type.startsWith('video/')) {
                        type.push(2);
                    }
                });
                console.log('type', type);

                const blob = new Blob([JSON.stringify(type)], {
                    type: 'application/json',
                });
                console.log('blob', blob);
                formData.append('type', blob);

                for (let i = 0; i < newPictures.length; i++) {
                    formData.append('files', newPictures[i]);
                }

                const result = await PostService.addFilePost(data.id, formData);

                if (result.success) {
                    dispatch(
                        updateListPost([
                            ...listPost.map((item) => {
                                if (item.id === result.data.id) {
                                    return {
                                        ...item,
                                        files: result.data.files.filter((item) => item.status === 'ENABLE'),
                                    };
                                }

                                return item;
                            }),
                        ]),
                    );
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const updatePost = async (content) => {
        try {
            const result = await PostService.updatePost(data.id, content);
            console.log(result.data);
            if (result.success) {
                dispatch(
                    updateListPost([
                        ...listPost.map((item) => {
                            if (item.id === result.data.id) {
                                return {
                                    ...item,
                                    value: result.data.value,
                                    security: result.data.security,
                                    files: result.data.files.filter((item) => item.status === 'ENABLE'),
                                };
                            }

                            return item;
                        }),
                    ]),
                );
            }
        } catch (error) {
            console.error(error);
        }
    };
    const loadImageBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handlePreview = async (e) => {
        const files = Array.from(e.target.files);
        const selectedFiles = [];

        toast.dark('Đang tải...', { position: 'bottom-right', autoClose: 4000 });

        if (pictures.length + newPictures.length > 5) {
            toast.warning('Chỉ được tải tối đa 6 tệp', {
                position: 'bottom-right',
                autoClose: 1500,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                theme: 'dark',
            });

            setTimeout(() => {
                toast.dismiss();
            }, [1500]);
            return;
        }

        for (var i = 0; i < files.length; i++) {
            if (files[i].type.startsWith('image/')) {
                const image = await loadImageBase64(files[i]);
                const checkImage = await UserService.checkImage(image);
                if (!(checkImage?.predictions.length > 0 && checkImage?.predictions[0].confidence > 0.5)) {
                    selectedFiles.push(files[i]);
                } else {
                    toast.warning('Hình ảnh của bạn có hành động bạo lực', {
                        position: 'bottom-right',
                        autoClose: 1500,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: true,
                        theme: 'dark',
                    });
                }
            } else {
                selectedFiles.push(files[i]);
            }

            if (selectedFiles.length + pictures.length + newPictures.length === 6) {
                toast.warning('Chỉ được tải tối đa 6 tệp', {
                    position: 'bottom-right',
                    autoClose: 1500,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: true,
                    theme: 'dark',
                });
                break;
            }
        }

        // if (files.length > 6) {
        //     selectedFiles = files.slice(0, 6);
        //     toast.warning('Only upload maximum 6 files', {
        //         position: 'bottom-right',
        //         autoClose: 1500,
        //         hideProgressBar: true,
        //         closeOnClick: true,
        //         pauseOnHover: true,
        //         theme: 'dark',
        //     });
        // } else {
        //     selectedFiles = files;
        // }

        const updatedPictures = selectedFiles.map((file) => {
            file.preview = URL.createObjectURL(file);
            return file;
        });

        if (data) {
            setNewPictures((prev) => [...prev, ...updatedPictures]);
        } else {
            setPictures((prev) => [...prev, ...updatedPictures]);
        }
        setTimeout(() => {
            toast.dismiss();
        }, [2500]);
    };

    const handleRemovePicture = (index, type = 0, id) => {
        if (type === 1) {
            const updatedPictures = [...pictures];
            updatedPictures.splice(index, 1);
            setPictures(updatedPictures);
            if (id !== '0') {
                setListDeleteFile((prev) => [...prev, id]);
            }
        } else if (type === 2) {
            const updatedPictures = [...newPictures];
            updatedPictures.splice(index, 1);
            setNewPictures(updatedPictures);
        }
    };

    const onClickAddPicture = () => {
        if (pictures.length === 0) {
            setIsPostPicture(true);
        } else {
            fileInputRef.current.click();
        }
    };

    useEffect(() => {
        if (!data) {
            setCaption('');
            setPictures([]);
            setIsPostPicture(false);
            setSelectedOption('PUBLIC');
        }
        // eslint-disable-next-line
    }, []);

    return (
        <div className={cx('create-post')}>
            <ToastContainer />
            <div className={cx('close-btn')} onClick={onClose}>
                <Close style={{ fontSize: '3rem' }} />
            </div>
            <div className={cx('wrapper')}>
                <div className={cx('post-title')}>
                    <span>{data ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}</span>
                </div>
                <div className={cx('top')}>
                    <div className={cx('post-header')}>
                        <AppAvatar src={userInfo.avatar} />

                        <div className={cx('post-username', 'username-hover')}>
                            <span>{userInfo.name}</span>
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
                    </div>
                    <div className={cx('post-content')}>
                        <textarea
                            value={caption}
                            style={{ fontWeight: '100' }}
                            spellCheck={false}
                            name="post-content"
                            id="post-content"
                            placeholder="Tiêu đề cho bài đăng..."
                            onChange={(e) => setCaption(e.target.value)}
                        />
                    </div>
                </div>
                {isPostPicture && (
                    <div className={cx('bottom')}>
                        {pictures.length > 0 && (
                            <div className={cx('wrap-picture')}>
                                {pictures.map((picture, index) => {
                                    if (data && picture.status === 'DISABLE') {
                                        return null;
                                    }

                                    if (data ? picture.type === 1 : picture.type.startsWith('image/')) {
                                        return (
                                            <img
                                                key={index}
                                                src={data ? picture.value : picture.preview}
                                                alt={`files ${index}`}
                                                className={cx('picture-item')}
                                                onClick={() => handleRemovePicture(index, 1, picture.id)}
                                            />
                                        );
                                    } else if (data ? picture.type === 2 : picture.type.startsWith('video/')) {
                                        return (
                                            <video
                                                key={index}
                                                src={data ? picture.value : picture.preview}
                                                alt={`files ${index}`}
                                                className={cx('picture-item')}
                                                onClick={() => handleRemovePicture(index, 1, picture.id)}
                                            />
                                        );
                                    }
                                    return null;
                                })}

                                {newPictures.map((picture, index) => {
                                    if (picture.type.startsWith('image/')) {
                                        return (
                                            <img
                                                key={index}
                                                src={picture.preview}
                                                alt={`files ${index}`}
                                                className={cx('picture-item')}
                                                onClick={() => handleRemovePicture(index, 2, '0')}
                                            />
                                        );
                                    } else if (picture.type.startsWith('video/')) {
                                        return (
                                            <video
                                                key={index}
                                                src={picture.preview}
                                                alt={`files ${index}`}
                                                className={cx('picture-item')}
                                                onClick={() => handleRemovePicture(index, 2, '0')}
                                            />
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        )}

                        {pictures.length === 0 && newPictures.length === 0 && (
                            <div className={cx('wrap-title')}>
                                <label htmlFor="post" role="button">
                                    <AddPhotoAlternate style={{ fontSize: '3.5rem' }} />
                                    <span>Thêm bức ảnh của bạn để chia sẻ</span>
                                </label>
                            </div>
                        )}
                    </div>
                )}
                <input
                    max={2}
                    type="file"
                    accept="image/*, video/*"
                    multiple
                    ref={fileInputRef}
                    onChange={handlePreview}
                    name="post"
                    id="post"
                    style={{ display: 'none' }}
                />
                <div className={cx('btn-open-img')} onClick={onClickAddPicture}>
                    <AddPhotoAlternate style={{ fontSize: '3.5rem' }} />
                </div>
                {data ? (
                    <div className={cx('share-btn')} onClick={handleUpdatePost}>
                        Cập nhật
                    </div>
                ) : (
                    <div className={cx('share-btn')} onClick={handlePost}>
                        Chia sẻ
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreatePost;
