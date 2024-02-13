let dlButton = document.getElementsByClassName("header-button")[0];
let homeButton = document.getElementsByClassName("path-last")[0];

let downloadDoc = async (el) => {
  await el.click();

  await dlButton.click();

  // Download Archive
  await document
    .getElementsByClassName("header-dropdown")[0]
    .children[1].click();
};

let iterateOnDocs = async () => {
  document.get;
};

// icon-rm_notebooks notes
// icon-rm_documents pdf
// icon-rm_collections folders
