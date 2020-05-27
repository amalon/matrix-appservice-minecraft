/**
 * Mojang API endpoints
 * credit to https://wiki.vg
 * @author Dylan Hackworth
 * @license GNU GPLv3
 */
const servers = {
  api: "https://api.mojang.com",
  sessions: "https://sessionserver.mojang.com"
}

// All the GET endpoints
export const get = {
  /**
   * Playername -> UUID
   * @link https://wiki.vg/Mojang_API#Username_-.3E_UUID_at_time
   */
  uuid: `${servers.api}/users/profiles/minecraft/{playername}`,

  /**
   * UUID -> Name history
   * @link https://wiki.vg/Mojang_API#UUID_-.3E_Name_history
   */
  nameHistory: `${servers.api}/user/profiles/{uuid}/names`,

  /**
   * UUID -> Profile + Skin/Cape
   * @link https://wiki.vg/Mojang_API#UUID_-.3E_Profile_.2B_Skin.2FCape
   */
  profile: `${servers.sessions}/session/minecraft/profile/{uuid}`
};

