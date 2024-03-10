// Import required modules
const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const fetch = require('node-fetch');

// Create Express application
const app = express();

app.use(cors());

// Set up connection parameters
const dbConfig = {
  user:  'admin',
  password: 'FITTeam26',
  connectString: 'onboardingdb-t26.c9i8okgcuhyb.us-east-1.rds.amazonaws.com:1521/ORCL' // host:port/service_name
};


// For list of states 
app.get('/location/states', async (req, res) => {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    const query = `SELECT DISTINCT STATE FROM LOCATION`;
    const result = await connection.execute(query);
    await connection.close();
    const states = result.rows.map(row => row[0]);
    res.json({states});

  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// For List of suburbs based on state input
app.get('/location/:state/suburbs', async (req, res) => {
  try {
    const state = req.params.state;
    const connection = await oracledb.getConnection(dbConfig);
    const query = `SELECT DISTINCT SUBURB FROM LOCATION WHERE UPPER(STATE) = UPPER(:state)`;
    const result = await connection.execute(query,[state]);

    await connection.close();
    if (result.rows.length > 0) {
      const suburbs = result.rows.map(row => row[0])
        res.json({
          suburbs
        });
      } else {
        res.status(404).json({ message: 'No data found' });
      }
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// For Lat and Lon
app.get('/location/:state/:suburb', async (req, res) => {
  try {
    const state = req.params.state;
    const suburb = req.params.suburb;

    const connection = await oracledb.getConnection(dbConfig);
    const query = `SELECT LAT,LON FROM LOCATION WHERE UPPER(STATE) = UPPER(:state) AND UPPER(SUBURB) = UPPER(:suburb)`;
    const result = await connection.execute(query,[state, suburb]);

    await connection.close();
    if (result.rows.length > 0) {
        const [latitude, longitude] = result.rows[0];
        const coordinates = { latitude, longitude };
        res.json(coordinates);
      } else {
        res.status(404).json({ message: 'No data found' });
      }
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


//UV Index level from Openweather API
app.get('/uvlevel/:lat/:lon', async (req, res) => {
  try {
    const lat = req.params.lat;
    const lon = req.params.lon;
   
    const apiKey = '8526e4de9f3fc4831a1af16efbd11516'; 
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    const response = await fetch(url);
    if (response.ok) {
      const uvData = await response.json();
      const uvIndex = uvData.current.uvi;
      res.json({ uvIndex });
    } else {
      res.status(response.status).json({ message: `Error: Unable to retrieve data, status code ${response.status}` });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


// Suggestions using UV Levels
app.get('/suggestions/:uvLevel', async (req, res) => {
  try {
    const uvLevel = req.params.uvLevel;

    const connection = await oracledb.getConnection(dbConfig);
    
    const query = `SELECT CLOTHING_SUGGESTION, SUNSCREEN_USAGE
                   FROM UV_INDEX_SUGGETIONS
                   WHERE UV_Index = :uvLevel`;
    
    const result = await connection.execute(query, [uvLevel]);
    await connection.close();

    if (result.rows.length > 0) {
      const [clothingSuggestion, sunscreenUsage] = result.rows[0];
      const suggestionsJSON = {
        "clothing_suggestion": clothingSuggestion,
        "sunscreen_usage": sunscreenUsage
      };
      res.json(suggestionsJSON);
    } else {
      res.status(404).json({ message: 'No suggestions found for the provided UV level' });
    }
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


// Start the Express server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
