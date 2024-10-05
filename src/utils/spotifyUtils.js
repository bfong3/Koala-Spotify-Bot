export const SongsFromUser = (discordId, ID_DICTIONARY, playlistItems) => {
    const spotifyId = ID_DICTIONARY[discordId].spotifyId;
    return playlistItems.filter(item => item.added_by.id === spotifyId);
};