async function leakIt() {
    const status = document.getElementById('status');
    const id = document.getElementById('assetId').value.trim();

    if (!id || isNaN(id)) return status.innerHTML = 'Bad ID';

    status.innerHTML = 'Trying unauth leak...';

    try {
        // Direct unauth attempt (works on legacy public modules)
        let response = await fetch(`https://assetdelivery.roblox.com/v1/asset?id=${id}`);
        if (!response.ok) throw '';

        let luaSource = await response.text();
        if (luaSource.startsWith('<') || luaSource.length < 20) throw '';

        // Success no cookie
        buildAndDownload(luaSource, id);
        status.innerHTML = 'Unauth leak success! No cookie needed for this one.';
        return;
    } catch {}

    // Proxy attempts (2025 some public CDNs still slip)
    const cdns = [
        `https://sc2.rbxcdn.com/`,
        `https://assetgame.roblox.com/asset/?id=${id}`
    ];

    for (let base of cdns) {
        try {
            let luaSource = await fetch(base + id).then(r => r.text());
            if (luaSource && !luaSource.startsWith('<')) {
                buildAndDownload(luaSource, id);
                status.innerHTML = 'CDN slip leak—got it raw!';
                return;
            }
        } catch {}
    }

    // Final: force cookie since protected
    let cookie = localStorage.getItem('roblosecurity') || prompt('2025 lock hit—paste .ROBLOSECURITY cookie for this ID:');
    if (!cookie) return status.innerHTML = 'No cookie, no leak on protected modules.';

    localStorage.setItem('roblosecurity', cookie);

    try {
        const response = await fetch(`https://assetdelivery.roblox.com/v1/asset?id=${id}`, {
            headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
        });
        const luaSource = await response.text();
        buildAndDownload(luaSource, id);
        status.innerHTML = 'Auth bypassed—full leak downloaded.';
    } catch {
        status.innerHTML = 'Even with cookie failed—true server-only or bad ID/cookie.';
    }

    function buildAndDownload(source, id) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(source);
        const header = new Uint8Array([0x3C, 0x72, 0x6F, 0x62, 0x6C, 0x6F, 0x78, 0x21]);
        const blob = new Blob([header, bytes], {type: 'application/octet-stream'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `moon_leak_${id}.rbxm`;
        a.click();
    }
}
