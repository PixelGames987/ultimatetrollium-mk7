let map;
let devices = [];
let currentMarkers = [];
let editingDeviceId = null;
let customIcons = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initIcons();
    loadDevices();
    setupEventListeners();
});

// Initialize custom icons
function initIcons() {
    // Define custom icons for different types with cyberpunk styling
    customIcons = {
        blue: L.divIcon({
            html: '<i class="fa fa-map-marker" style="color: #00b4d8; font-size: 24px; text-shadow: 0 0 5px #00b4d8;"></i>',
            className: 'custom-map-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
        }),
        red: L.divIcon({
            html: '<i class="fa fa-map-marker" style="color: #f72585; font-size: 24px; text-shadow: 0 0 5px #f72585;"></i>',
            className: 'custom-map-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
        }),
        orange: L.divIcon({
            html: '<i class="fa fa-map-marker" style="color: #ff9e00; font-size: 24px; text-shadow: 0 0 5px #ff9e00;"></i>',
            className: 'custom-map-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
        }),
        green: L.divIcon({
            html: '<i class="fa fa-map-marker" style="color: #39ff14; font-size: 24px; text-shadow: 0 0 5px #39ff14;"></i>',
            className: 'custom-map-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
        }),
        wifi: L.divIcon({
            html: '<i class="fa fa-wifi" style="color: #00b4d8; font-size: 20px; text-shadow: 0 0 5px #00b4d8;"></i>',
            className: 'custom-map-icon',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
        }),
        gate: L.divIcon({
            html: '<i class="fa fa-door-open" style="color: #ff9e00; font-size: 20px; text-shadow: 0 0 5px #ff9e00;"></i>',
            className: 'custom-map-icon',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
        })
    };
    
    // Set default selected icon
    selectIcon('red');
}

// Initialize the map with cyberpunk styling
function initMap() {
    map = L.map('map').setView([0, 0], 2);
    
    // Use a dark themed map style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    map.on('click', (e) => {
        document.getElementById('latitude').value = e.latlng.lat.toFixed(6);
        document.getElementById('longitude').value = e.latlng.lng.toFixed(6);
    });
}

// Toggle sidebar visibility
function toggleSidebar() {
    document.querySelector('.container').classList.toggle('sidebar-hidden');
}

// Load devices from JSON file or localStorage
function loadDevices() {
    const savedDevices = localStorage.getItem('wardriving-devices');
    
    if (savedDevices) {
        devices = JSON.parse(savedDevices);
        renderDevicesList();
        renderDevicesOnMap();
    } else {
        // Try to load from sample file
        fetch('data/devices.json')
            .then(response => response.json())
            .then(data => {
                devices = data;
                saveDevices();
                renderDevicesList();
                renderDevicesOnMap();
            })
            .catch(error => {
                console.log('No saved devices found, starting with empty list');
                devices = [];
            });
    }
}

// Save devices to localStorage
function saveDevices() {
    localStorage.setItem('wardriving-devices', JSON.stringify(devices));
}

// Render the devices list in the sidebar
function renderDevicesList() {
    const devicesList = document.getElementById('devices-list');
    devicesList.innerHTML = '';
    
    devices.forEach(device => {
        const listItem = document.createElement('li');
        listItem.className = 'device-item';
        listItem.textContent = device.name;
        listItem.setAttribute('data-id', device.id);
        listItem.addEventListener('click', () => selectDevice(device));
        devicesList.appendChild(listItem);
    });
}

