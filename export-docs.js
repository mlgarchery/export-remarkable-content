import fsPromises from "node:fs/promises";
import fs from "node:fs";
import http from "http";
import {Buffer} from "buffer"

// Specify the path to your folder containing the reMarkable content
const folderPath = "./raw/xochitl";

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
        parent = metadata.parent;
        if(parent === "trash") break;
        if (metadata.type === "CollectionType") {
          newDir = `${metadata.visibleName}/${newDir}`;
        }
      } while (parent !== "");

      const documentMetadata = JSON.parse(
        await fsPromises.readFile(`${folderPath}/${id}.metadata`, {
          encoding: "utf-8",
        })
      );
        
      if(parent !== "trash" && documentMetadata.type !== "CollectionType"){
        docs[id] = {
          folder: newDir,
          metadata: documentMetadata
        };
      }

    }
  }
  return docs;
};

const downloadDoc = async (id, folder, metadata) => {
  const url = `http://10.11.99.1/download/${id}/rmdoc`;
  const traceFilepath = `./documents/${folder}${id}.txt`;
  if (fs.existsSync(traceFilepath)) {
    console.log(`Trace already exists. Skipping ${folder}${id}`);
    return;
  } else {
    console.log(`New file \"${metadata.visibleName}\" ${id}`);
  }

  return new Promise((resolve, reject) =>
    http
      .get(url, {}, (res) => {
        if (res.statusCode === 200) {
          const filename =`${metadata.visibleName.replaceAll("/", "_")}.pdf`
          const filepath = folder
            ? `./documents/${folder}${filename}`
            : `./documents/${filename}`;

          console.log(`Adding ${filepath}`);

          if (fs.existsSync(filepath)) {
            reject("File has already been downloaded.");
          }

          const fileStream = fs.createWriteStream(filepath);
          res.pipe(fileStream);
          fileStream.on("finish", () => {
            fileStream.close();
            console.log(`Complete`);
            console.log("---");
            fs.writeFileSync(traceFilepath, JSON.stringify(metadata));
            resolve(filename);
          });
        } else {
          const msg = `Request Failed. Status Code: ${res.statusCode} !!`;
          fs.writeFileSync(traceFilepath, msg);
          reject(msg);
        }
      })
      .on("error", (e) => {
        reject(`Got error: ${e.message} !!`);
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
    await downloadDoc(doc, docs[doc].folder, docs[doc].metadata);
    i++;
    console.log(`${i}/${nbDocs}`);
  }
});