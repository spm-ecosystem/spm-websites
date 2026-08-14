const fs = require('fs');
const crypto = require('crypto');

const secret = process.env.SPM_DEV_SECRET;
const authToken = process.env.API_AUTH_TOKEN;
const changedFiles = (process.env.CHANGED_FILES || '').split(' ');

async function publish() {
    for (const file of changedFiles) {
        // Ignore empty files, non-manifests, and nested vnr_project manifests
        if (!file || !file.endsWith('manifest.json') || file.includes('vnr_project')) continue;

        console.log(`\n📦 Processing: ${file}`);
        const rawPayload = fs.readFileSync(file, 'utf8');
        
        let manifest;
        try {
            manifest = JSON.parse(rawPayload);
        } catch (e) {
            console.error(`❌ Error: Invalid JSON in ${file}`);
            process.exit(1); // Fails the pipeline if the JSON is broken
        }

        // Try reading content.css sibling file
        let cssContent = "";
        const cssFile = file.replace('manifest.json', 'content.css');
        if (fs.existsSync(cssFile)) {
            cssContent = fs.readFileSync(cssFile, 'utf8');
        }

        // Derive domain and themeName safely with fallback to directory path
        const pathParts = file.split('/');
        const domain = manifest.targetUrl 
            ? manifest.targetUrl.replace("*://", "").replace("/*", "") 
            : (pathParts[0] || "global");

        const themeName = (manifest.theme && manifest.theme.label)
            ? manifest.theme.label.toLowerCase().replace(/\s+/g, '-')
            : (pathParts[1] || "default");

        // Resolve version from Edge registry
        console.log(`🔍 Resolving latest version from edge for ${domain}/${themeName}...`);
        let resolvedVersion = "1.0.0";
        try {
            const listResponse = await fetch(`https://spm.hexacloud.net.br/spm/v1/api/themes/${domain}`);
            if (listResponse.ok) {
                const listData = await listResponse.json();
                const prefix = `themes/${domain}/${themeName}/`;
                const versions = new Set();
                for (const item of listData.themes || []) {
                    if (item.key.startsWith(prefix)) {
                        const parts = item.key.substring(prefix.length).split("/");
                        if (parts[0] && /^\d+\.\d+\.\d+$/.test(parts[0])) {
                            versions.add(parts[0]);
                        }
                    }
                }
                if (versions.size > 0) {
                    const sorted = Array.from(versions).sort((a, b) => {
                        const pa = a.split(".").map(Number);
                        const pb = b.split(".").map(Number);
                        for (let i = 0; i < 3; i++) {
                            if (pa[i] !== pb[i]) return pa[i] - pb[i];
                        }
                        return 0;
                    });
                    const latest = sorted[sorted.length - 1];
                    const parts = latest.split(".").map(Number);
                    parts[2] += 1; // Increment patch version
                    resolvedVersion = parts.join(".");
                }
            }
        } catch (e) {
            console.warn(`⚠️ Could not reach edge registry to resolve version, defaulting to ${resolvedVersion}:`, e.message);
        }

        console.log(`🏷️  Target Version: ${resolvedVersion}`);
        manifest.version = resolvedVersion;
        if (!manifest.targetUrl) {
            manifest.targetUrl = `*://${domain}/*`;
        }
        if (!manifest.theme) {
            manifest.theme = { label: themeName, cssVariables: {} };
        }

        const payload = JSON.stringify({
            manifest: manifest,
            css: cssContent
        });

        // Compute HMAC signature using SHA-256
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(payload);
        const signature = hmac.digest('hex');

        console.log(`🔐 Generated Signature: ${signature.substring(0, 16)}...`);
        console.log(`🚀 Dispatching payload to R2 via edge endpoint...`);

        try {
            const response = await fetch("https://spm.hexacloud.net.br/spm/v1/api/themes/publish", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-spm-signature": signature,
                    "Authorization": `Bearer ${authToken}`
                },
                body: payload
            });

            const resultText = await response.text();

            if (!response.ok) {
                console.error(`❌ Edge Publish Error [${response.status}]: ${resultText}`);
                process.exit(1);
            }

            console.log(`✅ Successfully published theme to edge: ${resultText}`);
        } catch (err) {
            console.error(`🔥 Network Error during edge publish: ${err.message}`);
            process.exit(1);
        }
    }
}

publish();