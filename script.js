async function leakIt() {
    const status = document.getElementById('status');
    const idInput = document.getElementById('assetId');
    const id = idInput.value.trim();

    if (!id || isNaN(id)) {
        status.innerHTML = 'Invalid ID, fix it.';
        return;
    }

    status.innerHTML = 'Protected module detected (2025 lock)—need auth...';

    // Force cookie prompt upfront since everything is auth-required now
    let cookie = localStorage.getItem('roblosecurity'); // reuse if saved before
    if (!cookie) {
        cookie = prompt('Paste your .ROBLOSECURITY cookie (from roblox.com logged in session):\nGrab from browser dev tools > Application > Cookies');
        if (!cookie) {
            status.innerHTML = 'No cookie = no leak. Cancelled.';
            return;
        }
        localStorage.setItem('roblosecurity', cookie); // optional reuse
    }

    status.innerHTML = 'Authenticating and fetching source...';

    try {
        const sourceUrl = `https://assetdelivery.roblox.com/v1/asset?id=${id}`;
        const response = await fetch(sourceUrl, {
            headers: {
                'Cookie': `.ROBLOSECURITY=${cookie}`
            },
            credentials: 'include' // helps with some sessions
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - bad cookie or protected beyond fetch`);
        }

        let luaSource = await response.text();

        if (luaSource.startsWith('<') || luaSource.includes('error') || luaSource.length < 20) {
            throw new Error('Invalid source - wrong ID, fully server-only, or cookie expired');
        }

        status.innerHTML = 'Source grabbed! Building RBXM...';

        // Minimal RBXM wrapper that Studio accepts (Lua source as binary blob)
        const encoder = new TextEncoder();
        const sourceBytes = encoder.encode(luaSource);

        const header = new Uint8Array([
            0x3C, 0x72, 0x6F, 0x62, 0x6C, 0x6F, 0x78, 0x21, 0x89, 0xFF, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00
        ]);

        const blob = new Blob([header, sourceBytes], { type: 'application/octet-stream' });

        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `moon_leak_${id}.rbxm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        status.innerHTML = `Leaked successfully! <strong>moon_leak_${id}.rbxm</strong> downloaded.<br>Import to Studio → profit. Cookie saved for next one.`;
    } catch (e) {
        status.innerHTML = `Failed: ${e.message}<br>Refresh cookie (log out/in roblox.com) and try again. Some modules are true server-only now—no external leak possible.`;
    }
}
