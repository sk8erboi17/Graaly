import { useQuery, useQueryClient } from "@tanstack/react-query";
import { graalyApi, type GraalyApi } from "../api/graaly-api";
import type { PlayerIdentity, Profile } from "../domain";

type ProfileState =
  | { status: "loading"; profile: null; error: null }
  | { status: "ready"; profile: Profile; error: null }
  | { status: "error"; profile: null; error: Error };

export type PlayerProfileState = ProfileState & {
  reload(): void;
  replaceProfile(profile: Profile): void;
};

export const profileQueryKey = (playerId: string) =>
  ["player-profile", playerId] as const;

export function usePlayerProfile(
  playerId: string,
  playerName: string,
  client: GraalyApi = graalyApi,
): PlayerProfileState {
  const queryClient = useQueryClient();
  const identity: PlayerIdentity = { playerId, playerName };
  const query = useQuery({
    queryKey: profileQueryKey(playerId),
    queryFn: ({ signal }) => client.getProfile(identity, signal),
    staleTime: 15_000,
  });

  const controls = {
    reload: () => {
      void query.refetch();
    },
    replaceProfile: (profile: Profile) => {
      queryClient.setQueryData(profileQueryKey(playerId), profile);
    },
  };

  if (query.status === "pending") {
    return { status: "loading", profile: null, error: null, ...controls };
  }
  if (query.status === "error") {
    const error = query.error instanceof Error
      ? query.error
      : new Error(String(query.error));
    return { status: "error", profile: null, error, ...controls };
  }
  return { status: "ready", profile: query.data, error: null, ...controls };
}
