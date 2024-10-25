export function getRealNameBySpotifyId(spotifyId, DISCORD_ID_DICTIONARY) {
    for (const userId in DISCORD_ID_DICTIONARY) {
        if (DISCORD_ID_DICTIONARY[userId].spotifyId === spotifyId) {
            return DISCORD_ID_DICTIONARY[userId].realName;
        }
    }
    return null;
}

export function getSpotifyIdByRealName(realName, DISCORD_ID_DICTIONARY) {
    for (const userId in DISCORD_ID_DICTIONARY) {
        if (DISCORD_ID_DICTIONARY[userId].realName === realName) {
            return DISCORD_ID_DICTIONARY[userId].spotifyId; 
        }
    }
    return null;
}