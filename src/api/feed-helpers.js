/**
 * Shared helper functions for GoodBarber feed endpoints (maps + events).
 */

/**
 * Strip HTML tags and truncate to specified length.
 * @param {string} html - HTML string
 * @param {number} maxLength - Maximum length (default 100)
 * @returns {string} Plain text truncated
 */
function stripHtmlAndTruncate(html, maxLength = 100) {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, '').trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Convert a video URL to an embed iframe.
 * @param {string} url - Video URL (YouTube or Vimeo)
 * @returns {string} HTML iframe or link
 */
function getVideoEmbed(url) {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) {
    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen></iframe>`;
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `<iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`;
  }
  return `<a href="${url}">${url}</a>`;
}

/**
 * Convert content blocks (JSON) to HTML for GoodBarber.
 * @param {Array} blocks - Array of content blocks
 * @returns {string} HTML string
 */
function blocksToHtml(blocks) {
  if (!Array.isArray(blocks)) return '';

  return blocks.map(block => {
    switch (block.type) {
      case 'text':
        return block.content || '';
      case 'photo': {
        // Skip photos used as the location thumbnail (shown as hero image by GoodBarber)
        if (block.isLocationThumbnail) return '';
        let html = '<figure class="content-photo">';
        html += `<img src="${block.url}" alt="${block.caption || ''}" />`;
        if (block.caption) {
          html += `<figcaption>${block.caption}</figcaption>`;
        }
        html += '</figure>';
        return html;
      }
      case 'video':
        return `<div class="content-video">${getVideoEmbed(block.url || '')}</div>`;
      case 'quote': {
        let html = '<blockquote class="content-quote">';
        html += `<p>${block.text || ''}</p>`;
        if (block.attribution) {
          html += `<cite>${block.attribution}</cite>`;
        }
        html += '</blockquote>';
        return html;
      }
      case 'embed':
        return `<div class="content-embed">${block.html || ''}</div>`;
      case 'button':
        return `<p style="text-align: center;"><a href="${block.url || ''}" style="background-color: rgb(41, 84, 126); border: initial; border-radius: 1000em; color: rgb(255, 255, 255); padding: 10px 16px; text-align: center; text-decoration: none;">${block.text || ''}</a></p>`;
      default:
        return '';
    }
  }).join('\n');
}

/**
 * Parse description field - could be JSON blocks or legacy HTML/text.
 * Returns HTML for GoodBarber consumption.
 * @param {string} description - Description field from database
 * @returns {string} HTML content
 */
function parseDescriptionToHtml(description) {
  if (!description) return '';

  // Try to parse as JSON (new block format)
  try {
    const parsed = JSON.parse(description);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
      return blocksToHtml(parsed);
    }
  } catch {
    // Not JSON, treat as legacy HTML/text
  }

  // Legacy content - return as-is (already HTML or plain text)
  return description;
}

module.exports = {
  stripHtmlAndTruncate,
  getVideoEmbed,
  blocksToHtml,
  parseDescriptionToHtml,
};
