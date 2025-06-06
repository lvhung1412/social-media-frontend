const initialState = {
    status: 'KẾT BẠN',
    listFriend: [],
};

const postReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'UPDATE_RELATION':
            return {
                ...state,
                status: action.status,
            };
        case 'UPDATE_FRIEND':
            return {
                ...state,
                listFriend: action.listFriend,
            };
        default:
            return state;
    }
};

export default postReducer;
