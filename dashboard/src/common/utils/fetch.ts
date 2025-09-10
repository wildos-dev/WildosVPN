
import { FetchOptions, ofetch } from 'ofetch';
import { useAuth } from '@wildosvpn/modules/auth';

export const $fetch = ofetch.create({
    baseURL: '/api/',
});

export const fetcher = <T = any>(
    url: string,
    ops: FetchOptions<'json'> = {}
) => {
    const token = useAuth.getState().getAuthToken();
    if (token) {
        ops['headers'] = {
            ...(ops?.headers || {}),
            Authorization: `Bearer ${token}`,
        };
    }
    return $fetch<T>(url, ops);
};

export const fetch = fetcher;
