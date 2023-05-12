const config = JSON.parse(localStorage.getItem('config')) || { hostname: 'localhost', port: '80' };

async function fetchData(path, method = 'GET', body = null, isProjectRequest = false) {
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
        const basePath = isProjectRequest ? '/api/service/project/' : '/api/service/system/';
        const url = `http://${config.hostname}:${config.port}${basePath}${path}`;
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        if (data.status.code !== 0) {
            throw new Error(data.status.message);
        }
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}



async function fetchProjectData(path, method = "GET", body = null) {
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const url = `http://${config.hostname}:${config.port}/api/service/project/${path}`;
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}


async function fetchDetectedSystems() {
    return await fetchData('detectsystems');
}

async function fetchProjects(hostname) {
  const data = await fetchData(`system/projects?hostname=${hostname}`);
  if (data) {
    return { projects: data.result, error: false };
  } else {
    return { projects: [], error: true };
  }
}



async function startLocalProject(projectPath) {
  const payload = {
    projectPath,
    soloMode: true,
    allowUpgrade: true,
  };
  return await fetchData("startlocalproject", "POST", payload, true);
}






function addStartButtonEventListeners() {
  const startButtons = document.querySelectorAll(".start-button");
  startButtons.forEach((button) =>
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      const projectPath = event.target.dataset.projectPath;
      await startLocalProject(projectPath);
    })
  );
}

function createProjectDropdown(projects) {
  let dropdown = `<select class="project-dropdown">`;
  for (const project of projects) {
    dropdown += `<option value="${project.path}">${project.path}</option>`;
  }
  dropdown += `</select>`;
  return dropdown;
}


const detectSystemsTable = document.getElementById('detectSystemsTable');

async function updateDetectedSystems() {
  const detectedSystemsData = await fetchDetectedSystems();

  if (detectedSystemsData && detectedSystemsData.result) {
    let tableContent = "";
    for (const system of detectedSystemsData.result) {
      const { projects, error } = await fetchProjects(system.hostname);
      const version = `${system.version.major}.${system.version.minor}.${system.version.hotfix}.${system.version.revision}`;

      const projectOptions = projects
        .map((project) => `<option value="${project.path}">${project.path}</option>`)
        .join("");

      const projectSelect = `<select class="${error ? "offline-machine" : ""}" ${error ? "disabled" : ""}>${projectOptions}</select>`;
      tableContent += `<tr>
          <td>${system.hostname}</td>
          <td>${system.type}</td>
          <td>r${version}</td>
          <td>${system.runningProject}</td>
          <td>${system.ipAddress}</td>
          <td>${system.isDesignerRunning ? "✔️" : "❌"}</td>
          <td>${system.isServiceRunning ? "✔️" : "❌"}</td>
          <td>${system.isManagerRunning ? "✔️" : "❌"}</td>
          <td>${system.isNotchHostRunning ? "✔️" : "❌"}</td>
          <td>${projectSelect}</td>
          <td><button class="start-project-button" data-hostname="${system.hostname}" ${error ? "disabled" : ""}>▶️</button></td>
      </tr>`;
    }
    detectSystemsTable.innerHTML = tableContent;
    attachStartProjectButtonListeners();
  }
}


async function updateData() {
await updateDetectedSystems();
}

setInterval(updateData, 1000);