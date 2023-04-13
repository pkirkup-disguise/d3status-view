const config = JSON.parse(localStorage.getItem('config')) || { hostname: 'localhost', port: '80' };

async function fetchData(path, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const url = `http://${config.hostname}:${config.port}/api/session/status/${path}`;
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

async function fetchSessionStatus() {
    return await fetchData('session');
}

const machineStatusTable = document.getElementById('machineStatusTable');
const notificationDetails = document.getElementById('notificationDetails');

async function updateMachineStatus() {
    const machineHealthData = await fetchData('health');
    const machineNotificationData = await fetchData('notifications');
    const sessionStatusData = await fetchSessionStatus();

    if (machineHealthData && machineHealthData.result && machineNotificationData && machineNotificationData.result && sessionStatusData && sessionStatusData.result) {
        const directorUid = sessionStatusData.result.director.uid;
        const actorUids = sessionStatusData.result.actors.map(actor => actor.uid);
        const understudyUids = sessionStatusData.result.understudies.map(understudy => understudy.uid);

        let tableContent = '';
        for (const machineHealth of machineHealthData.result) {
            const machineUid = machineHealth.machine.uid;
            let machineRole = 'Unknown';
            let machineRoleEmoji = '❓';
            if (machineUid === directorUid) {
                machineRole = 'Director';
                machineRoleEmoji = '🎬';
            } else if (actorUids.includes(machineUid)) {
                machineRole = 'Actor';
                machineRoleEmoji = '🎭';
            } else if (understudyUids.includes(machineUid)) {
                machineRole = 'Understudy';
                machineRoleEmoji = '📚';
            }

            const machineNotifications = machineNotificationData.result.find(mn => mn.machine.uid === machineHealth.machine.uid);
            const notificationCount = machineNotifications ? machineNotifications.notifications.length : 0;
            
            const isMachineOffline = machineHealth.status.states.some(state => state.severity === 'offline' && state.category === 'connection');
            const rowClass = isMachineOffline ? 'offline-machine' : '';

            tableContent += `<tr class="${rowClass}">
                <td>
                    ${machineHealth.machine.name}
                    ${notificationCount > 0 ? `<span class="notification-circle" onclick="showNotificationDetails('${machineHealth.machine.uid}')">${notificationCount}</span>` : ''}
                </td>
                <td>${machineRoleEmoji} ${machineRole}</td>
                <td>${machineHealth.status.averageFPS.toFixed(2)}</td>
                <td>${machineHealth.status.videoDroppedFrames}</td>
                <td>${machineHealth.status.videoMissedFrames}</td>
                <td>
                    ${machineHealth.status.states.map(state => {
                        if (state.severity === 'offline' && state.category === 'connection') {
                            return `<div class="${state.severity}">⚠️ ${state.name}: ${state.detail || 'Machine is offline'}</div>`;
                        } else {
                            return `<div class="${state.severity}">${state.name}: ${state.detail}</div>`;
                        }
                    }).join('')}
                </td>
            </tr>`;
        }
        machineStatusTable.innerHTML = tableContent;
    }
}

function showNotificationDetails(machineUid) {
    const machineNotificationData = JSON.parse(localStorage.getItem('machineNotificationData'));
    if (machineNotificationData) {
        const machineNotifications = machineNotificationData.result.find(mn => mn.machine.uid === machineUid);
        if (machineNotifications) {
            let detailsContent = `<h2>Notifications for ${machineNotifications.machine.name}</h2>`;
            detailsContent += '<ul>';
            for (const notification of machineNotifications.notifications) {
                detailsContent += `<li><strong>${notification.summary}</strong>: ${notification.detail}</li>`;
            }
            detailsContent += '</ul>';
            notificationDetails.innerHTML = detailsContent;
            notificationDetails.style.display = 'block';
        }
    }
}

async function updateData() {
    await updateMachineStatus();
    const machineNotificationData = await fetchData('notifications');
    if (machineNotificationData) {
        localStorage.setItem('machineNotificationData', JSON.stringify(machineNotificationData));
    }
}

setInterval(updateData, 1000);
