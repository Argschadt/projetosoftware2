// Tipos para exposições
export interface ExposicaoSceneData {
  schemaVersion: number;
  appVersion: string;
  sceneBaseId: string;
  name: string;
  createdAtIso: string;
  objects: Array<{
    id: string;
    px: number;
    py: number;
    pz: number;
    rx: number;
    ry: number;
    rz: number;
    sx: number;
    sy: number;
    sz: number;
    materialId: string;
  }>;
  artworks: Array<unknown>;
  skyboxMaterialName: string;
  skyboxPreset: {
    type: string;
    materialName: string;
    rotation: number;
    exposureCompensation: number;
  };
}

export interface Exposicao {
  id: string; // nome do arquivo sem .json
  name: string;
  description: string;
  fileName: string;
  createdAt: string;
  author?: string;
  status: 'published' | 'draft';
}

export interface ExposicaoMetadata extends Exposicao {
  data: ExposicaoSceneData;
}
