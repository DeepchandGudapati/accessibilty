// addLocation.js
const fetch = require('node-fetch');
const { Octokit } = require('@octokit/rest');
const csv = require('csv-parser');
const { Readable } = require('stream');

exports.handler = async (event, context) => {
  try {
    // Parse incoming request body
    const body = JSON.parse(event.body);
    const { address, lat, lng } = body;

    // Load CSV data from GitHub
    const csvContent = await loadCSVFromGitHub();

    // Parse CSV data into an array of objects
    let data = await parseCSV(csvContent);

    if (address && lat && lng) {
      // Add new location data to the array
      data.push({ address: address, lat: lat, lng: lng });

      // Convert data back to CSV format
      const updatedCSV = await convertToCSV(data);

      // Push updated CSV content back to GitHub
      await updateCSVInGitHub(updatedCSV);
    }

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Location added successfully' }),
    };
  } catch (error) {
    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to add location' }),
    };
  }
};

async function loadCSVFromGitHub() {
  // Fetch raw content of the CSV file from GitHub
  const response = await fetch('https://raw.githubusercontent.com/DeepchandGudapati/accessibilty/venueswheelchairaccess2.csv');
  return response.text();
}

async function parseCSV(csvContent) {
  return new Promise((resolve, reject) => {
    const results = [];
    Readable.from(csvContent)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

async function convertToCSV(data) {
  return new Promise((resolve, reject) => {
    const headers = Object.keys(data[0]).join(',') + '\n';
    let csvContent = headers;
    data.forEach((row) => {
      csvContent += Object.values(row).join(',') + '\n';
    });
    resolve(csvContent);
  });
}

async function updateCSVInGitHub(csvContent) {
  const octokit = new Octokit({
    auth: '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', // Replace with your GitHub personal access token
  });

  // Create a new commit with the updated CSV content
  const owner = 'DeepchandGudapati';
  const repo = 'accessibilty';
  const path = 'venueswheelchairaccess2.csv';
  const content = Buffer.from(csvContent).toString('base64');
  const { data: { commit } } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: 'Update CSV with new location',
    content,
    sha: 'f40e538', // Replace with the SHA of your CSV file
  });
}
