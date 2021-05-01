const electron = require('electron');
const path = require('path');
const { app, BrowserWindow, ipcMain, Notification } = electron;

const step = 0.1;

let mainWindow;
let paused = true;
let assignedDuration = 10.0;
let time = 10.0; // time remaining
let notifTitle = 'Time\'s up!';
let notifBody = 'Yup';

let interval;

app.on('ready', () => {
    console.log('app ready');

    // create new window
    mainWindow = new BrowserWindow({
        width: 300,
        height: 550,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html')
})

app.on('window-all-closed', () => {
    clearInterval(interval);
    interval = null;

    app.quit();
})

ipcMain.on('toMain', (_, data) => {
    switch (data[0]) {
        case 'start':
            if (paused && interval == null) {
                assignedDuration = data[1];
                time = data[1];
                console.log(`set time to ${assignedDuration}, starting...`);
                paused = false;
    
                clearInterval(interval);
                interval = null;
                interval = setInterval(() => { // updates every .1 seconds
                    if (paused == false) {
                        if (time > 0) {
                            // console.log(time/1000);
                            time -= step
                            mainWindow.webContents.send('fromMain', ['time', time.toFixed(1).toString()]);
                        } else {
                            paused = true
                            clearInterval(interval);
                            interval = null;
                            mainWindow.webContents.send('fromMain', ['time', 0.0.toFixed(1).toString()]);
                            new Notification({
                                title: notifTitle,
                                body: notifBody
                            }).show();
                        }
                    }
                }, step*1000)
            }
            break;
        case 'pause':
            console.log('pausing timer');
            paused = true;
            break;
        case 'resume':
            console.log('resuming timer');
            paused = false;
            break;
        case 'reset':
            console.log('reseting timer');
            time = assignedDuration;
            paused = true;
            console.log(`amogus: ${time}`);
            mainWindow.webContents.send('fromMain', ['time', assignedDuration.toString()]);
            clearInterval(interval);
            interval = null;
            break;
        case 'notif:title':
            if (data[1] != null && data[1] != '') {
                console.log(`assigning notification title: ${data[1]}`);
                notifTitle = data[1];
            }
            break;
        case 'notif:body':
            if (data[1] != null && data[1] != '') {
                console.log(`assigning notification body: ${data[1]}`);
                notifBody = data[1];
            }
            break;
        default:
            mainWindow.webContents.send('fromMain', ['alert', 'Unknown data']);
            break;
    }
})