async function fetchData(url, method = 'GET', body = null) {
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

const machineStatusTable = document.getElementById('machineStatusTable');
const notificationDetails = document.getElementById('notificationDetails');

async function updateMachineStatus() {
    const machineHealthData = await fetchData('http://localhost/api/session/status/health');
    const machineNotificationData = await fetchData('http://localhost/api/session/status/notifications');

    if (machineHealthData && machineHealthData.result && machineNotificationData && machineNotificationData.result) {
        let tableContent = '';
        for (const machineHealth of machineHealthData.result) {
            const machineRole = machineHealth.runningAsMachine.uid === machineHealth.machine.uid ? 'Director' : 'Actor';
            const machineNotifications = machineNotificationData.result.find(mn => mn.machine.uid === machineHealth.machine.uid);
            const notificationCount = machineNotifications ? machineNotifications.notifications.length : 0;
            tableContent += `<tr>
                <td>
                    ${machineHealth.machine.name}
                    ${notificationCount > 0 ? `<span class="notification-circle" onclick="showNotificationDetails('${machineHealth.machine.uid}')">${notificationCount}</span>` : ''}
                </td>
                <td>${machineRole}</td>
                <td>${machineHealth.status.averageFPS.toFixed(2)}</td>
                <td>${machineHealth.status.videoDroppedFrames}</td>
                <td>${machineHealth.status.videoMissedFrames}</td>
                <td>
                    ${machineHealth.status.states.map(state => `<div class="${state.severity}">${state.name}: ${state.detail}</div>`).join('')}
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
    const machineNotificationData = await fetchData('http://localhost/api/session/status/notifications');
    if (machineNotificationData) {
        localStorage.setItem('machineNotificationData', JSON.stringify(machineNotificationData));
    }
}

setInterval(updateData, 1000);
 