api_endpoint = "http://localhost:3000"

function enableSuburb(result) {

    if (result.value == 0) {
        document.getElementById('suburb_dropdown').classList.add('d-none')
        document.getElementById('suburb-select').classList.add('d-none')
        document.getElementById('uv-box').classList.add('d-none')
        document.getElementById('uv-body').classList.add('d-none')
        
        document.getElementById('suburb-select').value = 0;
    } else {
        // remove options
        const suburbSelectElement = document.getElementById('suburb-select');
        while (suburbSelectElement.options.length > 1) {
            suburbSelectElement.remove(1);
            }
        loadSuburbs(result.value)
    }
}

function enableUVCard(result) {
    if (result.value == 0) {
        document.getElementById('uv-box').classList.add('d-none')
    } else {
        const state = document.getElementById('state-select').value
        const suburb = result.value
        document.getElementById('uv-box').classList.remove('d-none')
        getCoordinates(state,suburb).then(coordinates => {
            if (coordinates) {
                fetchUVIndex(coordinates.latitude,coordinates.longitude).then(uvindex => {
                        fetchSuggestions(state,suburb,uvindex)
                })
            } else {
                console.log("No coordinates found")
            }
        })
    }
}

async function loadStates() {
    try {
        const response = await fetch(`${api_endpoint}/location/states`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        const stateSelect = document.getElementById('state-select');
        
        data.states.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelect.appendChild(option);
        });


    } catch (error) {
        console.error('Error in fetch operation:', error);
    }
}

async function loadSuburbs(state) {
    const loadingIndicator = document.getElementById('suburb-spinner');
    try {
        document.getElementById('suburb_dropdown').classList.remove('d-none')
        loadingIndicator.classList.remove('d-none');
        const response = await fetch(`${api_endpoint}/location/${state}/suburbs`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const suburbSelect = document.getElementById('suburb-select');
        data.suburbs.forEach(suburb => {
            const option = document.createElement('option');
            option.value = suburb;
            option.textContent = suburb;
            suburbSelect.appendChild(option);
        });
        loadingIndicator.classList.add('d-none');
        suburbSelect.classList.remove('d-none')
    } catch (error) {
        console.error('Error in fetch operation:', error);
        loadingIndicator.classList.add('d-none');
    }
}

async function getCoordinates(state,suburb)  {
    const loadingIndicator = document.getElementById('card-spinner');
    try {
        loadingIndicator.classList.remove('d-none');
        const response = await fetch(`${api_endpoint}/location/${state}/${suburb}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const {latitude, longitude} = data
        return {latitude, longitude};
    } catch (error) {
        console.error('Error in fetch operation:', error);
        loadingIndicator.classList.add('d-none');
    }
}

async function fetchUVIndex(lat,long) {
    const loadingIndicator = document.getElementById('card-spinner');
    try {
        loadingIndicator.classList.remove('d-none');
        const response = await fetch(`${api_endpoint}/uvlevel/${lat}/${long}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const uv_index = data.uvIndex
        return Math.round(uv_index)

    } catch (error) {
        console.error('Error in fetch operation:', error);
        loadingIndicator.classList.add('d-none');
    }
}

async function fetchSuggestions(state,suburb,uvindex) {
    const loadingIndicator = document.getElementById('card-spinner');
    try {
        loadingIndicator.classList.remove('d-none');
        const response = await fetch(`${api_endpoint}/suggestions/${uvindex}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        loadingIndicator.classList.add('d-none');
        document.getElementById('uv-body').classList.remove('d-none')

        // Update Values
        document.getElementById('location').textContent = `${suburb}, ${state}`
        document.getElementById('uv_index_label').textContent = uvindex;
        document.getElementById('clothing_accordion_para').textContent = data.clothing_suggestion
        document.getElementById('sunscreen_accordion_para').textContent = data.sunscreen_usage
    } catch (error) {
        console.error('Error in fetch operation:', error);
        loadingIndicator.classList.add('d-none');
    }
}


document.addEventListener('DOMContentLoaded',loadStates)