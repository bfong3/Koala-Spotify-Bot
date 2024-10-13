const SHEET_INDEX = 0; //Most recently created form is always gonna be 0 

function sortObjectByValuesAndKeys(obj) {
  // Convert the object into an array of [key, value] pairs
  const entries = Object.entries(obj);

  // Sort the entries based on values (descending) and keys (ascending) for ties
  entries.sort((a, b) => {
    // First, compare by value in descending order
    const valueComparison = b[1] - a[1];
    
    // If values are the same, compare by key in ascending order
    if (valueComparison === 0) {
      return a[0].localeCompare(b[0]);
    }
    
    // Return the comparison result for values
    return valueComparison;
  });

  // Convert back to an object (optional)
  const sortedObject = Object.fromEntries(entries);

  return sortedObject;
}

// True = winner, false = loser 
function formatScoresAsString(scores, isWinner) {
  // Convert scores to a sorted object
  const sortedScores = sortObjectByValuesAndKeys(scores);

  // Build a formatted string
  let result = (isWinner) ? 'Most Favorite Songs This Week:\n' : 'Least Favorite Songs This Week:\n';
  let index = 1; // Start index from 1
  for (const [key, value] of Object.entries(sortedScores)) {
    result += `${index}. ${key}: ${value}\n`; // Add index before each entry
    index++; // Increment index
  }

  return result.trim(); // Remove trailing newline
}

//Reads column 3-8
function addColumnScore(dictionary, columnIndex, columnData){
  const pointsAdded = 3 - ((columnIndex - 3) % 3);
  for(let i = 1; i < columnData.length; i++){
    if(columnData[i] in dictionary){
      dictionary[columnData[i]] += pointsAdded;
    } else{
      dictionary[columnData[i]] = pointsAdded;
    }
  }
  return dictionary;
}

function parseGoogleSheets() {
  const spreadsheet = SpreadsheetApp.openById(GOOGLE_SHEETS_ID);
  const sheet = spreadsheet.getSheets()[SHEET_INDEX];
  const lastRow = sheet.getLastRow();

  let winnerDict = {};
  let loserDict = {};

  for(let columnIndex = 3; columnIndex <= 8; columnIndex++){
    const columnValues = sheet.getRange(1, columnIndex, lastRow).getValues(); // This is an array of the Titles
    if (columnIndex <= 5) {
      winnerDict = addColumnScore(winnerDict, columnIndex, columnValues);
    } else{
      loserDict = addColumnScore(loserDict, columnIndex, columnValues);
    }
  }
  winnerDict = sortObjectByValuesAndKeys(winnerDict);
  loserDict = sortObjectByValuesAndKeys(loserDict)
  //console.log(winnerDict);
  //console.log(loserDict);
  winnerDict = formatScoresAsString(winnerDict, true);
  loserDict = formatScoresAsString(loserDict, false);
  console.log(winnerDict);
  console.log(loserDict);

}
