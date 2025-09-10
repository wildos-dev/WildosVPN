import { SidebarObject } from '@wildosvpn/common/components';
import { Box, Home, ShieldCheck, Server, ServerCog, Settings, UsersIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const useSidebarItems = () => {
    const { t } = useTranslation();
    
    const sidebarItems: SidebarObject = {
        [t('dashboard')]: [
            {
                title: t('home'),
                to: '/',
                icon: <Home />,
                isParent: false,
            },
        ],
        [t('management')]: [
            {
                title: t('users'),
                to: '/users',
                icon: <UsersIcon />,
                isParent: false,
            },
            {
                title: t('services'),
                to: '/services',
                icon: <Server />,
                isParent: false,
            },
            {
                title: t('nodes'),
                to: '/nodes',
                icon: <Box />,
                isParent: false,
            },
            {
                title: t('hosts'),
                to: '/hosts',
                icon: <ServerCog />,
                isParent: false,
            },
        ],
        [t('system')]: [
            {
                title: t('admins'),
                to: '/admins',
                icon: <ShieldCheck />,
                isParent: false,
            },
            {
                title: t('settings'),
                to: '/settings',
                icon: <Settings />,
                isParent: false,
            },
        ]
    };

    const sidebarItemsNonSudoAdmin: SidebarObject = {
        [t('dashboard')]: [
            {
                title: t('home'),
                to: '/',
                icon: <Home />,
                isParent: false,
            },
        ],
        [t('management')]: [
            {
                title: t('users'),
                to: '/users',
                icon: <UsersIcon />,
                isParent: false,
            },
        ],
    };

    return { sidebarItems, sidebarItemsNonSudoAdmin };
};

// Backward compatibility exports (will be removed)
export const sidebarItems: SidebarObject = {
    Dashboard: [
        {
            title: 'Home',
            to: '/',
            icon: <Home />,
            isParent: false,
        },
    ],
    Management: [
        {
            title: 'Users',
            to: '/users',
            icon: <UsersIcon />,
            isParent: false,
        },
        {
            title: 'Services',
            to: '/services',
            icon: <Server />,
            isParent: false,
        },
        {
            title: 'Nodes',
            to: '/nodes',
            icon: <Box />,
            isParent: false,
        },
        {
            title: 'Hosts',
            to: '/hosts',
            icon: <ServerCog />,
            isParent: false,
        },
    ],
    System: [
        {
            title: 'Admins',
            to: '/admins',
            icon: <ShieldCheck />,
            isParent: false,
        },
        {
            title: 'Settings',
            to: '/settings',
            icon: <Settings />,
            isParent: false,
        },
    ]
};

export const sidebarItemsNonSudoAdmin: SidebarObject = {
    Dashboard: [
        {
            title: 'Home',
            to: '/',
            icon: <Home />,
            isParent: false,
        },
    ],
    Management: [
        {
            title: 'Users',
            to: '/users',
            icon: <UsersIcon />,
            isParent: false,
        },
    ],
};
