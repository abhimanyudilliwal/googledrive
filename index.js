const fs = require("fs");
const express = require("express");
const multer = require("multer");
const async = require("async")
const OAuth2Data = require("./googlecredentials.json");
var name, pic

const { google } = require("googleapis");

const app = express();


const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL
);
var authed = false;

// If modifying these scopes, delete token.json.
const SCOPES =
  "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile";

app.set("view engine", "ejs");

var Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./images");
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

var upload = multer({
  storage: Storage,
}).single("file"); //Field name and max count

app.get("/", (req, res) => {
  if (!authed) {
    // Generate an OAuth URL and redirect there
    var url = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    console.log(url);
    res.render("index", { url: url });
  } else {
    var oauth2 = google.oauth2({
      auth: oAuth2Client,
      version: "v2",
    });
    oauth2.userinfo.get(function (err, response) {
      if (err) {
        console.log(err);
      } else {
        console.log(response.data);
        name = response.data.name
        pic = response.data.picture
        res.render("success", {
          name: response.data.name,
          pic: response.data.picture,
          success: false
        });
      }
    });
  }
});

app.post("/upload", (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      console.log(err);
      return res.end("Something went wrong");
    } else {
      console.log(req.file.path);
      const drive = google.drive({ version: "v3", auth: oAuth2Client });
      const fileMetadata = {
        name: req.file.filename,
      };
      const media = {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path),
      };
      drive.files.create(
        {
          resource: fileMetadata,
          media: media,
          fields: "id",
        },
        (err, file) => {
          if (err) {
            // Handle error
            console.error(err);
          } else {
            fs.unlinkSync(req.file.path)
            console.log("file",req.file)
            console.log("fileId",file.data.id)
            res.render("success", { name: name, pic: pic, success: true })
          }

        }
      );
    }
  });
});

app.post("/createfolder", (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      console.log(err);
      return res.end("Something went wrong");
    } else {
      console.log(req.file.path);
      const drive = google.drive({ version: "v3", auth: oAuth2Client });
      const fileMetadata = {
        name: req.file.filename,
      };
      const media = {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path),
      };
      drive.files.create(
        {
          resource: fileMetadata,
          media: media,
          fields: "id",
        },
        (err, file) => {
          if (err) {
            // Handle error
            console.error(err);
          } else {
            fs.unlinkSync(req.file.path)
            res.render("success", { name: name, pic: pic, success: true })
          }

        }
      );
    }
  });
});

app.post('/create', (req, res) => {
  const drive = google.drive({ version: "v3", auth: oAuth2Client });
  var fileMetadata = {
    'name': 'newfolder',
    'mimeType': 'application/vnd.google-apps.folder'
  };
  drive.files.create({
    resource: fileMetadata,
    fields: 'id'
  }, function (err, file) {
    if (err) {
      console.error(err);
    } else {
      /* console.log("folder",file)
      console.log("id",file.id)
      console.log("data",file.data) */
      console.log("dataid", file.data.id)
      res.render("newfile", { success: true })
    }
  });
})

app.post('/insertfolderdata', (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      console.log(err);
      return res.end("Something went wrong");
    } else {
      const drive = google.drive({ version: "v3", auth: oAuth2Client });
      var folderId = '1onr_xdr6ovXuYPl6epQi2rSbbBMIh6A-';
      var fileMetadata = {
        name: req.file.filename,
        parents: [folderId]
      };
      var media = {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path)
      };
      drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
      }, function (err, file) {
        if (err) {
          // Handle error
          console.error(err);
        } else {
          console.log('File Id: ', file.data.id);
        }
      }
      );
    }

  })
})

/* app.get('/download', (req, res) => {

  const drive = google.drive({ version: "v3", auth: oAuth2Client });
  var fileId = '1IW5cCwbpbbBGK2hVOV95n9rJXNZ4bD_A';
  var dest = fs.createWriteStream("./" + item.title);
  drive.files.get({
    fileId: fileId,
    alt: 'media'
  })
    .on('end', function () {
      console.log('Downloading Done');
    })
    .on('error', function (err) {
      console.log('Error during download', err);
    })
    .pipe(dest);

})
 */

