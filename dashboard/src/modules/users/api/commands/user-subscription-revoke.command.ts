import { useMutation } from "@tanstack/react-query";
import { fetch, queryClient } from "@wildosvpn/common/utils";
import { toast } from "sonner";
import i18n from "@wildosvpn/features/i18n";
import {
    UserMutationType
} from "@wildosvpn/modules/users";

export async function userSubscriptionRvoke(user: UserMutationType): Promise<UserMutationType> {
    return fetch(`/users/${user.username}/revoke_sub`, { method: 'post', body: user }).then((user) => {
        return user;
    });
}

const handleError = (error: Error, value: UserMutationType) => {
    toast.error(
        i18n.t('events.user_revoke.error', { name: value.username }),
        {
            description: error.message
        })
}

const handleSuccess = (value: UserMutationType) => {
    toast.success(
        i18n.t('events.user_revoke.success.title', { name: value.username }),
        {
            description: i18n.t('events.user_revoke.success.desc')
        })
    queryClient.invalidateQueries({ queryKey: [UsersSubscriptionFetchKey] })
}


const UsersSubscriptionFetchKey = "users";

export const useUserSubscriptionRevokeCmd = () => {
    return useMutation({
        mutationKey: [UsersSubscriptionFetchKey, "revoke_sub"],
        mutationFn: userSubscriptionRvoke,
        onError: handleError,
        onSuccess: handleSuccess,
    })
}
