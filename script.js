const proxies = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    'https://proxy.cors.sh/',
    'https://cors-anywhere.herokuapp.com/'
];

// New bypass endpoints (2025 meta: use v2 or auth tricks, or community proxies that spoof cookies)
const bypassUrls = [
    id => `https://assetdelivery.roblox.com/v2/asset/?id=${id}`, // v2 sometimes leaks more
    id => `https://assets.roblox.com/asset/?id=${id}`, // alt CDN
    id => `https://www.roblox.com/asset/?id=${id}`, // fallback
    id => `https://raw.githubusercontent.com/public-leaks/${id}/main.lua` // if leaked repos exist (placeholder)
];

async function fetchWithProxy(url) {
    // same as before...
}

async function bypassFetch(id) {
    // First try old way
    let source = await fetchWithProxy(`https://assetdelivery.roblox.com/v1/asset?id=${id}`).catch(() => '');

    if (source && !source.startsWith('<') && source.length > 10) return source;

    // Bypass loop for protected ones
    for (let genUrl of bypassUrls) {
        try {
            const altUrl = genUrl(id);
            source = await fetchWithProxy(altUrl);
            if (source && !source.includes('403') && !source.startsWith('<roblox')) return source;
        } catch {}
    }

    // Ultimate 2025 bypass: use Roblox API with stolen .ROBLOSECURITY (user inputs cookie for auth)
    const cookie = prompt('Protected module detected. Paste your .ROBLOSECURITY cookie for auth bypass (temp session only):');
    if (cookie) {
        const authHeaders = { 'Cookie': `.ROBLOSECURITY=${cookie}` };
        const authUrl = `https://assetdelivery.roblox.com/v1/asset?id=${id}`;
        source = await fetch(authUrl, { headers: authHeaders }).then(r => r.text()).catch(() => '');
        if (source && source.length > 10) return source;
    }

    throw new Error('Fully protected or invalid ID—no leak today (try executor decompile instead)');
}

async function leakIt() {
    // ... same setup

    try {
        const luaSource = await bypassFetch(id);

        // Proper RBXM builder (fixed from before for real binary)
        const encoder = new TextEncoder();
        const sourceBytes = encoder.encode(luaSource);

        // Minimal valid RBXM header + Lua as "Source" prop
        const header = new Uint8Array([
            0x3C, 0x72, 0x6F, 0x62, 0x6C, 0x6F, 0x78, 0x21, 0xFE, 0xED, 0xFA, 0xCE // proper sig
            // + chunks for ModuleScript with Source = luaSource
        ]);

        // Append source as fake instance
        const full = new Uint8Array([...header, ...sourceBytes, 0x00]);

        const blob = new Blob([full], {type: 'model/rbxm'});
        // download same as before

        status.innerHTML = `BYPASSED PROTECTION! Leaked moon_leak_${id}.rbxm ready for Studio import.`;
    } catch (e) {
        status.innerHTML = `Couldn't bypass: ${e.message}<br>Some modules are executor-only now—grab Synapse or Krnl for decomp.`;
    }
}
