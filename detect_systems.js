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
        const url = `http://${config.hostname}:${config.port}/api/service/system/${path}`;
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

async function fetchDetectedSystems() {
    return await fetchData('detectsystems');
}

const detectSystemsTable = document.getElementById('detectSystemsTable');

async function updateDetectedSystems() {
    const detectedSystemsData = await fetchDetectedSystems();

    if (detectedSystemsData && detectedSystemsData.result) {
        let tableContent = '';
        for (const system of detectedSystemsData.result) {
            const version = `${system.version.major}.${system.version.minor}.${system.version.hotfix}.${system.version.revision}`;
            tableContent += `<tr>
                <td>${system.hostname}</td>
                <td>${system.type}</td>
                <td>${version}</td>
                <td>${system.runningProject}</td>
                <td>${system.ipAddress}</td>
                <td>${system.isDesignerRunning ? '✔️' : '❌'}</td>
                <td>${system.isServiceRunning ? '✔️' : '❌'}</td>
                <td>${system.isManagerRunning ? '✔️' : '❌'}</td>
                <td>${system.isNotchHostRunning ? '✔️' : '❌'}</td>
            </tr>`;
    }
    detectSystemsTable.innerHTML = tableContent;
}
}

async function updateData() {
await updateDetectedSystems();
}

setInterval(updateData, 1000);