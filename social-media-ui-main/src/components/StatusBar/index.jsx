import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

import './StatusBar.scss';
import { useDispatch, useSelector } from 'react-redux';
import { openStory } from '../../action/ThemeAction';

const StatusBar = () => {
    const userInfo = useSelector((state) => state.user.user);
    const listFriend = useSelector((state) => state.relation.listFriend);
    const isDarkMode = useSelector((state) => state.theme.isDarkModeEnabled);
    const dispatch = useDispatch();

    const stopPropagate = (e) => {
        e.preventDefault();
    };

    const mouseOver = () => {
        document.addEventListener('wheel', stopPropagate, {
            passive: false,
        });
    };

    const mouseLeave = () => {
        document.removeEventListener('wheel', stopPropagate, false);
    };
    //Xử lý khi scroll chuột trên Status bar
    const handleWheel = (e) => {
        const scrollContainer = document.getElementsByClassName('statusBar__container');
        scrollContainer[0].scrollLeft += e.deltaY;
    };
    return (
        <div
            className={`${isDarkMode ? 'statusBar__dark theme-dark' : ''} statusBar__container`}
            onWheel={handleWheel}
            onMouseOver={mouseOver}
            onMouseLeave={mouseLeave}
            onClick={mouseLeave}
        >
            <div className="status" onClick={() => dispatch(openStory())}>
                <div className="circle">
                    <img className="statusBar__status" src={userInfo.avatar} alt="avatar" />
                </div>
                <div className="statusBar__text">Tôi</div>
            </div>
            {listFriend &&
                listFriend.slice(0, 10).map((item, index) => (
                    <Tippy content={item.name} placement="bottom" delay={100} key={item.username}>
                        <div
                            className="status"
                            onClick={() => {
                                dispatch(openStory(index));
                            }}
                        >
                            <div className="circle">
                                <img className="statusBar__status" src={item.avatar} alt="avatar" />
                            </div>
                            <div className="statusBar__text">{item.username}</div>
                        </div>
                    </Tippy>
                ))}
        </div>
    );
};

export default StatusBar;
