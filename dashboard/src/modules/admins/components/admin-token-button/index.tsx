import { useTranslation } from 'react-i18next';
import { useAdminTokenQuery } from '../../api/admin-token.query';
import { CopyToClipboardButton } from '@wildosvpn/common/components';
import { Key } from 'lucide-react';

export const AdminTokenButton = () => {
    const { t } = useTranslation();
    const { data } = useAdminTokenQuery();

    return (
        <CopyToClipboardButton
            text={data?.token || ''}
            successMessage={t('page.admins.token.copied')}
            copyIcon={Key}
            copyLabel={t('page.admins.token.copy')}
            errorLabel={t('page.admins.token.error')}
        />
    );
};