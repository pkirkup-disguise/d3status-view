// Fetch the active transports and tracks when the page loads
window.addEventListener('load', function() {
    fetch('http://localhost/api/session/transport/activetransport')
        .then(response => response.json())
        .then(data => {
            const transportSelect = document.getElementById('transportSelect');
            data.result.forEach(transport => {
                const option = document.createElement('option');
                option.value = transport.uid;
                option.textContent = transport.name;
                transportSelect.appendChild(option);
            });
        });

    fetch('http://localhost/api/session/transport/tracks')
        .then(response => response.json())
        .then(data => {
            const trackSelect = document.getElementById('trackSelect');
            data.result.forEach(track => {
                const option = document.createElement('option');
                option.value = track.uid;
                option.textContent = track.name;
                trackSelect.appendChild(option);
            });
            // Trigger 'change' event after populating dropdown
            trackSelect.dispatchEvent(new Event('change'));
        });
	const timeline = document.getElementById('annotationsTimeline');
    for (let i = 15; i < timeline.offsetWidth / 15; i++) {
        const indicator = document.createElement('div');
        indicator.className = 'indicator';
        indicator.style.left = `${(i * 15) / timeline.offsetWidth * 100}%`;
        timeline.appendChild(indicator);
    }
});

// Event listener for track selection
document.getElementById('trackSelect').addEventListener('change', function() {
    const selectedTrackUid = this.value;
    const selectedTrackName = this.options[this.selectedIndex].text;
    const transportSelect = document.getElementById('transportSelect');
    const selectedTransportUid = transportSelect.value;
    const selectedTransportName = transportSelect.options[transportSelect.selectedIndex].text;

    // Change track
    fetch('http://localhost/api/session/transport/gototrack', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            transports: [
                {
                    transport: {
                        uid: selectedTransportUid,
                        name: selectedTransportName
                    },
                    track: {
                        uid: selectedTrackUid,
                        name: selectedTrackName
                    },
                    playmode: 'NotSet'
                }
            ]
        })
    });

    // Fetch track length
    fetch('http://localhost/api/session/transport/tracks')
        .then(response => response.json())
        .then(data => {
            const track = data.result.find(track => track.uid === selectedTrackUid);
            const trackLength = track.length; // in seconds

            // Fetch and display annotations
            fetch(`http://localhost/api/session/transport/annotations?uid=${selectedTrackUid}`)
                .then(response => response.json())
                .then(data => {
                    const annotationsTimeline = document.getElementById('annotationsTimeline');
                    annotationsTimeline.innerHTML = ''; // Clear the current annotations
                    const { notes, tags, sections } = data.result.annotations;

                    // Create annotations for notes and tags
                    notes.forEach(note => {
                        const annotationDiv = document.createElement('div');
                        annotationDiv.className = 'annotation note';
                        annotationDiv.style.left = `${(note.time / trackLength) * 100}%`;
                        annotationDiv.textContent = note.text;
                        annotationDiv.title = note.text;
                        annotationsTimeline.appendChild(annotationDiv);
                    });

                    tags.forEach(tag => {
                        const annotationDiv = document.createElement('div');
                        annotationDiv.className = 'annotation tag';
                        annotationDiv.style.left = `${(tag.time / trackLength) * 100}%`;
                        annotationDiv.textContent = `${tag.type}: ${tag.value}`;
                        annotationDiv.title = `${tag.type}: ${tag.value}`;
                        annotationsTimeline.appendChild(annotationDiv);
                    });

                    // Create background colors for sections
                    sections.forEach((section, index) => {
                        const sectionDiv = document.createElement('div');
                        sectionDiv.className = 'section';
                        sectionDiv.style.left = `${(section.time / trackLength) * 100}%`;
                        sectionDiv.style.width = `${((sections[index + 1]?.time || trackLength) - section.time) / trackLength * 100}%`;
                        sectionDiv.style.backgroundColor = index % 2 === 0 ? 'lightblue' : 'lightred';
                        annotationsTimeline.insertBefore(sectionDiv, annotationsTimeline.firstChild);
                    });
                });
        });
});


function postToTransportEndpoint(endpoint, includePlaymode = false) {
    const selectedTransportUid = document.getElementById('transportSelect').value;
    let payload = {
        "transports": [
            {
                "uid": selectedTransportUid,
                "name": document.getElementById('transportSelect').selectedOptions[0].text
            }
        ]
    };

    if (includePlaymode) {
        const selectedPlaymode = document.getElementById('playmodeSelect').value;
        payload.transports[0].playmode = selectedPlaymode;
    }

    fetch(endpoint, {
        method: 'POST', 
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

// Event listeners for the buttons
document.getElementById('playButton').addEventListener('click', function() {
    postToTransportEndpoint('http://localhost/api/session/transport/play');
});

document.getElementById('pauseButton').addEventListener('click', function() {
    postToTransportEndpoint('http://localhost/api/session/transport/stop');
});

document.getElementById('loopButton').addEventListener('click', function() {
    postToTransportEndpoint('http://localhost/api/session/transport/playloopsection');
});

document.getElementById('returnButton').addEventListener('click', function() {
    postToTransportEndpoint('http://localhost/api/session/transport/returntostart');
});

document.getElementById('playSectionButton').addEventListener('click', function() {
    postToTransportEndpoint('http://localhost/api/session/transport/playsection', true);
});

document.getElementById('nextSectionButton').addEventListener('click', function() {
    postToTransportEndpoint('http://localhost/api/session/transport/gotonextsection', true);
});

document.getElementById('prevSectionButton').addEventListener('click', function() {
    postToTransportEndpoint('http://localhost/api/session/transport/gotoprevsection', true);
});

