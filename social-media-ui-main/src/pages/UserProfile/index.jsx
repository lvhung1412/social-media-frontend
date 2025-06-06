import { useEffect } from 'react';

import { useSelector } from 'react-redux';
import DefaultLayout from '@/layouts/DefaultLayout/DefaultLayout';
import { useParams } from 'react-router-dom';

import SidebarLayout from '@/layouts/SidebarLayout/SidebarLayout';
import UserProfileContent from './UserProfileContent';

const Profile = () => {
    const params = useParams();

    const isHeaderLayout = useSelector((state) => state.layout.isHeaderLayout);

    useEffect(() => {
        document.title = 'SC | ' + params.username;
    }, [params.username]);

    return (
        <div>
            {isHeaderLayout ? (
                <DefaultLayout>
                    <UserProfileContent username={params.username} />
                </DefaultLayout>
            ) : (
                <SidebarLayout>
                    <UserProfileContent username={params.username} />
                </SidebarLayout>
            )}
        </div>
    );
};

export default Profile;
