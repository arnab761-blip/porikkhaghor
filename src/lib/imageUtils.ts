/**
 * Utility function to convert various image and cloud storage links
 * (Google Drive, Cloudinary, Dropbox, etc.) into directly renderable image URLs.
 */
export function formatImageUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Google Drive: extract file ID from any format
  // Examples:
  // - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // - https://drive.google.com/open?id=FILE_ID
  // - https://drive.google.com/uc?id=FILE_ID&export=download
  // - https://drive.google.com/thumbnail?id=FILE_ID
  const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:.*&)?id=|thumbnail\?(?:.*&)?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/i;
  const match = trimmed.match(driveRegex);
  if (match && match[1]) {
    // lh3.googleusercontent.com/d/ID is the fastest and most reliable Google Drive image URL
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }

  // Dropbox share links
  if (trimmed.includes('dropbox.com')) {
    return trimmed
      .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
      .replace(/[?&]dl=0/, '')
      .replace(/[?&]raw=1/, '') + (trimmed.includes('?') ? '&raw=1' : '?raw=1');
  }

  return trimmed;
}

/**
 * Returns a secondary fallback URL for Google Drive images in case the primary direct link is temporarily unavailable
 */
export function getDriveFallbackUrl(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:.*&)?id=|thumbnail\?(?:.*&)?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/i;
  const match = url.trim().match(driveRegex);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200`;
  }
  return null;
}
