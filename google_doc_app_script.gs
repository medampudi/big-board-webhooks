/**
 * Google Apps Script used to modify Google Docs by inserting links to Trello.
 *
 * See README.md for installation instructions - this script has to be
 * installed manually for big-board-web-hooks to trigger it.
 */


/**
 * Request handler for this Apps Script's published web service.
 * Used to trigger Google Doc updates that add links to Trello
 *
 * Query parameters:
 *    docId: google doc ID to be edited
 *    trelloURL: target trello URL for adding card link
 *    removeTrelloLinks (optional): if "true", remove all trello links from
 *        google doc ID. This is used when cleaning up unit tests.
 *
 * Returns a 200 status response w/ "Done!" if successful and
 *  "Error: [explanation]" otherwise.
 *
 * TODO(kamens): change error responses to non-200 status codes once this issue
 * is resolved:
 * https://code.google.com/p/google-apps-script-issues/issues/detail?id=3151
 */
function doGet(e) {
  var docId = e.parameter.docId;

  // Make sure this Google Doc has been granted "anyone in domain can edit"
  var file = null;
  try {
    file = DriveApp.getFileById(docId);
  } catch(err) {
    // File doesn't exist or no access to file whatsoever
    return ContentService.createTextOutput("Error: Cannot find doc");
  }
    
  var permission = file.getSharingPermission();
  if (!(permission === DriveApp.Permission.EDIT)) {
    return ContentService.createTextOutput("Error: Missing edit permissions");
  }
  
  var doc = DocumentApp.openById(docId);
  var body = doc.getBody();
  
  if (e.parameter.removeTrelloLinks === "true") {
    // This "remove all trello links" functionality is used by unit tests to
    // clean up docs during tests
    removeTrelloLinks(body);
  }
  
  // Add trello link to google doc, if possible
  var trelloURL = e.parameter.trelloURL;
  if (trelloURL && !alreadyHasTrelloLink(body, trelloURL)) {
    addTrelloLink(body, trelloURL);
  }
  
  return ContentService.createTextOutput("Done!");
}


/**
 * Remove all paragraphs in Google Doc that are links to Trello.
 *
 * This is only used during unit testing to wipe our test docs of any Trello
 * links inserted during unit testing.
 */
function removeTrelloLinks(body) {
  var paragraphs = body.getParagraphs();
  for (var ix = 0; ix < paragraphs.length; ix++) {
    var paragraph = paragraphs[ix];
    var url = paragraph.getLinkUrl();
    if (url && url.indexOf("trello.com") > -1) {
      body.removeChild(paragraph);
    }
  }
}


/**
 * Return True if there's already a link to the right Trello URL in Google Doc
 */
function alreadyHasTrelloLink(body, trelloURL) {
  var paragraphs = body.getParagraphs();
  for (var ix = 0; ix < paragraphs.length; ix++) {
    if (paragraphs[ix].getLinkUrl() === trelloURL) {
      return true;
    }
  }
  return false;
}


/**
 * Find element index of title paragraph in Google Doc
 *
 * We use this to figure out where to insert the link to Trello
 */
function findTitleParagraphIndex(body) {
  var paragraphs = body.getParagraphs();
  for (var ix = 0; ix < paragraphs.length; ix++) {
    var paragraph = paragraphs[ix];
    var attrs = paragraph.getAttributes();
    if (attrs.HEADING === DocumentApp.ParagraphHeading.TITLE) {
      return body.getChildIndex(paragraph);
    }
  }
  
  // If we couldn't find a title paragraph, just assume it's the first element
  return 0;
}


/**
 * Add new paragraph to Google Doc w/ link to specified Trello card
 */
function addTrelloLink(body, trelloURL) {
  var style = {};
  style[DocumentApp.Attribute.FONT_FAMILY] = 'Proxima Nova';
  style[DocumentApp.Attribute.FOREGROUND_COLOR] = '#999999';
  style[DocumentApp.Attribute.FONT_SIZE] = 11;
  
  // Insert paragraph immediately after title
  // TODO(kamens): more elegantly handle failure when we don't have write perms
  var indexToInsert = findTitleParagraphIndex(body) + 1;
  var paragraph = body.insertParagraph(indexToInsert,
    'See Trello card for project\'s current status.');
  
  paragraph.setLinkUrl(trelloURL);
  paragraph.setAttributes(style);
}


/**
 * debug utility used when running this script manually from Apps Script editor
 */
function debug() {
  doGet({parameter: {
    docId: "1uc4_O3H6OgjPBSzb8lJvXwFipJ6zUs7utDUtwIhEPqI",
    trelloURL: "https://trello.com/c/Owfp15Jo"
  }});
}

