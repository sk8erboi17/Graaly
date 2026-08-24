import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inventory, Item, Message } from "@graaly/react";
import { graalyApi } from "../api/graaly-api";
import type { Authorization, PlayerIdentity, RoleKey } from "../domain";

type Props = {
  identity: PlayerIdentity;
  targetId: string;
  targetName: string;
  nonce: number;
};

const rolePresentation: Record<RoleKey, {
  slot: number;
  material: "BOOK" | "IRON_SWORD" | "NETHER_STAR";
  color: string;
}> = {
  member: { slot: 10, material: "BOOK", color: "&a" },
  moderator: { slot: 13, material: "IRON_SWORD", color: "&b" },
  admin: { slot: 16, material: "NETHER_STAR", color: "&c" },
};

const authorizationKey = (playerId: string) =>
  ["player-authorization", playerId] as const;

export function PermissionPanel({
  identity,
  targetId,
  targetName,
  nonce,
}: Props): React.ReactElement {
  const queryClient = useQueryClient();
  const actor = useQuery({
    queryKey: ["current-actor", identity.playerId],
    queryFn: () => graalyApi.getActor(identity),
  });
  const roles = useQuery({
    queryKey: ["role-catalog"],
    queryFn: () => graalyApi.getRoles(identity),
  });
  const authorization = useQuery({
    queryKey: authorizationKey(targetId),
    queryFn: () => graalyApi.getAuthorization(identity, targetId),
  });
  const mutation = useMutation({
    mutationFn: (nextRoles: RoleKey[]) =>
      graalyApi.setPlayerRoles(identity, targetId, nextRoles),
    onSuccess: updated => {
      queryClient.setQueryData<Authorization>(authorizationKey(targetId), updated);
    },
  });

  const failure = actor.error ?? roles.error ?? authorization.error ?? mutation.error;
  if (failure !== null) {
    const message = failure instanceof Error ? failure.message : String(failure);
    return <Message id={`permissions-error-${nonce}`}>&cPermissions: {message}</Message>;
  }
  if (actor.data === undefined || roles.data === undefined || authorization.data === undefined) {
    return <Message id={`permissions-loading-${nonce}`}>&eLoading permissions…</Message>;
  }

  const canManage = actor.data.permissions.includes("permissions.manage");
  const assigned = authorization.data.roles;

  function toggle(role: RoleKey): void {
    if (!canManage || mutation.isPending) return;
    const next = assigned.includes(role)
      ? assigned.filter(current => current !== role)
      : [...assigned, role];
    mutation.mutate(next.length === 0 ? ["member"] : next);
  }

  return (
    <Inventory
      id={`permissions-${targetId}-${nonce}`}
      title={`Permissions: ${targetName}`}
      rows={3}
    >
      {roles.data.map(role => {
        const presentation = rolePresentation[role.key];
        const active = assigned.includes(role.key);
        return (
          <Item
            key={role.key}
            slot={presentation.slot}
            material={presentation.material}
            name={`${presentation.color}${role.name}`}
            lore={[
              active ? "&aAssigned" : "&7Not assigned",
              ...role.permissions.map(permission => `&8• &f${permission}`),
              canManage ? "&eClick to toggle" : "&7Read only",
            ]}
            onClick={() => toggle(role.key)}
          />
        );
      })}
    </Inventory>
  );
}
