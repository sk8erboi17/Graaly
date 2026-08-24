import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graalyApi } from "../api/graaly-api";
import type { PlayerIdentity, Profile, PurchaseIntent, PurchaseResult, ShopItem } from "../domain";
import { profileQueryKey } from "./use-player-profile";

const prices: Record<ShopItem, number> = {
  diamond: 40,
  gold: 25,
  speed: 15,
};

type PurchaseContext = {
  previous: Profile | undefined;
};

export function usePurchase(identity: PlayerIdentity) {
  const queryClient = useQueryClient();
  const key = profileQueryKey(identity.playerId);

  return useMutation<PurchaseResult, Error, PurchaseIntent, PurchaseContext>({
    mutationFn: intent => graalyApi.purchase({ ...identity, ...intent }),
    onMutate: async ({ item }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Profile>(key);
      if (previous !== undefined && previous.coins >= prices[item]) {
        queryClient.setQueryData<Profile>(key, {
          ...previous,
          coins: previous.coins - prices[item],
          purchases: previous.purchases + 1,
        });
      }
      return { previous };
    },
    onError: (_error, _intent, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSuccess: result => {
      queryClient.setQueryData(key, result.profile);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
