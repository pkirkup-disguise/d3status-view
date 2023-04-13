const config = JSON.parse(localStorage.getItem('config')) || { hostname: 'localhost', port: '80' };

const layerStatusTable = document.getElementById('layerStatusTable');

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

        function getLayerAction(layerUid, action) {
            return {
                layers: [
                    {
                        uid: layerUid
                    }
                ]
            };
        }

        async function performLayerAction(layerUid, action) {
const endpoint = `http://${config.hostname}:${config.port}/api/session/renderstream/${action}`;
await fetchData(endpoint, 'POST', getLayerAction(layerUid, action));
updateLayerStatus();
}
    function renderStreamInfo(streams) {
        if (!streams || streams.length === 0) {
            return 'No streams';
        }

        let streamInfo = '';
        for (const stream of streams) {
            streamInfo += `<div>${stream.name} (${stream.sourceMachine} ➡️ ${stream.receiverMachine}): ${stream.statusString}</div>`;
        }
        return streamInfo;
    }

    function createLayerConfigDiv(layerUid) {
  const existingLayerConfigDiv = document.getElementById(`layerConfig-${layerUid}`);
  if (existingLayerConfigDiv) {
    return existingLayerConfigDiv;
  }
  const layerConfigDiv = document.createElement('div');
  layerConfigDiv.id = `layerConfig-${layerUid}`;
  layerConfigDiv.style.display = 'none';
  layerConfigDiv.style.padding = '8px';
  layerConfigDiv.style.border = '1px solid #E5E5E5';
  layerConfigDiv.style.backgroundColor = '#F7F7F7';
  layerConfigDiv.style.fontSize = '14px';
  layerConfigDiv.style.marginTop = '4px';

  return layerConfigDiv;
}


    async function showLayerConfig(layerUid) {
        const layerConfigDiv = document.getElementById(`layerConfig-${layerUid}`);
        if (layerConfigDiv.style.display === 'block') {
            layerConfigDiv.style.display = 'none';
        } else {
            const layerConfigData = await fetchData(`http://${config.hostname}:${config.port}/api/session/renderstream/layerconfig?uid=${layerUid}`);
            if (layerConfigData && layerConfigData.result) {
                const layerConfig = layerConfigData.result;
                const layerConfigTable = document.createElement('table');
                for (const channelMapping of layerConfig.channelMappings) {
                    layerConfigTable.innerHTML += `<tr><td>${channelMapping.channel}</td><td>${channelMapping.mapping.name}</td><td>${channelMapping.assigner.name}</td></tr>`;
                }
                const layerConfigDivContent = `
                    <p><strong>Asset:</strong> ${layerConfig.asset.name}</p>
                    <p><strong>Pool:</strong> ${layerConfig.pool.name}</p>
                    <p><strong>Default Assigner:</strong> ${layerConfig.defaultAssigner.name}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Channel</th>
                                <th>Mapping</th>
                                <th>Assigner</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${layerConfigTable.innerHTML}
                        </tbody>
                    </table>
                `;
                layerConfigDiv.innerHTML = layerConfigDivContent;
                layerConfigDiv.style.display = 'block';
            }
        }
    }

async function updateLayerStatus() {
  const layersData = await fetchData(`http://${config.hostname}:${config.port}/api/session/renderstream/layers`);
if (layersData && layersData.result) {
    let tableContent = '';
    for (const layer of layersData.result) {
      const layerStatusData = await fetchData(`http://${config.hostname}:${config.port}/api/session/renderstream/layerstatus?uid=${layer.uid}`);
      if (layerStatusData && layerStatusData.result) {
        const instance = layerStatusData.result.workload.instances[0];
        const layerConfigDiv = createLayerConfigDiv(layer.uid);
        // Check if the layer configuration div is already visible and preserve its content
        const existingLayerConfigDiv = document.getElementById(`layerConfig-${layer.uid}`);
        let existingLayerConfigDivContent = '';
        if (existingLayerConfigDiv && existingLayerConfigDiv.style.display === 'block') {
          existingLayerConfigDivContent = existingLayerConfigDiv.innerHTML;
        }
        tableContent += `<tr>
          <td>${layer.name}</td>
          <td>${instance.machineName}</td>
          <td>${instance.state}</td>
          <td>${instance.healthMessage}</td>
          <td>${instance.healthDetails}</td>
          <td>${renderStreamInfo(layerStatusData.result.streams)}</td>
          <td>
            <span class="action-icons" onclick="performLayerAction('${layer.uid}', 'startlayers')">▶️</span>
            <span class="action-icons" onclick="performLayerAction('${layer.uid}', 'stoplayers')">⏹️</span>
            <span class="action-icons" onclick="performLayerAction('${layer.uid}', 'restartlayers')">🔁</span>
            <span class="action-icons" onclick="performLayerAction('${layer.uid}', 'synclayers')">🔄</span>
          </td>
          <td>
            <span class="show-layer-config" onclick="showLayerConfig('${layer.uid}')">🔍</span>
            ${layerConfigDiv.outerHTML}
          </td>
        </tr>`;
        // If the layer configuration div was visible, preserve its content and display it again
        if (existingLayerConfigDiv && existingLayerConfigDiv.style.display === 'block') {
          existingLayerConfigDiv.innerHTML = existingLayerConfigDivContent;
          layerConfigDiv.style.display = 'none';
          existingLayerConfigDiv.style.display = 'block';
        }
      }
    }
    layerStatusTable.innerHTML = tableContent;
  }
}   
setInterval(updateLayerStatus, 1000);

