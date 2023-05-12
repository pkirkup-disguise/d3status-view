const config = JSON.parse(localStorage.getItem('config')) || { hostname: 'localhost', port: '80' };
function fetchAPI(endpoint, method = 'GET', body = null) {
    return fetch(`http://${config.hostname}:${config.port}/api/session/transport/${endpoint}`, {
        method: method,
        body: body ? JSON.stringify(body) : null,
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json());
}

const createOption = (parent, value, text, selected = false) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    option.selected = selected;
    parent.appendChild(option);
};

window.addEventListener('load', () => {
    fetchAPI('activetransport').then(data => {
        const transportSelect = document.getElementById('transportSelect');
        data.result.forEach(({ uid, name }) => createOption(transportSelect, uid, name));
        fetchTracksAndPopulateDropdown(data.result[0].currentTrack.uid);
    });
});

document.getElementById('trackSelect').addEventListener('change', fetchTrackAnnotations);

function fetchTracksAndPopulateDropdown(activeTrackUid) {
    fetchAPI('tracks').then(data => {
        const trackSelect = document.getElementById('trackSelect');
        data.result.forEach(({ uid, name }) => createOption(trackSelect, uid, name, uid === activeTrackUid));
        fetchTrackAnnotations();
    });
}

function createTimelineMarker(parent, className, position, height = 'auto') {
    const markerDiv = document.createElement('div');
    markerDiv.className = className;
    markerDiv.style.left = `${position}%`;
    markerDiv.style.height = height;
    parent.appendChild(markerDiv);
    return markerDiv;
}

function fetchTrackAnnotations() {
    const trackUid = document.getElementById('trackSelect').value;
    fetchAPI('tracks').then(data => {
        const track = data.result.find(({ uid }) => uid === trackUid);
        const trackLength = track.length;
        const annotationsTimeline = document.getElementById('annotationsTimeline');
        annotationsTimeline.innerHTML = '';
        const majorMarkerInterval = 15, minorMarkerInterval = 1;
        Array.from({ length: Math.floor(trackLength / majorMarkerInterval) + 1 }, (_, i) => createTimelineMarker(annotationsTimeline, 'timelineMarker', (i * majorMarkerInterval / trackLength) * 100));
        Array.from({ length: Math.floor(trackLength / minorMarkerInterval) + 1 }, (_, i) => createTimelineMarker(annotationsTimeline, 'minorTimelineMarker', (i * minorMarkerInterval / trackLength) * 100, '20px'));
        
        fetchAPI(`annotations?uid=${trackUid}`).then(data => {
            const { notes, tags, sections } = data.result.annotations;
            const selectedTransportUid = document.getElementById('transportSelect').value;
            const selectedTransportName = document.getElementById('transportSelect').selectedOptions[0].text;
            
            sections.forEach((section, index) => {
    const sectionDiv = createTimelineMarker(annotationsTimeline, 'section', (section.time / trackLength) * 100);
    sectionDiv.style.width = `${((sections[index + 1]?.time || trackLength) - section.time) / trackLength * 100}%`;
    sectionDiv.style.backgroundColor = index % 2 === 0 ? 'lightblue' : 'red';
    sectionDiv.addEventListener('click', () => {
        const payload = {
            "transports": [
                {
                    "uid": selectedTransportUid,
                    "name": selectedTransportName,
                    "section": index, // use index instead of section name
                    "playmode": "NotSet"
                }
            ]
        };
        fetchAPI('gotosection', 'POST', payload);
    });
    annotationsTimeline.appendChild(sectionDiv);
});



            notes.forEach((note, index) => {
                const annotationDiv = document.createElement('div');
                annotationDiv.className = 'annotation note';
                annotationDiv.style.left = `${(note.time / trackLength) * 100}%`;
                annotationDiv.textContent = note.text;
                annotationDiv.title = note.text;
                annotationDiv.style.top = `${index * 20}px`;
                annotationsTimeline.appendChild(annotationDiv);
            });

            tags.forEach((tag, index) => {
                const annotationDiv = document.createElement('div');
                annotationDiv.className = 'annotation tag';
                annotationDiv.style.left = `${(tag.time / trackLength) * 100}%`;
                annotationDiv.textContent = `${tag.type}: ${tag.value}`;
                annotationDiv.title = `${tag.type}: ${tag.value}`;
                annotationDiv.style.top = `${(index + notes.length) * 20}px`;
                annotationDiv.addEventListener('click', () => {
    const payload = {
        "transports": [
            {
                "transport": {
                    "uid": selectedTransportUid,
                    "name": selectedTransportName
                },
                "type": tag.type,
                "value": tag.value,
                "allowGlobalJump": true,
                "playmode": "NotSet"
            }
        ]
    };
    fetchAPI('gototag', 'POST', payload);
});

                annotationsTimeline.appendChild(annotationDiv);
            });
        }).catch(error => console.error('Error fetching annotations:', error));
    });
}




function postToTransportEndpoint(endpoint) {
    const selectedTransportUid = document.getElementById('transportSelect').value;
    fetch(`http://${config.hostname}:${config.port}/api/session/transport/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({
            transports: [{
                uid: selectedTransportUid,
                name: document.getElementById('transportSelect').selectedOptions[0].text,
                                playmode: document.getElementById('playmodeSelect')?.value
            }]
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

const addButtonListener = (buttonId, endpoint) => {
    document.getElementById(buttonId).addEventListener('click', () => postToTransportEndpoint(endpoint));
};

['play', 'stop', 'playloopsection', 'returntostart', 'playsection', 'gotonextsection', 'gotoprevsection'].forEach((endpoint, index) => {
    const buttonId = ['playButton', 'pauseButton', 'loopButton', 'returnButton', 'playSectionButton', 'nextSectionButton', 'prevSectionButton'][index];
    addButtonListener(buttonId, endpoint);
});
