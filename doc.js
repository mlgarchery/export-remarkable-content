import fsPromises from "node:fs/promises";
import fs from "node:fs";
import http from "http";

// Specify the path to your folder
const folderPath = "./raw/files/xochitl";

const getDocs = async () => {
  const files = await fsPromises.readdir(folderPath);
  const docs = {};

  for (const file of files) {
    const match = file.match(/^(.*?)\.metadata$/); // Regex to extract ID before the first dot
    if (match && match[1]) {
      const id = match[1];

      let newDir = "";
      let parent = id;

      do {
        let metadata = JSON.parse(
          await fsPromises.readFile(`${folderPath}/${parent}.metadata`, {
            encoding: "utf-8",
          })
        );
        if (metadata.type === "CollectionType") {
          newDir = `${metadata.visibleName}/${newDir}`;
          parent = metadata.parent.length === 36 ? metadata.parent : "";
        } else {
          parent = "";
        }
      } while (parent !== "");

      docs[id] = {
        folder: newDir,
        metadata: JSON.parse(
          await fsPromises.readFile(`${folderPath}/${id}.metadata`, {
            encoding: "utf-8",
          })
        ),
      };
    }
  }
  return docs;
};

// From header Content-disposition
const extractFilename = (header) => {
  const regex = /filename="([^"]+)"/;
  const match = header.match(regex);

  if (match && match[1]) {
    return match[1];
  } else {
    return null;
  }
};

const downloadDoc = async (id, folder, visibleName) => {
  const url = `http://10.11.99.1/download/${id}/rmdoc`;
  // const url = `http://10.11.99.1/download/e47247d2-38d8-4c29-bec4-57b5d902ef21/rmdoc`;
  const traceFilepath = `./documents/${folder}${id}.txt`;
  if (fs.existsSync(traceFilepath)) {
    console.log(`Trace already exists. Skipping ${folder}${id}`);
    return;
  } else {
    console.log("New file", folder, id, visibleName);
  }

  // Some file break the download, we ship their download
  if (
    [
      "a0215bc5-834c-4f43-9846-3215ea534268",
      "a9f13630-8020-40c8-bc16-1071e6475afe",
    ].includes(id)
  ) {
    return;
  }

  return new Promise((resolve, reject) =>
    http
      .get(url, (res) => {
        // Check if the statusCode is 200
        if (res.statusCode === 200) {
          const filename = extractFilename(res.headers["content-disposition"]);

          if (!filename) {
            reject("Filename not found in header Content-disposition");
            return;
          }
          const filepath = folder
            ? `./documents/${folder}${filename}`
            : `./documents/${filename}`;

          console.log(`Adding ${filepath} ${id}`);

          if (fs.existsSync(filepath)) {
            reject("File has already been downloaded.");
          }

          const fileStream = fs.createWriteStream(filepath);
          res.pipe(fileStream);
          fileStream.on("finish", () => {
            fileStream.close();
            console.log(`Complete`);
            console.log("---");
            fs.writeFileSync(traceFilepath, "");
            resolve(filename);
          });
        } else {
          console.log(folder, id);
          const msg = `Request Failed. Status Code: ${res.statusCode}`;
          fs.writeFileSync(traceFilepath, msg);
          console.log("---");
          reject(msg);
        }
      })
      .on("error", (e) => {
        reject(`Got error: ${e.message}`);
      })
  ).catch((error) => console.log(error));
};

getDocs().then(async (docs) => {
  const nbDocs = Object.entries(docs).length;
  console.log("Number of docs", nbDocs);
  let i = 0;
  for (const doc in docs) {
    if (docs[doc].folder) {
      fs.mkdirSync(`./documents/${docs[doc].folder}`, { recursive: true });
    }
    await downloadDoc(doc, docs[doc].folder, docs[doc].metadata.visibleName);
    i++;
    console.log(`${i}/${nbDocs}`);
  }
});
