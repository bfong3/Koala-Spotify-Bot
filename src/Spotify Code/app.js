import dotenv from 'dotenv'; 
import fetch from 'node-fetch';

// Load environment variables from .env file
dotenv.config();

const _getToken = async () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const result = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        },
        body: 'grant_type=client_credentials'
    });

    const data = await result.json();
    return data.access_token;
};

const _getPlaylistItems = async (token, playlistId) => {
    const limit = 100; // Max items per request
    let allItems = []; // Store all items
    let offset = 0; // Pagination offset
    let fields = 'items(added_at, added_by(id), track(name, popularity, artists(name), duration_ms))';
    
    while (true) {
        const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=${fields}&limit=${limit}&offset=${offset}`;

        const result = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        
        if (data.items) { 
            allItems = allItems.concat(data.items);
            console.log(`Fetched ${data.items.length} items. Total items: ${allItems.length}`);
        } else {
            console.error('No items found or an error occurred:', data);
            break;
        }

        if (data.items.length < limit) {
            break;
        }
        offset += limit;
    }
    return allItems;
};

const getPlaylistData = async () => {
    const token = await _getToken(); // Get the access token
    const playlistId = process.env.SPOTIFY_PLAYLIST_ID // Your Spotify playlist ID
    const items = await _getPlaylistItems(token, playlistId); // Get the playlist items
    return items; // Return the playlist items
};

export { getPlaylistData };
