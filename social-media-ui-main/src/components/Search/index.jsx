import { useEffect, useState, useRef } from 'react';

import * as UserService from '../../services/UserService';
import AccountItem from '../AccountItem';
import Tippy from '@tippyjs/react/headless';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { Wrapper as PopperWrapper } from '../Popper';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { onSnapshot, query, collection, where, doc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { v4 } from 'uuid';
import styles from './Search.module.scss';
import classNames from 'classnames/bind';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateCurrentRoom } from '../../action/ChatAction';

const cx = classNames.bind(styles);
const Search = ({ darkMode, chat = false }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const userInfo = useSelector((state) => state.user.user);
    const [searchValue, setSearchValue] = useState('');
    const [searchResult, setSearchResult] = useState([]);
    const [showResult, setShowResult] = useState(false);

    const inputRef = useRef();
    useEffect(() => {
        if (!searchValue.trim()) {
            setSearchResult([]);
            return;
        }
        //Get data from search result
        const fetchApi = async () => {
            const result = await UserService.searchByName(searchValue);
            setSearchResult(result.data);
        };
        fetchApi();
    }, [searchValue]);

    //xử lý khi clear input search
    const handleClear = () => {
        setSearchValue('');
        setSearchResult([]);
        inputRef.current.focus();
    };
    //Hide result when click outside
    const handleHideResult = () => {
        setShowResult(false);
    };

    //Set State input search
    const handleChange = (e) => {
        const searchValue = e.target.value;
        //không cho phép nhập khoảng trắng ở đầu
        if (!searchValue.startsWith(' ')) {
            setSearchValue(searchValue);
        }
    };
    const navigateProfile = (result) => {
        if (result.username === userInfo.username) {
            navigate('/profile');
        } else {
            navigate(`/${result.username}`);
        }
    };

    const chatRoom = async (result) => {
        const collection_ref = collection(db, 'user');
        const q = query(collection_ref, where('username', '==', result.username));
        const doc_refs = await getDocs(q);

        const res = [];

        doc_refs.forEach((country) => {
            res.push({
                id: country.id,
                ...country.data(),
            });
        });

        const friendFireBase = res[0];

        if (!friendFireBase) {
            try {
                const res = await createUserWithEmailAndPassword(auth, result.username + '@gmail.com', result.username);
                await setDoc(doc(db, 'user', result.username.trim()), {
                    uid: res.user.uid,
                    name: result.name.trim(),
                    username: result.username.trim(),
                    password: '',
                    date: serverTimestamp(),
                    email: '',
                    isOnline: false,
                });
            } catch (error) {
                console.log(error);
            }
        }

        const roomQuery = query(collection(db, 'rooms'), where('members', 'array-contains', userInfo.username));

        const unsubcribe = onSnapshot(roomQuery, (snapshot) => {
            const document = snapshot.docs
                .filter((doc) => doc.data().members.includes(result.username))
                .map((doc) => ({ ...doc.data(), id: doc.id }));

            if (document.length > 0) {
                dispatch(updateCurrentRoom(document[0]));
            } else {
                try {
                    setDoc(doc(db, 'rooms', v4()), {
                        members: [result.username, userInfo.username],
                    });
                } catch (error) {
                    console.log(error);
                }
            }
        });
        return unsubcribe;
    };

    return (
        <Tippy
            interactive={true}
            visible={showResult && searchValue}
            render={(attrs) => (
                <div className={cx('search-result')} tabIndex="-1" {...attrs}>
                    <PopperWrapper>
                        <h4 style={{ marginLeft: '10px' }} className={cx('search-title')}>
                            Tài khoản
                        </h4>
                        {searchResult.length > 0 ? (
                            searchResult.map((result) => (
                                <div
                                    key={result.username}
                                    // vào trang my profile nếu vào kết quả search của chính user
                                    onClick={() => {
                                        if (chat) {
                                            chatRoom(result);
                                        } else {
                                            navigateProfile(result);
                                        }
                                    }}
                                >
                                    <AccountItem key={result.username} data={result} />
                                </div>
                            ))
                        ) : (
                            <div className={cx('result-notify')}>
                                <span>Không có kết quả</span>
                            </div>
                        )}
                    </PopperWrapper>
                </div>
            )}
            onClickOutside={handleHideResult}
        >
            <div className={cx('search', `${darkMode ? 'theme-search-dark' : ''}`, chat && 'chat')}>
                <input
                    value={searchValue}
                    type="text"
                    ref={inputRef}
                    placeholder="Tìm kiếm tài khoản"
                    spellCheck={false}
                    onChange={handleChange}
                    onFocus={() => setShowResult(true)}
                />
                {!!searchValue && (
                    <button className={cx('clear')} onClick={handleClear}>
                        <FontAwesomeIcon icon={faCircleXmark} />
                    </button>
                )}
                {/* <FontAwesomeIcon className="loading" icon={faSpinner} /> */}

                <span></span>

                <button className={cx('search-btn')}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} onMouseDown={(e) => e.preventDefault()} />
                </button>
            </div>
        </Tippy>
    );
};

export default Search;
