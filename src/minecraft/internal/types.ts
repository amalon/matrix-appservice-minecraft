/**
 * Mojang API types
 * credit to https://wiki.vg
 * @author Dylan Hackworth
 * @license GNU GPLv3
 */
// Playername -> UUID Response
export type UUIDResponse = {
  id: string;
  username: string;
};

/**
 * UUID -> Name history Response
 * @link https://wiki.vg/Mojang_API#UUID_-.3E_Name_history
 */
type Name = {
  name: string;
  changedToAt?: number;
};

export type NHResponse = Name[];

/**
 * UUID -> Profile + Skin/Cape Response
 * @link https://wiki.vg/Mojang_API#UUID_-.3E_Profile_.2B_Skin.2FCape
 */
export type Texture = {
  name: string;
  value: string;
  signature?: string;
};

export type Skin = {
  timestamp: number;
  profileId: string;
  profileName: string;
  signatureRequired: boolean;
  textures: {
    SKIN?: {
      metadata?: {
        model: 'slim'
      }
      url: string
    },
    CAPE?: {
      url: string;
    }
  };
}

export type ProfileResponse = {
  id: string;
  name: string;
  properties: Texture[];
}
