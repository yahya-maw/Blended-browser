const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1300,
        height: 900,
        title: "Blended Browser - Local AI Edition",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true
        }
    });

    // إعدادات الخصوصية الافتراضية للمستخدم
    const userDataPath = app.getPath('userData');
    const settingsPath = path.join(userDataPath, 'settings.json');
    
    if (!fs.existsSync(settingsPath)) {
        fs.writeFileSync(settingsPath, JSON.stringify({ blockTracking: true }));
    }

    // منع التتبع بناءً على إعدادات المستخدم
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
        const trackers = ['google-analytics.com', 'telemetry', 'doubleclick.net'];
        const shouldBlock = trackers.some(t => details.url.includes(t));
        callback({ cancel: shouldBlock });
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

// محرك الذكاء الاصطناعي (Falcon 1B) يعمل محلياً 100%
ipcMain.handle('ask-ai', async (event, prompt) => {
    try {
        const { pipeline } = await import('@xenova/transformers');
        const generator = await pipeline('text-generation', 'Xenova/falcon-rw-1b');
        const output = await generator(prompt, { 
            max_new_tokens: 50, 
            temperature: 0.6,
            repetition_penalty: 1.2
        });
        return output[0].generated_text;
    } catch (err) {
        return "AI Error: Could not load local model.";
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
