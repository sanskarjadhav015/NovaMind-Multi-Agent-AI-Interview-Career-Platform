/**
 * @file youtube.js (Roadmap Service)
 * @description Interfaces with YouTube Data API v3 to search for video tutorials
 * corresponding to roadmap module topics.
 */

import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const BASE_URL = "https://www.googleapis.com/youtube/v3/search";

/**
 * Searches YouTube for a high-relevance tutorial video matching the given topic.
 * 
 * @param {string} topic - Search keyword or module title
 * @returns {Promise<{title: string, channel: string, URL: string}|null>}
 */
const searchVideo = async (topic) => {
    try {
        if (!process.env.YOUTUBE_API_KEY) {
            console.warn("⚠️ YOUTUBE_API_KEY not set. Skipping video search.");
            return null;
        }

        // 1. Direct topic search
        let query = topic;
        let { data } = await axios.get(BASE_URL, {
            params: {
                key: process.env.YOUTUBE_API_KEY,
                part: "snippet",
                q: query,
                maxResults: 1,
                type: "video"
            }
        });

        if (data.items && data.items.length > 0) {
            const video = data.items[0];
            return {
                title: video.snippet.title,
                channel: video.snippet.channelTitle,
                URL: `https://www.youtube.com/watch?v=${video.id.videoId}`
            };
        }

        // 2. Fallback query appending 'tutorial'
        query = `${topic} tutorial`;
        ({ data } = await axios.get(BASE_URL, {
            params: {
                key: process.env.YOUTUBE_API_KEY,
                part: "snippet",
                q: query,
                maxResults: 1,
                type: "video"
            }
        }));

        if (data.items && data.items.length > 0) {
            const video = data.items[0];
            return {
                title: video.snippet.title,
                channel: video.snippet.channelTitle,
                URL: `https://www.youtube.com/watch?v=${video.id.videoId}`
            };
        }

        return null;

    } catch (error) {
        console.error("YouTube API Error:", error.message);
        return null;
    }
};

export default searchVideo;