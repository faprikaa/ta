const express = require('express');
const router = express.Router();

// Sample route
router.get('/test', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is working'
  });
});

// Receive browsing history data
router.post('/history', (req, res) => {
  try {
    const historyData = req.body;
    console.log('Received history data:', historyData);
    // TODO: Add database storage logic here
    res.status(201).json({
      status: 'success',
      message: 'History data received successfully',
      data: historyData
    });
  } catch (error) {
    console.error('Error processing history data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error processing history data',
      error: error.message
    });
  }
});

// Receive bookmark data
router.post('/bookmarks', (req, res) => {
  try {
    const bookmarkData = req.body;
    console.log('Received bookmark data:', bookmarkData);
    // TODO: Add database storage logic here
    res.status(201).json({
      status: 'success',
      message: 'Bookmark data received successfully',
      data: bookmarkData
    });
  } catch (error) {
    console.error('Error processing bookmark data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error processing bookmark data',
      error: error.message
    });
  }
});

// Receive tab data
router.post('/tabs', (req, res) => {
  try {
    const tabData = req.body;
    console.log('Received tab data:', tabData);
    // TODO: Add database storage logic here
    res.status(201).json({
      status: 'success',
      message: 'Tab data received successfully',
      data: tabData
    });
  } catch (error) {
    console.error('Error processing tab data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error processing tab data',
      error: error.message
    });
  }
});

// Get all stored data
router.get('/data', (req, res) => {
  try {
    // TODO: Add database retrieval logic here
    res.status(200).json({
      status: 'success',
      message: 'Data retrieved successfully',
      data: {
        history: [],
        bookmarks: [],
        tabs: []
      }
    });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error retrieving data',
      error: error.message
    });
  }
});

module.exports = router; 