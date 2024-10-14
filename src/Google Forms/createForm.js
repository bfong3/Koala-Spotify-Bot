
// Reads the file and transforms them into array
function parseFileData(fileContent) {
  const lines = fileContent.split('\n'); // Split the content by new lines
  let weekNumber = null;
  let thisWeeksSongs = [];
  let allSongs = [];
  let isThisWeeksSongs = false;
  let isAllSongs = false;

  lines.forEach(line => {
    line = line.trim(); // Remove unnecessary whitespace

    // Extract Week Number
    if (line.startsWith('Week Number:')) {
      weekNumber = parseInt(line.split(':')[1].trim(), 10);
    }

    // Check if we're in the section for "This Week's Songs"
    if (line.startsWith('This Week\'s Songs:')) {
      isThisWeeksSongs = true;
      isAllSongs = false; // Reset other flag
    }

    // Check if we're in the section for "All Songs"
    if (line.startsWith('All Songs:')) {
      isAllSongs = true;
      isThisWeeksSongs = false; // Reset other flag
    }

    // Add songs to the respective arrays
    if (isThisWeeksSongs && line.match(/^\d+:/)) {
      const song = line.substring(line.indexOf(':') + 1).trim().replace(/"/g, '');
      thisWeeksSongs.push(song);
    }
    
    if (isAllSongs && line.match(/^\d+:/)) {
      const song = line.substring(line.indexOf(':') + 1).trim().replace(/"/g, '');
      allSongs.push(song);
    }
  });

  // console.log(weekNumber);
  // console.log(thisWeeksSongs);
  // console.log(allSongs);
  
  return {
    weekNumber,
    thisWeeksSongs,
    allSongs
  };
}

// Read's the data from our weekly songs
function readTextFileFromDrive() {
    // Get the file from Google Drive using the file ID
    const file = DriveApp.getFileById(TEXT_FILE_ID);
    
    // Get the file's content as a string
    const fileContent = file.getBlob().getDataAsString();
    //console.log(fileContent);
    return fileContent;
}

// Rename title on Google Sheets
function renameResponseSheet(sheetId, newName, weekNumber) {
    const sheet = SpreadsheetApp.openById(sheetId);
    const responseSheet = sheet.getSheets()[0]; // Written Poll always goes to the "first page" of the sheets
    responseSheet.setName(newName); // Rename the sheet
}

function createForm(weekNumber, thisWeeksSongs, allSongs) {   

  const folder = DriveApp.getFolderById(GOOGLE_FOLDER_ID); // Folder destination of Google Form

  // Create & name Form  
  var item =  `Week ${weekNumber} Koala Vote`;  
  var form = FormApp.create(item)  
      .setTitle(item);  

  form.setLimitOneResponsePerUser(true); // Limit to 1 response
  form.setAllowResponseEdits(true); // Allow respondents to edit their responses

  //const sheet = SpreadsheetApp.openById(GOOGLE_SHEETS_ID); // Open the Google Sheets
  form.setDestination(FormApp.DestinationType.SPREADSHEET, GOOGLE_SHEETS_ID); // Set the destination of Google Forms
  renameResponseSheet(GOOGLE_SHEETS_ID, item, weekNumber);

  // Single line text field  
  item = "Name";  
  form.addTextItem()  
      .setTitle(item)  
      .setRequired(true);  
  
  const rulesText = "Please follow these rules when selecting your songs:\n\n" +
                      "1. DO NOT VOTE YOUR OWN SONG!!!\n" +
                      "2. DO NOT VOTE THE SAME SONG TWICE IN THE SAME SECTION!\n" +
                      "2a. You could vote for the same song once as a favorite and once as a least favorite I guess?\n" +
                      "3. If you're having difficulty deciding, feel free to select the 'None' option (on the very top) instead.";
            
  form.addSectionHeaderItem()
      .setTitle(rulesText)

  // Arrays for question titles
  const topTitles = ['#1 Favorite Song (3 points)', '#2 Favorite Song (2 points)', '#3 Favorite Song (1 point)'];
  const bottomTitles = ['#1 Least Favorite Song (3 points)', '#2 Least Favorite Song (2 points)', '#3 Least Favorite Song (1 point)'];

  // Add drop-downs for Top 3 Songs
  for (let i = 0; i < topTitles.length; i++) {
  form.addListItem()
      .setTitle(topTitles[i])
      .setChoiceValues(thisWeeksSongs)
      .setRequired(true); 
  }

  // Add drop-downs for Bottom 3 Songs
  for (let j = 0; j < bottomTitles.length; j++) {
  form.addListItem()
      .setTitle(bottomTitles[j])
      .setChoiceValues(allSongs)
      .setRequired(true); 
  }

  // Move the form to the specified folder
  const formFile = DriveApp.getFileById(form.getId());
  folder.addFile(formFile);

  // Optionally remove the form from the root directory
  DriveApp.getRootFolder().removeFile(formFile);
}

function main(){
  const fileContent = readTextFileFromDrive();
  let { weekNumber, thisWeeksSongs, allSongs } = parseFileData(fileContent);
  thisWeeksSongs = ["None"].concat(thisWeeksSongs);
  allSongs = ["None"].concat(allSongs);
  createForm(weekNumber, thisWeeksSongs, allSongs);
}