// Select an icon option
function selectIcon(iconType) {
    // Reset previous selection
    document.querySelectorAll('.icon-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Set new selection
    const selectedOption = document.querySelector(`.icon-option[data-icon="${iconType}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
        document.getElementById('selected-icon').value = iconType;
    }
}

// Render devices as markers on the map
function renderDevicesOnMap() {
    // Clear existing markers
    currentMarkers.forEach(marker => map.removeLayer(marker));
    currentMarkers = [];
    
    // Add markers for each device
    devices.forEach(device => {
        // Use the device's icon type or default to red pin
        const iconType = device.iconType || 'red';
        const marker = L.marker([device.latitude, device.longitude], {
            icon: customIcons[iconType] || customIcons.red
        }).addTo(map);
        
        marker.bindPopup(`
            <div class="device-info-popup">
                <h3>${device.name}</h3>
                <div class="device-type">${device.deviceType}</div>
                <div>${device.information}</div>
                <div class="device-data">Lat: ${device.latitude}, Lng: ${device.longitude}</div>
                <button class="popup-edit" data-id="${device.id}">Edit</button>
                <button class="popup-delete" data-id="${device.id}">Delete</button>
            </div>
        `);
        
        marker.on('popupopen', (popup) => {
            // Add event listeners to popup buttons
            const editBtn = document.querySelector(`.popup-edit[data-id="${device.id}"]`);
            const deleteBtn = document.querySelector(`.popup-delete[data-id="${device.id}"]`);
            
            if (editBtn) editBtn.addEventListener('click', () => editDevice(device.id));
            if (deleteBtn) deleteBtn.addEventListener('click', () => deleteDevice(device.id));
        });
        
        currentMarkers.push(marker);
    });
    
    // If we have devices, fit map to show all markers
    if (devices.length > 0) {
        const group = L.featureGroup(currentMarkers);
        map.fitBounds(group.getBounds(), { padding: [30, 30] });
    }
}

// Select a device from the list
function selectDevice(device) {
    // Center map on the device
    map.setView([device.latitude, device.longitude], 15);
    
    // Find and open the marker popup
    const marker = currentMarkers.find(m => 
        m.getLatLng().lat === device.latitude && 
        m.getLatLng().lng === device.longitude
    );
    
    if (marker) marker.openPopup();
}

// Edit a device
function editDevice(id) {
    const device = devices.find(d => d.id === id);
    if (!device) return;
    
    // Fill the form with device data
    document.getElementById('name').value = device.name;
    document.getElementById('deviceType').value = device.deviceType;
    document.getElementById('information').value = device.information;
    document.getElementById('latitude').value = device.latitude;
    document.getElementById('longitude').value = device.longitude;
    
    // Select the icon
    selectIcon(device.iconType || 'red');
    
    editingDeviceId = id;
    
    // Change button text
    const addButton = document.getElementById('add-device');
    addButton.textContent = 'Update Device';
    
    // Scroll to form
    document.querySelector('.device-controls').scrollIntoView({ behavior: 'smooth' });
}

// Delete a device
function deleteDevice(id) {
    if (confirm('Are you sure you want to delete this device?')) {
        devices = devices.filter(device => device.id !== id);
        saveDevices();
        renderDevicesList();
        renderDevicesOnMap();
    }
}

// Set up event listeners
function setupEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
    
    // Icon selection event listeners
    document.querySelectorAll('.icon-option').forEach(option => {
        option.addEventListener('click', () => {
            const iconType = option.getAttribute('data-icon');
            selectIcon(iconType);
        });
    });
    
    // Add/edit device form submission
    document.getElementById('device-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const deviceData = {
            name: document.getElementById('name').value,
            deviceType: document.getElementById('deviceType').value,
            information: document.getElementById('information').value,
            latitude: parseFloat(document.getElementById('latitude').value),
            longitude: parseFloat(document.getElementById('longitude').value),
            iconType: document.getElementById('selected-icon').value
        };
        
        if (editingDeviceId) {
            // Update existing device
            const index = devices.findIndex(d => d.id === editingDeviceId);
            if (index !== -1) {
                deviceData.id = editingDeviceId;
                devices[index] = deviceData;
            }
            editingDeviceId = null;
            document.getElementById('add-device').textContent = 'Add Device';
        } else {
            // Add new device
            deviceData.id = Date.now().toString();
            devices.push(deviceData);
        }
        
        saveDevices();
        renderDevicesList();
        renderDevicesOnMap();
        
        // Reset the form
        document.getElementById('device-form').reset();
        // Reset icon selection to default (red)
        selectIcon('red');
    });
    
    // Use current location button
    document.getElementById('use-current-location').addEventListener('click', () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                document.getElementById('latitude').value = position.coords.latitude.toFixed(6);
                document.getElementById('longitude').value = position.coords.longitude.toFixed(6);
            }, () => {
                alert('Unable to get your location. Make sure location services are enabled.');
            });
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    });
    
    // Export JSON button
    document.getElementById('export-json').addEventListener('click', () => {
        const dataStr = JSON.stringify(devices, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wardriving-devices.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    // Import JSON button
    document.getElementById('import-json').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    
    document.getElementById('import-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedDevices = JSON.parse(event.target.result);
                if (Array.isArray(importedDevices)) {
                    if (confirm(`Import ${importedDevices.length} devices? This will replace your current data.`)) {
                        devices = importedDevices;
                        saveDevices();
                        renderDevicesList();
                        renderDevicesOnMap();
                    }
                } else {
                    alert('Invalid data format. The file should contain a JSON array of devices.');
                }
            } catch (error) {
                alert('Error parsing JSON file: ' + error.message);
            }
            e.target.value = null; // Reset file input
        };
        reader.readAsText(file);
    });
}
