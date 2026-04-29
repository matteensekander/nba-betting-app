const ESPN_API    = 'https://site.web.api.espn.com/apis';
const ESPN_SITE   = 'https://site.api.espn.com/apis';
const ESPN_SEARCH = 'https://site.web.api.espn.com/apis/search/v2';

async function espnFetch(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  });
  if (res.status === 429) throw Object.assign(new Error('Rate limited'), { status: 429 });
  if (!res.ok) throw Object.assign(new Error(`ESPN error: ${res.status}`), { status: res.status });
  return res.json();
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function extractAthleteId(uid = '') {
  const m = uid.match(/a:(\d+)/);
  return m ? m[1] : null;
}

module.exports = { ESPN_API, ESPN_SITE, ESPN_SEARCH, espnFetch, cors, extractAthleteId };
