/** Generated searchable Graaly API catalog. Do not edit by hand. */

export const bukkitEventCatalog = [
  {
    "name": "AreaEffectCloudApplyEvent",
    "javaName": "org.bukkit.event.entity.AreaEffectCloudApplyEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "affectedEntities",
        "pythonName": "affected_entities",
        "javaType": "java.util.List<org.bukkit.entity.LivingEntity>",
        "typeScriptType": "LivingEntity[]",
        "pythonType": "list[LivingEntity]",
        "javaRead": "getAffectedEntities()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "ArrowBodyCountChangeEvent",
    "javaName": "org.bukkit.event.entity.ArrowBodyCountChangeEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "reset",
        "pythonName": "reset",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isReset()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "oldAmount",
        "pythonName": "old_amount",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getOldAmount()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "newAmount",
        "pythonName": "new_amount",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getNewAmount()",
        "javaWrite": "setNewAmount(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "AsyncPlayerChatEvent",
    "javaName": "org.bukkit.event.player.AsyncPlayerChatEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "message",
        "pythonName": "message",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getMessage()",
        "javaWrite": "setMessage(value)",
        "writable": true
      },
      {
        "name": "format",
        "pythonName": "format",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getFormat()",
        "javaWrite": "setFormat(value)",
        "writable": true
      },
      {
        "name": "recipients",
        "pythonName": "recipients",
        "javaType": "java.util.Set<org.bukkit.entity.Player>",
        "typeScriptType": "Set<Player>",
        "pythonType": "set[Player]",
        "javaRead": "getRecipients()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "AsyncPlayerChatPreviewEvent",
    "javaName": "org.bukkit.event.player.AsyncPlayerChatPreviewEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "message",
        "pythonName": "message",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getMessage()",
        "javaWrite": "setMessage(value)",
        "writable": true
      },
      {
        "name": "format",
        "pythonName": "format",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getFormat()",
        "javaWrite": "setFormat(value)",
        "writable": true
      },
      {
        "name": "recipients",
        "pythonName": "recipients",
        "javaType": "java.util.Set<org.bukkit.entity.Player>",
        "typeScriptType": "Set<Player>",
        "pythonType": "set[Player]",
        "javaRead": "getRecipients()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "AsyncPlayerPreLoginEvent",
    "javaName": "org.bukkit.event.player.AsyncPlayerPreLoginEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "loginResult",
        "pythonName": "login_result",
        "javaType": "org.bukkit.event.player.AsyncPlayerPreLoginEvent$Result",
        "typeScriptType": "AsyncPlayerPreLoginResult",
        "pythonType": "AsyncPlayerPreLoginResult",
        "javaRead": "getLoginResult()",
        "javaWrite": "setLoginResult(value)",
        "writable": true
      },
      {
        "name": "result",
        "pythonName": "result",
        "javaType": "org.bukkit.event.player.PlayerPreLoginEvent$Result",
        "typeScriptType": "PlayerPreLoginResult",
        "pythonType": "PlayerPreLoginResult",
        "javaRead": "getResult()",
        "javaWrite": "setResult(value)",
        "writable": true
      },
      {
        "name": "kickMessage",
        "pythonName": "kick_message",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getKickMessage()",
        "javaWrite": "setKickMessage(value)",
        "writable": true
      },
      {
        "name": "name",
        "pythonName": "name",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getName()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "address",
        "pythonName": "address",
        "javaType": "java.net.InetAddress",
        "typeScriptType": "ApiObject",
        "pythonType": "ApiObject",
        "javaRead": "getAddress()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "uniqueId",
        "pythonName": "unique_id",
        "javaType": "java.util.UUID",
        "typeScriptType": "NativeUuid",
        "pythonType": "NativeUuid",
        "javaRead": "getUniqueId()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "transferred",
        "pythonName": "transferred",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isTransferred()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "AsyncStructureGenerateEvent",
    "javaName": "org.bukkit.event.world.AsyncStructureGenerateEvent",
    "category": "world",
    "cancellable": false,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.world.AsyncStructureGenerateEvent$Cause",
        "typeScriptType": "AsyncStructureGenerateCause",
        "pythonType": "AsyncStructureGenerateCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockTransformers",
        "pythonName": "block_transformers",
        "javaType": "java.util.Map<org.bukkit.NamespacedKey, org.bukkit.util.BlockTransformer>",
        "typeScriptType": "Map<NamespacedKey, BlockTransformer>",
        "pythonType": "dict[NamespacedKey, BlockTransformer]",
        "javaRead": "getBlockTransformers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityTransformers",
        "pythonName": "entity_transformers",
        "javaType": "java.util.Map<org.bukkit.NamespacedKey, org.bukkit.util.EntityTransformer>",
        "typeScriptType": "Map<NamespacedKey, EntityTransformer>",
        "pythonType": "dict[NamespacedKey, EntityTransformer]",
        "javaRead": "getEntityTransformers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "structure",
        "pythonName": "structure",
        "javaType": "org.bukkit.generator.structure.Structure",
        "typeScriptType": "StructureStructure",
        "pythonType": "StructureStructure",
        "javaRead": "getStructure()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "boundingBox",
        "pythonName": "bounding_box",
        "javaType": "org.bukkit.util.BoundingBox",
        "typeScriptType": "BoundingBox",
        "pythonType": "BoundingBox",
        "javaRead": "getBoundingBox()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "chunkX",
        "pythonName": "chunk_x",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getChunkX()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "chunkZ",
        "pythonName": "chunk_z",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getChunkZ()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "AsyncStructureSpawnEvent",
    "javaName": "org.bukkit.event.world.AsyncStructureSpawnEvent",
    "category": "world",
    "cancellable": true,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "structure",
        "pythonName": "structure",
        "javaType": "org.bukkit.generator.structure.Structure",
        "typeScriptType": "StructureStructure",
        "pythonType": "StructureStructure",
        "javaRead": "getStructure()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "boundingBox",
        "pythonName": "bounding_box",
        "javaType": "org.bukkit.util.BoundingBox",
        "typeScriptType": "BoundingBox",
        "pythonType": "BoundingBox",
        "javaRead": "getBoundingBox()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "chunkX",
        "pythonName": "chunk_x",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getChunkX()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "chunkZ",
        "pythonName": "chunk_z",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getChunkZ()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BatToggleSleepEvent",
    "javaName": "org.bukkit.event.entity.BatToggleSleepEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "awake",
        "pythonName": "awake",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isAwake()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BellResonateEvent",
    "javaName": "org.bukkit.event.block.BellResonateEvent",
    "category": "block",
    "cancellable": false,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "resonatedEntities",
        "pythonName": "resonated_entities",
        "javaType": "java.util.List<org.bukkit.entity.LivingEntity>",
        "typeScriptType": "LivingEntity[]",
        "pythonType": "list[LivingEntity]",
        "javaRead": "getResonatedEntities()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BellRingEvent",
    "javaName": "org.bukkit.event.block.BellRingEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "direction",
        "pythonName": "direction",
        "javaType": "org.bukkit.block.BlockFace",
        "typeScriptType": "BlockFace",
        "pythonType": "BlockFace",
        "javaRead": "getDirection()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockBreakEvent",
    "javaName": "org.bukkit.event.block.BlockBreakEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "expToDrop",
        "pythonName": "exp_to_drop",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getExpToDrop()",
        "javaWrite": "setExpToDrop(value)",
        "writable": true
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "dropItems",
        "pythonName": "drop_items",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isDropItems()",
        "javaWrite": "setDropItems(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "BlockBrushEvent",
    "javaName": "org.bukkit.event.block.BlockBrushEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "newState",
        "pythonName": "new_state",
        "javaType": "org.bukkit.block.BlockState",
        "typeScriptType": "BlockState",
        "pythonType": "BlockState",
        "javaRead": "getNewState()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockBurnEvent",
    "javaName": "org.bukkit.event.block.BlockBurnEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "ignitingBlock",
        "pythonName": "igniting_block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getIgnitingBlock()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockCanBuildEvent",
    "javaName": "org.bukkit.event.block.BlockCanBuildEvent",
    "category": "block",
    "cancellable": false,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "buildable",
        "pythonName": "buildable",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isBuildable()",
        "javaWrite": "setBuildable(value)",
        "writable": true
      },
      {
        "name": "material",
        "pythonName": "material",
        "javaType": "org.bukkit.Material",
        "typeScriptType": "Material",
        "pythonType": "Material",
        "javaRead": "getMaterial()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockData",
        "pythonName": "block_data",
        "javaType": "org.bukkit.block.data.BlockData",
        "typeScriptType": "BlockData",
        "pythonType": "BlockData",
        "javaRead": "getBlockData()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockCookEvent",
    "javaName": "org.bukkit.event.block.BlockCookEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "source",
        "pythonName": "source",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getSource()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "result",
        "pythonName": "result",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getResult()",
        "javaWrite": "setResult(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "BlockDamageAbortEvent",
    "javaName": "org.bukkit.event.block.BlockDamageAbortEvent",
    "category": "block",
    "cancellable": false,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "itemInHand",
        "pythonName": "item_in_hand",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItemInHand()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockDamageEvent",
    "javaName": "org.bukkit.event.block.BlockDamageEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "instaBreak",
        "pythonName": "insta_break",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "getInstaBreak()",
        "javaWrite": "setInstaBreak(value)",
        "writable": true
      },
      {
        "name": "itemInHand",
        "pythonName": "item_in_hand",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItemInHand()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockDispenseArmorEvent",
    "javaName": "org.bukkit.event.block.BlockDispenseArmorEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "item",
        "pythonName": "item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItem()",
        "javaWrite": "setItem(value)",
        "writable": true
      },
      {
        "name": "velocity",
        "pythonName": "velocity",
        "javaType": "org.bukkit.util.Vector",
        "typeScriptType": "Vector",
        "pythonType": "Vector",
        "javaRead": "getVelocity()",
        "javaWrite": "setVelocity(value)",
        "writable": true
      },
      {
        "name": "targetEntity",
        "pythonName": "target_entity",
        "javaType": "org.bukkit.entity.LivingEntity",
        "typeScriptType": "LivingEntity",
        "pythonType": "LivingEntity",
        "javaRead": "getTargetEntity()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockDispenseEvent",
    "javaName": "org.bukkit.event.block.BlockDispenseEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "item",
        "pythonName": "item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItem()",
        "javaWrite": "setItem(value)",
        "writable": true
      },
      {
        "name": "velocity",
        "pythonName": "velocity",
        "javaType": "org.bukkit.util.Vector",
        "typeScriptType": "Vector",
        "pythonType": "Vector",
        "javaRead": "getVelocity()",
        "javaWrite": "setVelocity(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "BlockDispenseLootEvent",
    "javaName": "org.bukkit.event.block.BlockDispenseLootEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "dispensedLoot",
        "pythonName": "dispensed_loot",
        "javaType": "java.util.List<org.bukkit.inventory.ItemStack>",
        "typeScriptType": "ItemStack[]",
        "pythonType": "list[ItemStack]",
        "javaRead": "getDispensedLoot()",
        "javaWrite": "setDispensedLoot(value)",
        "writable": true
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockDropItemEvent",
    "javaName": "org.bukkit.event.block.BlockDropItemEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockState",
        "pythonName": "block_state",
        "javaType": "org.bukkit.block.BlockState",
        "typeScriptType": "BlockState",
        "pythonType": "BlockState",
        "javaRead": "getBlockState()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "items",
        "pythonName": "items",
        "javaType": "java.util.List<org.bukkit.entity.Item>",
        "typeScriptType": "Item[]",
        "pythonType": "list[Item]",
        "javaRead": "getItems()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockExpEvent",
    "javaName": "org.bukkit.event.block.BlockExpEvent",
    "category": "block",
    "cancellable": false,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "expToDrop",
        "pythonName": "exp_to_drop",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getExpToDrop()",
        "javaWrite": "setExpToDrop(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "BlockExplodeEvent",
    "javaName": "org.bukkit.event.block.BlockExplodeEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "explosionResult",
        "pythonName": "explosion_result",
        "javaType": "org.bukkit.ExplosionResult",
        "typeScriptType": "ExplosionResult",
        "pythonType": "ExplosionResult",
        "javaRead": "getExplosionResult()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "explodedBlockState",
        "pythonName": "exploded_block_state",
        "javaType": "org.bukkit.block.BlockState",
        "typeScriptType": "BlockState",
        "pythonType": "BlockState",
        "javaRead": "getExplodedBlockState()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "yield",
        "pythonName": "yield_",
        "javaType": "float",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getYield()",
        "javaWrite": "setYield(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "BlockFadeEvent",
    "javaName": "org.bukkit.event.block.BlockFadeEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "newState",
        "pythonName": "new_state",
        "javaType": "org.bukkit.block.BlockState",
        "typeScriptType": "BlockState",
        "pythonType": "BlockState",
        "javaRead": "getNewState()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockFertilizeEvent",
    "javaName": "org.bukkit.event.block.BlockFertilizeEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blocks",
        "pythonName": "blocks",
        "javaType": "java.util.List<org.bukkit.block.BlockState>",
        "typeScriptType": "BlockState[]",
        "pythonType": "list[BlockState]",
        "javaRead": "getBlocks()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockFormEvent",
    "javaName": "org.bukkit.event.block.BlockFormEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "newState",
        "pythonName": "new_state",
        "javaType": "org.bukkit.block.BlockState",
        "typeScriptType": "BlockState",
        "pythonType": "BlockState",
        "javaRead": "getNewState()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockFromToEvent",
    "javaName": "org.bukkit.event.block.BlockFromToEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "face",
        "pythonName": "face",
        "javaType": "org.bukkit.block.BlockFace",
        "typeScriptType": "BlockFace",
        "pythonType": "BlockFace",
        "javaRead": "getFace()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "toBlock",
        "pythonName": "to_block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getToBlock()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockGrowEvent",
    "javaName": "org.bukkit.event.block.BlockGrowEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "newState",
        "pythonName": "new_state",
        "javaType": "org.bukkit.block.BlockState",
        "typeScriptType": "BlockState",
        "pythonType": "BlockState",
        "javaRead": "getNewState()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockIgniteEvent",
    "javaName": "org.bukkit.event.block.BlockIgniteEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.block.BlockIgniteEvent$IgniteCause",
        "typeScriptType": "BlockIgniteCause",
        "pythonType": "BlockIgniteCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "ignitingEntity",
        "pythonName": "igniting_entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getIgnitingEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "ignitingBlock",
        "pythonName": "igniting_block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getIgnitingBlock()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockMultiPlaceEvent",
    "javaName": "org.bukkit.event.block.BlockMultiPlaceEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockPlaced",
        "pythonName": "block_placed",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlockPlaced()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockReplacedState",
        "pythonName": "block_replaced_state",
        "javaType": "org.bukkit.block.BlockState",
        "typeScriptType": "BlockState",
        "pythonType": "BlockState",
        "javaRead": "getBlockReplacedState()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockAgainst",
        "pythonName": "block_against",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlockAgainst()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "itemInHand",
        "pythonName": "item_in_hand",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItemInHand()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "replacedBlockStates",
        "pythonName": "replaced_block_states",
        "javaType": "java.util.List<org.bukkit.block.BlockState>",
        "typeScriptType": "BlockState[]",
        "pythonType": "list[BlockState]",
        "javaRead": "getReplacedBlockStates()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "build",
        "pythonName": "build",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "build",
        "javaWrite": "setBuild(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "BlockPhysicsEvent",
    "javaName": "org.bukkit.event.block.BlockPhysicsEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "sourceBlock",
        "pythonName": "source_block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getSourceBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "changedType",
        "pythonName": "changed_type",
        "javaType": "org.bukkit.Material",
        "typeScriptType": "Material",
        "pythonType": "Material",
        "javaRead": "getChangedType()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockPistonExtendEvent",
    "javaName": "org.bukkit.event.block.BlockPistonExtendEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "sticky",
        "pythonName": "sticky",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isSticky()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "direction",
        "pythonName": "direction",
        "javaType": "org.bukkit.block.BlockFace",
        "typeScriptType": "BlockFace",
        "pythonType": "BlockFace",
        "javaRead": "getDirection()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "length",
        "pythonName": "length",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getLength()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blocks",
        "pythonName": "blocks",
        "javaType": "java.util.List<org.bukkit.block.Block>",
        "typeScriptType": "Block[]",
        "pythonType": "list[Block]",
        "javaRead": "getBlocks()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockPistonRetractEvent",
    "javaName": "org.bukkit.event.block.BlockPistonRetractEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "sticky",
        "pythonName": "sticky",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isSticky()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "direction",
        "pythonName": "direction",
        "javaType": "org.bukkit.block.BlockFace",
        "typeScriptType": "BlockFace",
        "pythonType": "BlockFace",
        "javaRead": "getDirection()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "retractLocation",
        "pythonName": "retract_location",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getRetractLocation()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blocks",
        "pythonName": "blocks",
        "javaType": "java.util.List<org.bukkit.block.Block>",
        "typeScriptType": "Block[]",
        "pythonType": "list[Block]",
        "javaRead": "getBlocks()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockPlaceEvent",
    "javaName": "org.bukkit.event.block.BlockPlaceEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockPlaced",
        "pythonName": "block_placed",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlockPlaced()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockReplacedState",
        "pythonName": "block_replaced_state",
        "javaType": "org.bukkit.block.BlockState",
        "typeScriptType": "BlockState",
        "pythonType": "BlockState",
        "javaRead": "getBlockReplacedState()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockAgainst",
        "pythonName": "block_against",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlockAgainst()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "itemInHand",
        "pythonName": "item_in_hand",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItemInHand()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "build",
        "pythonName": "build",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "build",
        "javaWrite": "setBuild(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "BlockReceiveGameEvent",
    "javaName": "org.bukkit.event.block.BlockReceiveGameEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "event",
        "pythonName": "event",
        "javaType": "org.bukkit.GameEvent",
        "typeScriptType": "GameEvent",
        "pythonType": "GameEvent",
        "javaRead": "getEvent()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockRedstoneEvent",
    "javaName": "org.bukkit.event.block.BlockRedstoneEvent",
    "category": "block",
    "cancellable": false,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "oldCurrent",
        "pythonName": "old_current",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getOldCurrent()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "newCurrent",
        "pythonName": "new_current",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getNewCurrent()",
        "javaWrite": "setNewCurrent(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "BlockShearEntityEvent",
    "javaName": "org.bukkit.event.block.BlockShearEntityEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "tool",
        "pythonName": "tool",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getTool()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BlockSpreadEvent",
    "javaName": "org.bukkit.event.block.BlockSpreadEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "newState",
        "pythonName": "new_state",
        "javaType": "org.bukkit.block.BlockState",
        "typeScriptType": "BlockState",
        "pythonType": "BlockState",
        "javaRead": "getNewState()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "source",
        "pythonName": "source",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getSource()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BrewEvent",
    "javaName": "org.bukkit.event.inventory.BrewEvent",
    "category": "inventory",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "contents",
        "pythonName": "contents",
        "javaType": "org.bukkit.inventory.BrewerInventory",
        "typeScriptType": "BrewerInventory",
        "pythonType": "BrewerInventory",
        "javaRead": "getContents()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "fuelLevel",
        "pythonName": "fuel_level",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getFuelLevel()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "results",
        "pythonName": "results",
        "javaType": "java.util.List<org.bukkit.inventory.ItemStack>",
        "typeScriptType": "ItemStack[]",
        "pythonType": "list[ItemStack]",
        "javaRead": "getResults()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "BrewingStandFuelEvent",
    "javaName": "org.bukkit.event.inventory.BrewingStandFuelEvent",
    "category": "inventory",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "fuel",
        "pythonName": "fuel",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getFuel()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "fuelPower",
        "pythonName": "fuel_power",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getFuelPower()",
        "javaWrite": "setFuelPower(value)",
        "writable": true
      },
      {
        "name": "consuming",
        "pythonName": "consuming",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isConsuming()",
        "javaWrite": "setConsuming(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "BrewingStartEvent",
    "javaName": "org.bukkit.event.block.BrewingStartEvent",
    "category": "block",
    "cancellable": false,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "source",
        "pythonName": "source",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getSource()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "totalBrewTime",
        "pythonName": "total_brew_time",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getTotalBrewTime()",
        "javaWrite": "setTotalBrewTime(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "BroadcastMessageEvent",
    "javaName": "org.bukkit.event.server.BroadcastMessageEvent",
    "category": "server",
    "cancellable": true,
    "properties": [
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "message",
        "pythonName": "message",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getMessage()",
        "javaWrite": "setMessage(value)",
        "writable": true
      },
      {
        "name": "recipients",
        "pythonName": "recipients",
        "javaType": "java.util.Set<org.bukkit.command.CommandSender>",
        "typeScriptType": "Set<CommandSender>",
        "pythonType": "set[CommandSender]",
        "javaRead": "getRecipients()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "CampfireStartEvent",
    "javaName": "org.bukkit.event.block.CampfireStartEvent",
    "category": "block",
    "cancellable": false,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "source",
        "pythonName": "source",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getSource()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "recipe",
        "pythonName": "recipe",
        "javaType": "org.bukkit.inventory.CampfireRecipe",
        "typeScriptType": "CampfireRecipe",
        "pythonType": "CampfireRecipe",
        "javaRead": "getRecipe()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "totalCookTime",
        "pythonName": "total_cook_time",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getTotalCookTime()",
        "javaWrite": "setTotalCookTime(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "CauldronLevelChangeEvent",
    "javaName": "org.bukkit.event.block.CauldronLevelChangeEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "reason",
        "pythonName": "reason",
        "javaType": "org.bukkit.event.block.CauldronLevelChangeEvent$ChangeReason",
        "typeScriptType": "CauldronLevelChangeChangeReason",
        "pythonType": "CauldronLevelChangeChangeReason",
        "javaRead": "getReason()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "newState",
        "pythonName": "new_state",
        "javaType": "org.bukkit.block.BlockState",
        "typeScriptType": "BlockState",
        "pythonType": "BlockState",
        "javaRead": "getNewState()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "oldLevel",
        "pythonName": "old_level",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getOldLevel()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "newLevel",
        "pythonName": "new_level",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getNewLevel()",
        "javaWrite": "setNewLevel(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "ChunkLoadEvent",
    "javaName": "org.bukkit.event.world.ChunkLoadEvent",
    "category": "world",
    "cancellable": false,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "chunk",
        "pythonName": "chunk",
        "javaType": "org.bukkit.Chunk",
        "typeScriptType": "Chunk",
        "pythonType": "Chunk",
        "javaRead": "getChunk()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "newChunk",
        "pythonName": "new_chunk",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isNewChunk()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "ChunkPopulateEvent",
    "javaName": "org.bukkit.event.world.ChunkPopulateEvent",
    "category": "world",
    "cancellable": false,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "chunk",
        "pythonName": "chunk",
        "javaType": "org.bukkit.Chunk",
        "typeScriptType": "Chunk",
        "pythonType": "Chunk",
        "javaRead": "getChunk()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "ChunkUnloadEvent",
    "javaName": "org.bukkit.event.world.ChunkUnloadEvent",
    "category": "world",
    "cancellable": false,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "chunk",
        "pythonName": "chunk",
        "javaType": "org.bukkit.Chunk",
        "typeScriptType": "Chunk",
        "pythonType": "Chunk",
        "javaRead": "getChunk()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "saveChunk",
        "pythonName": "save_chunk",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isSaveChunk()",
        "javaWrite": "setSaveChunk(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "CrafterCraftEvent",
    "javaName": "org.bukkit.event.block.CrafterCraftEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "result",
        "pythonName": "result",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getResult()",
        "javaWrite": "setResult(value)",
        "writable": true
      },
      {
        "name": "remainingItems",
        "pythonName": "remaining_items",
        "javaType": "java.util.List<org.bukkit.inventory.ItemStack>",
        "typeScriptType": "ItemStack[]",
        "pythonType": "list[ItemStack]",
        "javaRead": "getRemainingItems()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "recipe",
        "pythonName": "recipe",
        "javaType": "org.bukkit.inventory.CraftingRecipe",
        "typeScriptType": "CraftingRecipe",
        "pythonType": "CraftingRecipe",
        "javaRead": "getRecipe()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "CraftItemEvent",
    "javaName": "org.bukkit.event.inventory.CraftItemEvent",
    "category": "inventory",
    "cancellable": true,
    "properties": [
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "viewers",
        "pythonName": "viewers",
        "javaType": "java.util.List<org.bukkit.entity.HumanEntity>",
        "typeScriptType": "HumanEntity[]",
        "pythonType": "list[HumanEntity]",
        "javaRead": "getViewers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "view",
        "pythonName": "view",
        "javaType": "org.bukkit.inventory.InventoryView",
        "typeScriptType": "InventoryView",
        "pythonType": "InventoryView",
        "javaRead": "getView()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "whoClicked",
        "pythonName": "who_clicked",
        "javaType": "org.bukkit.entity.HumanEntity",
        "typeScriptType": "HumanEntity",
        "pythonType": "HumanEntity",
        "javaRead": "getWhoClicked()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "result",
        "pythonName": "result",
        "javaType": "org.bukkit.event.Event$Result",
        "typeScriptType": "EventResult",
        "pythonType": "EventResult",
        "javaRead": "getResult()",
        "javaWrite": "setResult(value)",
        "writable": true
      },
      {
        "name": "slotType",
        "pythonName": "slot_type",
        "javaType": "org.bukkit.event.inventory.InventoryType$SlotType",
        "typeScriptType": "InventorySlotType",
        "pythonType": "InventorySlotType",
        "javaRead": "getSlotType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cursor",
        "pythonName": "cursor",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getCursor()",
        "javaWrite": "setCursor(value)",
        "writable": true
      },
      {
        "name": "currentItem",
        "pythonName": "current_item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getCurrentItem()",
        "javaWrite": "setCurrentItem(value)",
        "writable": true
      },
      {
        "name": "rightClick",
        "pythonName": "right_click",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isRightClick()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "leftClick",
        "pythonName": "left_click",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isLeftClick()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "shiftClick",
        "pythonName": "shift_click",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isShiftClick()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "clickedInventory",
        "pythonName": "clicked_inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getClickedInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "slot",
        "pythonName": "slot",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getSlot()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "rawSlot",
        "pythonName": "raw_slot",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getRawSlot()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hotbarButton",
        "pythonName": "hotbar_button",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getHotbarButton()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "action",
        "pythonName": "action",
        "javaType": "org.bukkit.event.inventory.InventoryAction",
        "typeScriptType": "InventoryAction",
        "pythonType": "InventoryAction",
        "javaRead": "getAction()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "click",
        "pythonName": "click",
        "javaType": "org.bukkit.event.inventory.ClickType",
        "typeScriptType": "ClickType",
        "pythonType": "ClickType",
        "javaRead": "getClick()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "recipe",
        "pythonName": "recipe",
        "javaType": "org.bukkit.inventory.Recipe",
        "typeScriptType": "Recipe",
        "pythonType": "Recipe",
        "javaRead": "getRecipe()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "CreatureSpawnEvent",
    "javaName": "org.bukkit.event.entity.CreatureSpawnEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "location",
        "pythonName": "location",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getLocation()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "spawnReason",
        "pythonName": "spawn_reason",
        "javaType": "org.bukkit.event.entity.CreatureSpawnEvent$SpawnReason",
        "typeScriptType": "CreatureSpawnReason",
        "pythonType": "CreatureSpawnReason",
        "javaRead": "getSpawnReason()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "CreeperPowerEvent",
    "javaName": "org.bukkit.event.entity.CreeperPowerEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "lightning",
        "pythonName": "lightning",
        "javaType": "org.bukkit.entity.LightningStrike",
        "typeScriptType": "LightningStrike",
        "pythonType": "LightningStrike",
        "javaRead": "getLightning()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.entity.CreeperPowerEvent$PowerCause",
        "typeScriptType": "CreeperPowerCause",
        "pythonType": "CreeperPowerCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "CubeMobSplitEvent",
    "javaName": "org.bukkit.event.entity.CubeMobSplitEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "count",
        "pythonName": "count",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getCount()",
        "javaWrite": "setCount(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "EnchantItemEvent",
    "javaName": "org.bukkit.event.enchantment.EnchantItemEvent",
    "category": "enchantment",
    "cancellable": true,
    "properties": [
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "viewers",
        "pythonName": "viewers",
        "javaType": "java.util.List<org.bukkit.entity.HumanEntity>",
        "typeScriptType": "HumanEntity[]",
        "pythonType": "list[HumanEntity]",
        "javaRead": "getViewers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "view",
        "pythonName": "view",
        "javaType": "org.bukkit.inventory.InventoryView",
        "typeScriptType": "InventoryView",
        "pythonType": "InventoryView",
        "javaRead": "getView()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "enchanter",
        "pythonName": "enchanter",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getEnchanter()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "enchantBlock",
        "pythonName": "enchant_block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getEnchantBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "item",
        "pythonName": "item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItem()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "expLevelCost",
        "pythonName": "exp_level_cost",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getExpLevelCost()",
        "javaWrite": "setExpLevelCost(value)",
        "writable": true
      },
      {
        "name": "enchantsToAdd",
        "pythonName": "enchants_to_add",
        "javaType": "java.util.Map<org.bukkit.enchantments.Enchantment, java.lang.Integer>",
        "typeScriptType": "Map<Enchantment, number>",
        "pythonType": "dict[Enchantment, int]",
        "javaRead": "getEnchantsToAdd()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "enchantmentHint",
        "pythonName": "enchantment_hint",
        "javaType": "org.bukkit.enchantments.Enchantment",
        "typeScriptType": "Enchantment",
        "pythonType": "Enchantment",
        "javaRead": "getEnchantmentHint()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "levelHint",
        "pythonName": "level_hint",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getLevelHint()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EnderDragonChangePhaseEvent",
    "javaName": "org.bukkit.event.entity.EnderDragonChangePhaseEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "currentPhase",
        "pythonName": "current_phase",
        "javaType": "org.bukkit.entity.EnderDragon$Phase",
        "typeScriptType": "EnderDragonPhase",
        "pythonType": "EnderDragonPhase",
        "javaRead": "getCurrentPhase()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "newPhase",
        "pythonName": "new_phase",
        "javaType": "org.bukkit.entity.EnderDragon$Phase",
        "typeScriptType": "EnderDragonPhase",
        "pythonType": "EnderDragonPhase",
        "javaRead": "getNewPhase()",
        "javaWrite": "setNewPhase(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "EntitiesLoadEvent",
    "javaName": "org.bukkit.event.world.EntitiesLoadEvent",
    "category": "world",
    "cancellable": false,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "chunk",
        "pythonName": "chunk",
        "javaType": "org.bukkit.Chunk",
        "typeScriptType": "Chunk",
        "pythonType": "Chunk",
        "javaRead": "getChunk()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entities",
        "pythonName": "entities",
        "javaType": "java.util.List<org.bukkit.entity.Entity>",
        "typeScriptType": "Entity[]",
        "pythonType": "list[Entity]",
        "javaRead": "getEntities()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntitiesUnloadEvent",
    "javaName": "org.bukkit.event.world.EntitiesUnloadEvent",
    "category": "world",
    "cancellable": false,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "chunk",
        "pythonName": "chunk",
        "javaType": "org.bukkit.Chunk",
        "typeScriptType": "Chunk",
        "pythonType": "Chunk",
        "javaRead": "getChunk()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entities",
        "pythonName": "entities",
        "javaType": "java.util.List<org.bukkit.entity.Entity>",
        "typeScriptType": "Entity[]",
        "pythonType": "list[Entity]",
        "javaRead": "getEntities()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityAirChangeEvent",
    "javaName": "org.bukkit.event.entity.EntityAirChangeEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "amount",
        "pythonName": "amount",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getAmount()",
        "javaWrite": "setAmount(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "EntityBlockFormEvent",
    "javaName": "org.bukkit.event.block.EntityBlockFormEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "newState",
        "pythonName": "new_state",
        "javaType": "org.bukkit.block.BlockState",
        "typeScriptType": "BlockState",
        "pythonType": "BlockState",
        "javaRead": "getNewState()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityBreakDoorEvent",
    "javaName": "org.bukkit.event.entity.EntityBreakDoorEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "to",
        "pythonName": "to",
        "javaType": "org.bukkit.Material",
        "typeScriptType": "Material",
        "pythonType": "Material",
        "javaRead": "getTo()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockData",
        "pythonName": "block_data",
        "javaType": "org.bukkit.block.data.BlockData",
        "typeScriptType": "BlockData",
        "pythonType": "BlockData",
        "javaRead": "getBlockData()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityBreedEvent",
    "javaName": "org.bukkit.event.entity.EntityBreedEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "mother",
        "pythonName": "mother",
        "javaType": "org.bukkit.entity.LivingEntity",
        "typeScriptType": "LivingEntity",
        "pythonType": "LivingEntity",
        "javaRead": "getMother()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "father",
        "pythonName": "father",
        "javaType": "org.bukkit.entity.LivingEntity",
        "typeScriptType": "LivingEntity",
        "pythonType": "LivingEntity",
        "javaRead": "getFather()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "breeder",
        "pythonName": "breeder",
        "javaType": "org.bukkit.entity.LivingEntity",
        "typeScriptType": "LivingEntity",
        "pythonType": "LivingEntity",
        "javaRead": "getBreeder()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "bredWith",
        "pythonName": "bred_with",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getBredWith()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "experience",
        "pythonName": "experience",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getExperience()",
        "javaWrite": "setExperience(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "EntityChangeBlockEvent",
    "javaName": "org.bukkit.event.entity.EntityChangeBlockEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "to",
        "pythonName": "to",
        "javaType": "org.bukkit.Material",
        "typeScriptType": "Material",
        "pythonType": "Material",
        "javaRead": "getTo()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockData",
        "pythonName": "block_data",
        "javaType": "org.bukkit.block.data.BlockData",
        "typeScriptType": "BlockData",
        "pythonType": "BlockData",
        "javaRead": "getBlockData()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityCombustByBlockEvent",
    "javaName": "org.bukkit.event.entity.EntityCombustByBlockEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "duration",
        "pythonName": "duration",
        "javaType": "float",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getDuration()",
        "javaWrite": "setDuration(value)",
        "writable": true
      },
      {
        "name": "combuster",
        "pythonName": "combuster",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getCombuster()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityCombustByEntityEvent",
    "javaName": "org.bukkit.event.entity.EntityCombustByEntityEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "duration",
        "pythonName": "duration",
        "javaType": "float",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getDuration()",
        "javaWrite": "setDuration(value)",
        "writable": true
      },
      {
        "name": "combuster",
        "pythonName": "combuster",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getCombuster()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityCombustEvent",
    "javaName": "org.bukkit.event.entity.EntityCombustEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "duration",
        "pythonName": "duration",
        "javaType": "float",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getDuration()",
        "javaWrite": "setDuration(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "EntityCreatePortalEvent",
    "javaName": "org.bukkit.event.entity.EntityCreatePortalEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "blocks",
        "pythonName": "blocks",
        "javaType": "java.util.List<org.bukkit.block.BlockState>",
        "typeScriptType": "BlockState[]",
        "pythonType": "list[BlockState]",
        "javaRead": "getBlocks()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "portalType",
        "pythonName": "portal_type",
        "javaType": "org.bukkit.PortalType",
        "typeScriptType": "PortalType",
        "pythonType": "PortalType",
        "javaRead": "getPortalType()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityDamageByBlockEvent",
    "javaName": "org.bukkit.event.entity.EntityDamageByBlockEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "damage",
        "pythonName": "damage",
        "javaType": "double",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getDamage()",
        "javaWrite": "setDamage(value)",
        "writable": true
      },
      {
        "name": "finalDamage",
        "pythonName": "final_damage",
        "javaType": "double",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getFinalDamage()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.entity.EntityDamageEvent$DamageCause",
        "typeScriptType": "EntityDamageCause",
        "pythonType": "EntityDamageCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "damageSource",
        "pythonName": "damage_source",
        "javaType": "org.bukkit.damage.DamageSource",
        "typeScriptType": "DamageSource",
        "pythonType": "DamageSource",
        "javaRead": "getDamageSource()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "damager",
        "pythonName": "damager",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getDamager()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "damagerBlockState",
        "pythonName": "damager_block_state",
        "javaType": "org.bukkit.block.BlockState",
        "typeScriptType": "BlockState",
        "pythonType": "BlockState",
        "javaRead": "getDamagerBlockState()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityDamageByEntityEvent",
    "javaName": "org.bukkit.event.entity.EntityDamageByEntityEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "damage",
        "pythonName": "damage",
        "javaType": "double",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getDamage()",
        "javaWrite": "setDamage(value)",
        "writable": true
      },
      {
        "name": "finalDamage",
        "pythonName": "final_damage",
        "javaType": "double",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getFinalDamage()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.entity.EntityDamageEvent$DamageCause",
        "typeScriptType": "EntityDamageCause",
        "pythonType": "EntityDamageCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "damageSource",
        "pythonName": "damage_source",
        "javaType": "org.bukkit.damage.DamageSource",
        "typeScriptType": "DamageSource",
        "pythonType": "DamageSource",
        "javaRead": "getDamageSource()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "damager",
        "pythonName": "damager",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getDamager()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityDamageEvent",
    "javaName": "org.bukkit.event.entity.EntityDamageEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "damage",
        "pythonName": "damage",
        "javaType": "double",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getDamage()",
        "javaWrite": "setDamage(value)",
        "writable": true
      },
      {
        "name": "finalDamage",
        "pythonName": "final_damage",
        "javaType": "double",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getFinalDamage()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.entity.EntityDamageEvent$DamageCause",
        "typeScriptType": "EntityDamageCause",
        "pythonType": "EntityDamageCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "damageSource",
        "pythonName": "damage_source",
        "javaType": "org.bukkit.damage.DamageSource",
        "typeScriptType": "DamageSource",
        "pythonType": "DamageSource",
        "javaRead": "getDamageSource()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityDeathEvent",
    "javaName": "org.bukkit.event.entity.EntityDeathEvent",
    "category": "entity",
    "cancellable": false,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "damageSource",
        "pythonName": "damage_source",
        "javaType": "org.bukkit.damage.DamageSource",
        "typeScriptType": "DamageSource",
        "pythonType": "DamageSource",
        "javaRead": "getDamageSource()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "droppedExp",
        "pythonName": "dropped_exp",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getDroppedExp()",
        "javaWrite": "setDroppedExp(value)",
        "writable": true
      },
      {
        "name": "drops",
        "pythonName": "drops",
        "javaType": "java.util.List<org.bukkit.inventory.ItemStack>",
        "typeScriptType": "ItemStack[]",
        "pythonType": "list[ItemStack]",
        "javaRead": "getDrops()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityDismountEvent",
    "javaName": "org.bukkit.event.entity.EntityDismountEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "dismounted",
        "pythonName": "dismounted",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getDismounted()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityDropItemEvent",
    "javaName": "org.bukkit.event.entity.EntityDropItemEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "itemDrop",
        "pythonName": "item_drop",
        "javaType": "org.bukkit.entity.Item",
        "typeScriptType": "Item",
        "pythonType": "Item",
        "javaRead": "getItemDrop()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityEnterBlockEvent",
    "javaName": "org.bukkit.event.entity.EntityEnterBlockEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityEnterLoveModeEvent",
    "javaName": "org.bukkit.event.entity.EntityEnterLoveModeEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "humanEntity",
        "pythonName": "human_entity",
        "javaType": "org.bukkit.entity.HumanEntity",
        "typeScriptType": "HumanEntity",
        "pythonType": "HumanEntity",
        "javaRead": "getHumanEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "ticksInLove",
        "pythonName": "ticks_in_love",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getTicksInLove()",
        "javaWrite": "setTicksInLove(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "EntityExhaustionEvent",
    "javaName": "org.bukkit.event.entity.EntityExhaustionEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "exhaustionReason",
        "pythonName": "exhaustion_reason",
        "javaType": "org.bukkit.event.entity.EntityExhaustionEvent$ExhaustionReason",
        "typeScriptType": "EntityExhaustionExhaustionReason",
        "pythonType": "EntityExhaustionExhaustionReason",
        "javaRead": "getExhaustionReason()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "exhaustion",
        "pythonName": "exhaustion",
        "javaType": "float",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getExhaustion()",
        "javaWrite": "setExhaustion(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "EntityExplodeEvent",
    "javaName": "org.bukkit.event.entity.EntityExplodeEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "explosionResult",
        "pythonName": "explosion_result",
        "javaType": "org.bukkit.ExplosionResult",
        "typeScriptType": "ExplosionResult",
        "pythonType": "ExplosionResult",
        "javaRead": "getExplosionResult()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "location",
        "pythonName": "location",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getLocation()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "yield",
        "pythonName": "yield_",
        "javaType": "float",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getYield()",
        "javaWrite": "setYield(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "EntityInteractEvent",
    "javaName": "org.bukkit.event.entity.EntityInteractEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityKnockbackByEntityEvent",
    "javaName": "org.bukkit.event.entity.EntityKnockbackByEntityEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.entity.EntityKnockbackEvent$KnockbackCause",
        "typeScriptType": "EntityKnockbackKnockbackCause",
        "pythonType": "EntityKnockbackKnockbackCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "force",
        "pythonName": "force",
        "javaType": "double",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getForce()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "knockback",
        "pythonName": "knockback",
        "javaType": "org.bukkit.util.Vector",
        "typeScriptType": "Vector",
        "pythonType": "Vector",
        "javaRead": "getKnockback()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "finalKnockback",
        "pythonName": "final_knockback",
        "javaType": "org.bukkit.util.Vector",
        "typeScriptType": "Vector",
        "pythonType": "Vector",
        "javaRead": "getFinalKnockback()",
        "javaWrite": "setFinalKnockback(value)",
        "writable": true
      },
      {
        "name": "sourceEntity",
        "pythonName": "source_entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getSourceEntity()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityKnockbackEvent",
    "javaName": "org.bukkit.event.entity.EntityKnockbackEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.entity.EntityKnockbackEvent$KnockbackCause",
        "typeScriptType": "EntityKnockbackKnockbackCause",
        "pythonType": "EntityKnockbackKnockbackCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "force",
        "pythonName": "force",
        "javaType": "double",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getForce()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "knockback",
        "pythonName": "knockback",
        "javaType": "org.bukkit.util.Vector",
        "typeScriptType": "Vector",
        "pythonType": "Vector",
        "javaRead": "getKnockback()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "finalKnockback",
        "pythonName": "final_knockback",
        "javaType": "org.bukkit.util.Vector",
        "typeScriptType": "Vector",
        "pythonType": "Vector",
        "javaRead": "getFinalKnockback()",
        "javaWrite": "setFinalKnockback(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "EntityMountEvent",
    "javaName": "org.bukkit.event.entity.EntityMountEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "mount",
        "pythonName": "mount",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getMount()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityPickupItemEvent",
    "javaName": "org.bukkit.event.entity.EntityPickupItemEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "item",
        "pythonName": "item",
        "javaType": "org.bukkit.entity.Item",
        "typeScriptType": "Item",
        "pythonType": "Item",
        "javaRead": "getItem()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "remaining",
        "pythonName": "remaining",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getRemaining()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityPlaceEvent",
    "javaName": "org.bukkit.event.entity.EntityPlaceEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockFace",
        "pythonName": "block_face",
        "javaType": "org.bukkit.block.BlockFace",
        "typeScriptType": "BlockFace",
        "pythonType": "BlockFace",
        "javaRead": "getBlockFace()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityPortalEnterEvent",
    "javaName": "org.bukkit.event.entity.EntityPortalEnterEvent",
    "category": "entity",
    "cancellable": false,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "location",
        "pythonName": "location",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getLocation()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityPortalEvent",
    "javaName": "org.bukkit.event.entity.EntityPortalEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "from",
        "pythonName": "from_",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getFrom()",
        "javaWrite": "setFrom(value)",
        "writable": true
      },
      {
        "name": "to",
        "pythonName": "to",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getTo()",
        "javaWrite": "setTo(value)",
        "writable": true
      },
      {
        "name": "searchRadius",
        "pythonName": "search_radius",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getSearchRadius()",
        "javaWrite": "setSearchRadius(value)",
        "writable": true
      },
      {
        "name": "canCreatePortal",
        "pythonName": "can_create_portal",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "getCanCreatePortal()",
        "javaWrite": "setCanCreatePortal(value)",
        "writable": true
      },
      {
        "name": "creationRadius",
        "pythonName": "creation_radius",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getCreationRadius()",
        "javaWrite": "setCreationRadius(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "EntityPortalExitEvent",
    "javaName": "org.bukkit.event.entity.EntityPortalExitEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "from",
        "pythonName": "from_",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getFrom()",
        "javaWrite": "setFrom(value)",
        "writable": true
      },
      {
        "name": "to",
        "pythonName": "to",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getTo()",
        "javaWrite": "setTo(value)",
        "writable": true
      },
      {
        "name": "before",
        "pythonName": "before",
        "javaType": "org.bukkit.util.Vector",
        "typeScriptType": "Vector",
        "pythonType": "Vector",
        "javaRead": "getBefore()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "after",
        "pythonName": "after",
        "javaType": "org.bukkit.util.Vector",
        "typeScriptType": "Vector",
        "pythonType": "Vector",
        "javaRead": "getAfter()",
        "javaWrite": "setAfter(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "EntityPoseChangeEvent",
    "javaName": "org.bukkit.event.entity.EntityPoseChangeEvent",
    "category": "entity",
    "cancellable": false,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "pose",
        "pythonName": "pose",
        "javaType": "org.bukkit.entity.Pose",
        "typeScriptType": "Pose",
        "pythonType": "Pose",
        "javaRead": "getPose()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityPotionEffectEvent",
    "javaName": "org.bukkit.event.entity.EntityPotionEffectEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "oldEffect",
        "pythonName": "old_effect",
        "javaType": "org.bukkit.potion.PotionEffect",
        "typeScriptType": "PotionEffect",
        "pythonType": "PotionEffect",
        "javaRead": "getOldEffect()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "newEffect",
        "pythonName": "new_effect",
        "javaType": "org.bukkit.potion.PotionEffect",
        "typeScriptType": "PotionEffect",
        "pythonType": "PotionEffect",
        "javaRead": "getNewEffect()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.entity.EntityPotionEffectEvent$Cause",
        "typeScriptType": "EntityPotionEffectCause",
        "pythonType": "EntityPotionEffectCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "action",
        "pythonName": "action",
        "javaType": "org.bukkit.event.entity.EntityPotionEffectEvent$Action",
        "typeScriptType": "EntityPotionEffectAction",
        "pythonType": "EntityPotionEffectAction",
        "javaRead": "getAction()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "modifiedType",
        "pythonName": "modified_type",
        "javaType": "org.bukkit.potion.PotionEffectType",
        "typeScriptType": "PotionEffectType",
        "pythonType": "PotionEffectType",
        "javaRead": "getModifiedType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "override",
        "pythonName": "override",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isOverride()",
        "javaWrite": "setOverride(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "EntityRegainHealthEvent",
    "javaName": "org.bukkit.event.entity.EntityRegainHealthEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "amount",
        "pythonName": "amount",
        "javaType": "double",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getAmount()",
        "javaWrite": "setAmount(value)",
        "writable": true
      },
      {
        "name": "regainReason",
        "pythonName": "regain_reason",
        "javaType": "org.bukkit.event.entity.EntityRegainHealthEvent$RegainReason",
        "typeScriptType": "EntityRegainReason",
        "pythonType": "EntityRegainReason",
        "javaRead": "getRegainReason()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityRemoveEvent",
    "javaName": "org.bukkit.event.entity.EntityRemoveEvent",
    "category": "entity",
    "cancellable": false,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.entity.EntityRemoveEvent$Cause",
        "typeScriptType": "EntityRemoveCause",
        "pythonType": "EntityRemoveCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityResurrectEvent",
    "javaName": "org.bukkit.event.entity.EntityResurrectEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityShootBowEvent",
    "javaName": "org.bukkit.event.entity.EntityShootBowEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "bow",
        "pythonName": "bow",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getBow()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "consumable",
        "pythonName": "consumable",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getConsumable()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "projectile",
        "pythonName": "projectile",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getProjectile()",
        "javaWrite": "setProjectile(value)",
        "writable": true
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "force",
        "pythonName": "force",
        "javaType": "float",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getForce()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "consumeItem",
        "pythonName": "consume_item",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "consumeItem",
        "javaWrite": "setConsumeItem(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "EntitySpawnEvent",
    "javaName": "org.bukkit.event.entity.EntitySpawnEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "location",
        "pythonName": "location",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getLocation()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntitySpellCastEvent",
    "javaName": "org.bukkit.event.entity.EntitySpellCastEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "spell",
        "pythonName": "spell",
        "javaType": "org.bukkit.entity.Spellcaster$Spell",
        "typeScriptType": "SpellcasterSpell",
        "pythonType": "SpellcasterSpell",
        "javaRead": "getSpell()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityTameEvent",
    "javaName": "org.bukkit.event.entity.EntityTameEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "owner",
        "pythonName": "owner",
        "javaType": "org.bukkit.entity.AnimalTamer",
        "typeScriptType": "AnimalTamer",
        "pythonType": "AnimalTamer",
        "javaRead": "getOwner()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityTargetBlockEvent",
    "javaName": "org.bukkit.event.entity.EntityTargetBlockEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "target",
        "pythonName": "target",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getTarget()",
        "javaWrite": "setTarget(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "EntityTargetEvent",
    "javaName": "org.bukkit.event.entity.EntityTargetEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "reason",
        "pythonName": "reason",
        "javaType": "org.bukkit.event.entity.EntityTargetEvent$TargetReason",
        "typeScriptType": "EntityTargetReason",
        "pythonType": "EntityTargetReason",
        "javaRead": "getReason()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "target",
        "pythonName": "target",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getTarget()",
        "javaWrite": "setTarget(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "EntityTargetLivingEntityEvent",
    "javaName": "org.bukkit.event.entity.EntityTargetLivingEntityEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "reason",
        "pythonName": "reason",
        "javaType": "org.bukkit.event.entity.EntityTargetEvent$TargetReason",
        "typeScriptType": "EntityTargetReason",
        "pythonType": "EntityTargetReason",
        "javaRead": "getReason()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "target",
        "pythonName": "target",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getTarget()",
        "javaWrite": "setTarget(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "EntityTeleportEvent",
    "javaName": "org.bukkit.event.entity.EntityTeleportEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "from",
        "pythonName": "from_",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getFrom()",
        "javaWrite": "setFrom(value)",
        "writable": true
      },
      {
        "name": "to",
        "pythonName": "to",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getTo()",
        "javaWrite": "setTo(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "EntityToggleGlideEvent",
    "javaName": "org.bukkit.event.entity.EntityToggleGlideEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "gliding",
        "pythonName": "gliding",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isGliding()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityToggleSwimEvent",
    "javaName": "org.bukkit.event.entity.EntityToggleSwimEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "swimming",
        "pythonName": "swimming",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isSwimming()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityTransformEvent",
    "javaName": "org.bukkit.event.entity.EntityTransformEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "transformedEntity",
        "pythonName": "transformed_entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getTransformedEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "transformedEntities",
        "pythonName": "transformed_entities",
        "javaType": "java.util.List<org.bukkit.entity.Entity>",
        "typeScriptType": "Entity[]",
        "pythonType": "list[Entity]",
        "javaRead": "getTransformedEntities()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "transformReason",
        "pythonName": "transform_reason",
        "javaType": "org.bukkit.event.entity.EntityTransformEvent$TransformReason",
        "typeScriptType": "EntityTransformTransformReason",
        "pythonType": "EntityTransformTransformReason",
        "javaRead": "getTransformReason()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "EntityUnleashEvent",
    "javaName": "org.bukkit.event.entity.EntityUnleashEvent",
    "category": "entity",
    "cancellable": false,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "reason",
        "pythonName": "reason",
        "javaType": "org.bukkit.event.entity.EntityUnleashEvent$UnleashReason",
        "typeScriptType": "EntityUnleashReason",
        "pythonType": "EntityUnleashReason",
        "javaRead": "getReason()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "ExpBottleEvent",
    "javaName": "org.bukkit.event.entity.ExpBottleEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "hitBlock",
        "pythonName": "hit_block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getHitBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hitBlockFace",
        "pythonName": "hit_block_face",
        "javaType": "org.bukkit.block.BlockFace",
        "typeScriptType": "BlockFace",
        "pythonType": "BlockFace",
        "javaRead": "getHitBlockFace()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hitEntity",
        "pythonName": "hit_entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getHitEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "showEffect",
        "pythonName": "show_effect",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "getShowEffect()",
        "javaWrite": "setShowEffect(value)",
        "writable": true
      },
      {
        "name": "experience",
        "pythonName": "experience",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getExperience()",
        "javaWrite": "setExperience(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "ExplosionPrimeEvent",
    "javaName": "org.bukkit.event.entity.ExplosionPrimeEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "radius",
        "pythonName": "radius",
        "javaType": "float",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getRadius()",
        "javaWrite": "setRadius(value)",
        "writable": true
      },
      {
        "name": "fire",
        "pythonName": "fire",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "getFire()",
        "javaWrite": "setFire(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "FireworkExplodeEvent",
    "javaName": "org.bukkit.event.entity.FireworkExplodeEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "FluidLevelChangeEvent",
    "javaName": "org.bukkit.event.block.FluidLevelChangeEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "newData",
        "pythonName": "new_data",
        "javaType": "org.bukkit.block.data.BlockData",
        "typeScriptType": "BlockData",
        "pythonType": "BlockData",
        "javaRead": "getNewData()",
        "javaWrite": "setNewData(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "FoodLevelChangeEvent",
    "javaName": "org.bukkit.event.entity.FoodLevelChangeEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "item",
        "pythonName": "item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItem()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "foodLevel",
        "pythonName": "food_level",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getFoodLevel()",
        "javaWrite": "setFoodLevel(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "FurnaceBurnEvent",
    "javaName": "org.bukkit.event.inventory.FurnaceBurnEvent",
    "category": "inventory",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "fuel",
        "pythonName": "fuel",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getFuel()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "burnTime",
        "pythonName": "burn_time",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getBurnTime()",
        "javaWrite": "setBurnTime(value)",
        "writable": true
      },
      {
        "name": "burning",
        "pythonName": "burning",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isBurning()",
        "javaWrite": "setBurning(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "FurnaceExtractEvent",
    "javaName": "org.bukkit.event.inventory.FurnaceExtractEvent",
    "category": "inventory",
    "cancellable": false,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "expToDrop",
        "pythonName": "exp_to_drop",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getExpToDrop()",
        "javaWrite": "setExpToDrop(value)",
        "writable": true
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "itemType",
        "pythonName": "item_type",
        "javaType": "org.bukkit.Material",
        "typeScriptType": "Material",
        "pythonType": "Material",
        "javaRead": "getItemType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "itemAmount",
        "pythonName": "item_amount",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getItemAmount()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "FurnaceSmeltEvent",
    "javaName": "org.bukkit.event.inventory.FurnaceSmeltEvent",
    "category": "inventory",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "source",
        "pythonName": "source",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getSource()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "result",
        "pythonName": "result",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getResult()",
        "javaWrite": "setResult(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "FurnaceStartSmeltEvent",
    "javaName": "org.bukkit.event.inventory.FurnaceStartSmeltEvent",
    "category": "inventory",
    "cancellable": false,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "source",
        "pythonName": "source",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getSource()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "recipe",
        "pythonName": "recipe",
        "javaType": "org.bukkit.inventory.CookingRecipe<?>",
        "typeScriptType": "CookingRecipe<unknown>",
        "pythonType": "CookingRecipe[Any]",
        "javaRead": "getRecipe()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "totalCookTime",
        "pythonName": "total_cook_time",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getTotalCookTime()",
        "javaWrite": "setTotalCookTime(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "GenericGameEvent",
    "javaName": "org.bukkit.event.world.GenericGameEvent",
    "category": "world",
    "cancellable": true,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "event",
        "pythonName": "event",
        "javaType": "org.bukkit.GameEvent",
        "typeScriptType": "GameEvent",
        "pythonType": "GameEvent",
        "javaRead": "getEvent()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "location",
        "pythonName": "location",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getLocation()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "radius",
        "pythonName": "radius",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getRadius()",
        "javaWrite": "setRadius(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "HangingBreakByEntityEvent",
    "javaName": "org.bukkit.event.hanging.HangingBreakByEntityEvent",
    "category": "hanging",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Hanging",
        "typeScriptType": "Hanging",
        "pythonType": "Hanging",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.hanging.HangingBreakEvent$RemoveCause",
        "typeScriptType": "HangingRemoveCause",
        "pythonType": "HangingRemoveCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "remover",
        "pythonName": "remover",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getRemover()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "HangingBreakEvent",
    "javaName": "org.bukkit.event.hanging.HangingBreakEvent",
    "category": "hanging",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Hanging",
        "typeScriptType": "Hanging",
        "pythonType": "Hanging",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.hanging.HangingBreakEvent$RemoveCause",
        "typeScriptType": "HangingRemoveCause",
        "pythonType": "HangingRemoveCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "HangingPlaceEvent",
    "javaName": "org.bukkit.event.hanging.HangingPlaceEvent",
    "category": "hanging",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Hanging",
        "typeScriptType": "Hanging",
        "pythonType": "Hanging",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockFace",
        "pythonName": "block_face",
        "javaType": "org.bukkit.block.BlockFace",
        "typeScriptType": "BlockFace",
        "pythonType": "BlockFace",
        "javaRead": "getBlockFace()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "itemStack",
        "pythonName": "item_stack",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItemStack()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "HopperInventorySearchEvent",
    "javaName": "org.bukkit.event.inventory.HopperInventorySearchEvent",
    "category": "inventory",
    "cancellable": false,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": "setInventory(value)",
        "writable": true
      },
      {
        "name": "containerType",
        "pythonName": "container_type",
        "javaType": "org.bukkit.event.inventory.HopperInventorySearchEvent$ContainerType",
        "typeScriptType": "HopperInventorySearchContainerType",
        "pythonType": "HopperInventorySearchContainerType",
        "javaRead": "getContainerType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "searchBlock",
        "pythonName": "search_block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getSearchBlock()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "HorseJumpEvent",
    "javaName": "org.bukkit.event.entity.HorseJumpEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "power",
        "pythonName": "power",
        "javaType": "float",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getPower()",
        "javaWrite": "setPower(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "InventoryBlockStartEvent",
    "javaName": "org.bukkit.event.block.InventoryBlockStartEvent",
    "category": "block",
    "cancellable": false,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "source",
        "pythonName": "source",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getSource()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "InventoryClickEvent",
    "javaName": "org.bukkit.event.inventory.InventoryClickEvent",
    "category": "inventory",
    "cancellable": true,
    "properties": [
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "viewers",
        "pythonName": "viewers",
        "javaType": "java.util.List<org.bukkit.entity.HumanEntity>",
        "typeScriptType": "HumanEntity[]",
        "pythonType": "list[HumanEntity]",
        "javaRead": "getViewers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "view",
        "pythonName": "view",
        "javaType": "org.bukkit.inventory.InventoryView",
        "typeScriptType": "InventoryView",
        "pythonType": "InventoryView",
        "javaRead": "getView()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "whoClicked",
        "pythonName": "who_clicked",
        "javaType": "org.bukkit.entity.HumanEntity",
        "typeScriptType": "HumanEntity",
        "pythonType": "HumanEntity",
        "javaRead": "getWhoClicked()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "result",
        "pythonName": "result",
        "javaType": "org.bukkit.event.Event$Result",
        "typeScriptType": "EventResult",
        "pythonType": "EventResult",
        "javaRead": "getResult()",
        "javaWrite": "setResult(value)",
        "writable": true
      },
      {
        "name": "slotType",
        "pythonName": "slot_type",
        "javaType": "org.bukkit.event.inventory.InventoryType$SlotType",
        "typeScriptType": "InventorySlotType",
        "pythonType": "InventorySlotType",
        "javaRead": "getSlotType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cursor",
        "pythonName": "cursor",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getCursor()",
        "javaWrite": "setCursor(value)",
        "writable": true
      },
      {
        "name": "currentItem",
        "pythonName": "current_item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getCurrentItem()",
        "javaWrite": "setCurrentItem(value)",
        "writable": true
      },
      {
        "name": "rightClick",
        "pythonName": "right_click",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isRightClick()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "leftClick",
        "pythonName": "left_click",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isLeftClick()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "shiftClick",
        "pythonName": "shift_click",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isShiftClick()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "clickedInventory",
        "pythonName": "clicked_inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getClickedInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "slot",
        "pythonName": "slot",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getSlot()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "rawSlot",
        "pythonName": "raw_slot",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getRawSlot()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hotbarButton",
        "pythonName": "hotbar_button",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getHotbarButton()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "action",
        "pythonName": "action",
        "javaType": "org.bukkit.event.inventory.InventoryAction",
        "typeScriptType": "InventoryAction",
        "pythonType": "InventoryAction",
        "javaRead": "getAction()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "click",
        "pythonName": "click",
        "javaType": "org.bukkit.event.inventory.ClickType",
        "typeScriptType": "ClickType",
        "pythonType": "ClickType",
        "javaRead": "getClick()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "InventoryCloseEvent",
    "javaName": "org.bukkit.event.inventory.InventoryCloseEvent",
    "category": "inventory",
    "cancellable": false,
    "properties": [
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "viewers",
        "pythonName": "viewers",
        "javaType": "java.util.List<org.bukkit.entity.HumanEntity>",
        "typeScriptType": "HumanEntity[]",
        "pythonType": "list[HumanEntity]",
        "javaRead": "getViewers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "view",
        "pythonName": "view",
        "javaType": "org.bukkit.inventory.InventoryView",
        "typeScriptType": "InventoryView",
        "pythonType": "InventoryView",
        "javaRead": "getView()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.HumanEntity",
        "typeScriptType": "HumanEntity",
        "pythonType": "HumanEntity",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "InventoryCreativeEvent",
    "javaName": "org.bukkit.event.inventory.InventoryCreativeEvent",
    "category": "inventory",
    "cancellable": true,
    "properties": [
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "viewers",
        "pythonName": "viewers",
        "javaType": "java.util.List<org.bukkit.entity.HumanEntity>",
        "typeScriptType": "HumanEntity[]",
        "pythonType": "list[HumanEntity]",
        "javaRead": "getViewers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "view",
        "pythonName": "view",
        "javaType": "org.bukkit.inventory.InventoryView",
        "typeScriptType": "InventoryView",
        "pythonType": "InventoryView",
        "javaRead": "getView()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "whoClicked",
        "pythonName": "who_clicked",
        "javaType": "org.bukkit.entity.HumanEntity",
        "typeScriptType": "HumanEntity",
        "pythonType": "HumanEntity",
        "javaRead": "getWhoClicked()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "result",
        "pythonName": "result",
        "javaType": "org.bukkit.event.Event$Result",
        "typeScriptType": "EventResult",
        "pythonType": "EventResult",
        "javaRead": "getResult()",
        "javaWrite": "setResult(value)",
        "writable": true
      },
      {
        "name": "slotType",
        "pythonName": "slot_type",
        "javaType": "org.bukkit.event.inventory.InventoryType$SlotType",
        "typeScriptType": "InventorySlotType",
        "pythonType": "InventorySlotType",
        "javaRead": "getSlotType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cursor",
        "pythonName": "cursor",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getCursor()",
        "javaWrite": "setCursor(value)",
        "writable": true
      },
      {
        "name": "currentItem",
        "pythonName": "current_item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getCurrentItem()",
        "javaWrite": "setCurrentItem(value)",
        "writable": true
      },
      {
        "name": "rightClick",
        "pythonName": "right_click",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isRightClick()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "leftClick",
        "pythonName": "left_click",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isLeftClick()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "shiftClick",
        "pythonName": "shift_click",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isShiftClick()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "clickedInventory",
        "pythonName": "clicked_inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getClickedInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "slot",
        "pythonName": "slot",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getSlot()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "rawSlot",
        "pythonName": "raw_slot",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getRawSlot()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hotbarButton",
        "pythonName": "hotbar_button",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getHotbarButton()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "action",
        "pythonName": "action",
        "javaType": "org.bukkit.event.inventory.InventoryAction",
        "typeScriptType": "InventoryAction",
        "pythonType": "InventoryAction",
        "javaRead": "getAction()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "click",
        "pythonName": "click",
        "javaType": "org.bukkit.event.inventory.ClickType",
        "typeScriptType": "ClickType",
        "pythonType": "ClickType",
        "javaRead": "getClick()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "InventoryDragEvent",
    "javaName": "org.bukkit.event.inventory.InventoryDragEvent",
    "category": "inventory",
    "cancellable": true,
    "properties": [
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "viewers",
        "pythonName": "viewers",
        "javaType": "java.util.List<org.bukkit.entity.HumanEntity>",
        "typeScriptType": "HumanEntity[]",
        "pythonType": "list[HumanEntity]",
        "javaRead": "getViewers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "view",
        "pythonName": "view",
        "javaType": "org.bukkit.inventory.InventoryView",
        "typeScriptType": "InventoryView",
        "pythonType": "InventoryView",
        "javaRead": "getView()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "whoClicked",
        "pythonName": "who_clicked",
        "javaType": "org.bukkit.entity.HumanEntity",
        "typeScriptType": "HumanEntity",
        "pythonType": "HumanEntity",
        "javaRead": "getWhoClicked()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "result",
        "pythonName": "result",
        "javaType": "org.bukkit.event.Event$Result",
        "typeScriptType": "EventResult",
        "pythonType": "EventResult",
        "javaRead": "getResult()",
        "javaWrite": "setResult(value)",
        "writable": true
      },
      {
        "name": "newItems",
        "pythonName": "new_items",
        "javaType": "java.util.Map<java.lang.Integer, org.bukkit.inventory.ItemStack>",
        "typeScriptType": "Map<number, ItemStack>",
        "pythonType": "dict[int, ItemStack]",
        "javaRead": "getNewItems()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "rawSlots",
        "pythonName": "raw_slots",
        "javaType": "java.util.Set<java.lang.Integer>",
        "typeScriptType": "Set<number>",
        "pythonType": "set[int]",
        "javaRead": "getRawSlots()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "inventorySlots",
        "pythonName": "inventory_slots",
        "javaType": "java.util.Set<java.lang.Integer>",
        "typeScriptType": "Set<number>",
        "pythonType": "set[int]",
        "javaRead": "getInventorySlots()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cursor",
        "pythonName": "cursor",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getCursor()",
        "javaWrite": "setCursor(value)",
        "writable": true
      },
      {
        "name": "oldCursor",
        "pythonName": "old_cursor",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getOldCursor()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "type",
        "pythonName": "type",
        "javaType": "org.bukkit.event.inventory.DragType",
        "typeScriptType": "DragType",
        "pythonType": "DragType",
        "javaRead": "getType()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "InventoryEvent",
    "javaName": "org.bukkit.event.inventory.InventoryEvent",
    "category": "inventory",
    "cancellable": false,
    "properties": [
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "viewers",
        "pythonName": "viewers",
        "javaType": "java.util.List<org.bukkit.entity.HumanEntity>",
        "typeScriptType": "HumanEntity[]",
        "pythonType": "list[HumanEntity]",
        "javaRead": "getViewers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "view",
        "pythonName": "view",
        "javaType": "org.bukkit.inventory.InventoryView",
        "typeScriptType": "InventoryView",
        "pythonType": "InventoryView",
        "javaRead": "getView()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "InventoryMoveItemEvent",
    "javaName": "org.bukkit.event.inventory.InventoryMoveItemEvent",
    "category": "inventory",
    "cancellable": true,
    "properties": [
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "source",
        "pythonName": "source",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getSource()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "item",
        "pythonName": "item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItem()",
        "javaWrite": "setItem(value)",
        "writable": true
      },
      {
        "name": "destination",
        "pythonName": "destination",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getDestination()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "initiator",
        "pythonName": "initiator",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInitiator()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "InventoryOpenEvent",
    "javaName": "org.bukkit.event.inventory.InventoryOpenEvent",
    "category": "inventory",
    "cancellable": true,
    "properties": [
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "viewers",
        "pythonName": "viewers",
        "javaType": "java.util.List<org.bukkit.entity.HumanEntity>",
        "typeScriptType": "HumanEntity[]",
        "pythonType": "list[HumanEntity]",
        "javaRead": "getViewers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "view",
        "pythonName": "view",
        "javaType": "org.bukkit.inventory.InventoryView",
        "typeScriptType": "InventoryView",
        "pythonType": "InventoryView",
        "javaRead": "getView()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.HumanEntity",
        "typeScriptType": "HumanEntity",
        "pythonType": "HumanEntity",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "InventoryPickupItemEvent",
    "javaName": "org.bukkit.event.inventory.InventoryPickupItemEvent",
    "category": "inventory",
    "cancellable": true,
    "properties": [
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "item",
        "pythonName": "item",
        "javaType": "org.bukkit.entity.Item",
        "typeScriptType": "Item",
        "pythonType": "Item",
        "javaRead": "getItem()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "ItemDespawnEvent",
    "javaName": "org.bukkit.event.entity.ItemDespawnEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "location",
        "pythonName": "location",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getLocation()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "ItemMergeEvent",
    "javaName": "org.bukkit.event.entity.ItemMergeEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "target",
        "pythonName": "target",
        "javaType": "org.bukkit.entity.Item",
        "typeScriptType": "Item",
        "pythonType": "Item",
        "javaRead": "getTarget()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "ItemSpawnEvent",
    "javaName": "org.bukkit.event.entity.ItemSpawnEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "location",
        "pythonName": "location",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getLocation()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "LeavesDecayEvent",
    "javaName": "org.bukkit.event.block.LeavesDecayEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "LightningStrikeEvent",
    "javaName": "org.bukkit.event.weather.LightningStrikeEvent",
    "category": "weather",
    "cancellable": true,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "lightning",
        "pythonName": "lightning",
        "javaType": "org.bukkit.entity.LightningStrike",
        "typeScriptType": "LightningStrike",
        "pythonType": "LightningStrike",
        "javaRead": "getLightning()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.weather.LightningStrikeEvent$Cause",
        "typeScriptType": "LightningStrikeCause",
        "pythonType": "LightningStrikeCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "LingeringPotionSplashEvent",
    "javaName": "org.bukkit.event.entity.LingeringPotionSplashEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "hitBlock",
        "pythonName": "hit_block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getHitBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hitBlockFace",
        "pythonName": "hit_block_face",
        "javaType": "org.bukkit.block.BlockFace",
        "typeScriptType": "BlockFace",
        "pythonType": "BlockFace",
        "javaRead": "getHitBlockFace()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hitEntity",
        "pythonName": "hit_entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getHitEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "areaEffectCloud",
        "pythonName": "area_effect_cloud",
        "javaType": "org.bukkit.entity.AreaEffectCloud",
        "typeScriptType": "AreaEffectCloud",
        "pythonType": "AreaEffectCloud",
        "javaRead": "getAreaEffectCloud()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "LootGenerateEvent",
    "javaName": "org.bukkit.event.world.LootGenerateEvent",
    "category": "world",
    "cancellable": true,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "inventoryHolder",
        "pythonName": "inventory_holder",
        "javaType": "org.bukkit.inventory.InventoryHolder",
        "typeScriptType": "InventoryHolder",
        "pythonType": "InventoryHolder",
        "javaRead": "getInventoryHolder()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "lootTable",
        "pythonName": "loot_table",
        "javaType": "org.bukkit.loot.LootTable",
        "typeScriptType": "LootTable",
        "pythonType": "LootTable",
        "javaRead": "getLootTable()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "lootContext",
        "pythonName": "loot_context",
        "javaType": "org.bukkit.loot.LootContext",
        "typeScriptType": "LootContext",
        "pythonType": "LootContext",
        "javaRead": "getLootContext()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "loot",
        "pythonName": "loot",
        "javaType": "java.util.List<org.bukkit.inventory.ItemStack>",
        "typeScriptType": "ItemStack[]",
        "pythonType": "list[ItemStack]",
        "javaRead": "getLoot()",
        "javaWrite": "setLoot(value)",
        "writable": true
      },
      {
        "name": "plugin",
        "pythonName": "plugin",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isPlugin()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "MapInitializeEvent",
    "javaName": "org.bukkit.event.server.MapInitializeEvent",
    "category": "server",
    "cancellable": false,
    "properties": [
      {
        "name": "map",
        "pythonName": "map",
        "javaType": "org.bukkit.map.MapView",
        "typeScriptType": "MapView",
        "pythonType": "MapView",
        "javaRead": "getMap()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "MoistureChangeEvent",
    "javaName": "org.bukkit.event.block.MoistureChangeEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "newState",
        "pythonName": "new_state",
        "javaType": "org.bukkit.block.BlockState",
        "typeScriptType": "BlockState",
        "pythonType": "BlockState",
        "javaRead": "getNewState()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "NotePlayEvent",
    "javaName": "org.bukkit.event.block.NotePlayEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "instrument",
        "pythonName": "instrument",
        "javaType": "org.bukkit.Instrument",
        "typeScriptType": "Instrument",
        "pythonType": "Instrument",
        "javaRead": "getInstrument()",
        "javaWrite": "setInstrument(value)",
        "writable": true
      },
      {
        "name": "note",
        "pythonName": "note",
        "javaType": "org.bukkit.Note",
        "typeScriptType": "Note",
        "pythonType": "Note",
        "javaRead": "getNote()",
        "javaWrite": "setNote(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PiglinBarterEvent",
    "javaName": "org.bukkit.event.entity.PiglinBarterEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "input",
        "pythonName": "input",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getInput()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "outcome",
        "pythonName": "outcome",
        "javaType": "java.util.List<org.bukkit.inventory.ItemStack>",
        "typeScriptType": "ItemStack[]",
        "pythonType": "list[ItemStack]",
        "javaRead": "getOutcome()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PigZapEvent",
    "javaName": "org.bukkit.event.entity.PigZapEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "transformedEntity",
        "pythonName": "transformed_entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getTransformedEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "transformedEntities",
        "pythonName": "transformed_entities",
        "javaType": "java.util.List<org.bukkit.entity.Entity>",
        "typeScriptType": "Entity[]",
        "pythonType": "list[Entity]",
        "javaRead": "getTransformedEntities()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "transformReason",
        "pythonName": "transform_reason",
        "javaType": "org.bukkit.event.entity.EntityTransformEvent$TransformReason",
        "typeScriptType": "EntityTransformTransformReason",
        "pythonType": "EntityTransformTransformReason",
        "javaRead": "getTransformReason()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "lightning",
        "pythonName": "lightning",
        "javaType": "org.bukkit.entity.LightningStrike",
        "typeScriptType": "LightningStrike",
        "pythonType": "LightningStrike",
        "javaRead": "getLightning()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "pigZombie",
        "pythonName": "pig_zombie",
        "javaType": "org.bukkit.entity.PigZombie",
        "typeScriptType": "PigZombie",
        "pythonType": "PigZombie",
        "javaRead": "getPigZombie()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PigZombieAngerEvent",
    "javaName": "org.bukkit.event.entity.PigZombieAngerEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "target",
        "pythonName": "target",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getTarget()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "newAnger",
        "pythonName": "new_anger",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getNewAnger()",
        "javaWrite": "setNewAnger(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerAdvancementDoneEvent",
    "javaName": "org.bukkit.event.player.PlayerAdvancementDoneEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "advancement",
        "pythonName": "advancement",
        "javaType": "org.bukkit.advancement.Advancement",
        "typeScriptType": "Advancement",
        "pythonType": "Advancement",
        "javaRead": "getAdvancement()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerAnimationEvent",
    "javaName": "org.bukkit.event.player.PlayerAnimationEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "animationType",
        "pythonName": "animation_type",
        "javaType": "org.bukkit.event.player.PlayerAnimationType",
        "typeScriptType": "PlayerAnimationType",
        "pythonType": "PlayerAnimationType",
        "javaRead": "getAnimationType()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerArmorStandManipulateEvent",
    "javaName": "org.bukkit.event.player.PlayerArmorStandManipulateEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "rightClicked",
        "pythonName": "right_clicked",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getRightClicked()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "playerItem",
        "pythonName": "player_item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getPlayerItem()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "armorStandItem",
        "pythonName": "armor_stand_item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getArmorStandItem()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "slot",
        "pythonName": "slot",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getSlot()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerBedEnterEvent",
    "javaName": "org.bukkit.event.player.PlayerBedEnterEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "bedEnterResult",
        "pythonName": "bed_enter_result",
        "javaType": "org.bukkit.event.player.PlayerBedEnterEvent$BedEnterResult",
        "typeScriptType": "PlayerBedEnterBedEnterResult",
        "pythonType": "PlayerBedEnterBedEnterResult",
        "javaRead": "getBedEnterResult()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "bed",
        "pythonName": "bed",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBed()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "useBed",
        "pythonName": "use_bed",
        "javaType": "org.bukkit.event.Event$Result",
        "typeScriptType": "EventResult",
        "pythonType": "EventResult",
        "javaRead": "useBed",
        "javaWrite": "setUseBed(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerBedLeaveEvent",
    "javaName": "org.bukkit.event.player.PlayerBedLeaveEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "bed",
        "pythonName": "bed",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBed()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "spawnLocation",
        "pythonName": "spawn_location",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "spawnLocation",
        "javaWrite": "setSpawnLocation(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerBucketEmptyEvent",
    "javaName": "org.bukkit.event.player.PlayerBucketEmptyEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "bucket",
        "pythonName": "bucket",
        "javaType": "org.bukkit.Material",
        "typeScriptType": "Material",
        "pythonType": "Material",
        "javaRead": "getBucket()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "itemStack",
        "pythonName": "item_stack",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItemStack()",
        "javaWrite": "setItemStack(value)",
        "writable": true
      },
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockClicked",
        "pythonName": "block_clicked",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlockClicked()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockFace",
        "pythonName": "block_face",
        "javaType": "org.bukkit.block.BlockFace",
        "typeScriptType": "BlockFace",
        "pythonType": "BlockFace",
        "javaRead": "getBlockFace()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerBucketEntityEvent",
    "javaName": "org.bukkit.event.player.PlayerBucketEntityEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "originalBucket",
        "pythonName": "original_bucket",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getOriginalBucket()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityBucket",
        "pythonName": "entity_bucket",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getEntityBucket()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerBucketFillEvent",
    "javaName": "org.bukkit.event.player.PlayerBucketFillEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "bucket",
        "pythonName": "bucket",
        "javaType": "org.bukkit.Material",
        "typeScriptType": "Material",
        "pythonType": "Material",
        "javaRead": "getBucket()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "itemStack",
        "pythonName": "item_stack",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItemStack()",
        "javaWrite": "setItemStack(value)",
        "writable": true
      },
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockClicked",
        "pythonName": "block_clicked",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlockClicked()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockFace",
        "pythonName": "block_face",
        "javaType": "org.bukkit.block.BlockFace",
        "typeScriptType": "BlockFace",
        "pythonType": "BlockFace",
        "javaRead": "getBlockFace()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerBucketFishEvent",
    "javaName": "org.bukkit.event.player.PlayerBucketFishEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "originalBucket",
        "pythonName": "original_bucket",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getOriginalBucket()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityBucket",
        "pythonName": "entity_bucket",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getEntityBucket()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "waterBucket",
        "pythonName": "water_bucket",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getWaterBucket()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "fishBucket",
        "pythonName": "fish_bucket",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getFishBucket()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerChangedMainHandEvent",
    "javaName": "org.bukkit.event.player.PlayerChangedMainHandEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "mainHand",
        "pythonName": "main_hand",
        "javaType": "org.bukkit.inventory.MainHand",
        "typeScriptType": "MainHand",
        "pythonType": "MainHand",
        "javaRead": "getMainHand()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerChangedWorldEvent",
    "javaName": "org.bukkit.event.player.PlayerChangedWorldEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "from",
        "pythonName": "from_",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getFrom()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerChatEvent",
    "javaName": "org.bukkit.event.player.PlayerChatEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": "setPlayer(value)",
        "writable": true
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "message",
        "pythonName": "message",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getMessage()",
        "javaWrite": "setMessage(value)",
        "writable": true
      },
      {
        "name": "format",
        "pythonName": "format",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getFormat()",
        "javaWrite": "setFormat(value)",
        "writable": true
      },
      {
        "name": "recipients",
        "pythonName": "recipients",
        "javaType": "java.util.Set<org.bukkit.entity.Player>",
        "typeScriptType": "Set<Player>",
        "pythonType": "set[Player]",
        "javaRead": "getRecipients()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerChatTabCompleteEvent",
    "javaName": "org.bukkit.event.player.PlayerChatTabCompleteEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "chatMessage",
        "pythonName": "chat_message",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getChatMessage()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "lastToken",
        "pythonName": "last_token",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getLastToken()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "tabCompletions",
        "pythonName": "tab_completions",
        "javaType": "java.util.Collection<java.lang.String>",
        "typeScriptType": "string[]",
        "pythonType": "list[str]",
        "javaRead": "getTabCompletions()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerCommandPreprocessEvent",
    "javaName": "org.bukkit.event.player.PlayerCommandPreprocessEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": "setPlayer(value)",
        "writable": true
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "message",
        "pythonName": "message",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getMessage()",
        "javaWrite": "setMessage(value)",
        "writable": true
      },
      {
        "name": "recipients",
        "pythonName": "recipients",
        "javaType": "java.util.Set<org.bukkit.entity.Player>",
        "typeScriptType": "Set<Player>",
        "pythonType": "set[Player]",
        "javaRead": "getRecipients()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerCommandSendEvent",
    "javaName": "org.bukkit.event.player.PlayerCommandSendEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "commands",
        "pythonName": "commands",
        "javaType": "java.util.Collection<java.lang.String>",
        "typeScriptType": "string[]",
        "pythonType": "list[str]",
        "javaRead": "getCommands()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerCustomClickEvent",
    "javaName": "org.bukkit.event.player.PlayerCustomClickEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "id",
        "pythonName": "id",
        "javaType": "org.bukkit.NamespacedKey",
        "typeScriptType": "NamespacedKey",
        "pythonType": "NamespacedKey",
        "javaRead": "getId()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "data",
        "pythonName": "data",
        "javaType": "com.google.gson.JsonElement",
        "typeScriptType": "JsonElement",
        "pythonType": "JsonElement",
        "javaRead": "getData()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerDeathEvent",
    "javaName": "org.bukkit.event.entity.PlayerDeathEvent",
    "category": "entity",
    "cancellable": false,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "damageSource",
        "pythonName": "damage_source",
        "javaType": "org.bukkit.damage.DamageSource",
        "typeScriptType": "DamageSource",
        "pythonType": "DamageSource",
        "javaRead": "getDamageSource()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "droppedExp",
        "pythonName": "dropped_exp",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getDroppedExp()",
        "javaWrite": "setDroppedExp(value)",
        "writable": true
      },
      {
        "name": "drops",
        "pythonName": "drops",
        "javaType": "java.util.List<org.bukkit.inventory.ItemStack>",
        "typeScriptType": "ItemStack[]",
        "pythonType": "list[ItemStack]",
        "javaRead": "getDrops()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "deathMessage",
        "pythonName": "death_message",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getDeathMessage()",
        "javaWrite": "setDeathMessage(value)",
        "writable": true
      },
      {
        "name": "newExp",
        "pythonName": "new_exp",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getNewExp()",
        "javaWrite": "setNewExp(value)",
        "writable": true
      },
      {
        "name": "newLevel",
        "pythonName": "new_level",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getNewLevel()",
        "javaWrite": "setNewLevel(value)",
        "writable": true
      },
      {
        "name": "newTotalExp",
        "pythonName": "new_total_exp",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getNewTotalExp()",
        "javaWrite": "setNewTotalExp(value)",
        "writable": true
      },
      {
        "name": "keepLevel",
        "pythonName": "keep_level",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "getKeepLevel()",
        "javaWrite": "setKeepLevel(value)",
        "writable": true
      },
      {
        "name": "keepInventory",
        "pythonName": "keep_inventory",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "getKeepInventory()",
        "javaWrite": "setKeepInventory(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerDropItemEvent",
    "javaName": "org.bukkit.event.player.PlayerDropItemEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "itemDrop",
        "pythonName": "item_drop",
        "javaType": "org.bukkit.entity.Item",
        "typeScriptType": "Item",
        "pythonType": "Item",
        "javaRead": "getItemDrop()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerEditBookEvent",
    "javaName": "org.bukkit.event.player.PlayerEditBookEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "previousBookMeta",
        "pythonName": "previous_book_meta",
        "javaType": "org.bukkit.inventory.meta.BookMeta",
        "typeScriptType": "BookMeta",
        "pythonType": "BookMeta",
        "javaRead": "getPreviousBookMeta()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "newBookMeta",
        "pythonName": "new_book_meta",
        "javaType": "org.bukkit.inventory.meta.BookMeta",
        "typeScriptType": "BookMeta",
        "pythonType": "BookMeta",
        "javaRead": "getNewBookMeta()",
        "javaWrite": "setNewBookMeta(value)",
        "writable": true
      },
      {
        "name": "slot",
        "pythonName": "slot",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getSlot()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "signing",
        "pythonName": "signing",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isSigning()",
        "javaWrite": "setSigning(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerEggThrowEvent",
    "javaName": "org.bukkit.event.player.PlayerEggThrowEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "egg",
        "pythonName": "egg",
        "javaType": "org.bukkit.entity.Egg",
        "typeScriptType": "Egg",
        "pythonType": "Egg",
        "javaRead": "getEgg()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hatching",
        "pythonName": "hatching",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isHatching()",
        "javaWrite": "setHatching(value)",
        "writable": true
      },
      {
        "name": "hatchingType",
        "pythonName": "hatching_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getHatchingType()",
        "javaWrite": "setHatchingType(value)",
        "writable": true
      },
      {
        "name": "numHatches",
        "pythonName": "num_hatches",
        "javaType": "byte",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getNumHatches()",
        "javaWrite": "setNumHatches(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerExpChangeEvent",
    "javaName": "org.bukkit.event.player.PlayerExpChangeEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "amount",
        "pythonName": "amount",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getAmount()",
        "javaWrite": "setAmount(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerExpCooldownChangeEvent",
    "javaName": "org.bukkit.event.player.PlayerExpCooldownChangeEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "reason",
        "pythonName": "reason",
        "javaType": "org.bukkit.event.player.PlayerExpCooldownChangeEvent$ChangeReason",
        "typeScriptType": "PlayerExpCooldownChangeChangeReason",
        "pythonType": "PlayerExpCooldownChangeChangeReason",
        "javaRead": "getReason()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "newCooldown",
        "pythonName": "new_cooldown",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getNewCooldown()",
        "javaWrite": "setNewCooldown(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerFishEvent",
    "javaName": "org.bukkit.event.player.PlayerFishEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "caught",
        "pythonName": "caught",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getCaught()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hook",
        "pythonName": "hook",
        "javaType": "org.bukkit.entity.FishHook",
        "typeScriptType": "FishHook",
        "pythonType": "FishHook",
        "javaRead": "getHook()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "expToDrop",
        "pythonName": "exp_to_drop",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getExpToDrop()",
        "javaWrite": "setExpToDrop(value)",
        "writable": true
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "state",
        "pythonName": "state",
        "javaType": "org.bukkit.event.player.PlayerFishEvent$State",
        "typeScriptType": "PlayerFishState",
        "pythonType": "PlayerFishState",
        "javaRead": "getState()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerGameModeChangeEvent",
    "javaName": "org.bukkit.event.player.PlayerGameModeChangeEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "newGameMode",
        "pythonName": "new_game_mode",
        "javaType": "org.bukkit.GameMode",
        "typeScriptType": "GameMode",
        "pythonType": "GameMode",
        "javaRead": "getNewGameMode()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerHarvestBlockEvent",
    "javaName": "org.bukkit.event.player.PlayerHarvestBlockEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "harvestedBlock",
        "pythonName": "harvested_block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getHarvestedBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "itemsHarvested",
        "pythonName": "items_harvested",
        "javaType": "java.util.List<org.bukkit.inventory.ItemStack>",
        "typeScriptType": "ItemStack[]",
        "pythonType": "list[ItemStack]",
        "javaRead": "getItemsHarvested()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerHideEntityEvent",
    "javaName": "org.bukkit.event.player.PlayerHideEntityEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerInputEvent",
    "javaName": "org.bukkit.event.player.PlayerInputEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "input",
        "pythonName": "input",
        "javaType": "org.bukkit.Input",
        "typeScriptType": "Input",
        "pythonType": "Input",
        "javaRead": "getInput()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerInteractAtEntityEvent",
    "javaName": "org.bukkit.event.player.PlayerInteractAtEntityEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "rightClicked",
        "pythonName": "right_clicked",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getRightClicked()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "clickedPosition",
        "pythonName": "clicked_position",
        "javaType": "org.bukkit.util.Vector",
        "typeScriptType": "Vector",
        "pythonType": "Vector",
        "javaRead": "getClickedPosition()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerInteractEntityEvent",
    "javaName": "org.bukkit.event.player.PlayerInteractEntityEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "rightClicked",
        "pythonName": "right_clicked",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getRightClicked()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerInteractEvent",
    "javaName": "org.bukkit.event.player.PlayerInteractEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "action",
        "pythonName": "action",
        "javaType": "org.bukkit.event.block.Action",
        "typeScriptType": "Action",
        "pythonType": "Action",
        "javaRead": "getAction()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "item",
        "pythonName": "item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItem()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "material",
        "pythonName": "material",
        "javaType": "org.bukkit.Material",
        "typeScriptType": "Material",
        "pythonType": "Material",
        "javaRead": "getMaterial()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockInHand",
        "pythonName": "block_in_hand",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isBlockInHand()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "clickedBlock",
        "pythonName": "clicked_block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getClickedBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blockFace",
        "pythonName": "block_face",
        "javaType": "org.bukkit.block.BlockFace",
        "typeScriptType": "BlockFace",
        "pythonType": "BlockFace",
        "javaRead": "getBlockFace()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "clickedPosition",
        "pythonName": "clicked_position",
        "javaType": "org.bukkit.util.Vector",
        "typeScriptType": "Vector",
        "pythonType": "Vector",
        "javaRead": "getClickedPosition()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "useInteractedBlock",
        "pythonName": "use_interacted_block",
        "javaType": "org.bukkit.event.Event$Result",
        "typeScriptType": "EventResult",
        "pythonType": "EventResult",
        "javaRead": "useInteractedBlock",
        "javaWrite": "setUseInteractedBlock(value)",
        "writable": true
      },
      {
        "name": "useItemInHand",
        "pythonName": "use_item_in_hand",
        "javaType": "org.bukkit.event.Event$Result",
        "typeScriptType": "EventResult",
        "pythonType": "EventResult",
        "javaRead": "useItemInHand",
        "javaWrite": "setUseItemInHand(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerItemBreakEvent",
    "javaName": "org.bukkit.event.player.PlayerItemBreakEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "brokenItem",
        "pythonName": "broken_item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getBrokenItem()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerItemConsumeEvent",
    "javaName": "org.bukkit.event.player.PlayerItemConsumeEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "item",
        "pythonName": "item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItem()",
        "javaWrite": "setItem(value)",
        "writable": true
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerItemDamageEvent",
    "javaName": "org.bukkit.event.player.PlayerItemDamageEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "item",
        "pythonName": "item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItem()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "damage",
        "pythonName": "damage",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getDamage()",
        "javaWrite": "setDamage(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerItemHeldEvent",
    "javaName": "org.bukkit.event.player.PlayerItemHeldEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "previousSlot",
        "pythonName": "previous_slot",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getPreviousSlot()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "newSlot",
        "pythonName": "new_slot",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getNewSlot()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerItemMendEvent",
    "javaName": "org.bukkit.event.player.PlayerItemMendEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "item",
        "pythonName": "item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItem()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "slot",
        "pythonName": "slot",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getSlot()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "experienceOrb",
        "pythonName": "experience_orb",
        "javaType": "org.bukkit.entity.ExperienceOrb",
        "typeScriptType": "ExperienceOrb",
        "pythonType": "ExperienceOrb",
        "javaRead": "getExperienceOrb()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "repairAmount",
        "pythonName": "repair_amount",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getRepairAmount()",
        "javaWrite": "setRepairAmount(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerJoinEvent",
    "javaName": "org.bukkit.event.player.PlayerJoinEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "joinMessage",
        "pythonName": "join_message",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getJoinMessage()",
        "javaWrite": "setJoinMessage(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerKickEvent",
    "javaName": "org.bukkit.event.player.PlayerKickEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "reason",
        "pythonName": "reason",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getReason()",
        "javaWrite": "setReason(value)",
        "writable": true
      },
      {
        "name": "leaveMessage",
        "pythonName": "leave_message",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getLeaveMessage()",
        "javaWrite": "setLeaveMessage(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerLeashEntityEvent",
    "javaName": "org.bukkit.event.entity.PlayerLeashEntityEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "leashHolder",
        "pythonName": "leash_holder",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getLeashHolder()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerLevelChangeEvent",
    "javaName": "org.bukkit.event.player.PlayerLevelChangeEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "oldLevel",
        "pythonName": "old_level",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getOldLevel()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "newLevel",
        "pythonName": "new_level",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getNewLevel()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerLinksSendEvent",
    "javaName": "org.bukkit.event.player.PlayerLinksSendEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "links",
        "pythonName": "links",
        "javaType": "org.bukkit.ServerLinks",
        "typeScriptType": "ServerLinks",
        "pythonType": "ServerLinks",
        "javaRead": "getLinks()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerLocaleChangeEvent",
    "javaName": "org.bukkit.event.player.PlayerLocaleChangeEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "locale",
        "pythonName": "locale",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getLocale()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerLoginEvent",
    "javaName": "org.bukkit.event.player.PlayerLoginEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "result",
        "pythonName": "result",
        "javaType": "org.bukkit.event.player.PlayerLoginEvent$Result",
        "typeScriptType": "PlayerLoginResult",
        "pythonType": "PlayerLoginResult",
        "javaRead": "getResult()",
        "javaWrite": "setResult(value)",
        "writable": true
      },
      {
        "name": "kickMessage",
        "pythonName": "kick_message",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getKickMessage()",
        "javaWrite": "setKickMessage(value)",
        "writable": true
      },
      {
        "name": "hostname",
        "pythonName": "hostname",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getHostname()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "address",
        "pythonName": "address",
        "javaType": "java.net.InetAddress",
        "typeScriptType": "ApiObject",
        "pythonType": "ApiObject",
        "javaRead": "getAddress()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "realAddress",
        "pythonName": "real_address",
        "javaType": "java.net.InetAddress",
        "typeScriptType": "ApiObject",
        "pythonType": "ApiObject",
        "javaRead": "getRealAddress()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerMoveEvent",
    "javaName": "org.bukkit.event.player.PlayerMoveEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "from",
        "pythonName": "from_",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getFrom()",
        "javaWrite": "setFrom(value)",
        "writable": true
      },
      {
        "name": "to",
        "pythonName": "to",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getTo()",
        "javaWrite": "setTo(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerPickupArrowEvent",
    "javaName": "org.bukkit.event.player.PlayerPickupArrowEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "item",
        "pythonName": "item",
        "javaType": "org.bukkit.entity.Item",
        "typeScriptType": "Item",
        "pythonType": "Item",
        "javaRead": "getItem()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "remaining",
        "pythonName": "remaining",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getRemaining()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "arrow",
        "pythonName": "arrow",
        "javaType": "org.bukkit.entity.AbstractArrow",
        "typeScriptType": "AbstractArrow",
        "pythonType": "AbstractArrow",
        "javaRead": "getArrow()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerPickupItemEvent",
    "javaName": "org.bukkit.event.player.PlayerPickupItemEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "item",
        "pythonName": "item",
        "javaType": "org.bukkit.entity.Item",
        "typeScriptType": "Item",
        "pythonType": "Item",
        "javaRead": "getItem()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "remaining",
        "pythonName": "remaining",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getRemaining()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerPortalEvent",
    "javaName": "org.bukkit.event.player.PlayerPortalEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "from",
        "pythonName": "from_",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getFrom()",
        "javaWrite": "setFrom(value)",
        "writable": true
      },
      {
        "name": "to",
        "pythonName": "to",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getTo()",
        "javaWrite": "setTo(value)",
        "writable": true
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.player.PlayerTeleportEvent$TeleportCause",
        "typeScriptType": "PlayerTeleportCause",
        "pythonType": "PlayerTeleportCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "searchRadius",
        "pythonName": "search_radius",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getSearchRadius()",
        "javaWrite": "setSearchRadius(value)",
        "writable": true
      },
      {
        "name": "canCreatePortal",
        "pythonName": "can_create_portal",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "getCanCreatePortal()",
        "javaWrite": "setCanCreatePortal(value)",
        "writable": true
      },
      {
        "name": "creationRadius",
        "pythonName": "creation_radius",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getCreationRadius()",
        "javaWrite": "setCreationRadius(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerPreLoginEvent",
    "javaName": "org.bukkit.event.player.PlayerPreLoginEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "result",
        "pythonName": "result",
        "javaType": "org.bukkit.event.player.PlayerPreLoginEvent$Result",
        "typeScriptType": "PlayerPreLoginResult",
        "pythonType": "PlayerPreLoginResult",
        "javaRead": "getResult()",
        "javaWrite": "setResult(value)",
        "writable": true
      },
      {
        "name": "kickMessage",
        "pythonName": "kick_message",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getKickMessage()",
        "javaWrite": "setKickMessage(value)",
        "writable": true
      },
      {
        "name": "name",
        "pythonName": "name",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getName()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "address",
        "pythonName": "address",
        "javaType": "java.net.InetAddress",
        "typeScriptType": "ApiObject",
        "pythonType": "ApiObject",
        "javaRead": "getAddress()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "uniqueId",
        "pythonName": "unique_id",
        "javaType": "java.util.UUID",
        "typeScriptType": "NativeUuid",
        "pythonType": "NativeUuid",
        "javaRead": "getUniqueId()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerQuitEvent",
    "javaName": "org.bukkit.event.player.PlayerQuitEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "quitMessage",
        "pythonName": "quit_message",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getQuitMessage()",
        "javaWrite": "setQuitMessage(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerRecipeBookClickEvent",
    "javaName": "org.bukkit.event.player.PlayerRecipeBookClickEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "originalRecipe",
        "pythonName": "original_recipe",
        "javaType": "org.bukkit.inventory.Recipe",
        "typeScriptType": "Recipe",
        "pythonType": "Recipe",
        "javaRead": "getOriginalRecipe()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "recipe",
        "pythonName": "recipe",
        "javaType": "org.bukkit.inventory.Recipe",
        "typeScriptType": "Recipe",
        "pythonType": "Recipe",
        "javaRead": "getRecipe()",
        "javaWrite": "setRecipe(value)",
        "writable": true
      },
      {
        "name": "shiftClick",
        "pythonName": "shift_click",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isShiftClick()",
        "javaWrite": "setShiftClick(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerRecipeBookSettingsChangeEvent",
    "javaName": "org.bukkit.event.player.PlayerRecipeBookSettingsChangeEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "recipeBookType",
        "pythonName": "recipe_book_type",
        "javaType": "org.bukkit.event.player.PlayerRecipeBookSettingsChangeEvent$RecipeBookType",
        "typeScriptType": "PlayerRecipeBookSettingsChangeRecipeBookType",
        "pythonType": "PlayerRecipeBookSettingsChangeRecipeBookType",
        "javaRead": "getRecipeBookType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "open",
        "pythonName": "open",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isOpen()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "filtering",
        "pythonName": "filtering",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isFiltering()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerRecipeDiscoverEvent",
    "javaName": "org.bukkit.event.player.PlayerRecipeDiscoverEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "recipe",
        "pythonName": "recipe",
        "javaType": "org.bukkit.NamespacedKey",
        "typeScriptType": "NamespacedKey",
        "pythonType": "NamespacedKey",
        "javaRead": "getRecipe()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerRegisterChannelEvent",
    "javaName": "org.bukkit.event.player.PlayerRegisterChannelEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "channel",
        "pythonName": "channel",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getChannel()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerResourcePackStatusEvent",
    "javaName": "org.bukkit.event.player.PlayerResourcePackStatusEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "ID",
        "pythonName": "id",
        "javaType": "java.util.UUID",
        "typeScriptType": "NativeUuid",
        "pythonType": "NativeUuid",
        "javaRead": "getID()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "status",
        "pythonName": "status",
        "javaType": "org.bukkit.event.player.PlayerResourcePackStatusEvent$Status",
        "typeScriptType": "ResourcePackStatus",
        "pythonType": "ResourcePackStatus",
        "javaRead": "getStatus()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerRespawnEvent",
    "javaName": "org.bukkit.event.player.PlayerRespawnEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "respawnLocation",
        "pythonName": "respawn_location",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getRespawnLocation()",
        "javaWrite": "setRespawnLocation(value)",
        "writable": true
      },
      {
        "name": "bedSpawn",
        "pythonName": "bed_spawn",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isBedSpawn()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "anchorSpawn",
        "pythonName": "anchor_spawn",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isAnchorSpawn()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "respawnReason",
        "pythonName": "respawn_reason",
        "javaType": "org.bukkit.event.player.PlayerRespawnEvent$RespawnReason",
        "typeScriptType": "PlayerRespawnRespawnReason",
        "pythonType": "PlayerRespawnRespawnReason",
        "javaRead": "getRespawnReason()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerRiptideEvent",
    "javaName": "org.bukkit.event.player.PlayerRiptideEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "item",
        "pythonName": "item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItem()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "velocity",
        "pythonName": "velocity",
        "javaType": "org.bukkit.util.Vector",
        "typeScriptType": "Vector",
        "pythonType": "Vector",
        "javaRead": "getVelocity()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerShearEntityEvent",
    "javaName": "org.bukkit.event.player.PlayerShearEntityEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "item",
        "pythonName": "item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItem()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerShowEntityEvent",
    "javaName": "org.bukkit.event.player.PlayerShowEntityEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerSignOpenEvent",
    "javaName": "org.bukkit.event.player.PlayerSignOpenEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "sign",
        "pythonName": "sign",
        "javaType": "org.bukkit.block.Sign",
        "typeScriptType": "BlockSign",
        "pythonType": "BlockSign",
        "javaRead": "getSign()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "side",
        "pythonName": "side",
        "javaType": "org.bukkit.block.sign.Side",
        "typeScriptType": "Side",
        "pythonType": "Side",
        "javaRead": "getSide()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.player.PlayerSignOpenEvent$Cause",
        "typeScriptType": "PlayerSignOpenCause",
        "pythonType": "PlayerSignOpenCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerSpawnChangeEvent",
    "javaName": "org.bukkit.event.player.PlayerSpawnChangeEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.player.PlayerSpawnChangeEvent$Cause",
        "typeScriptType": "PlayerSpawnChangeCause",
        "pythonType": "PlayerSpawnChangeCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "forced",
        "pythonName": "forced",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isForced()",
        "javaWrite": "setForced(value)",
        "writable": true
      },
      {
        "name": "newSpawn",
        "pythonName": "new_spawn",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getNewSpawn()",
        "javaWrite": "setNewSpawn(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerStatisticIncrementEvent",
    "javaName": "org.bukkit.event.player.PlayerStatisticIncrementEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "statistic",
        "pythonName": "statistic",
        "javaType": "org.bukkit.Statistic",
        "typeScriptType": "Statistic",
        "pythonType": "Statistic",
        "javaRead": "getStatistic()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "previousValue",
        "pythonName": "previous_value",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getPreviousValue()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "newValue",
        "pythonName": "new_value",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getNewValue()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "material",
        "pythonName": "material",
        "javaType": "org.bukkit.Material",
        "typeScriptType": "Material",
        "pythonType": "Material",
        "javaRead": "getMaterial()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerSwapHandItemsEvent",
    "javaName": "org.bukkit.event.player.PlayerSwapHandItemsEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "mainHandItem",
        "pythonName": "main_hand_item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getMainHandItem()",
        "javaWrite": "setMainHandItem(value)",
        "writable": true
      },
      {
        "name": "offHandItem",
        "pythonName": "off_hand_item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getOffHandItem()",
        "javaWrite": "setOffHandItem(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PlayerTakeLecternBookEvent",
    "javaName": "org.bukkit.event.player.PlayerTakeLecternBookEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "lectern",
        "pythonName": "lectern",
        "javaType": "org.bukkit.block.Lectern",
        "typeScriptType": "Lectern",
        "pythonType": "Lectern",
        "javaRead": "getLectern()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "book",
        "pythonName": "book",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getBook()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerTeleportEvent",
    "javaName": "org.bukkit.event.player.PlayerTeleportEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "from",
        "pythonName": "from_",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getFrom()",
        "javaWrite": "setFrom(value)",
        "writable": true
      },
      {
        "name": "to",
        "pythonName": "to",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getTo()",
        "javaWrite": "setTo(value)",
        "writable": true
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.player.PlayerTeleportEvent$TeleportCause",
        "typeScriptType": "PlayerTeleportCause",
        "pythonType": "PlayerTeleportCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerToggleFlightEvent",
    "javaName": "org.bukkit.event.player.PlayerToggleFlightEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "flying",
        "pythonName": "flying",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isFlying()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerToggleSneakEvent",
    "javaName": "org.bukkit.event.player.PlayerToggleSneakEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "sneaking",
        "pythonName": "sneaking",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isSneaking()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerToggleSprintEvent",
    "javaName": "org.bukkit.event.player.PlayerToggleSprintEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "sprinting",
        "pythonName": "sprinting",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isSprinting()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerUnleashEntityEvent",
    "javaName": "org.bukkit.event.player.PlayerUnleashEntityEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "reason",
        "pythonName": "reason",
        "javaType": "org.bukkit.event.entity.EntityUnleashEvent$UnleashReason",
        "typeScriptType": "EntityUnleashReason",
        "pythonType": "EntityUnleashReason",
        "javaRead": "getReason()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hand",
        "pythonName": "hand",
        "javaType": "org.bukkit.inventory.EquipmentSlot",
        "typeScriptType": "EquipmentSlot",
        "pythonType": "EquipmentSlot",
        "javaRead": "getHand()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerUnregisterChannelEvent",
    "javaName": "org.bukkit.event.player.PlayerUnregisterChannelEvent",
    "category": "player",
    "cancellable": false,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "channel",
        "pythonName": "channel",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getChannel()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PlayerVelocityEvent",
    "javaName": "org.bukkit.event.player.PlayerVelocityEvent",
    "category": "player",
    "cancellable": true,
    "properties": [
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "velocity",
        "pythonName": "velocity",
        "javaType": "org.bukkit.util.Vector",
        "typeScriptType": "Vector",
        "pythonType": "Vector",
        "javaRead": "getVelocity()",
        "javaWrite": "setVelocity(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PluginDisableEvent",
    "javaName": "org.bukkit.event.server.PluginDisableEvent",
    "category": "server",
    "cancellable": false,
    "properties": [
      {
        "name": "plugin",
        "pythonName": "plugin",
        "javaType": "org.bukkit.plugin.Plugin",
        "typeScriptType": "Plugin",
        "pythonType": "Plugin",
        "javaRead": "getPlugin()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PluginEnableEvent",
    "javaName": "org.bukkit.event.server.PluginEnableEvent",
    "category": "server",
    "cancellable": false,
    "properties": [
      {
        "name": "plugin",
        "pythonName": "plugin",
        "javaType": "org.bukkit.plugin.Plugin",
        "typeScriptType": "Plugin",
        "pythonType": "Plugin",
        "javaRead": "getPlugin()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PortalCreateEvent",
    "javaName": "org.bukkit.event.world.PortalCreateEvent",
    "category": "world",
    "cancellable": true,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "blocks",
        "pythonName": "blocks",
        "javaType": "java.util.List<org.bukkit.block.BlockState>",
        "typeScriptType": "BlockState[]",
        "pythonType": "list[BlockState]",
        "javaRead": "getBlocks()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "reason",
        "pythonName": "reason",
        "javaType": "org.bukkit.event.world.PortalCreateEvent$CreateReason",
        "typeScriptType": "PortalCreateReason",
        "pythonType": "PortalCreateReason",
        "javaRead": "getReason()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PotionSplashEvent",
    "javaName": "org.bukkit.event.entity.PotionSplashEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "hitBlock",
        "pythonName": "hit_block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getHitBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hitBlockFace",
        "pythonName": "hit_block_face",
        "javaType": "org.bukkit.block.BlockFace",
        "typeScriptType": "BlockFace",
        "pythonType": "BlockFace",
        "javaRead": "getHitBlockFace()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hitEntity",
        "pythonName": "hit_entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getHitEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "potion",
        "pythonName": "potion",
        "javaType": "org.bukkit.entity.ThrownPotion",
        "typeScriptType": "ThrownPotion",
        "pythonType": "ThrownPotion",
        "javaRead": "getPotion()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "affectedEntities",
        "pythonName": "affected_entities",
        "javaType": "java.util.Collection<org.bukkit.entity.LivingEntity>",
        "typeScriptType": "LivingEntity[]",
        "pythonType": "list[LivingEntity]",
        "javaRead": "getAffectedEntities()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PrepareAnvilEvent",
    "javaName": "org.bukkit.event.inventory.PrepareAnvilEvent",
    "category": "inventory",
    "cancellable": false,
    "properties": [
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "viewers",
        "pythonName": "viewers",
        "javaType": "java.util.List<org.bukkit.entity.HumanEntity>",
        "typeScriptType": "HumanEntity[]",
        "pythonType": "list[HumanEntity]",
        "javaRead": "getViewers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "view",
        "pythonName": "view",
        "javaType": "org.bukkit.inventory.InventoryView",
        "typeScriptType": "InventoryView",
        "pythonType": "InventoryView",
        "javaRead": "getView()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "result",
        "pythonName": "result",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getResult()",
        "javaWrite": "setResult(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PrepareGrindstoneEvent",
    "javaName": "org.bukkit.event.inventory.PrepareGrindstoneEvent",
    "category": "inventory",
    "cancellable": false,
    "properties": [
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "viewers",
        "pythonName": "viewers",
        "javaType": "java.util.List<org.bukkit.entity.HumanEntity>",
        "typeScriptType": "HumanEntity[]",
        "pythonType": "list[HumanEntity]",
        "javaRead": "getViewers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "view",
        "pythonName": "view",
        "javaType": "org.bukkit.inventory.InventoryView",
        "typeScriptType": "InventoryView",
        "pythonType": "InventoryView",
        "javaRead": "getView()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "result",
        "pythonName": "result",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getResult()",
        "javaWrite": "setResult(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PrepareInventoryResultEvent",
    "javaName": "org.bukkit.event.inventory.PrepareInventoryResultEvent",
    "category": "inventory",
    "cancellable": false,
    "properties": [
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "viewers",
        "pythonName": "viewers",
        "javaType": "java.util.List<org.bukkit.entity.HumanEntity>",
        "typeScriptType": "HumanEntity[]",
        "pythonType": "list[HumanEntity]",
        "javaRead": "getViewers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "view",
        "pythonName": "view",
        "javaType": "org.bukkit.inventory.InventoryView",
        "typeScriptType": "InventoryView",
        "pythonType": "InventoryView",
        "javaRead": "getView()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "result",
        "pythonName": "result",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getResult()",
        "javaWrite": "setResult(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "PrepareItemCraftEvent",
    "javaName": "org.bukkit.event.inventory.PrepareItemCraftEvent",
    "category": "inventory",
    "cancellable": false,
    "properties": [
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "viewers",
        "pythonName": "viewers",
        "javaType": "java.util.List<org.bukkit.entity.HumanEntity>",
        "typeScriptType": "HumanEntity[]",
        "pythonType": "list[HumanEntity]",
        "javaRead": "getViewers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "view",
        "pythonName": "view",
        "javaType": "org.bukkit.inventory.InventoryView",
        "typeScriptType": "InventoryView",
        "pythonType": "InventoryView",
        "javaRead": "getView()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "recipe",
        "pythonName": "recipe",
        "javaType": "org.bukkit.inventory.Recipe",
        "typeScriptType": "Recipe",
        "pythonType": "Recipe",
        "javaRead": "getRecipe()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "repair",
        "pythonName": "repair",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isRepair()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PrepareItemEnchantEvent",
    "javaName": "org.bukkit.event.enchantment.PrepareItemEnchantEvent",
    "category": "enchantment",
    "cancellable": true,
    "properties": [
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "viewers",
        "pythonName": "viewers",
        "javaType": "java.util.List<org.bukkit.entity.HumanEntity>",
        "typeScriptType": "HumanEntity[]",
        "pythonType": "list[HumanEntity]",
        "javaRead": "getViewers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "view",
        "pythonName": "view",
        "javaType": "org.bukkit.inventory.InventoryView",
        "typeScriptType": "InventoryView",
        "pythonType": "InventoryView",
        "javaRead": "getView()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "enchanter",
        "pythonName": "enchanter",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getEnchanter()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "enchantBlock",
        "pythonName": "enchant_block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getEnchantBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "item",
        "pythonName": "item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getItem()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "expLevelCostsOffered",
        "pythonName": "exp_level_costs_offered",
        "javaType": "int[]",
        "typeScriptType": "number[]",
        "pythonType": "list[int]",
        "javaRead": "getExpLevelCostsOffered()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "offers",
        "pythonName": "offers",
        "javaType": "org.bukkit.enchantments.EnchantmentOffer[]",
        "typeScriptType": "EnchantmentOffer[]",
        "pythonType": "list[EnchantmentOffer]",
        "javaRead": "getOffers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "enchantmentBonus",
        "pythonName": "enchantment_bonus",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getEnchantmentBonus()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "PrepareSmithingEvent",
    "javaName": "org.bukkit.event.inventory.PrepareSmithingEvent",
    "category": "inventory",
    "cancellable": false,
    "properties": [
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "viewers",
        "pythonName": "viewers",
        "javaType": "java.util.List<org.bukkit.entity.HumanEntity>",
        "typeScriptType": "HumanEntity[]",
        "pythonType": "list[HumanEntity]",
        "javaRead": "getViewers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "view",
        "pythonName": "view",
        "javaType": "org.bukkit.inventory.InventoryView",
        "typeScriptType": "InventoryView",
        "pythonType": "InventoryView",
        "javaRead": "getView()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "result",
        "pythonName": "result",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getResult()",
        "javaWrite": "setResult(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "ProjectileHitEvent",
    "javaName": "org.bukkit.event.entity.ProjectileHitEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "hitBlock",
        "pythonName": "hit_block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getHitBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hitBlockFace",
        "pythonName": "hit_block_face",
        "javaType": "org.bukkit.block.BlockFace",
        "typeScriptType": "BlockFace",
        "pythonType": "BlockFace",
        "javaRead": "getHitBlockFace()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hitEntity",
        "pythonName": "hit_entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getHitEntity()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "ProjectileLaunchEvent",
    "javaName": "org.bukkit.event.entity.ProjectileLaunchEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "location",
        "pythonName": "location",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getLocation()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "RaidFinishEvent",
    "javaName": "org.bukkit.event.raid.RaidFinishEvent",
    "category": "raid",
    "cancellable": false,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "raid",
        "pythonName": "raid",
        "javaType": "org.bukkit.Raid",
        "typeScriptType": "Raid",
        "pythonType": "Raid",
        "javaRead": "getRaid()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "winners",
        "pythonName": "winners",
        "javaType": "java.util.List<org.bukkit.entity.Player>",
        "typeScriptType": "Player[]",
        "pythonType": "list[Player]",
        "javaRead": "getWinners()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "RaidSpawnWaveEvent",
    "javaName": "org.bukkit.event.raid.RaidSpawnWaveEvent",
    "category": "raid",
    "cancellable": false,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "raid",
        "pythonName": "raid",
        "javaType": "org.bukkit.Raid",
        "typeScriptType": "Raid",
        "pythonType": "Raid",
        "javaRead": "getRaid()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "patrolLeader",
        "pythonName": "patrol_leader",
        "javaType": "org.bukkit.entity.Raider",
        "typeScriptType": "Raider",
        "pythonType": "Raider",
        "javaRead": "getPatrolLeader()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "raiders",
        "pythonName": "raiders",
        "javaType": "java.util.List<org.bukkit.entity.Raider>",
        "typeScriptType": "Raider[]",
        "pythonType": "list[Raider]",
        "javaRead": "getRaiders()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "RaidStopEvent",
    "javaName": "org.bukkit.event.raid.RaidStopEvent",
    "category": "raid",
    "cancellable": false,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "raid",
        "pythonName": "raid",
        "javaType": "org.bukkit.Raid",
        "typeScriptType": "Raid",
        "pythonType": "Raid",
        "javaRead": "getRaid()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "reason",
        "pythonName": "reason",
        "javaType": "org.bukkit.event.raid.RaidStopEvent$Reason",
        "typeScriptType": "RaidStopReason",
        "pythonType": "RaidStopReason",
        "javaRead": "getReason()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "RaidTriggerEvent",
    "javaName": "org.bukkit.event.raid.RaidTriggerEvent",
    "category": "raid",
    "cancellable": true,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "raid",
        "pythonName": "raid",
        "javaType": "org.bukkit.Raid",
        "typeScriptType": "Raid",
        "pythonType": "Raid",
        "javaRead": "getRaid()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "RemoteServerCommandEvent",
    "javaName": "org.bukkit.event.server.RemoteServerCommandEvent",
    "category": "server",
    "cancellable": true,
    "properties": [
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "command",
        "pythonName": "command",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getCommand()",
        "javaWrite": "setCommand(value)",
        "writable": true
      },
      {
        "name": "sender",
        "pythonName": "sender",
        "javaType": "org.bukkit.command.CommandSender",
        "typeScriptType": "CommandSender",
        "pythonType": "CommandSender",
        "javaRead": "getSender()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "SculkBloomEvent",
    "javaName": "org.bukkit.event.block.SculkBloomEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "charge",
        "pythonName": "charge",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getCharge()",
        "javaWrite": "setCharge(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "ServerCommandEvent",
    "javaName": "org.bukkit.event.server.ServerCommandEvent",
    "category": "server",
    "cancellable": true,
    "properties": [
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "command",
        "pythonName": "command",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getCommand()",
        "javaWrite": "setCommand(value)",
        "writable": true
      },
      {
        "name": "sender",
        "pythonName": "sender",
        "javaType": "org.bukkit.command.CommandSender",
        "typeScriptType": "CommandSender",
        "pythonType": "CommandSender",
        "javaRead": "getSender()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "ServerListPingEvent",
    "javaName": "org.bukkit.event.server.ServerListPingEvent",
    "category": "server",
    "cancellable": false,
    "properties": [
      {
        "name": "hostname",
        "pythonName": "hostname",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getHostname()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "address",
        "pythonName": "address",
        "javaType": "java.net.InetAddress",
        "typeScriptType": "ApiObject",
        "pythonType": "ApiObject",
        "javaRead": "getAddress()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "motd",
        "pythonName": "motd",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getMotd()",
        "javaWrite": "setMotd(value)",
        "writable": true
      },
      {
        "name": "numPlayers",
        "pythonName": "num_players",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getNumPlayers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "maxPlayers",
        "pythonName": "max_players",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getMaxPlayers()",
        "javaWrite": "setMaxPlayers(value)",
        "writable": true
      },
      {
        "name": "serverIcon",
        "pythonName": "server_icon",
        "javaType": "org.bukkit.util.CachedServerIcon",
        "typeScriptType": "CachedServerIcon",
        "pythonType": "CachedServerIcon",
        "javaRead": "serverIcon",
        "javaWrite": "setServerIcon(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "ServerLoadEvent",
    "javaName": "org.bukkit.event.server.ServerLoadEvent",
    "category": "server",
    "cancellable": false,
    "properties": [
      {
        "name": "type",
        "pythonName": "type",
        "javaType": "org.bukkit.event.server.ServerLoadEvent$LoadType",
        "typeScriptType": "ServerLoadLoadType",
        "pythonType": "ServerLoadLoadType",
        "javaRead": "getType()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "ServiceRegisterEvent",
    "javaName": "org.bukkit.event.server.ServiceRegisterEvent",
    "category": "server",
    "cancellable": false,
    "properties": [
      {
        "name": "provider",
        "pythonName": "provider",
        "javaType": "org.bukkit.plugin.RegisteredServiceProvider<?>",
        "typeScriptType": "RegisteredServiceProvider<unknown>",
        "pythonType": "RegisteredServiceProvider[Any]",
        "javaRead": "getProvider()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "ServiceUnregisterEvent",
    "javaName": "org.bukkit.event.server.ServiceUnregisterEvent",
    "category": "server",
    "cancellable": false,
    "properties": [
      {
        "name": "provider",
        "pythonName": "provider",
        "javaType": "org.bukkit.plugin.RegisteredServiceProvider<?>",
        "typeScriptType": "RegisteredServiceProvider<unknown>",
        "pythonType": "RegisteredServiceProvider[Any]",
        "javaRead": "getProvider()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "SheepDyeWoolEvent",
    "javaName": "org.bukkit.event.entity.SheepDyeWoolEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "color",
        "pythonName": "color",
        "javaType": "org.bukkit.DyeColor",
        "typeScriptType": "DyeColor",
        "pythonType": "DyeColor",
        "javaRead": "getColor()",
        "javaWrite": "setColor(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "SheepRegrowWoolEvent",
    "javaName": "org.bukkit.event.entity.SheepRegrowWoolEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "SignChangeEvent",
    "javaName": "org.bukkit.event.block.SignChangeEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "lines",
        "pythonName": "lines",
        "javaType": "java.lang.String[]",
        "typeScriptType": "string[]",
        "pythonType": "list[str]",
        "javaRead": "getLines()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "side",
        "pythonName": "side",
        "javaType": "org.bukkit.block.sign.Side",
        "typeScriptType": "Side",
        "pythonType": "Side",
        "javaRead": "getSide()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "SlimeSplitEvent",
    "javaName": "org.bukkit.event.entity.SlimeSplitEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "count",
        "pythonName": "count",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getCount()",
        "javaWrite": "setCount(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "SmithItemEvent",
    "javaName": "org.bukkit.event.inventory.SmithItemEvent",
    "category": "inventory",
    "cancellable": true,
    "properties": [
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "viewers",
        "pythonName": "viewers",
        "javaType": "java.util.List<org.bukkit.entity.HumanEntity>",
        "typeScriptType": "HumanEntity[]",
        "pythonType": "list[HumanEntity]",
        "javaRead": "getViewers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "view",
        "pythonName": "view",
        "javaType": "org.bukkit.inventory.InventoryView",
        "typeScriptType": "InventoryView",
        "pythonType": "InventoryView",
        "javaRead": "getView()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "whoClicked",
        "pythonName": "who_clicked",
        "javaType": "org.bukkit.entity.HumanEntity",
        "typeScriptType": "HumanEntity",
        "pythonType": "HumanEntity",
        "javaRead": "getWhoClicked()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "result",
        "pythonName": "result",
        "javaType": "org.bukkit.event.Event$Result",
        "typeScriptType": "EventResult",
        "pythonType": "EventResult",
        "javaRead": "getResult()",
        "javaWrite": "setResult(value)",
        "writable": true
      },
      {
        "name": "slotType",
        "pythonName": "slot_type",
        "javaType": "org.bukkit.event.inventory.InventoryType$SlotType",
        "typeScriptType": "InventorySlotType",
        "pythonType": "InventorySlotType",
        "javaRead": "getSlotType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cursor",
        "pythonName": "cursor",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getCursor()",
        "javaWrite": "setCursor(value)",
        "writable": true
      },
      {
        "name": "currentItem",
        "pythonName": "current_item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getCurrentItem()",
        "javaWrite": "setCurrentItem(value)",
        "writable": true
      },
      {
        "name": "rightClick",
        "pythonName": "right_click",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isRightClick()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "leftClick",
        "pythonName": "left_click",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isLeftClick()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "shiftClick",
        "pythonName": "shift_click",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isShiftClick()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "clickedInventory",
        "pythonName": "clicked_inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getClickedInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "slot",
        "pythonName": "slot",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getSlot()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "rawSlot",
        "pythonName": "raw_slot",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getRawSlot()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "hotbarButton",
        "pythonName": "hotbar_button",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getHotbarButton()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "action",
        "pythonName": "action",
        "javaType": "org.bukkit.event.inventory.InventoryAction",
        "typeScriptType": "InventoryAction",
        "pythonType": "InventoryAction",
        "javaRead": "getAction()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "click",
        "pythonName": "click",
        "javaType": "org.bukkit.event.inventory.ClickType",
        "typeScriptType": "ClickType",
        "pythonType": "ClickType",
        "javaRead": "getClick()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "SpawnChangeEvent",
    "javaName": "org.bukkit.event.world.SpawnChangeEvent",
    "category": "world",
    "cancellable": false,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "previousLocation",
        "pythonName": "previous_location",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getPreviousLocation()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "SpawnerSpawnEvent",
    "javaName": "org.bukkit.event.entity.SpawnerSpawnEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "location",
        "pythonName": "location",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getLocation()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "spawner",
        "pythonName": "spawner",
        "javaType": "org.bukkit.block.CreatureSpawner",
        "typeScriptType": "CreatureSpawner",
        "pythonType": "CreatureSpawner",
        "javaRead": "getSpawner()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "SpongeAbsorbEvent",
    "javaName": "org.bukkit.event.block.SpongeAbsorbEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "blocks",
        "pythonName": "blocks",
        "javaType": "java.util.List<org.bukkit.block.BlockState>",
        "typeScriptType": "BlockState[]",
        "pythonType": "list[BlockState]",
        "javaRead": "getBlocks()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "StriderTemperatureChangeEvent",
    "javaName": "org.bukkit.event.entity.StriderTemperatureChangeEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "shivering",
        "pythonName": "shivering",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isShivering()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "StructureGrowEvent",
    "javaName": "org.bukkit.event.world.StructureGrowEvent",
    "category": "world",
    "cancellable": true,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "location",
        "pythonName": "location",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getLocation()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "species",
        "pythonName": "species",
        "javaType": "org.bukkit.TreeType",
        "typeScriptType": "TreeType",
        "pythonType": "TreeType",
        "javaRead": "getSpecies()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "fromBonemeal",
        "pythonName": "from_bonemeal",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isFromBonemeal()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "player",
        "pythonName": "player",
        "javaType": "org.bukkit.entity.Player",
        "typeScriptType": "Player",
        "pythonType": "Player",
        "javaRead": "getPlayer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "blocks",
        "pythonName": "blocks",
        "javaType": "java.util.List<org.bukkit.block.BlockState>",
        "typeScriptType": "BlockState[]",
        "pythonType": "list[BlockState]",
        "javaRead": "getBlocks()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "TabCompleteEvent",
    "javaName": "org.bukkit.event.server.TabCompleteEvent",
    "category": "server",
    "cancellable": true,
    "properties": [
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "sender",
        "pythonName": "sender",
        "javaType": "org.bukkit.command.CommandSender",
        "typeScriptType": "CommandSender",
        "pythonType": "CommandSender",
        "javaRead": "getSender()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "buffer",
        "pythonName": "buffer",
        "javaType": "java.lang.String",
        "typeScriptType": "string",
        "pythonType": "str",
        "javaRead": "getBuffer()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "completions",
        "pythonName": "completions",
        "javaType": "java.util.List<java.lang.String>",
        "typeScriptType": "string[]",
        "pythonType": "list[str]",
        "javaRead": "getCompletions()",
        "javaWrite": "setCompletions(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "ThunderChangeEvent",
    "javaName": "org.bukkit.event.weather.ThunderChangeEvent",
    "category": "weather",
    "cancellable": true,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "TimeSkipEvent",
    "javaName": "org.bukkit.event.world.TimeSkipEvent",
    "category": "world",
    "cancellable": true,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "skipReason",
        "pythonName": "skip_reason",
        "javaType": "org.bukkit.event.world.TimeSkipEvent$SkipReason",
        "typeScriptType": "TimeSkipSkipReason",
        "pythonType": "TimeSkipSkipReason",
        "javaRead": "getSkipReason()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "skipAmount",
        "pythonName": "skip_amount",
        "javaType": "long",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getSkipAmount()",
        "javaWrite": "setSkipAmount(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "TNTPrimeEvent",
    "javaName": "org.bukkit.event.block.TNTPrimeEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "cause",
        "pythonName": "cause",
        "javaType": "org.bukkit.event.block.TNTPrimeEvent$PrimeCause",
        "typeScriptType": "TNTPrimePrimeCause",
        "pythonType": "TNTPrimePrimeCause",
        "javaRead": "getCause()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "primingEntity",
        "pythonName": "priming_entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getPrimingEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "primingBlock",
        "pythonName": "priming_block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getPrimingBlock()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "TradeSelectEvent",
    "javaName": "org.bukkit.event.inventory.TradeSelectEvent",
    "category": "inventory",
    "cancellable": true,
    "properties": [
      {
        "name": "inventory",
        "pythonName": "inventory",
        "javaType": "org.bukkit.inventory.Inventory",
        "typeScriptType": "Inventory",
        "pythonType": "Inventory",
        "javaRead": "getInventory()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "viewers",
        "pythonName": "viewers",
        "javaType": "java.util.List<org.bukkit.entity.HumanEntity>",
        "typeScriptType": "HumanEntity[]",
        "pythonType": "list[HumanEntity]",
        "javaRead": "getViewers()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "view",
        "pythonName": "view",
        "javaType": "org.bukkit.inventory.InventoryView",
        "typeScriptType": "InventoryView",
        "pythonType": "InventoryView",
        "javaRead": "getView()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "whoClicked",
        "pythonName": "who_clicked",
        "javaType": "org.bukkit.entity.HumanEntity",
        "typeScriptType": "HumanEntity",
        "pythonType": "HumanEntity",
        "javaRead": "getWhoClicked()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "result",
        "pythonName": "result",
        "javaType": "org.bukkit.event.Event$Result",
        "typeScriptType": "EventResult",
        "pythonType": "EventResult",
        "javaRead": "getResult()",
        "javaWrite": "setResult(value)",
        "writable": true
      },
      {
        "name": "index",
        "pythonName": "index",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getIndex()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "merchant",
        "pythonName": "merchant",
        "javaType": "org.bukkit.inventory.Merchant",
        "typeScriptType": "Merchant",
        "pythonType": "Merchant",
        "javaRead": "getMerchant()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "TrialSpawnerSpawnEvent",
    "javaName": "org.bukkit.event.entity.TrialSpawnerSpawnEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "location",
        "pythonName": "location",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getLocation()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "trialSpawner",
        "pythonName": "trial_spawner",
        "javaType": "org.bukkit.block.TrialSpawner",
        "typeScriptType": "TrialSpawner",
        "pythonType": "TrialSpawner",
        "javaRead": "getTrialSpawner()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "VaultDisplayItemEvent",
    "javaName": "org.bukkit.event.block.VaultDisplayItemEvent",
    "category": "block",
    "cancellable": true,
    "properties": [
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "displayItem",
        "pythonName": "display_item",
        "javaType": "org.bukkit.inventory.ItemStack",
        "typeScriptType": "ItemStack",
        "pythonType": "ItemStack",
        "javaRead": "getDisplayItem()",
        "javaWrite": "setDisplayItem(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "VehicleBlockCollisionEvent",
    "javaName": "org.bukkit.event.vehicle.VehicleBlockCollisionEvent",
    "category": "vehicle",
    "cancellable": false,
    "properties": [
      {
        "name": "vehicle",
        "pythonName": "vehicle",
        "javaType": "org.bukkit.entity.Vehicle",
        "typeScriptType": "Vehicle",
        "pythonType": "Vehicle",
        "javaRead": "getVehicle()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "block",
        "pythonName": "block",
        "javaType": "org.bukkit.block.Block",
        "typeScriptType": "Block",
        "pythonType": "Block",
        "javaRead": "getBlock()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "VehicleCreateEvent",
    "javaName": "org.bukkit.event.vehicle.VehicleCreateEvent",
    "category": "vehicle",
    "cancellable": true,
    "properties": [
      {
        "name": "vehicle",
        "pythonName": "vehicle",
        "javaType": "org.bukkit.entity.Vehicle",
        "typeScriptType": "Vehicle",
        "pythonType": "Vehicle",
        "javaRead": "getVehicle()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "VehicleDamageEvent",
    "javaName": "org.bukkit.event.vehicle.VehicleDamageEvent",
    "category": "vehicle",
    "cancellable": true,
    "properties": [
      {
        "name": "vehicle",
        "pythonName": "vehicle",
        "javaType": "org.bukkit.entity.Vehicle",
        "typeScriptType": "Vehicle",
        "pythonType": "Vehicle",
        "javaRead": "getVehicle()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "attacker",
        "pythonName": "attacker",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getAttacker()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "damage",
        "pythonName": "damage",
        "javaType": "double",
        "typeScriptType": "number",
        "pythonType": "float",
        "javaRead": "getDamage()",
        "javaWrite": "setDamage(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "VehicleDestroyEvent",
    "javaName": "org.bukkit.event.vehicle.VehicleDestroyEvent",
    "category": "vehicle",
    "cancellable": true,
    "properties": [
      {
        "name": "vehicle",
        "pythonName": "vehicle",
        "javaType": "org.bukkit.entity.Vehicle",
        "typeScriptType": "Vehicle",
        "pythonType": "Vehicle",
        "javaRead": "getVehicle()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "attacker",
        "pythonName": "attacker",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getAttacker()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "VehicleEnterEvent",
    "javaName": "org.bukkit.event.vehicle.VehicleEnterEvent",
    "category": "vehicle",
    "cancellable": true,
    "properties": [
      {
        "name": "vehicle",
        "pythonName": "vehicle",
        "javaType": "org.bukkit.entity.Vehicle",
        "typeScriptType": "Vehicle",
        "pythonType": "Vehicle",
        "javaRead": "getVehicle()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "entered",
        "pythonName": "entered",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntered()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "VehicleEntityCollisionEvent",
    "javaName": "org.bukkit.event.vehicle.VehicleEntityCollisionEvent",
    "category": "vehicle",
    "cancellable": true,
    "properties": [
      {
        "name": "vehicle",
        "pythonName": "vehicle",
        "javaType": "org.bukkit.entity.Vehicle",
        "typeScriptType": "Vehicle",
        "pythonType": "Vehicle",
        "javaRead": "getVehicle()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "pickupCancelled",
        "pythonName": "pickup_cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isPickupCancelled()",
        "javaWrite": "setPickupCancelled(value)",
        "writable": true
      },
      {
        "name": "collisionCancelled",
        "pythonName": "collision_cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCollisionCancelled()",
        "javaWrite": "setCollisionCancelled(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "VehicleExitEvent",
    "javaName": "org.bukkit.event.vehicle.VehicleExitEvent",
    "category": "vehicle",
    "cancellable": true,
    "properties": [
      {
        "name": "vehicle",
        "pythonName": "vehicle",
        "javaType": "org.bukkit.entity.Vehicle",
        "typeScriptType": "Vehicle",
        "pythonType": "Vehicle",
        "javaRead": "getVehicle()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "exited",
        "pythonName": "exited",
        "javaType": "org.bukkit.entity.LivingEntity",
        "typeScriptType": "LivingEntity",
        "pythonType": "LivingEntity",
        "javaRead": "getExited()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "VehicleMoveEvent",
    "javaName": "org.bukkit.event.vehicle.VehicleMoveEvent",
    "category": "vehicle",
    "cancellable": false,
    "properties": [
      {
        "name": "vehicle",
        "pythonName": "vehicle",
        "javaType": "org.bukkit.entity.Vehicle",
        "typeScriptType": "Vehicle",
        "pythonType": "Vehicle",
        "javaRead": "getVehicle()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "from",
        "pythonName": "from_",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getFrom()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "to",
        "pythonName": "to",
        "javaType": "org.bukkit.Location",
        "typeScriptType": "Location",
        "pythonType": "Location",
        "javaRead": "getTo()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "VehicleUpdateEvent",
    "javaName": "org.bukkit.event.vehicle.VehicleUpdateEvent",
    "category": "vehicle",
    "cancellable": false,
    "properties": [
      {
        "name": "vehicle",
        "pythonName": "vehicle",
        "javaType": "org.bukkit.entity.Vehicle",
        "typeScriptType": "Vehicle",
        "pythonType": "Vehicle",
        "javaRead": "getVehicle()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "VillagerAcquireTradeEvent",
    "javaName": "org.bukkit.event.entity.VillagerAcquireTradeEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "recipe",
        "pythonName": "recipe",
        "javaType": "org.bukkit.inventory.MerchantRecipe",
        "typeScriptType": "MerchantRecipe",
        "pythonType": "MerchantRecipe",
        "javaRead": "getRecipe()",
        "javaWrite": "setRecipe(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "VillagerCareerChangeEvent",
    "javaName": "org.bukkit.event.entity.VillagerCareerChangeEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "profession",
        "pythonName": "profession",
        "javaType": "org.bukkit.entity.Villager$Profession",
        "typeScriptType": "VillagerProfession",
        "pythonType": "VillagerProfession",
        "javaRead": "getProfession()",
        "javaWrite": "setProfession(value)",
        "writable": true
      },
      {
        "name": "reason",
        "pythonName": "reason",
        "javaType": "org.bukkit.event.entity.VillagerCareerChangeEvent$ChangeReason",
        "typeScriptType": "VillagerCareerChangeChangeReason",
        "pythonType": "VillagerCareerChangeChangeReason",
        "javaRead": "getReason()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "VillagerReplenishTradeEvent",
    "javaName": "org.bukkit.event.entity.VillagerReplenishTradeEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "recipe",
        "pythonName": "recipe",
        "javaType": "org.bukkit.inventory.MerchantRecipe",
        "typeScriptType": "MerchantRecipe",
        "pythonType": "MerchantRecipe",
        "javaRead": "getRecipe()",
        "javaWrite": "setRecipe(value)",
        "writable": true
      },
      {
        "name": "bonus",
        "pythonName": "bonus",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getBonus()",
        "javaWrite": "setBonus(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "VillagerReputationChangeEvent",
    "javaName": "org.bukkit.event.entity.VillagerReputationChangeEvent",
    "category": "entity",
    "cancellable": true,
    "properties": [
      {
        "name": "entity",
        "pythonName": "entity",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getEntity()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "entityType",
        "pythonName": "entity_type",
        "javaType": "org.bukkit.entity.EntityType",
        "typeScriptType": "EntityType",
        "pythonType": "EntityType",
        "javaRead": "getEntityType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      },
      {
        "name": "targetUUID",
        "pythonName": "target_uuid",
        "javaType": "java.util.UUID",
        "typeScriptType": "NativeUuid",
        "pythonType": "NativeUuid",
        "javaRead": "getTargetUUID()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "target",
        "pythonName": "target",
        "javaType": "org.bukkit.entity.Entity",
        "typeScriptType": "Entity",
        "pythonType": "Entity",
        "javaRead": "getTarget()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "reason",
        "pythonName": "reason",
        "javaType": "org.bukkit.entity.Villager$ReputationEvent",
        "typeScriptType": "VillagerReputationEvent",
        "pythonType": "VillagerReputationEvent",
        "javaRead": "getReason()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "reputationType",
        "pythonName": "reputation_type",
        "javaType": "org.bukkit.entity.Villager$ReputationType",
        "typeScriptType": "VillagerReputationType",
        "pythonType": "VillagerReputationType",
        "javaRead": "getReputationType()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "oldValue",
        "pythonName": "old_value",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getOldValue()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "newValue",
        "pythonName": "new_value",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getNewValue()",
        "javaWrite": "setNewValue(value)",
        "writable": true
      },
      {
        "name": "maxValue",
        "pythonName": "max_value",
        "javaType": "int",
        "typeScriptType": "number",
        "pythonType": "int",
        "javaRead": "getMaxValue()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "WeatherChangeEvent",
    "javaName": "org.bukkit.event.weather.WeatherChangeEvent",
    "category": "weather",
    "cancellable": true,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      }
    ]
  },
  {
    "name": "WorldInitEvent",
    "javaName": "org.bukkit.event.world.WorldInitEvent",
    "category": "world",
    "cancellable": false,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "WorldLoadEvent",
    "javaName": "org.bukkit.event.world.WorldLoadEvent",
    "category": "world",
    "cancellable": false,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "WorldSaveEvent",
    "javaName": "org.bukkit.event.world.WorldSaveEvent",
    "category": "world",
    "cancellable": false,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      }
    ]
  },
  {
    "name": "WorldUnloadEvent",
    "javaName": "org.bukkit.event.world.WorldUnloadEvent",
    "category": "world",
    "cancellable": true,
    "properties": [
      {
        "name": "world",
        "pythonName": "world",
        "javaType": "org.bukkit.World",
        "typeScriptType": "World",
        "pythonType": "World",
        "javaRead": "getWorld()",
        "javaWrite": null,
        "writable": false
      },
      {
        "name": "cancelled",
        "pythonName": "cancelled",
        "javaType": "boolean",
        "typeScriptType": "boolean",
        "pythonType": "bool",
        "javaRead": "isCancelled()",
        "javaWrite": "setCancelled(value)",
        "writable": true
      }
    ]
  }
] as const;
