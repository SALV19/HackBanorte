// Emisores de los 4 tipos de mensaje A2UI v0.9 con el envelope real
// ({version: "v0.9", ...}). Cada builder construye el mensaje con el schema
// real de @a2ui/web_core/v0_9 (.parse) para que un envelope mal formado
// truene aquí, no en el cliente.
import {
  CreateSurfaceMessageSchema,
  UpdateComponentsMessageSchema,
  UpdateDataModelMessageSchema,
  DeleteSurfaceMessageSchema,
  type CreateSurfaceMessage,
  type UpdateComponentsMessage,
  type UpdateDataModelMessage,
  type DeleteSurfaceMessage,
  type AnyComponent,
} from "@a2ui/web_core/v0_9";

const VERSION = "v0.9" as const;

export function createSurface(surfaceId: string, catalogId: string): CreateSurfaceMessage {
  return CreateSurfaceMessageSchema.parse({
    version: VERSION,
    createSurface: { surfaceId, catalogId },
  }) as CreateSurfaceMessage;
}

export function updateComponents(surfaceId: string, components: AnyComponent[]): UpdateComponentsMessage {
  return UpdateComponentsMessageSchema.parse({
    version: VERSION,
    updateComponents: { surfaceId, components },
  }) as UpdateComponentsMessage;
}

export function updateDataModel(surfaceId: string, path: string, value: unknown): UpdateDataModelMessage {
  return UpdateDataModelMessageSchema.parse({
    version: VERSION,
    updateDataModel: { surfaceId, path, value },
  }) as UpdateDataModelMessage;
}

export function deleteSurface(surfaceId: string): DeleteSurfaceMessage {
  return DeleteSurfaceMessageSchema.parse({
    version: VERSION,
    deleteSurface: { surfaceId },
  }) as DeleteSurfaceMessage;
}