app.get('/download', (req, res) => {
  var dir = `./images`; // directory from where node.js will look for downloaded file from google drive

  var fileId = '1IW5cCwbpbbBGK2hVOV95n9rJXNZ4bD_A'; // Desired file id to download from  google drive

  /*  var dest = fs.createWriteStream('./downloads/kamal-hossain.jpg'); */
  var dest = fs.createWriteStream('./images/aj.png'); // file path where google drive function will save the file

  const drive = google.drive({ version: "v3", auth: oAuth2Client }); // Authenticating drive API

  let progress = 0; // This will contain the download progress amount

  // Uploading Single image to drive
  drive.files
    .get({ fileId, alt: 'media' }, { responseType: 'stream' })
    .then((driveResponse) => {
      driveResponse.data
        .on('end', () => {
          console.log('\nDone downloading file.');
          const file = `${dir}`; // file path from where node.js will send file to the requested user
          res.download(file);
          res.render("success") // Set disposition and send it.
        })
        .on('error', (err) => {
          console.error('Error downloading file.');
        })
        .on('data', (d) => {
          progress += d.length;
          if (process.stdout.isTTY) {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(`Downloaded ${progress} bytes`);
          }
        })
        .pipe(dest);
    })
    .catch((err) => console.log(err));
});

app.get('/getdata', (req, res) => {
  const drive = google.drive({ version: "v3", auth: oAuth2Client });
  fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }
    //listing all files using forEach
    files.forEach(function (file) {
      // Do whatever you want to do with the file
      console.log(file);
    });
  });
})


app.get('/search', (req, res) => {
  const drive = google.drive({ version: "v3", auth: oAuth2Client });
  var pageToken = null;
  // Using the NPM module 'async'
  async.doWhilst(function (callback) {
    drive.files.list({
      q: "mimeType='image/jpeg'",
      fields: 'nextPageToken, files(id, name)',
      spaces: 'drive',
      pageToken: pageToken
    },  (err, res) => {
      console.log("response",res)
      if (err) {
        // Handle error
        console.error(err);
        callback(err)
      } else {
        console.log("jshsdkjhsdkjshsdkjh",res.files.data)
        res.files.list(function (file) {
          console.log('Found file: ', file.name, file.id);
        });
        pageToken = res.nextPageToken;
        callback();
      }
    })
  }, function () {
    return !!pageToken;
  }, function (err) {
    if (err) {
      // Handle error
      console.error(err);
    } else {
      // All pages fetched
    }
  })

})

app.get("/publicURL",async(req,res) => {
  const drive = google.drive({ version: "v3", auth: oAuth2Client });
  const fileId = "1e0_FXstP8HIcOmaxT6jVKgw6PThjGWYc";
 
 await drive.permissions.create({
    fileId : fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    }
  });

   await drive.files.get({
    fileId: fileId,
    fields: 'webViewLink'
}).then((res) =>{
  console.log("publicLink",res.data)
  /* console.log("publicLink",webViewLink.data) */
}).catch( (error) => {
  console.log("error",error)
})


})

app.delete('/deleteAFile', (req, res) => {
  var fileId = '1sPLVnPOnF46hKwK3bfdN2pnzLFEzEpo_'; // Desired file id to download from  google drive

  const drive = google.drive({ version: "v3", auth: oAuth2Client }); // Authenticating drive API

  // Deleting the image from Drive
  drive.files
    .delete({
      fileId: fileId,
    })
    .then(
      async function (response) {
        res.status(200).json({ 
        status: 'success',
        massage:'successfully delete' });
        console.log('delete',response)
      },
      function (err) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Deletion Failed for some reason' }] });
      }
    );
});

app.get('/getall',(req,res) => {
  const drive = google.drive({ version: "v3", auth: oAuth2Client });
  drive.files.list({name}, (err, res) => {
    if (err) throw err;
    const files = res.data.files;
    if (files.length) {
    files.map((file) => {
      console.log(file);
      console.log(file.id)
    });
    } else {
      console.log('No files found');
    }
  });
})


app.post('/create', (req, res) => {
  const drive = google.drive({ version: "v3", auth: oAuth2Client });
  var folderId = '0BwwA4oUTeiV1TGRPeTVjaWRDY1E';
  var fileMetadata = {
    'name': 'photo.jpg',
    parents: [folderId]
  };
  var media = {
    mimeType: 'image/jpeg',
    body: fs.createReadStream('files/photo.jpg')
  };
  drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id'
  }, function (err, file) {
    if (err) {
      // Handle error
      console.error(err);
    } else {
      console.log('File Id: ', file.id);
    }
  });
})

app.get('/logout', (req, res) => {
  authed = false
  res.redirect('/')
})

app.get("/google/callback", function (req, res) {
  const code = req.query.code;
  if (code) {
    // Get an access token based on our OAuth code
    oAuth2Client.getToken(code, function (err, tokens) {
      if (err) {
        console.log("Error authenticating");
        console.log(err);
      } else {
        console.log("Successfully authenticated");
        console.log(tokens)
        oAuth2Client.setCredentials(tokens);


        authed = true;
        res.redirect("/");
      }
    });
  }
});


app.listen(3000, () => {
  console.log("App is listening on Port 5000");
});