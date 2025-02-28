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
  fs.writeFileSync(ADDONS_FILE, JSON.stringify([], null, 2));
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

// Delete an addon
app.delete('/api/addons/:title', (req, res) => {
  const { title } = req.params;
  const addons = readAddons();
  
  const filteredAddons = addons.filter(addon => addon.title.toLowerCase() !== title.toLowerCase());
  
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
// Note: In a production environment, you would use a more secure authentication system
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Hardcoded credentials for simplicity
  // In a real application, you would use a database and proper password hashing
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