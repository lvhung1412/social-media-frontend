import { useEffect } from 'react';

import { useSelector } from 'react-redux';
import 'yet-another-react-lightbox/styles.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import DefaultLayout from '../../layouts/DefaultLayout/DefaultLayout';

import SidebarLayout from '../../layouts/SidebarLayout/SidebarLayout';
import ProfileContent from '@components/ProfileContent';

const Profile = () => {
    const isHeaderLayout = useSelector((state) => state.layout.isHeaderLayout);

    useEffect(() => {
        document.title = 'Trang cá nhân';
    }, []);

    return (
        <div>
            {isHeaderLayout ? (
                <DefaultLayout>
                    <ProfileContent />
                </DefaultLayout>
            ) : (
                <SidebarLayout>
                    <ProfileContent />
                </SidebarLayout>
            )}
        </div>
    );
};

export default Profile;
