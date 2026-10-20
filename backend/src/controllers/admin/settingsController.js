const { query } = require('../../config/database');
const { flush, get, set } = require('../../services/cacheService');

const getSettings = async (req, res, next) => {
  try {
    const cacheKey = 'settings:all';

    let formatted = await get(cacheKey);
    if (formatted) {
      return res.json(formatted);
    }

    const { rows } = await query("SELECT * FROM content WHERE key = 'settings' LIMIT 1");
    const settingsData = rows[0]?.data || {};

    formatted = {
      siteMeta: {
        value: {
          name: settingsData.site_name || 'Lotus & Lion',
          tagline: settingsData.site_description || '',
          whatsapp: settingsData.whatsapp_number || '',
          instagram: settingsData.instagram_url || '',
          twitter: settingsData.twitter_url || '',
          pinterest: settingsData.pinterest_url || '',
        },
      },
    };

    await set(cacheKey, formatted, 600);
    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { siteMeta } = req.body;
    const metaValue = siteMeta?.value || siteMeta || {};

    const settingsData = {
      site_name: metaValue.name || 'Lotus & Lion',
      site_description: metaValue.tagline || '',
      whatsapp_number: metaValue.whatsapp || '',
      instagram_url: metaValue.instagram || '',
      twitter_url: metaValue.twitter || '',
      pinterest_url: metaValue.pinterest || '',
    };

    await query(
      `INSERT INTO content (key, type, data, updated_at)
       VALUES ('settings', 'settings', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [JSON.stringify(settingsData)]
    );

    await flush('settings:*');
    await flush('content:*');

    const formatted = {
      siteMeta: {
        value: {
          name: settingsData.site_name || 'Lotus & Lion',
          tagline: settingsData.site_description || '',
          whatsapp: settingsData.whatsapp_number || '',
          instagram: settingsData.instagram_url || '',
          twitter: settingsData.twitter_url || '',
          pinterest: settingsData.pinterest_url || '',
        },
      },
    };

    res.json(formatted);
  } catch (error) {
    console.error('[Settings] Controller error:', error);
    next(error);
  }
};

module.exports = { getSettings, updateSettings, updateSetting: updateSettings };
