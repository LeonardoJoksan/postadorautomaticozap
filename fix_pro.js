const fs = require('fs');

function applyFixes() {
    const files = ['js/popup.js', 'js/background.js', 'js/inject/content-script.js'];
    for (const file of files) {
        let code = fs.readFileSync(file, 'utf8');

        // Instead of overriding storage, let's just make the condition checks pass.
        // We know it checks `"Free" === this.permissionText` or `this.permissionText === "Free"`.
        // Let's replace the strict equality check of `"Free"` with a string that will never be matched if we don't want to break syntax
        code = code.replace(/==="Free"/g, '==="NEVER_FREE"');
        code = code.replace(/!=="Free"/g, '!=="NEVER_FREE"');
        
        // Also: `"Pro"!==e.permissionText`
        // We can't replace the left side of `!==` blindly, but we can replace `!==` with `===`
        // Wait, `"Pro"!==e.permissionText` means "If it is NOT Pro". We want it to be false.
        code = code.replace(/"Pro"!==([a-zA-Z0-9_]+)\.permissionText/g, 'false');
        code = code.replace(/"Pro" !== ([a-zA-Z0-9_]+)\.permissionText/g, 'false');
        
        // Also check for paid_mark
        // `!e.paid_mark` means "if NOT paid". We want it to be false.
        code = code.replace(/!([a-zA-Z0-9_]+)\.paid_mark/g, 'false');
        code = code.replace(/!([a-zA-Z0-9_]+)\["paid_mark"\]/g, 'false');
        
        // Also check for isPro
        // `!e.isPro` means "if NOT Pro". We want it to be false.
        code = code.replace(/!([a-zA-Z0-9_]+)\.isPro/g, 'false');

        // Any assignments to false?
        // `paid_mark:!1` -> `paid_mark:!0`
        code = code.replace(/paid_mark:!1/g, 'paid_mark:!0');
        // `isPro:!1` -> `isPro:!0`
        code = code.replace(/isPro:!1/g, 'isPro:!0');
        
        // Any assignments to "Free"?
        // `permissionText:"Free"` -> `permissionText:"Pro"`
        code = code.replace(/permissionText:"Free"/g, 'permissionText:"Pro"');

        fs.writeFileSync(file, code);
    }
}
applyFixes();

function hideUI() {
    ['popup.html', 'index.html'].forEach(file => {
        if (!fs.existsSync(file)) return;
        let content = fs.readFileSync(file, 'utf8');

        // Add styles to hide elements
        content = content.replace(/<\/head>/i, '<style>.upgradeWrap, .discountBadge, .activateProLink, .free-gift-box, .pro, .trial { display: none !important; }</style></head>');
        
        // remove pricing html references
        content = content.replace(/group_sender_pricing\.html/g, '#');
        content = content.replace(/pricing_temporary\.html/g, '#');
        content = content.replace(/pricing_pro_plan\.html/g, '#');

        fs.writeFileSync(file, content);
    });
}
hideUI();

function wipePay(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}
wipePay('pay/');

function replaceLocales() {
    const glob = require('glob');
    const matches = glob.sync('_locales/**/*.json');
    matches.forEach(path => {
        let content = fs.readFileSync(path, 'utf8');
        content = content.replace(/Free/g, 'Pro');
        content = content.replace(/free/g, 'pro');
        content = content.replace(/Grátis/g, 'Pro');
        content = content.replace(/Gratuita/g, 'Pro');
        content = content.replace(/grátis/g, 'pro');
        content = content.replace(/Premium/g, 'Pro');
        content = content.replace(/premium/g, 'pro');
        fs.writeFileSync(path, content);
    });
}
replaceLocales();

