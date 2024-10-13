const SHEET_INDEX = 0; //Most recently created form is always gonna be 0 

function sortObjectByValuesAndKeys(obj) {
  // Convert the object into an array of [key, value] pairs
  const entries = Object.entries(obj);

  // Sort the entries based on the score (descending) and name (ascending) for ties
  entries.sort((a, b) => {
    // Compare scores in descending order
    const scoreComparison = b[1].score - a[1].score;

    // If scores are the same, compare keys (names) in ascending order
    if (scoreComparison === 0) {
      return a[0].localeCompare(b[0]);
    }

    // Return the comparison result for scores
    return scoreComparison;
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
  let result = isWinner ? 'Most Favorite Songs This Week:\n' : 'Least Favorite Songs This Week:\n';
  let index = 1; // Start index from 1

  // Loop through sorted scores and format the output
  for (const [key, value] of Object.entries(sortedScores)) {
    result += `${index}. ${key}: Score = ${value.score}, Votes = ${value.votes}\n`; // Format each entry
    index++; // Increment index
  }

  return result.trim(); // Remove trailing newline
}


//Reads column 3-8
function addColumnScore(dictionary, columnIndex, columnData){
  const shiftedIndex = columnIndex - 3;
  const pointsAdded = 3 - (shiftedIndex % 3);
  for(let i = 1; i < columnData.length; i++){
    const songName = columnData[i];
    if(songName in dictionary){
      dictionary[songName] += pointsAdded;
      dictionary[songName].votes[shiftedIndex % 3] += 1;
    } else{
      //dictionary[songName] = pointsAdded;
      dictionary[songName] = {
        score: pointsAdded,
        votes: [0, 0, 0]
      };
      dictionary[songName].votes[shiftedIndex % 3] += 1;
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
  winnerDict = formatScoresAsString(winnerDict, true);
  loserDict = formatScoresAsString(loserDict, false);
  console.log(winnerDict);
  console.log(loserDict);
}
