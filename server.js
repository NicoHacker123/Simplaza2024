const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADDONS_FILE = path.join(__dirname, 'addons.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize addons file if it doesn't exist
if (!fs.existsSync(ADDONS_FILE)) {
  // Initialize with the IniBuilds A350 preset
  const initialAddons = [
    { 
      title: "IniBuilds A350 2020 1.0.0", 
      image: "https://i.imgur.com/nKLOEQk.jpg", 
      link: "https://drive.google.com/file/d/1Hft9rRQQXw7TZoGzZsOX_uF-1pJd6eiG/view" 
    }
  ];
  fs.writeFileSync(ADDONS_FILE, JSON.stringify(initialAddons, null, 2));
}

// Helper function to read addons
const readAddons = () => {
  try {
    const addonsData = fs.readFileSync(ADDONS_FILE, 'utf8');
    return JSON.parse(addonsData);
  } catch (error) {
    console.error('Error reading addons file:', error);
    return [];
  }
};

// Helper function to write addons
const writeAddons = (addons) => {
  try {
    fs.writeFileSync(ADDONS_FILE, JSON.stringify(addons, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing addons file:', error);
    return false;
  }
};

// API Endpoints
// Get all addons
app.get('/api/addons', (req, res) => {
  const addons = readAddons();
  res.json(addons);
});

// Add a new addon
app.post('/api/addons', (req, res) => {
  const { title, image, link } = req.body;
  
  if (!title || !link) {
    return res.status(400).json({ error: 'Title and link are required' });
  }
  
  const addons = readAddons();
  
  // Check if addon with same title already exists
  const existingAddonIndex = addons.findIndex(addon => addon.title.toLowerCase() === title.toLowerCase());
  
  if (existingAddonIndex >= 0) {
    // Update existing addon
    addons[existingAddonIndex] = { title, image, link };
  } else {
    // Add new addon
    addons.push({ title, image, link });
  }
  
  if (writeAddons(addons)) {
    res.status(201).json({ message: 'Addon added successfully', addon: { title, image, link } });
  } else {
    res.status(500).json({ error: 'Failed to add addon' });
  }
});

// Update an existing addon
app.put('/api/addons/:title', (req, res) => {
  const originalTitle = decodeURIComponent(req.params.title);
  const { title, image, link } = req.body;
  
  if (!title || !link) {
    return res.status(400).json({ error: 'Title and link are required' });
  }
  
  const addons = readAddons();
  
  // Find the addon to update
  const addonIndex = addons.findIndex(addon => addon.title === originalTitle);
  
  if (addonIndex === -1) {
    return res.status(404).json({ error: 'Addon not found' });
  }
  
  // Update the addon
  addons[addonIndex] = { title, image, link };
  
  if (writeAddons(addons)) {
    res.json({ 
      message: 'Addon updated successfully', 
      addon: { title, image, link } 
    });
  } else {
    res.status(500).json({ error: 'Failed to update addon' });
  }
});

// Delete an addon
app.delete('/api/addons/:title', (req, res) => {
  const { title } = req.params;
  const decodedTitle = decodeURIComponent(title);
  const addons = readAddons();
  
  const filteredAddons = addons.filter(addon => addon.title !== decodedTitle);
  
  if (filteredAddons.length < addons.length) {
    if (writeAddons(filteredAddons)) {
      res.json({ message: 'Addon deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete addon' });
    }
  } else {
    res.status(404).json({ error: 'Addon not found' });
  }
});

// Basic authentication for owner access
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Hardcoded credentials for simplicity
  if (username === 'admin' && password === '123') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});